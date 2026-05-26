const XLSX = require('xlsx');
const bcrypt = require('bcryptjs');
const { Faculty, FacultyImport } = require('../models');

const REQUIRED_COLUMNS = ['name', 'userId', 'strand', 'role', 'subjects'];
const ALLOWED_ROLES = ['faculty', 'strand_head', 'principal'];
const DEFAULT_PHOTO_URL = 'https://placeholder.com/photo.jpg';
const DEFAULT_CURRENT_LOCATION = 'TBD';
const DEFAULT_PASSWORD_FALLBACK = 'Test1234!';

function normalizeCell(value) {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}

function getDefaultPassword() {
  const envPassword = normalizeCell(process.env.DEFAULT_FACULTY_PASSWORD);
  return envPassword || DEFAULT_PASSWORD_FALLBACK;
}

function parseSheet(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

function validateHeaders(rows) {
  if (!rows || rows.length === 0) {
    const error = new Error('The uploaded file is empty or has no data rows');
    error.name = 'ValidationError';
    error.errors = {
      file: { message: 'The uploaded file is empty or has no data rows' }
    };
    throw error;
  }

  const headers = Object.keys(rows[0]);
  const missing = REQUIRED_COLUMNS.filter(function (col) {
    return !headers.includes(col);
  });

  if (missing.length > 0) {
    const error = new Error(`Missing required columns: ${missing.join(', ')}`);
    error.name = 'ValidationError';
    error.errors = {
      file: { message: `Missing required columns: ${missing.join(', ')}` }
    };
    throw error;
  }

  return headers;
}

function addRowError(errors, row, field, message) {
  errors.push({ row, field, message });
}

function parseSubjects(value, rowNumber, errors) {
  if (Array.isArray(value)) {
    const normalized = value.map(normalizeCell).filter(Boolean);
    if (!normalized.length) {
      addRowError(errors, rowNumber, 'subjects', 'subjects must contain at least one value');
      return null;
    }
    return normalized;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) {
        addRowError(errors, rowNumber, 'subjects', 'subjects must be a JSON array');
        return null;
      }

      const normalized = parsed.map(normalizeCell).filter(Boolean);
      if (!normalized.length) {
        addRowError(errors, rowNumber, 'subjects', 'subjects must contain at least one value');
        return null;
      }

      return normalized;
    } catch (error) {
      addRowError(errors, rowNumber, 'subjects', 'subjects must be a JSON array');
      return null;
    }
  }

  addRowError(errors, rowNumber, 'subjects', 'subjects must be a JSON array');
  return null;
}

function parseSchedule(value, rowNumber, errors) {
  if (!value) {
    return null;
  }

  if (typeof value !== 'string') {
    addRowError(errors, rowNumber, 'schedule', 'schedule must be a JSON array');
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      addRowError(errors, rowNumber, 'schedule', 'schedule must be a JSON array');
      return null;
    }

    const normalized = [];
    parsed.forEach(function (entry, index) {
      if (!entry || typeof entry !== 'object') {
        addRowError(
          errors,
          rowNumber,
          'schedule',
          `schedule entry ${index + 1} must be an object`
        );
        return;
      }

      const day = normalizeCell(entry.day);
      const startTime = normalizeCell(entry.startTime);
      const endTime = normalizeCell(entry.endTime);
      const subject = normalizeCell(entry.subject);
      const room = normalizeCell(entry.room);

      if (!day || !startTime || !endTime || !subject || !room) {
        addRowError(
          errors,
          rowNumber,
          'schedule',
          `schedule entry ${index + 1} is missing required fields`
        );
        return;
      }

      normalized.push({ day, startTime, endTime, subject, room });
    });

    if (normalized.length === 0) {
      return null;
    }

    return normalized;
  } catch (error) {
    addRowError(errors, rowNumber, 'schedule', 'schedule must be a JSON array');
    return null;
  }
}

