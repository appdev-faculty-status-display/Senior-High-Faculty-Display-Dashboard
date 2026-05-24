const express = require('express');
const router = express.Router();

const { authToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { 
    getAnnouncements,
    postAnnouncement,
    removeAnnouncement
} = require('../controllers/announcement.controller');

const optionalAuthToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return next();
    }

    return authToken(req, res, next);
};

//GET /announcements
router.get('/', optionalAuthToken, getAnnouncements);

//POST /announcements
router.post('/', authToken, requireRole('principal', 'strand_head'), postAnnouncement);

//DELETE
router.delete('/:id', authToken, requireRole('principal', 'strand_head'), removeAnnouncement);

module.exports = router;