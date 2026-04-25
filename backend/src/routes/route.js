const express = require('express');
const router = express.Router();
const { login, refresh, logout } = require('../controllers/auth.controllers');
const { authToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const { reqSameStrand } = require('../middleware/strandScope');

function handler(req, res) {
    return res.status(501).json({ message: 'Profile handler not implemented yet' });
}

router.post('/auth/login', authLimiter, login);
router.post('/auth/refresh', authLimiter, refresh);
router.post('/auth/logout', logout);
router.get('/:facultyId/profile', authToken, reqSameStrand('facultyId'), handler);

module.exports = router;