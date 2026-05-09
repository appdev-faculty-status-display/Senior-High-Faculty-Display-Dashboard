const express = require('express');
const router = express.Router();

const { authToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { 
    getAnnouncements,
    postAnnouncement,
    removeAnnouncement
} = require('../controllers/announcement.controller');

//GET /announcements
router.get('/', getAnnouncements);

//POST - confirm exact role strings first then plug in here
router.post('/', authToken, requireRole('principal', 'strand_head'), postAnnouncement);

//DELETE
router.delete('/:id', authToken, requireRole('principal', 'strand_head'), removeAnnouncement);

module.exports = router;