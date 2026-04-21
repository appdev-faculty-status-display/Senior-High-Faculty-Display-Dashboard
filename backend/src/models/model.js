const mongoose = require('mongoose');
const { Schema } = mongoose;

/*
  Faculty
  Includes all frontend fields + teamsWebhookUrl.
  toJSON transform removes teamsWebhookUrl.
*/
const facultyStatusValues = [
  'available',
  'in-class',
  'on-break',
  'off-campus',
  'in-meeting',
  'do-not-disturb'
];

const strandValues = ['STEM', 'ABM', 'HUMSS'];

const consultationHoursSchema = new Schema(
  {
    start: { type: String, required: true, trim: true },
    end: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const facultySchema = new Schema(
  {
    id: { type: String, required: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    strand: { type: String, required: true, enum: strandValues },
    photoUrl: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: facultyStatusValues, default: 'available' },
    currentLocation: { type: String, required: true, trim: true },
    subject: { type: String, default: null, trim: true },
    consultationHours: { type: consultationHoursSchema, default: null },
    meetingWith: { type: String, default: null, trim: true },
    returnTime: { type: String, default: null, trim: true },
    note: { type: String, default: null, trim: true },
    currentPeriod: { type: String, default: null, trim: true },
    teamsWebhookUrl: { type: String, default: null, trim: true }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function (_doc, ret) {
        delete ret.teamsWebhookUrl;
        return ret;
      }
    }
  }
);

/*
  Queue
  Must include: facultyId, accessKey, status, expiresAt
*/
const queueStatusValues = ['pending', 'active', 'served', 'expired'];

const queueSchema = new Schema(
  {
    facultyId: { type: String, required: true, index: true, trim: true },
    accessKey: { type: String, required: true, unique: true, index: true, trim: true },
    status: { type: String, required: true, enum: queueStatusValues, default: 'pending', index: true },
    expiresAt: { type: Date, required: true, index: true },

    studentName: { type: String, default: null, trim: true },
    studentId: { type: String, default: null, trim: true },
    strand: { type: String, default: null, trim: true },
    reason: { type: String, default: null, trim: true }
  },
  { timestamps: true, versionKey: false }
);

// Auto-delete expired queue entries at expiresAt
queueSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/*
  Room
*/
const roomStatusValues = [
  'AVAILABLE',
  'OCCUPIED',
  'RESERVED',
  'available',
  'occupied',
  'reserved'
];

const roomSchema = new Schema(
  {
    id: { type: String, required: true, index: true, trim: true },
    status: { type: String, required: true, enum: roomStatusValues, index: true },
    teacher: { type: String, default: null, trim: true },
    strand: { type: String, default: null, trim: true },
    time: { type: String, default: null, trim: true },
    student: { type: String, default: null, trim: true }
  },
  { timestamps: true, versionKey: false }
);

/*
  Announcement
*/
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

/*
  Notification
*/
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

/*
  ScheduleImport
*/
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

const Faculty = mongoose.models.Faculty || mongoose.model('Faculty', facultySchema);
const Queue = mongoose.models.Queue || mongoose.model('Queue', queueSchema);
const Room = mongoose.models.Room || mongoose.model('Room', roomSchema);
const Announcement = mongoose.models.Announcement || mongoose.model('Announcement', announcementSchema);
const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
const ScheduleImport = mongoose.models.ScheduleImport || mongoose.model('ScheduleImport', scheduleImportSchema);

module.exports = {
  Faculty,
  Queue,
  Room,
  Announcement,
  Notification,
  ScheduleImport
};