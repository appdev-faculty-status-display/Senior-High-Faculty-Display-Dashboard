// routes/schedules.route.js

const express  = require('express');
const router   = express.Router();
const { getSchedules } = require('../controllers/schedule.controller');
const { authToken }    = require('../middleware/auth');
const { requireRole }  = require('../middleware/roles');
const { asyncHandler } = require('../utils/asyncHandler');

// GET /api/schedules
router.get(
    '/',
    authToken,
    requireRole('principal', 'strand_head'),
    asyncHandler(getSchedules)
);

module.exports = router;