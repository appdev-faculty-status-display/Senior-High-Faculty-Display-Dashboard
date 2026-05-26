const mongoose = require('mongoose');
const { Schema } = mongoose;

const importErrorSchema = new Schema(
  {
    row: { type: Number, required: true },
    message: { type: String, required: true, trim: true }
  },
  { _id: false }
)

const scheduleImportSchema = new Schema(
  {
    importedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },

    filename: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'success', 'partial', 'failed'],
      default: 'pending',
      index: true
    },
    startedAt: { type: Date, default: null },
    finishedAt: { type: Date, default: null },
    recordsProcessed: { type: Number, default: 0, min: 0 },
    recordsApplied: { type: Number, default: 0, min: 0 },
    importErrors: { type: [importErrorSchema], default: [] }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.ScheduleImport || mongoose.model('ScheduleImport', scheduleImportSchema);
