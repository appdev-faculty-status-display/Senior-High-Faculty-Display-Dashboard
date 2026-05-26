const crypto = require('crypto');
const mongoose = require('mongoose');
const { Queue } = require('../models');
const Faculty  = require('../models/faculty.model');
const { createAuthError } = require('../utils/error');

const queueStatusValues = [
  'pending',
  'approved',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  'no_show'
];

const activeStatusValues = ['pending', 'approved', 'in_progress'];
const cancellableStatusValues = ['pending', 'approved'];
const urgencyValues = ['low', 'normal', 'urgent'];
const queueTypeValues = ['quick_consultation', 'room_consultation'];

const statusTransitions = {
  pending: ['approved', 'rejected', 'cancelled'],
  approved: ['in_progress', 'cancelled', 'no_show'],
  in_progress: ['completed']
};

function createValidationError(field, message) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.errors = {
    [field]: { message }
  };
  throw error;
}

function assertObjectId(value, field) {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    const error = new Error('Invalid id');
    error.name = 'CastError';
    error.path = field;
    throw error;
  }
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function normalizeStatusInput(value) {
  const normalized = normalizeString(value);
  return normalized === 'on_going' ? 'in_progress' : normalized;
}

function generateAccessKey() {
  return crypto.randomBytes(16).toString('hex');
}

function normalizeQueueEntry(entry, position) {
  return {
    queueId: entry._id.toString(),
    position: position ?? null,
    studentName: entry.studentName,
    reason: entry.reason,
    urgency: entry.urgency,
    type: entry.type,
    status: entry.status,
    joinedAt: entry.createdAt
  };
}

function validateStatusFilter(status) {
  if (!queueStatusValues.includes(status)) {
    createValidationError('status', 'status must be a valid queue status');
  }
}

async function ensureFacultyExists(facultyId) {
  const faculty = await Faculty.findById(facultyId).select('_id');
  if (!faculty) {
    throw createAuthError('NOT_FOUND');
  }
}

async function getQueueByFaculty(facultyId, status) {
  assertObjectId(facultyId, 'id');
  await ensureFacultyExists(facultyId);

  const normalizedStatus = status ? normalizeStatusInput(status) : null;

  if (normalizedStatus) {
    validateStatusFilter(normalizedStatus);
  }

  const statusFilter = normalizedStatus ? [normalizedStatus] : activeStatusValues;
  const query = { facultyId, status: { $in: statusFilter } };

  const entries = await Queue.find(query).sort({ createdAt: 1 }).lean();
  const activeEntries = await Queue.find({
    facultyId,
    status: { $in: activeStatusValues }
  })
    .sort({ createdAt: 1 })
    .select('_id')
    .lean();

  const positionMap = new Map(
    activeEntries.map((entry, index) => [String(entry._id), index + 1])
  );

  return {
    facultyId,
    queue: entries.map((entry) =>
      normalizeQueueEntry(entry, positionMap.get(String(entry._id)) ?? null)
    ),
    total: entries.length
  };
}

async function createQueueEntry(facultyId, payload) {
  assertObjectId(facultyId, 'id');
  await ensureFacultyExists(facultyId);

  const studentId = normalizeString(payload?.studentId);
  const studentName = normalizeString(payload?.studentName);
  const studentEmail = normalizeString(payload?.studentEmail);
  const reason = normalizeString(payload?.reason);
  const urgency = normalizeString(payload?.urgency) || 'normal';
  const type = normalizeString(payload?.type);
  const strand = normalizeString(payload?.strand);

  if (!studentId) {
    createValidationError('studentId', 'studentId is required');
  }

  if (!studentName) {
    createValidationError('studentName', 'studentName is required');
  }

  if (!studentEmail) {
    createValidationError('studentEmail', 'studentEmail is required');
  }

  if (!reason) {
    createValidationError('reason', 'reason is required');
  }

  if (!type) {
    createValidationError('type', 'type is required');
  }

  if (!queueTypeValues.includes(type)) {
    createValidationError('type', 'type must be quick_consultation or room_consultation');
  }

  if (urgency && !urgencyValues.includes(urgency)) {
    createValidationError('urgency', 'urgency must be low, normal, or urgent');
  }

  const duplicate = await Queue.findOne({
    facultyId,
    studentId,
    status: { $in: activeStatusValues }
  }).select('_id');

  if (duplicate) {
    throw createAuthError('DUPLICATE_QUEUE');
  }

  const position =
    (await Queue.countDocuments({
      facultyId,
      status: { $in: activeStatusValues }
    })) + 1;

  const accessKey = generateAccessKey();

  const entry = await Queue.create({
    facultyId,
    accessKey,
    status: 'pending',
    studentName,
    studentId,
    studentEmail,
    reason,
    urgency,
    type,
    strand: strand || null
  });

  return {
    queueId: entry._id.toString(),
    position,
    accessKey,
    status: entry.status,
    message: `Request added to queue. Current position: ${position}.`
  };
}

