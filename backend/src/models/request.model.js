const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
    {
        studentName: { type: String, required: true },
        studentId: { type: String, required: true },
        studentEmail: { type: String, required: true },
        strand: { type: String, default: null },
        teacher: { type: String, default: null },
        reason: { type: String, required: true },
        purpose: { type: String, default: null, trim: true },
        room: { type: String, default: null },
        time: { type: String, default: null },
        urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed', 'no_show'],
            default: 'pending'
        },
        rejectionReason: { type: String, default: null },
        cancellationReason: { type: String, default: null, trim: true },
        facultyApprovedAt: { type: Date, default: null },
        strandHeadApprovedAt: { type: Date, default: null },
    },
    { timestamps: true, versionKey: false }
);

const requestDbName = process.env.REQUESTS_DB_NAME || 'requests';
const requestDb = mongoose.connection.useDb(requestDbName, { useCache: true });

module.exports = requestDb.models.facultyboard ||
    requestDb.model('facultyboard', requestSchema, 'consultationRequests');