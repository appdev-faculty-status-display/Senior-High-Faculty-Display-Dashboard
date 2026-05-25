const express = require('express');
const router = express.Router();
const multer = require('multer');

const { login, refresh, logout } = require('../controllers/auth.controller');
const {
    getFacultyList,
    getFacultyById,
    createFaculty,
    updateFacultyStatus,
    updateFacultySchedule,
    updateFacultyConsultationHours
} = require('../controllers/faculty.controller');
const {
    getQueue,
    createQueue,
    cancelQueue,
    updateQueue,
    assignRoom
} = require('../controllers/queue.controller');

const { authToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { requireRole } = require('../middleware/roles');
const { asyncHandler } = require('../utils/asyncHandler');

const scheduleImportRouter = require('./schedImport.route');
const facultyImportRouter = require('./facultyImport.route');
const announcementsRouter = require('./announcements.route');
const notificationRouter = require('./notification.route');
const requestsRouter = require('./request.route');
const schedulesRouter = require('./schedule.route');
const facultyImportRouter = require('./facultyImport.route');
const announcementsRouter = require('./announcements.route');
const notificationRouter = require('./notification.route');

const upload = multer();

// ── Schedule ──────────────────────────────────────────────────────────────────
router.use('/schedule', schedulesRouter);      // GET  /schedule
router.use('/schedule', scheduleImportRouter); // POST /schedule/import
// POST /schedule/:facultyId

// ── Announcements ─────────────────────────────────────────────────────────────
router.use('/announcements', announcementsRouter);

// ── Auth ──────────────────────────────────────────────────────────────────────
router.post('/auth/login', authLimiter, login);
router.post('/auth/refresh', authLimiter, refresh);
router.post('/auth/logout', logout);

// ── Faculty ───────────────────────────────────────────────────────────────────
router.post(
    '/faculty',
    authToken,
    requireRole('principal', 'strand_head'),
    upload.none(),
    asyncHandler(createFaculty)
);
router.use('/faculty/:id', authToken);
router.get('/faculty', asyncHandler(getFacultyList));
router.get('/faculty/:id', asyncHandler(getFacultyById));
router.patch('/faculty/:id/status', authToken, asyncHandler(updateFacultyStatus));
router.patch('/faculty/:id/schedule', authToken, asyncHandler(updateFacultySchedule));
router.patch('/faculty/:id/consultation-hours', authToken, asyncHandler(updateFacultyConsultationHours));

// ── Queue ─────────────────────────────────────────────────────────────────────
router.get('/faculty/:id/queue', asyncHandler(getQueue));
router.post('/faculty/:id/queue', asyncHandler(createQueue));
router.patch(
    '/faculty/:facultyId/queue/:queueId/cancel',
    asyncHandler(cancelQueue)
);
router.patch(
    '/faculty/:facultyId/queue/:queueId/room',
    authToken,
    requireRole('faculty', 'strand_head', 'principal', 'service'),
    asyncHandler(assignRoom)
);

// ── Notifications ─────────────────────────────────────────────────────────────
router.use('/notifications', notificationRouter);
router.use('/requests', requestsRouter);

module.exports = router;