const express = require('express');
const router = express.Router();
const multer = require('multer');
const { importSchedule, addScheduleEntry } = require('../controllers/schedImport.controller');
const { authToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { asyncHandler } = require('../utils/asyncHandler');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (_req, file, cb) {
        if (
            file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Only .xlsx files are allowed'));
        }
    }
});

router.post(
    '/import',
    authToken,
    requireRole('principal', 'strand_head'),
    upload.single('file'),
    asyncHandler(importSchedule)
);

router.post(
    '/:facultyId',
    authToken,
    requireRole('principal', 'strand_head'),
    asyncHandler(addScheduleEntry)
);

module.exports = router;