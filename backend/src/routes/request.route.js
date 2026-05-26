const express = require('express');
const router = express.Router();
const { createRequest, getBookedTimes, getRoomAvailability, getRequest, triggerPowerAutomateFlow, updateRequestStatus, getApprovedConsultations } = require('../controllers/request.controller');

router.post('/', createRequest);
router.post('/trigger-flow', triggerPowerAutomateFlow);
router.get('/booked-times', getBookedTimes);
router.get('/room-availability', getRoomAvailability);
router.get('/approved-consultations', getApprovedConsultations);
router.get('/:requestId', getRequest);
router.patch('/:requestId', updateRequestStatus);
router.patch('/:requestId/decision', updateRequestStatus);

module.exports = router;