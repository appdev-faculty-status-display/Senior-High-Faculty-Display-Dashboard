const mongoose = require('mongoose');
const Request = require('../models/request.model');

const powerAutomateUrl = process.env.POWER_AUTOMATE_URL || 'https://default1d981f773ca346aeb0d4e8044e6c7f.84.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3343cd1296ee46efaaa5abec7e1c62c9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=h0isss1ndoNgJjPPfHk_Tml5YX55M_AyJwtyC2H0w-o';

const allowedStatuses = new Set(['pending', 'approved', 'rejected']);

const normalizeDecision = (body = {}) => {
    const rawDecision = String(body.decision || body.status || '').trim().toLowerCase();

    if (rawDecision === 'approve' || rawDecision === 'approved') {
        return { status: 'approved', rejectionReason: null };
    }

    if (rawDecision === 'reject' || rawDecision === 'rejected') {
        const rejectionReason = String(body.rejectionReason || body.reason || '').trim();
        return {
            status: 'rejected',
            rejectionReason: rejectionReason || null
        };
    }

    return null;
};

const buildRequestResponse = (request) => ({
    success: true,
    request: {
        id: String(request._id),
        status: allowedStatuses.has(request.status) ? request.status : 'pending',
        rejectionReason: request.rejectionReason || null,
        updatedAt: request.updatedAt || null
    }
});

const createRequest = async (req, res) => {
    const payload = req.body || {};

    try {
        const request = await Request.create({
            studentName: payload.studentName,
            studentId: payload.studentId,
            studentEmail: payload.studentEmail,
            strand: payload.strand || null,
            teacher: payload.teacher || null,
            reason: payload.reason,
            room: payload.room || null,
            time: payload.time || null,
            urgency: payload.urgency || 'low'
        });

        return res.status(201).json({
            _id: String(request._id),
            status: allowedStatuses.has(request.status) ? request.status : 'pending',
            rejectionReason: request.rejectionReason || null
        });
    } catch (err) {
        console.error('[createRequest]', err);
        return res.status(500).json({ error: err.message || 'Server error' });
    }
};

const getBookedTimes = async (req, res) => {
    const teacher = String(req.query.teacher || '').trim();

    if (!teacher) {
        return res.status(400).json({ error: 'teacher is required' });
    }

    try {
        const requests = await Request.find({
            teacher,
            status: 'approved'
        })
            .select('time')
            .lean();

        return res.json({
            teacher,
            bookedTimes: requests.map((request) => request.time).filter(Boolean)
        });
    } catch (err) {
        console.error('[getBookedTimes]', err);
        return res.status(500).json({ error: err.message || 'Server error' });
    }
};

const triggerPowerAutomateFlow = async (req, res) => {
    const payload = req.body || {};

    try {
        const flowResponse = await fetch(powerAutomateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const responseText = await flowResponse.text();
        let responseBody = responseText;

        try {
            responseBody = responseText ? JSON.parse(responseText) : null;
        } catch (parseErr) {
            responseBody = responseText;
        }

        if (!flowResponse.ok) {
            return res.status(flowResponse.status).json({
                error: 'Power Automate flow trigger failed',
                status: flowResponse.status,
                body: responseBody
            });
        }

        return res.status(202).json({
            success: true,
            body: responseBody
        });
    } catch (err) {
        console.error('[triggerPowerAutomateFlow]', err);
        return res.status(500).json({ error: err.message || 'Server error' });
    }
};

const getRequest = async (req, res) => {
    const { requestId } = req.params;
    console.log('[getRequest] received requestId=', requestId);

    try {
        const request = await Request.findById(requestId).lean();
        console.log('[getRequest] MongoDB returned=', request);

        if (!request) return res.status(404).json({ error: 'Request not found' });

        res.json({
            status: allowedStatuses.has(request.status) ? request.status : 'pending',
            rejectionReason: request.rejectionReason || null
        });
    } catch (err) {
        console.error('[getRequest]', err);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateRequestStatus = async (req, res) => {
    const { requestId } = req.params;
    const normalizedDecision = normalizeDecision(req.body);

    console.log('[updateRequestStatus] received requestId=', requestId, 'body=', req.body);

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
        return res.status(400).json({ error: 'Invalid requestId' });
    }

    if (!normalizedDecision) {
        return res.status(400).json({
            error: 'Invalid decision',
            allowed: ['approve', 'reject']
        });
    }

    try {
        const update = { status: normalizedDecision.status };

        if (normalizedDecision.status === 'rejected') {
            update.rejectionReason = normalizedDecision.rejectionReason;
        } else {
            update.rejectionReason = null;
        }

        const request = await Request.findByIdAndUpdate(
            requestId,
            { $set: update },
            { new: true, runValidators: true }
        );

        console.log('[updateRequestStatus] MongoDB returned after update=', request);

        if (!request) return res.status(404).json({ error: 'Request not found' });

        res.json(buildRequestResponse(request));
    } catch (err) {
        console.error('[updateRequestStatus]', err);
        res.status(500).json({ error: err.message || 'Server error' });
    }
};

module.exports = { createRequest, getBookedTimes, getRequest, triggerPowerAutomateFlow, updateRequestStatus };