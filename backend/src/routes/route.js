const express = require('express');
const router = express.Router();

const { login, refresh, logout } = require('../controllers/auth.controllers');
const {
    getFacultyList,
    getFacultyById,
    updateFacultyStatus,
    updateFacultySchedule,
    updateFacultyConsultationHours
} = require('../controllers/faculty.controllers');

const { authToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { asyncHandler } = require('../utils/asyncHandler');

const scheduleImportRouter = require('./schedImport.route');
const announcementsRouter = require('./announcements.route');

router.use('/schedule', scheduleImportRouter);
router.use('/announcements', announcementsRouter);

router.post('/auth/login', authLimiter, login);
router.post('/auth/refresh', authLimiter, refresh);
router.post('/auth/logout', logout);

router.use('/faculty/:id', authToken);

router.get('/faculty', asyncHandler(getFacultyList));
router.get('/faculty/:id', asyncHandler(getFacultyById));

router.patch('/faculty/:id/status', asyncHandler(updateFacultyStatus));
router.patch('/faculty/:id/schedule', asyncHandler(updateFacultySchedule));
router.patch('/faculty/:id/consultation-hours', asyncHandler(updateFacultyConsultationHours));

module.exports = router;