const express = require('express');
const router = express.Router();
const { getConsultationAnalyticsHandler } = require('../controllers/consultationAnalytics.controller');

router.get('/consultation', getConsultationAnalyticsHandler);

module.exports = router;
