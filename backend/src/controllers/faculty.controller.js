const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Faculty } = require('../models');
const { createAuthError } = require('../utils/error');

const allowedStatusValues = [
  'available',
  'in-class',
  'on-break',
  'off-campus',
  'in-meeting',
  'do-not-disturb'
];

const allowedRoleValues = ['faculty', 'strand_head', 'principal'];
const DEFAULT_PASSWORD_FALLBACK = 'Test1234!';

// ── Utilities ──────────────────────────────────────────────────────────────────

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function trimString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function createValidationError(field, message) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.errors = { [field]: { message } };
  throw error;
}

function requireStringField(value, fieldName) {
  const trimmed = trimString(value);
  if (!trimmed) createValidationError(fieldName, `${fieldName} is required`);
  return trimmed;
}

function ensureArray(value, fieldName) {
  if (!Array.isArray(value)) {
    const error = new Error(`${fieldName} must be an array`);
    error.name = 'ValidationError';
    error.errors = { [fieldName]: { message: `${fieldName} must be an array` } };
    throw error;
  }
  return value;
}

function normalizeSubjects(faculty) {
  if (Array.isArray(faculty.subjects) && faculty.subjects.length) return faculty.subjects;
  if (faculty.subject) return [faculty.subject];
  return [];
}

function parseSubjects(value) {
  if (Array.isArray(value)) {
    return value.map(trimString).filter(Boolean);
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) createValidationError('subjects', 'subjects must be a JSON array');
      return parsed.map(trimString).filter(Boolean);
    } catch {
      createValidationError('subjects', 'subjects must be a JSON array');
    }
  }
  createValidationError('subjects', 'subjects must be a JSON array');
}

function normalizeScheduleEntries(entries) {
  return ensureArray(entries, 'schedule').map((entry) => ({
    day: trimString(entry.day),
    startTime: trimString(entry.startTime),
    endTime: trimString(entry.endTime),
    subject: trimString(entry.subject),
    room: trimString(entry.room)
  }));
}

function normalizeConsultationHours(entries) {
  return ensureArray(entries, 'consultationHours').map((entry) => ({
    day: trimString(entry.day),
    startTime: trimString(entry.startTime),
    endTime: trimString(entry.endTime)
  }));
}

// ── facultyId generation: FAC-LASTNAME, FAC-LASTNAME-2, etc. ─────────────────

/**
 * Derives the base slug from a full name.
 * "Juan dela Cruz" → "DELACRUZ" (last word, uppercased, non-alpha stripped)
 */
