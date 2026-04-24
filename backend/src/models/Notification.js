const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipientType: {
      type: String,
      enum: ['faculty', 'student', 'admin', 'broadcast'],
      default: 'broadcast',
      index: true
    },
    recipientId: { type: String, default: null, index: true, trim: true },
    type: { type: String, enum: ['queue', 'announcement', 'status', 'system'], default: 'system' },
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date, default: null },
    meta: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