async function cancelQueueEntry(facultyId, queueId, accessKey) {
  assertObjectId(facultyId, 'facultyId');
  assertObjectId(queueId, 'queueId');

  const token = normalizeString(accessKey);

  if (!token) {
    createValidationError('accessKey', 'accessKey is required');
  }

  const entry = await Queue.findOne({ _id: queueId, facultyId });

  if (!entry) {
    throw createAuthError('NOT_FOUND');
  }

  if (entry.accessKey !== token) {
    throw createAuthError('INVALID_ACCESS_KEY');
  }

  if (!cancellableStatusValues.includes(entry.status)) {
    throw createAuthError('INVALID_TRANSITION');
  }

  entry.status = 'cancelled';
  entry.accessKey = generateAccessKey();
  await entry.save();

  return {
    message: 'Queue entry cancelled',
    queueId: entry._id.toString()
  };
}

async function updateQueueStatus(facultyId, queueId, status, rejectionReason) {
  assertObjectId(facultyId, 'facultyId');
  assertObjectId(queueId, 'queueId');

  const nextStatus = normalizeStatusInput(status);

  if (!nextStatus) {
    createValidationError('status', 'status is required');
  }

  validateStatusFilter(nextStatus);

  if (nextStatus === 'rejected' && !normalizeString(rejectionReason)) {
    createValidationError('rejectionReason', 'rejectionReason is required');
  }

  const entry = await Queue.findOne({ _id: queueId, facultyId });

  if (!entry) {
    throw createAuthError('NOT_FOUND');
  }

  const allowedTransitions = statusTransitions[entry.status] || [];

  if (!allowedTransitions.includes(nextStatus)) {
    throw createAuthError('INVALID_TRANSITION');
  }

  entry.status = nextStatus;

  if (nextStatus === 'rejected') {
    entry.rejectionReason = normalizeString(rejectionReason);
  } else {
    entry.rejectionReason = null;
  }

  if (nextStatus === 'cancelled') {
    entry.accessKey = generateAccessKey();
  }

  await entry.save();

  return {
    queueId: entry._id.toString(),
    status: entry.status,
    notificationSent: false
  };
}

async function assignQueueRoom(facultyId, queueId, payload, actor) {
  assertObjectId(facultyId, 'facultyId');
  assertObjectId(queueId, 'queueId');

  const approvalRole = normalizeString(payload?.approvalRole);
  const roomId = normalizeString(payload?.roomId);
  const strandHeadApproval = normalizeString(payload?.strandHeadApproval);
  const rejectionReason = normalizeString(payload?.rejectionReason);

  if (!approvalRole) {
    createValidationError('approvalRole', 'approvalRole is required');
  }

  if (!['faculty', 'strand_head'].includes(approvalRole)) {
    createValidationError('approvalRole', 'approvalRole must be faculty or strand_head');
  }

  const entry = await Queue.findOne({ _id: queueId, facultyId });

  if (!entry) {
    throw createAuthError('NOT_FOUND');
  }

  if (entry.type !== 'room_consultation') {
    createValidationError('type', 'room assignment is only allowed for room_consultation');
  }

  if (approvalRole === 'faculty') {
    if (!['faculty', 'principal'].includes(actor?.role)) {
      throw createAuthError('FORBIDDEN');
    }

    if (!roomId) {
      createValidationError('roomId', 'roomId is required');
    }

    assertObjectId(roomId, 'roomId');

    if (entry.status !== 'approved') {
      throw createAuthError('INVALID_TRANSITION');
    }

    if (entry.strandHeadApproval && entry.strandHeadApproval !== 'rejected') {
      throw createAuthError('INVALID_TRANSITION');
    }

    entry.roomId = roomId;
    entry.strandHeadApproval = 'pending';
    await entry.save();

    return {
      queueId: entry._id.toString(),
      roomId: entry.roomId,
      strandHeadApproval: entry.strandHeadApproval,
      status: entry.status,
      notificationSent: false
    };
  }

  if (!['strand_head', 'principal'].includes(actor?.role)) {
    throw createAuthError('FORBIDDEN');
  }

  if (!entry.roomId) {
    createValidationError('roomId', 'roomId must be assigned first');
  }

  if (entry.strandHeadApproval !== 'pending') {
    throw createAuthError('INVALID_TRANSITION');
  }

  if (!strandHeadApproval) {
    createValidationError('strandHeadApproval', 'strandHeadApproval is required');
  }

  if (!['approved', 'rejected'].includes(strandHeadApproval)) {
    createValidationError(
      'strandHeadApproval',
      'strandHeadApproval must be approved or rejected'
    );
  }

  entry.strandHeadApproval = strandHeadApproval;

  if (strandHeadApproval === 'rejected') {
    entry.status = 'rejected';
    entry.rejectionReason = rejectionReason || null;
  }

  await entry.save();

  return {
    queueId: entry._id.toString(),
    roomId: entry.roomId,
    strandHeadApproval: entry.strandHeadApproval,
    status: entry.status,
    notificationSent: false
  };
}

module.exports = {
  getQueueByFaculty,
  createQueueEntry,
  cancelQueueEntry,
  updateQueueStatus,
  assignQueueRoom
};
