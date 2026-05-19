const express = require('express');
const router = express.Router();
const { login, refresh, logout } = require('../controllers/auth.controller');
const {
    getFacultyList,
    getFacultyById,
    createFaculty,
    updateFacultyStatus,
    updateFacultySchedule,
    updateFacultyConsultationHours
} = require('../controllers/faculty.controllers');

const { authToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { requireRole } = require('../middleware/roles');
const { asyncHandler } = require('../utils/asyncHandler');

const scheduleImportRouter = require('./schedImport.route');

router.use('/schedule', scheduleImportRouter);
router.post('/auth/login', authLimiter, login);
router.post('/auth/refresh', authLimiter, refresh);
router.post('/auth/logout', logout);
router.get('/faculty', asyncHandler(getFacultyList));
router.get('/faculty/:id', asyncHandler(getFacultyById));
router.patch('/faculty/:id/status', authToken, asyncHandler(updateFacultyStatus));
router.patch('/faculty/:id/schedule', authToken, asyncHandler(updateFacultySchedule));
router.patch('/faculty/:id/consultation-hours', authToken, asyncHandler(updateFacultyConsultationHours));
router.get('/faculty/:id/queue', asyncHandler(getQueue));
router.post('/faculty/:id/queue', asyncHandler(createQueue));
router.patch('/faculty/:facultyId/queue/:queueId/cancel', asyncHandler(cancelQueue));
router.patch(
    '/faculty/:facultyId/queue/:queueId/status',
    authToken,
    requireRole('faculty', 'strand_head', 'principal'),
    asyncHandler(updateQueue)
);
router.patch(
    '/faculty/:facultyId/queue/:queueId/room',
    authToken,
    requireRole('faculty', 'strand_head', 'principal'),
    asyncHandler(assignRoom)
);

module.exports = router;