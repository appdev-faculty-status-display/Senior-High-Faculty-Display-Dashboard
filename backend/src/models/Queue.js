const mongoose = require('mongoose');
const { Schema } = mongoose;

const queueStatusValues = [
  'pending',
  'approved',
  'in_progress',
  'completed',
  'cancelled',
  'rejected',
  'no_show'
];

const urgencyValues = ['low', 'normal', 'urgent'];
const queueTypeValues = ['quick_consultation', 'room_consultation'];
const strandHeadApprovalValues = ['pending', 'approved', 'rejected'];

const queueSchema = new Schema(
  {
    facultyId: { type: String, required: true, index: true, trim: true },
    accessKey: { type: String, required: true, unique: true, index: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: queueStatusValues,
      default: 'pending',
      index: true
    },
    studentName: { type: String, required: true, trim: true },
    studentId: { type: String, required: true, trim: true },
    studentEmail: { type: String, required: true, trim: true },
    strand: { type: String, default: null, trim: true },
    reason: { type: String, required: true, trim: true },
    urgency: { type: String, enum: urgencyValues, default: 'normal', trim: true },
    type: { type: String, enum: queueTypeValues, required: true, trim: true },
    roomId: { type: String, default: null, trim: true },
    strandHeadApproval: {
      type: String,
      enum: strandHeadApprovalValues,
      default: null,
      trim: true
    },
    rejectionReason: { type: String, default: null, trim: true },
    expiresAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

// Auto-delete expired queue entries at expiresAt.
queueSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.models.Queue || mongoose.model('Queue', queueSchema);