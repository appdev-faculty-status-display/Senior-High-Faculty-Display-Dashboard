const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
    roomCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    capacity: {
        type: Number,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    currentOccupant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    occupiedUntil: {
        type: Date,
        default: null,
    },
},
    {
        timestamps: true,
    }
);

const ConsultRooms = mongoose.model('ConsultRooms', consultationSchema);

module.exports = ConsultRooms;