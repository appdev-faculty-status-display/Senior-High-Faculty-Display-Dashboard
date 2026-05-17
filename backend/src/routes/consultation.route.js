const express = require('express');
const router = express.Router();
const { getRooms, getRoomById } = require('../controllers/consultation.controller');

router.get('/', getRooms);
router.get('/:id', getRoomById);

module.exports = router;