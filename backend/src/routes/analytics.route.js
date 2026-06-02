const express = require('express');
const router = express.Router();
const { facultyActivity, consultation } = require('../controllers/analytics.controller');
const { authToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { asyncHandler } = require('../utils/asyncHandler');

// Public endpoints for charts used by admin pages. Some endpoints are protected for admin views.
router.get('/faculty-activity', authToken, requireRole('principal','strand_head'), asyncHandler(facultyActivity));
router.get('/consultation', authToken, requireRole('principal','strand_head'), asyncHandler(consultation));

module.exports = router;