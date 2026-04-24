const mongoose = require('mongoose');
const { Schema } = mongoose;

const scheduleImportSchema = new Schema(
  {
    source: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    rowsTotal: { type: Number, default: 0, min: 0 },
    rowsInserted: { type: Number, default: 0, min: 0 },
    rowsUpdated: { type: Number, default: 0, min: 0 },
    rowsSkipped: { type: Number, default: 0, min: 0 },
    errorMessage: { type: String, default: null, trim: true }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.ScheduleImport || mongoose.model('ScheduleImport', scheduleImportSchema);
