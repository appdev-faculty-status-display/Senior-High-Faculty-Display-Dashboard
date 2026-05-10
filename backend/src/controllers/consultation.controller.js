const { getAllConsultRooms, getConsultRoomById } = require('../services/consultation.service');
const asyncHandler = require('../utils/asyncHandler');

// GET /consultation/rooms
const getRooms = asyncHandler(async (req, res) => {
    const result = await getAllConsultRooms();
    return res.status(200).json(result);
});


// GET /consultation/rooms/:id
const getRoomById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await getConsultRoomById(id);
    return res.status(200).json(result);
});

module.exports = {
    getRooms,
    getRoomById
};  