function lastNameSlug(fullName) {
  const parts = trimString(fullName).split(/\s+/);
  const last = parts[parts.length - 1] || parts[0];
  return last.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * Finds a unique facultyId of the form FAC-SLUG, FAC-SLUG-2, FAC-SLUG-3 …
 * Checks against existing records. Pass `excludeId` when updating so we
 * don't collide with the faculty's own current id.
 */
async function generateFacultyId(fullName, excludeId = null) {
  const slug = lastNameSlug(fullName);
  const base = `FAC-${slug}`;

  // Find all existing ids that start with this base
  const query = { facultyId: new RegExp(`^${base}(-\\d+)?$`) };
  if (excludeId) query._id = { $ne: excludeId };

  const existing = await Faculty.find(query).select('facultyId').lean();
  const taken = new Set(existing.map((f) => f.facultyId));

  if (!taken.has(base)) return base;

  let counter = 2;
  while (taken.has(`${base}-${counter}`)) counter++;
  return `${base}-${counter}`;
}

// ── Serialization ──────────────────────────────────────────────────────────────

function normalizeFacultyCard(faculty) {
  return {
    id: faculty._id.toString(),
    facultyId: faculty.facultyId,
    name: faculty.name,
    email: faculty.email || null,
    strand: faculty.strand,
    role: faculty.role,
    currentStatus: faculty.status,
    currentRoom: faculty.currentLocation,
    subjects: normalizeSubjects(faculty),
    consultationHours: Array.isArray(faculty.consultationHours) ? faculty.consultationHours : [],
    // schedule: Array.isArray(faculty.schedule) ? faculty.schedule : [],
    updatedAt: faculty.updatedAt
  };
}

function normalizeStatusOverride(faculty) {
  if (!faculty.statusOverride) return null;
  return {
    status: faculty.statusOverride.status,
    expiresAt: faculty.statusOverride.expiresAt,
    setBy: faculty.statusOverride.setBy
  };
}

// ── Authorization helpers ──────────────────────────────────────────────────────

function assertCanEditFaculty(req, faculty) {
  const user = req.user || {};
  if (user.role === 'principal') return;
  if (user.role === 'strand_head') {
    if (!user.strand || faculty.strand !== user.strand) throw createAuthError('FORBIDDEN');
    return;
  }
  if (user.role === 'faculty') {
    if (String(user.id) !== String(faculty._id)) throw createAuthError('FORBIDDEN');
    return;
  }
  throw createAuthError('FORBIDDEN');
}

function assertCanCreateFaculty(req, strand) {
  const user = req.user || {};
  if (user.role === 'principal') return;
  if (user.role === 'strand_head') {
    if (!user.strand || strand !== user.strand) throw createAuthError('FORBIDDEN');
    return;
  }
  throw createAuthError('FORBIDDEN');
}

function assertCanDeleteFaculty(req, faculty) {
  const user = req.user || {};
  if (user.role === 'principal') return;
  if (user.role === 'strand_head') {
    if (!user.strand || faculty.strand !== user.strand) throw createAuthError('FORBIDDEN');
    return;
  }
  throw createAuthError('FORBIDDEN');
}

function getDefaultPassword() {
  const envPassword = trimString(process.env.DEFAULT_FACULTY_PASSWORD);
  return envPassword || DEFAULT_PASSWORD_FALLBACK;
}

// ── Route handlers ─────────────────────────────────────────────────────────────

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
      error.errors = { status: { message: 'status must be one of the allowed faculty status values' } };
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
  if (!faculty) throw createAuthError('NOT_FOUND');

  return res.status(200).json(normalizeFacultyCard(faculty));
}

async function createFaculty(req, res) {
  const payload = req.body || {};
  const name    = requireStringField(payload.name, 'name');
  const email   = requireStringField(payload.email, 'email');
  const strand  = requireStringField(payload.strand, 'strand');
  const role    = requireStringField(payload.role, 'role');

  // Optional fields
  const currentRoom      = trimString(payload.currentRoom) || 'TBD';
  const teamsWebhookUrl  = trimString(payload.teamsWebhookUrl) || null;

  if (!allowedRoleValues.includes(role)) {
    createValidationError('role', 'role must be one of the allowed faculty roles');
  }

  const subjects = parseSubjects(payload.subjects);
  if (!subjects.length) createValidationError('subjects', 'subjects must contain at least one value');

  assertCanCreateFaculty(req, strand);

  // Duplicate check on email (primary natural key for humans)
  const existingByEmail = await Faculty.findOne({ email: email.toLowerCase() });
  if (existingByEmail) throw createAuthError('DUPLICATE_FACULTY');

  const facultyId    = await generateFacultyId(name);
  const passwordHash = await bcrypt.hash(getDefaultPassword(), 10);

  const faculty = await Faculty.create({
    facultyId,
    userId: facultyId,
    email: email.toLowerCase(),
    name,
    role,
    strand,
    passwordHash,
    currentLocation: currentRoom,
    subjects,
    teamsWebhookUrl,
    status: 'available'
  });

  return res.status(201).json({
    id: faculty._id.toString(),
    facultyId: faculty.facultyId,
    name: faculty.name,
    email: faculty.email,
    strand: faculty.strand,
    role: faculty.role,
    subjects: faculty.subjects,
    currentStatus: faculty.status,
    createdAt: faculty.createdAt
  });
}

