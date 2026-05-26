// schedImport.service.js

const XLSX = require('xlsx');
const { Faculty, ScheduleImport } = require('../models');
const { createAuthError } = require('../utils/error');

const REQUIRED_COLUMNS = ['facultyId', 'name', 'day', 'startTime', 'endTime', 'subject', 'room'];
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Sheet parsing ────────────────────────────────────────────────────────────

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
        error.errors = { file: { message: 'The uploaded file is empty or has no data rows' } };
        throw error;
    }

    const headers = Object.keys(rows[0]);
    const missing = REQUIRED_COLUMNS.filter(col => !headers.includes(col));

    if (missing.length > 0) {
        const error = new Error(`Missing required columns: ${missing.join(', ')}`);
        error.name = 'ValidationError';
        error.errors = { file: { message: `Missing required columns: ${missing.join(', ')}` } };
        throw error;
    }
}

function validateRow(row, rowIndex) {
    const errors = [];
    const rowNumber = rowIndex + 2;

     if (!row.facultyId || String(row.facultyId).trim() === '') {
        errors.push({
            row: rowNumber,
            message: 'Column "facultyId" is empty or invalid'
        });
        return errors; 
    }

    REQUIRED_COLUMNS.filter(function (col) {
        return col !== 'facultyId';
    }).forEach(function (col) {
        if (!row[col] || String(row[col]).trim() === '') {
            errors.push({
                row: rowNumber,
                message: `Column "${col}" is empty`
            });
        }
    });

    if (row.day && !VALID_DAYS.includes(String(row.day).trim())) {
        errors.push({
            row: rowNumber,
            message: `Invalid day "${row.day}". Must be one of: ${VALID_DAYS.join(', ')}`
        });
    }

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (row.startTime && !timePattern.test(String(row.startTime).trim())) {
        errors.push({
            row: rowNumber,
            message: `Invalid startTime "${row.startTime}". Must be in HH:MM format (24-hour)`
        });
    }

    if (row.endTime && !timePattern.test(String(row.endTime).trim())) {
        errors.push({
            row: rowNumber,
            message: `Invalid endTime "${row.endTime}". Must be in HH:MM format (24-hour)`
        });
    }

    return errors;
}

function groupRowsByFaculty(rows) {
    const grouped = {};

    rows.forEach(function (row) {
        const facultyId = String(row.facultyId).trim();

        if (!grouped[facultyId]) {
            grouped[facultyId] = {
                name: String(row.name).trim(),
                entries: []
            };
        };

        grouped[facultyId].entries.push({
            day:       String(row.day).trim(),
            startTime: String(row.startTime).trim(),
            endTime:   String(row.endTime).trim(),
            subject:   String(row.subject).trim(),
            room:      String(row.room).trim()
        });
    });

    return grouped;
}

async function createImportLog(importedBy, fileName) {
    return ScheduleImport.create({
        importedBy,
        filename: fileName,
        status: 'processing',
        startedAt: new Date(),
        recordsProcessed: 0,
        recordsApplied: 0,
        importErrors: []
    });
}

function parseAndValidateRows(buffer) {         
    const rows = parseSheet(buffer);
    validateHeaders(rows);

    const rowErrors = [];
    rows.forEach(function (row, index) {
        const errors = validateRow(row, index);
        rowErrors.push(...errors);
    });

    return { rows, rowErrors };
}

function getValidRows(rows, rowErrors) {
    const errorRows = new Set(rowErrors.map(e => e.row));
    return rows.filter((_, index) => !errorRows.has(index + 2));
}

function computeRowCounts(rows, grouped) {
    const attemptedCounts = {};
    rows.forEach(function (row) {
        const facultyId = String(row.facultyId).trim();
        if (facultyId === '') return;
        attemptedCounts[facultyId] = (attemptedCounts[facultyId] || 0) + 1;
    });

    const validCounts = {};
    Object.keys(grouped).forEach(fid => { 
        validCounts[fid] = grouped[fid].entries.length; });

    return { attemptedCounts, validCounts };
}

