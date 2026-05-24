const Request = require('../models/request.model');

const allowedStatuses = new Set(['pending', 'approved', 'rejected']);

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
    const { status, rejectionReason } = req.body;

    console.log('[updateRequestStatus] received requestId=', requestId, 'body=', req.body);

    if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    if (status === 'rejected' && !String(rejectionReason || '').trim()) {
        return res.status(400).json({ error: 'rejectionReason is required when rejecting' });
    }

    try {
        const update = {
            status,
            rejectionReason: status === 'approved' ? null : String(rejectionReason).trim()
        };

        const request = await Request.findByIdAndUpdate(
            requestId,
            { $set: update },
            { new: true, runValidators: true }
        ).lean();

        console.log('[updateRequestStatus] MongoDB returned after update=', request);

        if (!request) return res.status(404).json({ error: 'Request not found' });

        res.json({ success: true, request });
    } catch (err) {
        console.error('[updateRequestStatus]', err);
        res.status(500).json({ error: err.message || 'Server error' });
    }
};

module.exports = { getRequest, updateRequestStatus };