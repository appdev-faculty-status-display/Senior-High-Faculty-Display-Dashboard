const express = require('express');
const router = express.Router();
const { createRequest, getBookedTimes, getRoomAvailability, getRequest, triggerPowerAutomateFlow, updateRequestStatus, getApprovedConsultations } = require('../controllers/request.controller');
const { authToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

router.post('/', createRequest);
router.post('/trigger-flow', triggerPowerAutomateFlow);
router.get('/booked-times', getBookedTimes);
router.get('/room-availability', getRoomAvailability);
router.get('/approved-consultations', getApprovedConsultations);
router.get('/:requestId', getRequest);
router.patch('/:requestId', updateRequestStatus);
router.patch('/:requestId/decision', updateRequestStatus);
router.patch('/:requestId/service-decision', authToken, requireRole('service'), updateRequestStatus);

module.exports = router;