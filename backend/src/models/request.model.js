const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema(
    {
        studentName: { type: String, required: true },
        studentId: { type: String, required: true },
        studentEmail: { type: String, required: true },
        strand: { type: String, default: null },
        teacher: { type: String, default: null },
        reason: { type: String, required: true },
        room: { type: String, default: null },
        time: { type: String, default: null },
        urgency: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        rejectionReason: { type: String, default: null },
    },
    { timestamps: true, versionKey: false }
);

const requestDbName = process.env.REQUESTS_DB_NAME || 'requests';
const requestDb = mongoose.connection.useDb(requestDbName, { useCache: true });

module.exports = requestDb.models.facultyboard ||
    requestDb.model('facultyboard', requestSchema, 'consultationRequests');