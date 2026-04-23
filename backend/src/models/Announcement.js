const mongoose = require('mongoose');
const { Schema } = mongoose;

const announcementSchema = new Schema(
  {
    message: { type: String, required: true, trim: true },
    level: { type: String, enum: ['info', 'warning', 'critical'], default: 'info' },
    isActive: { type: Boolean, default: true, index: true },
    startsAt: { type: Date, default: Date.now, index: true },
    endsAt: { type: Date, default: null, index: true },
    createdBy: { type: String, default: 'system', trim: true }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
