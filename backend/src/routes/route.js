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

router.use('/schedule', scheduleImportRouter);
router.post('/auth/login', authLimiter, login);
router.post('/auth/refresh', authLimiter, refresh);
router.post('/auth/logout', logout);
router.get('/faculty', asyncHandler(getFacultyList));
router.get('/faculty/:id', asyncHandler(getFacultyById));
router.patch('/faculty/:id/status', authToken, asyncHandler(updateFacultyStatus));
router.patch('/faculty/:id/schedule', authToken, asyncHandler(updateFacultySchedule));
router.patch('/faculty/:id/consultation-hours', authToken, asyncHandler(updateFacultyConsultationHours));

module.exports = router;