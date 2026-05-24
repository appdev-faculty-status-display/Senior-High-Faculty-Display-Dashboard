const XLSX = require('xlsx');
const { Faculty, ScheduleImport } = require('../models');

/**
 * MEMORY CONSIDERATIONS FOR LARGE FILE IMPORTS:
 * 
 * Current Implementation Limits:
 * - XLSX parser loads the entire file into memory before processing
 * - multer limits file size to 5MB in schedImport.route.js
 * - Faculty.find().cursor() uses streaming to avoid loading all faculty into memory
 * 
 * Scaling Recommendations:
 * 1. For files >10MB: Implement streaming XLSX parsing with 'xlsx-stream' or similar
 * 2. Consider processing files in chunks (e.g., 1000 rows at a time)
 * 3. For very large operations: Use a background job queue (Bull, RabbitMQ, etc.)
 * 4. Monitor memory usage in production and adjust limits based on server capacity
 * 5. Consider compression for API requests if import frequency is high
 */

const REQUIRED_COLUMNS = ['facultyId', 'day', 'startTime', 'endTime', 'subject', 'room'];
const VALID_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
}

function validateRow(row, rowIndex) {
    const errors = [];
    const rowNumber = rowIndex + 2; // account for header row and 1-based index

    // Explicit check for empty facultyId (more specific error message)
    if (!row.facultyId || String(row.facultyId).trim() === '') {
        errors.push({
            row: rowNumber,
            message: 'Column "facultyId" is empty or invalid'
        });
        // Return early to avoid cascading errors
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

    const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/; // matches HH:MM in 24-hour format

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
            grouped[facultyId] = [];
        }

        grouped[facultyId].push({
            day: String(row.day).trim(),
            startTime: String(row.startTime).trim(),
            endTime: String(row.endTime).trim(),
            subject: String(row.subject).trim(),
            room: String(row.room).trim()
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

        if (facultyId === '') {
            return;
        }

        attemptedCounts[facultyId] = (attemptedCounts[facultyId] || 0) + 1;
    });

    const validCounts = {};
    Object.keys(grouped).forEach(function (fid) {
        validCounts[fid] = grouped[fid].length;
    });

    return { attemptedCounts, validCounts };
}

async function applyGroupedSchedules(grouped, requestingUser, replaceAll) {
    const facultyIds = Object.keys(grouped);
    let recordsApplied = 0;
    const applyErrors = [];

    for (const facultyId of facultyIds) {
        const faculty = await Faculty.findOne({ facultyId });

        if (!faculty) {
            applyErrors.push({
                row: 0,
                message: `Faculty with facultyId "${facultyId}" not found and was skipped`
            });
            continue;
        }

        if (
            requestingUser.role === 'strand_head' &&
            faculty.strand !== requestingUser.strand
        ) {
            applyErrors.push({
                row: 0,
                message: `Faculty "${facultyId}" belongs to a different strand and was skipped`
            });
            continue;
        }

        if (replaceAll) {
            faculty.schedule = grouped[facultyId];
        } else {
            const incoming = grouped[facultyId];

            incoming.forEach(function (newEntry) {
                const exists = faculty.schedule.some(function (existing) {
                    return (
                        existing.day === newEntry.day &&
                        existing.startTime === newEntry.startTime &&
                        existing.endTime === newEntry.endTime
                    );
                });

                if (!exists) {
                    faculty.schedule.push(newEntry);
                }
            });
        }

        await faculty.save();
        recordsApplied += grouped[facultyId].length;
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

async function runImport(buffer, fileName, importedBy, replaceAll, requestingUser) {
    const log = await createImportLog(importedBy, fileName);
    try {
        const { rows, rowErrors } = parsedAndValidateRows(buffer);
        const validRows = getValidRows(rows, rowErrors);
        const grouped = groupRowsByFaculty(validRows);
        const { attemptedCounts, validCounts } = computeRowCounts(rows, grouped);
        const { recordsApplied, applyErrors } = await applyGroupedSchedules(
            grouped,
            requestingUser,
            replaceAll
        );

        const allErrors = [...rowErrors, ...applyErrors];
        const totalProcessed = rows.length;

        let finalStatus = 'success';

        if (allErrors.length > 0 && recordsApplied === 0) {
            finalStatus = 'failed';
        } else if (allErrors.length > 0) {
            finalStatus = 'partial';
        }

        await finalizeLog(log, finalStatus, totalProcessed, recordsApplied, allErrors);

        return {
            importId: log._id.toString(),
            status: finalStatus,
            recordsProcessed: totalProcessed,
            recordsApplied: recordsApplied,
            errors: allErrors,
            perFacultyRowCounts: Object.keys(attemptedCounts)
                .reduce(function (acc, fid) {
                    acc[fid] = {
                        attempted: attemptedCounts[fid] || 0,
                        valid: validCounts[fid] || 0
                    };
                    return acc;
                }, {})
        };
    } catch (err) {
        await finalizeLog(log, 'failed', 0, 0, [{ row: 0, message: err.stack || err.message }]);
        throw err;
    }
}

module.exports = { runImport };