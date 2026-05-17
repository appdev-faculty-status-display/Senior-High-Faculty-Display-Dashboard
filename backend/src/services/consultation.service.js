const ConsultRooms = require('../models/consultation.model');
const { createAuthError } = require('../utils/error');

async function getAllConsultRooms() {
    const rooms = await ConsultRooms.find()
        .populate('currentOccupant', 'name')
        .lean();

    const available = rooms.filter(
        (room) => room.isActive && room.currentOccupant === null
    ).length;

    const data = rooms.map((room) => ({
        id: room._id,
        roomCode: room.roomCode,
        capacity: room.capacity,
        isActive: room.isActive,
        currentOccupant: room.currentOccupant
            ? {
                id: room.currentOccupant._id,
                name: room.currentOccupant.name
            }
            : null,
        occupiedUntil: room.occupiedUntil ?? null,
    }));


    return {
        data,
        total: rooms.length,
        available,
    };
}

async function getConsultRoomById(id) {
    const room = await ConsultRooms.findById(id)
        .populate('currentOccupant', 'name')
        .lean();

    if (!room) {
        throw createAuthError('NOT_FOUND');
    }

    return {
        id: room._id,
        roomCode: room.roomCode,
        capacity: room.capacity,
        isActive: room.isActive,
        currentOccupant: room.currentOccupant
            ? { id: room.currentOccupant._id, name: room.currentOccupant.name }
            : null,
        occupiedUntil: room.occupiedUntil ?? null,
    };
}

module.exports = {
    getAllConsultRooms,
    getConsultRoomById
};