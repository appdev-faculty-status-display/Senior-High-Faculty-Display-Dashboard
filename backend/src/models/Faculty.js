const mongoose = require('mongoose');
const { Schema } = mongoose;

const facultyStatusValues = [
  'available',
  'in-class',
  'on-break',
  'off-campus',
  'in-meeting',
  'do-not-disturb'
];

const scheduleEntrySchema = new Schema(
  {
    day: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    room: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const consultationHoursSchema = new Schema(
  {
    day: { type: String, required: true, trim: true },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true }
  },
  { _id: false }
);

const statusOverrideSchema = new Schema(
  {
    status: { type: String, required: true, enum: facultyStatusValues, trim: true },
    expiresAt: { type: Date, default: null },
    setBy: { type: String, default: null, trim: true }
  },
  { _id: false }
);

const facultySchema = new Schema(
  {
    facultyId: { type: String, required: true, index: true, trim: true },
    userId: { type: String, sparse: true, index: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      required: true,
      enum: ['faculty', 'strand_head', 'principal'],
      default: 'faculty'
    },
    passwordHash: { type: String, required: true, select: false },
    refreshTokenHash: { type: String, default: null, select: false },
    strand: { type: String, default: null, trim: true },
    photoUrl: { type: String, required: true, trim: true },
    status: { type: String, required: true, enum: facultyStatusValues, default: 'available' },
    statusOverride: { type: statusOverrideSchema, default: null },
    currentLocation: { type: String, required: true, trim: true },
    subject: { type: String, default: null, trim: true },
    schedule: { type: [scheduleEntrySchema], default: [] },
    consultationHours: { type: [consultationHoursSchema], default: [] },
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

module.exports = mongoose.models.Faculty || mongoose.model('Faculty', facultySchema);