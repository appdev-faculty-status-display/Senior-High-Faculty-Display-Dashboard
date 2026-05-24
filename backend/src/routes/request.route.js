const express = require('express');
const router = express.Router();
const { getRequest, updateRequestStatus } = require('../controllers/request.controller');

router.get('/:requestId', getRequest);
router.patch('/:requestId', updateRequestStatus);

module.exports = router;