async function applyGroupedSchedules(grouped, requestingUser, replaceAll) {
    const facultyIds = Object.keys(grouped);
    let recordsApplied = 0;
    const applyErrors = [];
 
    for (const facultyId of facultyIds) {
        const { name, entries } = grouped[facultyId];
        const faculty = await Faculty.findOne({ facultyId });
 
        if (!faculty) {
            applyErrors.push({
                row: 0,
                message: `Faculty with facultyId "${facultyId}" not found and was skipped`
            });
            continue;
        }
 
        if (requestingUser.role === 'strand_head' && 
            faculty.strand !== requestingUser.strand
        ) {
            applyErrors.push({
                row: 0,
                message: `Faculty "${facultyId}" belongs to a different strand and was skipped`
            });
            continue;
        }
 
        if (name && name !== faculty.name) {
            faculty.name = name;
        }
 
        if (replaceAll) {
            faculty.schedule = entries;
        } else {
            entries.forEach(function (newEntry) {
                const exists = faculty.schedule.some(function (existing) {
                    return (
                        existing.day       === newEntry.day &&
                        existing.startTime === newEntry.startTime &&
                        existing.endTime   === newEntry.endTime
                    );
                });
                if (!exists) faculty.schedule.push(newEntry);
            });
        }
 
        // Sync faculty.subjects from the full schedule (after merge/replace).
        // Collect unique non-empty subject values across all schedule entries.
        const subjectSet = new Set(
            faculty.schedule
                .map(function (e) { return e.subject && e.subject.trim(); })
                .filter(Boolean)
        );
        if (subjectSet.size > 0) {
            faculty.subjects = Array.from(subjectSet);
        }
 
        await faculty.save({ validateModifiedOnly: true });
        recordsApplied += entries.length;
    }
 
    return { recordsApplied, applyErrors };
}


async function finalizeLog(log, finalStatus, totalProcessed, recordsApplied, allErrors) {
    log.status = finalStatus;
    log.finishedAt = new Date();
    log.recordsProcessed = totalProcessed;
    log.recordsApplied = recordsApplied;
    log.importErrors = allErrors;
    await log.save();
}

// ─── Bulk import ──────────────────────────────────────────────────────────────

async function runImport(buffer, fileName, importedBy, replaceAll, requestingUser) {
    const log = await createImportLog(importedBy, fileName);
    try {
        const { rows, rowErrors } = parseAndValidateRows(buffer); 
        
        const validRows = getValidRows(rows, rowErrors);
        const grouped   = groupRowsByFaculty(validRows);
        const { attemptedCounts, validCounts } = computeRowCounts(rows, grouped);
        const { recordsApplied, applyErrors }  = await applyGroupedSchedules(
            grouped, requestingUser, replaceAll
        );

        const allErrors      = [...rowErrors, ...applyErrors];
        const totalProcessed = rows.length;

        let finalStatus = 'success';
        if (allErrors.length > 0 && recordsApplied === 0) finalStatus = 'failed';
        else if (allErrors.length > 0)                    finalStatus = 'partial';

        await finalizeLog(log, finalStatus, totalProcessed, recordsApplied, allErrors);

        return {
            importId:         log._id.toString(),
            status:           finalStatus,
            recordsProcessed: totalProcessed,
            recordsApplied,
            errors:           allErrors,
            perFacultyRowCounts: Object.keys(attemptedCounts).reduce(function (acc, fid) {
                acc[fid] = { attempted: attemptedCounts[fid] || 0, valid: validCounts[fid] || 0 };
                return acc;
            }, {})
        };
    } catch (err) {
        await finalizeLog(log, 'failed', 0, 0, [{ row: 0, message: err.stack || err.message }]);
        throw err;
    }
}

// ─── Single-entry add ─────────────────────────────────────────────────────────

/**
 * Adds one schedule entry to a faculty document.
 *
 * Times must be HH:MM strings in Philippine Standard Time (Asia/Manila, UTC+8).
 * The client is responsible for sending PH-local times — no UTC conversion is
 * performed here because PH has no DST (fixed offset), so HH:MM string
 * comparison is safe for duplicate detection.
 *
 * @param {string} facultyId       - The business-key facultyId (not MongoDB _id)
 * @param {{ day, startTime, endTime, subject, room }} entry
 * @param {{ role: string, strand?: string }} requestingUser - From req.user (JWT payload)
 * @returns {{ facultyId, addedEntry, totalEntries }}
 */
