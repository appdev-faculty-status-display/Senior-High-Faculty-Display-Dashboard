const mongoose = require('mongoose');
const { Faculty } = require('../models');
const { createAuthError } = require('./auth.errors');

const allowedStatusValues = [
  'available',
  'in-class',
  'on-break',
  'off-campus',
  'in-meeting',
  'do-not-disturb'
];

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function ensureArray(value, fieldName) {
  if (!Array.isArray(value)) {
    const error = new Error(`${fieldName} must be an array`);
    error.name = 'ValidationError';
    error.errors = {
      [fieldName]: { message: `${fieldName} must be an array` }
    };
    throw error;
  }

  return value;
}

function normalizeSubjects(faculty) {
  return Array.isArray(faculty.subjects) ? faculty.subjects : [];
}

function normalizeFacultyCard(faculty) {
  return {
    id: faculty._id.toString(),
    name: faculty.name,
    strand: faculty.strand,
    role: faculty.role,
    currentStatus: faculty.status,
    currentRoom: faculty.currentLocation,
    subjects: normalizeSubjects(faculty),
    consultationHours: Array.isArray(faculty.consultationHours) ? faculty.consultationHours : [],
    schedule: Array.isArray(faculty.schedule) ? faculty.schedule : [],
    updatedAt: faculty.updatedAt
  };
}

function normalizeStatusOverride(faculty) {
  if (!faculty.statusOverride) {
    return null;
  }

  return {
    status: faculty.statusOverride.status,
    expiresAt: faculty.statusOverride.expiresAt,
    setBy: faculty.statusOverride.setBy
  };
}

function normalizeScheduleEntries(entries) {
  return ensureArray(entries, 'schedule').map(function (entry) {
    return {
      day: trimString(entry.day),
      startTime: trimString(entry.startTime),
      endTime: trimString(entry.endTime),
      subject: trimString(entry.subject),
      room: trimString(entry.room)
    };
  });
}

function normalizeConsultationHours(entries) {
  return ensureArray(entries, 'consultationHours').map(function (entry) {
    return {
      day: trimString(entry.day),
      startTime: trimString(entry.startTime),
      endTime: trimString(entry.endTime)
    };
  });
}

function assertCanEditFaculty(req, faculty) {
  const user = req.user || {};

  if (user.role === 'principal') {
    return;
  }

  if (user.role === 'strand_head') {
    if (!user.strand || faculty.strand !== user.strand) {
      throw createAuthError('FORBIDDEN');
    }

    return;
  }

  if (user.role === 'faculty') {
    if (String(user.id) !== String(faculty._id)) {
      throw createAuthError('FORBIDDEN');
    }

    return;
  }

  throw createAuthError('FORBIDDEN');
}

async function getFacultyList(req, res) {
  const filter = {};

  if (req.query.strand) {
    filter.strand = trimString(req.query.strand);
  }

  if (req.query.status) {
    const status = trimString(req.query.status);

    if (!allowedStatusValues.includes(status)) {
      const error = new Error('Invalid status filter');
      error.name = 'ValidationError';
      error.errors = {
        status: { message: 'status must be one of the allowed faculty status values' }
      };
      throw error;
    }

    filter.status = status;
  }

  const facultyList = await Faculty.find(filter).sort({ name: 1 });

  return res.status(200).json({
    data: facultyList.map(normalizeFacultyCard),
    total: facultyList.length
  });
}

async function getFacultyById(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    const error = new Error('Invalid faculty id');
    error.name = 'CastError';
    error.path = 'id';
    throw error;
  }

  const faculty = await Faculty.findById(id);

  if (!faculty) {
    throw createAuthError('NOT_FOUND');
  }

  return res.status(200).json(normalizeFacultyCard(faculty));
}

async function updateFacultyStatus(req, res) {
  const { id } = req.params;
  const { status, expiresAt } = req.body || {};

  if (!isValidObjectId(id)) {
    const error = new Error('Invalid faculty id');
    error.name = 'CastError';
    error.path = 'id';
    throw error;
  }

  if (!status || !allowedStatusValues.includes(status)) {
    const error = new Error('Invalid status');
    error.name = 'ValidationError';
    error.errors = {
      status: { message: 'status must be one of the allowed faculty status values' }
    };
    throw error;
  }

  const faculty = await Faculty.findById(id);

  if (!faculty) {
    throw createAuthError('NOT_FOUND');
  }

  assertCanEditFaculty(req, faculty);

  let parsedExpires = null;

  if (expiresAt) {
    const d = new Date(expiresAt);

    if (isNaN(d.getTime())) {
      const error = new Error('Invalid expiresAt');
      error.name = 'ValidationError';
      error.errors = {
        expiresAt: { message: 'expiresAt must be a valid date' }
      };
      throw error;
    }

    parsedExpires = d;
  }

  const setBy = req.user && req.user.id ? trimString(String(req.user.id)) : null;

  /**
   * NOTE: Status Redundancy (Design Concern)
   * Currently storing status in both faculty.status and faculty.statusOverride.status.
   * Future Improvement: Store only in statusOverride and compute current status via:
   *   - Check if statusOverride exists and is still active (expiresAt > now)
   *   - If yes, use statusOverride.status; otherwise use default 'available'
   * This would eliminate the redundancy and prevent status mismatch bugs.
   */
  faculty.status = status;
  faculty.statusOverride = {
    status,
    expiresAt: parsedExpires,
    setBy: setBy
  };

  await faculty.save();

  return res.status(200).json({
    id: faculty._id.toString(),
    currentStatus: faculty.status,
    statusOverride: normalizeStatusOverride(faculty),
    updatedAt: faculty.updatedAt
  });
}

async function updateFacultySchedule(req, res) {
  const { id } = req.params;
  const { schedule } = req.body || {};

  if (!isValidObjectId(id)) {
    const error = new Error('Invalid faculty id');
    error.name = 'CastError';
    error.path = 'id';
    throw error;
  }

  const faculty = await Faculty.findById(id);

  if (!faculty) {
    throw createAuthError('NOT_FOUND');
  }

  assertCanEditFaculty(req, faculty);

  faculty.schedule = normalizeScheduleEntries(schedule);
  await faculty.save();

  return res.status(200).json({
    id: faculty._id.toString(),
    schedule: faculty.schedule,
    updatedAt: faculty.updatedAt
  });
}

async function updateFacultyConsultationHours(req, res) {
  const { id } = req.params;
  const { consultationHours } = req.body || {};

  if (!isValidObjectId(id)) {
    const error = new Error('Invalid faculty id');
    error.name = 'CastError';
    error.path = 'id';
    throw error;
  }

  const faculty = await Faculty.findById(id);

  if (!faculty) {
    throw createAuthError('NOT_FOUND');
  }

  assertCanEditFaculty(req, faculty);

  faculty.consultationHours = normalizeConsultationHours(consultationHours);
  await faculty.save();

  return res.status(200).json({
    id: faculty._id.toString(),
    consultationHours: faculty.consultationHours,
    updatedAt: faculty.updatedAt
  });
}

module.exports = {
  getFacultyList,
  getFacultyById,
  updateFacultyStatus,
  updateFacultySchedule,
  updateFacultyConsultationHours,
  normalizeFacultyCard
};