const mongoose = require('mongoose');
const Request = require('../models/request.model');
const ConsultRooms = require('../models/consultation.model');

const rawUrl = process.env.POWER_AUTOMATE_URL || 'https://default1d981f773ca346aeb0d4e8044e6c7f.84.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/3343cd1296ee46efaaa5abec7e1c62c9/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=h0isss1ndoNgJjPPfHk_Tml5YX55M_AyJwtyC2H0w-o';
const powerAutomateUrl = rawUrl.replace(/[\r\n\t ]/g, '').trim();

const allowedStatuses = new Set(['pending', 'approved', 'rejected']);
const defaultRoomCodes = ['CR-01', 'CR-02', 'CR-03'];

const timeRangeSplitPattern = /\s*(?:–|-|—)\s*/;

function parseTimeToMinutes(value) {
    const match = String(value || '').trim().match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);

    if (!match) {
        return null;
    }

    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const period = match[3] ? match[3].toUpperCase() : null;

    if (Number.isNaN(hour) || Number.isNaN(minute) || minute < 0 || minute > 59) {
        return null;
    }

    if (period) {
        if (hour < 1 || hour > 12) {
            return null;
        }

        if (period === 'PM' && hour !== 12) {
            hour += 12;
        }

        if (period === 'AM' && hour === 12) {
            hour = 0;
        }
    }

    if (hour < 0 || hour > 23) {
        return null;
    }

    return hour * 60 + minute;
}

function parseTimeRange(value) {
    const parts = String(value || '')
        .split(timeRangeSplitPattern)
        .map((part) => part.trim())
        .filter(Boolean);

    if (parts.length !== 2) {
        return null;
    }

    const start = parseTimeToMinutes(parts[0]);
    const end = parseTimeToMinutes(parts[1]);

    if (start === null || end === null || end <= start) {
        return null;
    }

    return { start, end };
}

function splitTimeRangeLabel(value) {
    const parts = String(value || '')
        .split(timeRangeSplitPattern)
        .map((part) => part.trim())
        .filter(Boolean);

    if (parts.length !== 2) {
        return { startTime: null, endTime: null };
    }

    return {
        startTime: parts[0],
        endTime: parts[1]
    };
}

function rangesOverlap(startA, endA, startB, endB) {
    return startA < endB && startB < endA;
}

function escapeRegex(value) {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeRoomCode(value) {
    return String(value || '').trim().toUpperCase();
}

function getFallbackRoomCodes() {
    const fromEnv = String(process.env.CONSULTATION_ROOM_CODES || '')
        .split(',')
        .map((code) => normalizeRoomCode(code))
        .filter(Boolean);

    return fromEnv.length > 0 ? fromEnv : defaultRoomCodes;
}

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
    const requestedRoom = normalizeRoomCode(payload.room);
    const requestedTimeRange = parseTimeRange(payload.time);

    try {
        if (requestedRoom && requestedRoom !== 'WALK-IN' && requestedTimeRange) {
            const existingRequests = await Request.find({
                status: { $in: ['pending', 'approved'] },
                room: { $ne: null },
                time: { $ne: null }
            })
                .select('room time')
                .lean();

            const hasConflict = existingRequests.some((request) => {
                if (normalizeRoomCode(request.room) !== requestedRoom) {
                    return false;
                }

                const existingTimeRange = parseTimeRange(request.time);

                return existingTimeRange
                    ? rangesOverlap(
                        requestedTimeRange.start,
                        requestedTimeRange.end,
                        existingTimeRange.start,
                        existingTimeRange.end
                    )
                    : false;
            });

            if (hasConflict) {
                return res.status(409).json({
                    error: 'Selected room is already booked for that time window.'
                });
            }
        }

        const request = await Request.create({
            studentName: payload.studentName,
            studentId: payload.studentId,
            studentEmail: payload.studentEmail,
            strand: payload.strand || null,
            teacher: payload.teacher || null,
            reason: payload.reason,
            room: typeof payload.room === 'string' ? payload.room.trim() : null,
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

    const teacherPattern = new RegExp(`^${escapeRegex(teacher)}$`, 'i');

    try {
        const requests = await Request.find({
            teacher: teacherPattern,
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

const getRoomAvailability = async (req, res) => {
    const startTime = String(req.query.startTime || '').trim();
    const endTime = String(req.query.endTime || '').trim();

    if (!startTime || !endTime) {
        return res.status(400).json({ error: 'startTime and endTime are required' });
    }

    const startMinutes = parseTimeToMinutes(startTime);
    const endMinutes = parseTimeToMinutes(endTime);

    if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
        return res.status(400).json({ error: 'Invalid time window' });
    }

    const rooms = await ConsultRooms.find().lean();
    const roomCatalog = rooms.length > 0
        ? rooms.map((room) => ({
            id: String(room._id),
            roomCode: normalizeRoomCode(room.roomCode),
            capacity: room.capacity,
            isActive: room.isActive,
            currentOccupant: room.currentOccupant || null,
            occupiedUntil: room.occupiedUntil || null
        }))
        : getFallbackRoomCodes().map((roomCode) => ({
            id: roomCode,
            roomCode,
            capacity: null,
            isActive: true,
            currentOccupant: null,
            occupiedUntil: null
        }));

    const bookedRequests = await Request.find({
        status: { $in: ['pending', 'approved'] },
        room: { $ne: null },
        time: { $ne: null }
    })
        .select('room time status')
        .lean();

    const data = roomCatalog.map((room) => {
        const normalizedRoomCode = normalizeRoomCode(room.roomCode);
        const roomReservations = bookedRequests.filter(
            (request) => normalizeRoomCode(request.room) === normalizedRoomCode
        );
        const isReserved = roomReservations.some((request) => {
            const timeRange = parseTimeRange(request.time);

            return timeRange
                ? rangesOverlap(startMinutes, endMinutes, timeRange.start, timeRange.end)
                : false;
        });

        return {
            id: room.id,
            roomCode: room.roomCode,
            capacity: room.capacity,
            isActive: room.isActive,
            status: room.isActive && !isReserved ? 'available' : 'reserved',
            currentOccupant: room.currentOccupant || null,
            occupiedUntil: room.occupiedUntil || null
        };
    });

    return res.status(200).json({
        startTime,
        endTime,
        total: data.length,
        available: data.filter((room) => room.status === 'available').length,
        data
    });
};

const triggerPowerAutomateFlow = async (req, res) => {
    const payload = req.body || {};
    const derivedTimeRange = splitTimeRangeLabel(payload.time);
    const flowPayload = {
        ...payload,
        startTime: payload.startTime || derivedTimeRange.startTime,
        endTime: payload.endTime || derivedTimeRange.endTime
    };

    try {
        const flowResponse = await fetch(powerAutomateUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(flowPayload)
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

const getApprovedConsultations = async (req, res) => {
    try {
        const consultations = await Request.find({
            status: 'approved',
            room: { $ne: null }
        })
            .select('studentName studentId studentEmail strand teacher room time urgency status')
            .lean();

        return res.json({
            data: consultations,
            total: consultations.length
        });
    } catch (err) {
        console.error('[getApprovedConsultations]', err);
        return res.status(500).json({ error: err.message || 'Server error' });
    }
};

module.exports = { createRequest, getBookedTimes, getRoomAvailability, getRequest, triggerPowerAutomateFlow, updateRequestStatus, getApprovedConsultations };