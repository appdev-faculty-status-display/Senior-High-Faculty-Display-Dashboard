const express = require('express');
const router = express.Router();
const { getResourceCommunicationAnalyticsHandler } = require('../controllers/resourceCommunicationAnalytics.controller');

router.get('/resource-communication', getResourceCommunicationAnalyticsHandler);

module.exports = router;