async function addEntry(facultyId, entry, requestingUser) {
    // ── 1. Validate the incoming entry fields ──────────────────────────────────
    const { day, startTime, endTime, subject, room } = entry;
    const validationErrors = [];

    if (!facultyId || String(facultyId).trim() === '') {
        const error = new Error('facultyId is required');
        error.name = 'ValidationError';
        error.errors = { facultyId: { message: 'facultyId is required' } };
        throw error;
    }

    if (!day || !VALID_DAYS.includes(String(day).trim())) {
        validationErrors.push(`day must be one of: ${VALID_DAYS.join(', ')}`);
    }

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

    if (!startTime || !timePattern.test(String(startTime).trim())) {
        validationErrors.push('startTime must be in HH:MM 24-hour format (PH time)');
    }

    if (!endTime || !timePattern.test(String(endTime).trim())) {
        validationErrors.push('endTime must be in HH:MM 24-hour format (PH time)');
    }

    // Only compare times if both are individually valid
    if (
        timePattern.test(String(startTime).trim()) &&
        timePattern.test(String(endTime).trim()) &&
        String(startTime).trim() >= String(endTime).trim()
    ) {
        validationErrors.push('startTime must be earlier than endTime');
    }

    if (!subject || String(subject).trim() === '') {
        validationErrors.push('subject is required');
    }

    if (!room || String(room).trim() === '') {
        validationErrors.push('room is required');
    }

    if (validationErrors.length > 0) {
        const error = new Error(validationErrors.join('; '));
        error.name = 'ValidationError';
        error.errors = validationErrors.reduce(function (acc, msg, i) {
            acc[`field_${i}`] = { message: msg };
            return acc;
        }, {});
        throw error;
    }

    // ── 2. Normalize (trim) all fields ─────────────────────────────────────────
    const normalized = {
        day:       String(day).trim(),
        startTime: String(startTime).trim(),
        endTime:   String(endTime).trim(),
        subject:   String(subject).trim(),
        room:      String(room).trim()
    };

    // ── 3. Fetch faculty document ──────────────────────────────────────────────
    const faculty = await Faculty.findOne({ facultyId: String(facultyId).trim() });

    if (!faculty) {
        throw createAuthError('NOT_FOUND');
    }

    // ── 4. Strand-head guard (mirrors applyGroupedSchedules) ──────────────────
    if (requestingUser.role === 'strand_head' && faculty.strand !== requestingUser.strand) {
        throw createAuthError('FORBIDDEN');
    }

    // ── 5. Duplicate detection (same day + startTime + endTime) ───────────────
    const duplicate = faculty.schedule.some(function (existing) {
        return (
            existing.day       === normalized.day &&
            existing.startTime === normalized.startTime &&
            existing.endTime   === normalized.endTime
        );
    });

    if (duplicate) {
        const error = new Error(
            `A schedule entry for "${normalized.day}" from ${normalized.startTime} ` +
            `to ${normalized.endTime} already exists for this faculty member.`
        );
        error.name = 'ValidationError';
        error.errors = { schedule: { message: error.message } };
        throw error;
    }

    // ── 6. Persist ─────────────────────────────────────────────────────────────
    faculty.schedule.push(normalized);

    // Sync subjects from full schedule after adding new entry
    const subjectSet = new Set(
        faculty.schedule
            .map(function (e) { return e.subject && e.subject.trim(); })
            .filter(Boolean)
    );
    if (subjectSet.size > 0) {
        faculty.subjects = Array.from(subjectSet);
    }
    await faculty.save({ validateModifiedOnly: true });

    return {
        facultyId,
        addedEntry:   normalized,
        totalEntries: faculty.schedule.length
    };
}

async function listSchedules() {
    const faculty = await Faculty.find(
        {}, { 
            facultyId: 1, 
            name: 1, 
            strand: 1, 
            schedule: 1 
        });

    return faculty.flatMap((f) =>
        f.schedule.map((entry) => ({
            // Faculty-level fields
            facultyId: f.facultyId,
            mongoId:   f._id.toString(),
            name:      f.name,           
            strand:    f.strand,

            // Schedule sub-document fields
            _id:       entry._id.toString(),
            day:       entry.day,
            startTime: entry.startTime,
            endTime:   entry.endTime,
            subject:   entry.subject,
            room:      entry.room,
        }))
    );
}

// ─── Single-entry delete ──────────────────────────────────────────────────────
async function deleteEntry(facultyId, entryKey) {
    const faculty = await Faculty.findOne({ facultyId });

    if (!faculty) {
        throw createAuthError('NOT_FOUND');
    }

    // entryKey formay: facultyId_day_startTime_endTime
    const [ , day, startTime, endTime ] = entryKey.split('_');

    const index = faculty.schedule.findIndex(
        (e) => e.day === day && e.startTime === startTime && e.endTime === endTime
    );

    if (index === -1) {
        const error = new Error('Schedule entry not found for deletion');
        error.name = 'NOT_FOUND';
        throw createAuthError('NOT_FOUND');
    }

    faculty.schedule.splice(index, 1);
    await faculty.save({ validateModifiedOnly: true });

    return { facultyId, deletedEntryKey: entryKey };
}

// ——— Update Entry ————————————————————————————————————————————————————————————
async function updateEntry(facultyId, entryKey, updates) {
    const faculty = await Faculty.findOne({ facultyId });
    if (!faculty) throw createAuthError('NOT_FOUND');

    const [, day, startTime, endTime] = entryKey.split('_');

    const entry = faculty.schedule.find(
        (e) => e.day === day && e.startTime === startTime && e.endTime === endTime
    );

    if (!entry) throw createAuthError('NOT_FOUND');

    // apply updates
    entry.day       = updates.day       ?? entry.day;
    entry.startTime = updates.startTime ?? entry.startTime;
    entry.endTime   = updates.endTime   ?? entry.endTime;
    entry.subject   = updates.subject   ?? entry.subject;
    entry.room      = updates.room      ?? entry.room;

    faculty.markModified('schedule');
    await faculty.save({ validateModifiedOnly: true });

    return { facultyId, updatedEntry: entry };
}


// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = { runImport, addEntry, deleteEntry, updateEntry };