const mongoose = require('mongoose');
const { Schema } = mongoose;

const queueStatusValues = ['pending', 'active', 'served', 'expired'];

const queueSchema = new Schema(
  {
    facultyId: { type: String, required: true, index: true, trim: true },
    accessKey: { type: String, required: true, unique: true, index: true, trim: true },
    status: { type: String, required: true, enum: queueStatusValues, default: 'pending', index: true },
    expiresAt: { type: Date, required: true },
    studentName: { type: String, default: null, trim: true },
    studentId: { type: String, default: null, trim: true },
    strand: { type: String, default: null, trim: true },
    reason: { type: String, default: null, trim: true }
  },
  { timestamps: true, versionKey: false }
);

// Auto-delete expired queue entries at expiresAt.
queueSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.Queue || mongoose.model('Queue', queueSchema);