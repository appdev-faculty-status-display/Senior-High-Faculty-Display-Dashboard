const mongoose = require('mongoose');
const { Schema } = mongoose;

const notificationSchema = new Schema(
  {
    recipientId: { 
      type: String, 
      default: null, 
      index: true, 
      trim: true 
    },
    recipientType: {
      type: String,
      enum: ['student', 'faculty', 'strand_head', 'principal'],
      default: 'broadcast',
      index: true
    },
    message: { 
      type: String, 
      required: true, 
    },
    type: { 
      type: String, 
      enum: [
        'queue_update', 
        'consultation_approved',
        'consultation_rejected',
        'room_assigned',
        'announcement',
        'cancellation_confirmed',
      ], 
      required: true
    },
    strand: {
      type: String,
      default: null,
    },
    channel: {
      type: String,
      enum: [
        'email',
        'teams_card',
       ],
      required: true
    },
    isRead: { 
      type: Boolean, 
      default: false,  
    },
    relatedQueueId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Queue',
      default: null,
    }
  },
  { 
    timestamps: true, 
    versionKey: false 
  }
);

//indexes for common query patterns
notificationSchema.index({ recipientId: 1, createdAt: -1 });
notificationSchema.index({ recipientType: 1, createdAt: -1 });
notificationSchema.index({ strand: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
