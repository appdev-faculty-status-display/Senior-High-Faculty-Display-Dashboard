const mongoose = require('mongoose');
const { Schema } = mongoose;

const roomStatusValues = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED'
];

const roomSchema = new Schema(
  {
    facultyId: { type: String, required: true, index: true, trim: true },
    status: { type: String, required: true, enum: roomStatusValues, index: true },
    teacher: { type: String, default: null, trim: true },
    strand: { type: String, default: null, trim: true },
    time: { type: String, default: null, trim: true },
    student: { type: String, default: null, trim: true }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.Room || mongoose.model('Room', roomSchema);
