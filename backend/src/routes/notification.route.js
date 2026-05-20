const express = require('express');
const router = express.Router();
const { getNotifications } = require('../controllers/notificationController');
const { authenticate, authorize } = require('../middleware/auth'); // project-level auth middleware

router.get(
  '/',
  authenticate,
  authorize(['principal', 'strand_head']),
  getNotifications
);

module.exports = router;