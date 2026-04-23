const express = require('express');
const router = express.Router();
const { login, refresh, logout } = require('../auth/controller');

router.post('/auth/login', login);
router.post('/auth/refresh', refresh);
router.post('/auth/logout', logout);

module.exports = router;