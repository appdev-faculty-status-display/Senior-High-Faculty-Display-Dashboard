const express = require('express');
const router = express.Router();
const { getNotifications } = require('../controllers/notification.controller');
const { authToken } = require('../middleware/auth'); 
const { requireRole } = require('../middleware/roles');

router.get(
  '/',
  authToken,
  requireRole('principal', 'strand_head'),
  getNotifications
);

module.exports = router;