/**
 * PATCH /faculty/:id
 * Editable fields: name, email, strand, role, subjects, currentRoom, teamsWebhookUrl
 * facultyId is intentionally NOT editable after creation.
 */
async function updateFaculty(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    const error = new Error('Invalid faculty id');
    error.name = 'CastError';
    error.path = 'id';
    throw error;
  }

  const faculty = await Faculty.findById(id);
  if (!faculty) throw createAuthError('NOT_FOUND');

  assertCanEditFaculty(req, faculty);

  const payload = req.body || {};
  // Apply only fields that were actually sent
  if (payload.name !== undefined) {
    faculty.name = requireStringField(payload.name, 'name');
  }

  if (payload.email !== undefined) {
    const newEmail = requireStringField(payload.email, 'email').toLowerCase();
    if (newEmail !== faculty.email) {
      const clash = await Faculty.findOne({ email: newEmail, _id: { $ne: id } });
      if (clash) throw createAuthError('DUPLICATE_FACULTY');
    }
    faculty.email = newEmail;
  }

  if (payload.strand !== undefined) {
    faculty.strand = requireStringField(payload.strand, 'strand');
  }

  if (payload.role !== undefined) {
    const role = requireStringField(payload.role, 'role');
    if (!allowedRoleValues.includes(role)) createValidationError('role', 'role must be one of the allowed faculty roles');
    faculty.role = role;
  }

  if (payload.subjects !== undefined) {
    const subjects = parseSubjects(payload.subjects);
    if (!subjects.length) createValidationError('subjects', 'subjects must contain at least one value');
    faculty.subjects = subjects;
  }

  if (payload.currentRoom !== undefined) {
    faculty.currentLocation = trimString(payload.currentRoom) || faculty.currentLocation;
  }

  if (payload.teamsWebhookUrl !== undefined) {
    faculty.teamsWebhookUrl = trimString(payload.teamsWebhookUrl) || null;
  }

  await faculty.save();

  return res.status(200).json(normalizeFacultyCard(faculty));
}

/**
 * DELETE /faculty/:id
 * Principal: can delete any faculty.
 * Strand head: can only delete faculty in their strand.
 */
async function deleteFaculty(req, res) {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    const error = new Error('Invalid faculty id');
    error.name = 'CastError';
    error.path = 'id';
    throw error;
  }

  const faculty = await Faculty.findById(id);
  if (!faculty) throw createAuthError('NOT_FOUND');

  assertCanDeleteFaculty(req, faculty);

  await faculty.deleteOne();

  return res.status(200).json({
    id: faculty._id.toString(),
    facultyId: faculty.facultyId,
    deleted: true
  });
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
    error.errors = { status: { message: 'status must be one of the allowed faculty status values' } };
    throw error;
  }

  const faculty = await Faculty.findById(id);
  if (!faculty) throw createAuthError('NOT_FOUND');

  assertCanEditFaculty(req, faculty);

  let parsedExpires = null;
  if (expiresAt) {
    const d = new Date(expiresAt);
    if (isNaN(d.getTime())) {
      const error = new Error('Invalid expiresAt');
      error.name = 'ValidationError';
      error.errors = { expiresAt: { message: 'expiresAt must be a valid date' } };
      throw error;
    }
    parsedExpires = d;
  }

  const setBy = req.user?.id ? trimString(String(req.user.id)) : null;

  faculty.status = status;
  faculty.statusOverride = { status, expiresAt: parsedExpires, setBy };
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
  if (!faculty) throw createAuthError('NOT_FOUND');

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
  if (!faculty) throw createAuthError('NOT_FOUND');

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
  createFaculty,
  updateFaculty,
  deleteFaculty,
  updateFacultyStatus,
  updateFacultySchedule,
  updateFacultyConsultationHours,
  normalizeFacultyCard,
  generateFacultyId  
};