function parseRows(rows, headers) {
  const rowErrors = [];
  const parsedRows = [];
  const hasScheduleColumn = headers.includes('schedule');

  rows.forEach(function (row, index) {
    const rowNumber = index + 2;
    const localErrors = [];

    const name = normalizeCell(row.name);
    const userId = normalizeCell(row.userId);
    const strand = normalizeCell(row.strand);
    const role = normalizeCell(row.role);

    if (!name) {
      addRowError(localErrors, rowNumber, 'name', 'name is required');
    }

    if (!userId) {
      addRowError(localErrors, rowNumber, 'userId', 'userId is required');
    }

    if (!strand) {
      addRowError(localErrors, rowNumber, 'strand', 'strand is required');
    }

    if (!role) {
      addRowError(localErrors, rowNumber, 'role', 'role is required');
    } else if (!ALLOWED_ROLES.includes(role)) {
      addRowError(localErrors, rowNumber, 'role', 'role must be a valid faculty role');
    }

    const subjects = parseSubjects(row.subjects, rowNumber, localErrors);
    const schedule = hasScheduleColumn ? parseSchedule(row.schedule, rowNumber, localErrors) : null;

    if (localErrors.length > 0) {
      rowErrors.push(...localErrors);
      return;
    }

    parsedRows.push({
      rowNumber,
      name,
      userId,
      strand,
      role,
      subjects,
      schedule
    });
  });

  return { parsedRows, rowErrors };
}

async function createImportLog(importedBy, fileName) {
  return FacultyImport.create({
    importedBy,
    filename: fileName,
    status: 'processing',
    startedAt: new Date(),
    recordsProcessed: 0,
    recordsCreated: 0,
    recordsUpdated: 0,
    importErrors: []
  });
}

async function finalizeLog(log, status, recordsProcessed, recordsCreated, recordsUpdated, errors) {
  log.status = status;
  log.finishedAt = new Date();
  log.recordsProcessed = recordsProcessed;
  log.recordsCreated = recordsCreated;
  log.recordsUpdated = recordsUpdated;
  log.importErrors = errors;
  await log.save();
}

async function applyRows(rows, requestingUser, replaceSchedule) {
  let recordsCreated = 0;
  let recordsUpdated = 0;
  const applyErrors = [];
  let defaultPasswordHash = null;

  for (const row of rows) {
    if (requestingUser.role === 'strand_head') {
      if (!requestingUser.strand || row.strand !== requestingUser.strand) {
      addRowError(
        applyErrors,
        row.rowNumber,
        'strand',
        'Faculty belongs to a different strand and was skipped'
      );
      continue;
      }
    }

    const existing = await Faculty.findOne({ userId: row.userId });

    if (existing) {
      existing.name = row.name;
      existing.strand = row.strand;
      existing.role = row.role;
      existing.subjects = row.subjects;

      if (replaceSchedule && row.schedule && row.schedule.length > 0) {
        existing.schedule = row.schedule;
      }

      await existing.save();
      recordsUpdated += 1;
      continue;
    }

    if (!defaultPasswordHash) {
      defaultPasswordHash = await bcrypt.hash(getDefaultPassword(), 10);
    }

    await Faculty.create({
      facultyId: row.userId,
      userId: row.userId,
      name: row.name,
      role: row.role,
      strand: row.strand,
      passwordHash: defaultPasswordHash,
      photoUrl: DEFAULT_PHOTO_URL,
      status: 'available',
      currentLocation: DEFAULT_CURRENT_LOCATION,
      subjects: row.subjects,
      schedule: row.schedule || [],
      teamsWebhookUrl: null
    });

    recordsCreated += 1;
  }

  return { recordsCreated, recordsUpdated, applyErrors };
}

async function runFacultyImport(buffer, fileName, importedBy, replaceSchedule, requestingUser) {
  const log = await createImportLog(importedBy, fileName);

  try {
    const rows = parseSheet(buffer);
    const headers = validateHeaders(rows);
    const { parsedRows, rowErrors } = parseRows(rows, headers);
    const { recordsCreated, recordsUpdated, applyErrors } = await applyRows(
      parsedRows,
      requestingUser,
      replaceSchedule
    );

    const allErrors = [...rowErrors, ...applyErrors];
    const totalProcessed = rows.length;
    let status = 'success';

    if (allErrors.length > 0 && recordsCreated + recordsUpdated === 0) {
      status = 'failed';
    } else if (allErrors.length > 0) {
      status = 'partial';
    }

    await finalizeLog(
      log,
      status,
      totalProcessed,
      recordsCreated,
      recordsUpdated,
      allErrors
    );

    return {
      importId: log._id.toString(),
      status,
      recordsProcessed: totalProcessed,
      recordsCreated,
      recordsUpdated,
      errors: allErrors
    };
  } catch (error) {
    await finalizeLog(
      log,
      'failed',
      0,
      0,
      0,
      [{ row: 0, field: 'file', message: error.message }]
    );
    throw error;
  }
}

module.exports = { runFacultyImport };
