const mongoose = require('mongoose');
const { Schema } = mongoose;

const announcementSchema = new Schema(
  {
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: [ 280, 'Announcement message cannot exceed 280 characters.' ]
    },
    scope: {
      type: String,
      enum: [ 'all', 'strand' ],
      required: true
    },
    strand: {
      type: String,
      trim: true,
      default: null,
    },
    level: {
      type: String,
      enum: [  'info', 'warning', 'critical' ],
      default: 'info'
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: String,
      required: true,
      trim: true,
    },
    createdByRole: {
      type: String,
      enum: [ 'principal', 'strand_head' ],
      required: true,
    },
    startsAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
