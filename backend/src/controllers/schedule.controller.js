// controllers/schedules.controller.js

const { listSchedules } = require('../services/schedule.service');

async function getSchedules(req, res) {
    const result = await listSchedules(req.user);
    return res.status(200).json(result);
}

module.exports = { getSchedules };