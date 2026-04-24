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

const consultationHoursSchema = new Schema(
  {
    start: { type: String, required: true, trim: true },
    end: { type: String, required: true, trim: true }
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

module.exports = mongoose.models.Faculty || mongoose.model('Faculty', facultySchema);