const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

jest.mock('../models/request.model');
jest.mock('../models/consultation.model');
const Request = require('../models/request.model');
const ConsultRooms = require('../models/consultation.model');

const { createRequest, getBookedTimes, getRoomAvailability, getRequest, updateRequestStatus } = require('../controllers/request.controller');
const { asyncHandler } = require('../utils/asyncHandler');

const app = express();
app.use(express.json());
app.post('/requests', asyncHandler(createRequest));
app.get('/requests/booked-times', asyncHandler(getBookedTimes));
app.get('/requests/room-availability', asyncHandler(getRoomAvailability));
app.get('/requests/:requestId', asyncHandler(getRequest));
app.patch('/requests/:requestId', asyncHandler(updateRequestStatus));
app.patch('/requests/:requestId/decision', asyncHandler(updateRequestStatus));

const requestId = new mongoose.Types.ObjectId().toString();

describe('Request Routes', () => {
    afterEach(() => jest.clearAllMocks());

    describe('POST /requests', () => {
        it('creates a request and returns top-level _id for flow response mapping', async () => {
            Request.create.mockResolvedValue({
                _id: requestId,
                status: 'pending',
                rejectionReason: null
            });

            const res = await request(app)
                .post('/requests')
                .send({
                    studentName: 'Juan Dela Cruz',
                    studentId: '2025-123456',
                    studentEmail: 'juan@example.com',
                    reason: 'Consultation request'
                });

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('_id', requestId);
            expect(res.body).toHaveProperty('status', 'pending');
            expect(Request.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    studentName: 'Juan Dela Cruz',
                    studentId: '2025-123456',
                    studentEmail: 'juan@example.com',
                    reason: 'Consultation request'
                })
            );
        });

        it('rejects overlapping room requests even for different teachers', async () => {
            Request.find.mockReturnValue({
                select: () => ({
                    lean: () => Promise.resolve([
                        { room: 'CR-03', time: '12:07 PM – 1:07 PM' }
                    ])
                })
            });

            const res = await request(app)
                .post('/requests')
                .send({
                    studentName: 'Juan Dela Cruz',
                    studentId: '2025-123456',
                    studentEmail: 'juan@example.com',
                    teacher: 'Mr. Robles',
                    reason: 'Consultation request',
                    room: 'CR-03',
                    time: '12:30 PM – 1:00 PM'
                });

            expect(res.status).toBe(409);
            expect(res.body).toHaveProperty('error', 'Selected room is already booked for that time window.');
            expect(Request.create).not.toHaveBeenCalled();
        });
    });

    describe('GET /requests/booked-times', () => {
        it('returns approved booked times for a teacher only', async () => {
            Request.find.mockReturnValue({
                select: () => ({
                    lean: () => Promise.resolve([
                        { time: '11:15 AM - 11:30 AM' },
                        { time: '11:30 AM - 11:45 AM' }
                    ])
                })
            });

            const res = await request(app)
                .get('/requests/booked-times')
                .query({ teacher: 'Mr. Jompilla' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('teacher', 'Mr. Jompilla');
            expect(res.body).toHaveProperty('bookedTimes');
            expect(Array.isArray(res.body.bookedTimes)).toBe(true);
            expect(Request.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    teacher: expect.any(RegExp),
                    status: 'approved'
                })
            );

            const queryTeacherRegex = Request.find.mock.calls[0][0].teacher;
            expect(queryTeacherRegex.test('mr. jompilla')).toBe(true);
            expect(queryTeacherRegex.test('Mr. Jompilla')).toBe(true);
            expect(queryTeacherRegex.test('Mr. Robles')).toBe(false);
        });
    });

    describe('GET /requests/room-availability', () => {
        it('marks overlapping consultation rooms as reserved', async () => {
            ConsultRooms.find.mockReturnValue({
                lean: () => Promise.resolve([
                    { _id: new mongoose.Types.ObjectId().toString(), roomCode: 'CR-01', capacity: 4, isActive: true },
                    { _id: new mongoose.Types.ObjectId().toString(), roomCode: 'CR-02', capacity: 4, isActive: true },
                    { _id: new mongoose.Types.ObjectId().toString(), roomCode: 'CR-03', capacity: 4, isActive: false }
                ])
            });

            Request.find.mockReturnValue({
                select: () => ({
                    lean: () => Promise.resolve([
                        { room: ' CR-01 ', time: '09:30 AM - 10:00 AM', status: 'approved' },
                        { room: 'CR-02', time: '10:00 AM – 10:30 AM', status: 'pending' },
                        { room: 'CR-02', time: '11:00 AM - 11:30 AM', status: 'rejected' }
                    ])
                })
            });

            const res = await request(app)
                .get('/requests/room-availability')
                .query({ startTime: '09:45', endTime: '10:15' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('available', 0);
            expect(res.body.data.find((room) => room.roomCode === 'CR-01').status).toBe('reserved');
            expect(res.body.data.find((room) => room.roomCode === 'CR-02').status).toBe('reserved');
            expect(res.body.data.find((room) => room.roomCode === 'CR-03').status).toBe('reserved');
        });

        it('uses fallback room list when consultation rooms are not seeded', async () => {
            ConsultRooms.find.mockReturnValue({
                lean: () => Promise.resolve([])
            });

            Request.find.mockReturnValue({
                select: () => ({
                    lean: () => Promise.resolve([
                        { room: 'CR-01', time: '12:23 PM - 12:58 PM', status: 'approved' }
                    ])
                })
            });

            const res = await request(app)
                .get('/requests/room-availability')
                .query({ startTime: '12:28', endTime: '12:33' });

            expect(res.status).toBe(200);
            expect(res.body.data.find((room) => room.roomCode === 'CR-01').status).toBe('reserved');
            expect(res.body.data.find((room) => room.roomCode === 'CR-02').status).toBe('available');
            expect(res.body.data.find((room) => room.roomCode === 'CR-03').status).toBe('available');
        });

        it('returns 400 for an invalid time window', async () => {
            const res = await request(app)
                .get('/requests/room-availability')
                .query({ startTime: '10:30', endTime: '10:00' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Invalid time window');
        });
    });

    describe('PATCH /requests/:requestId/decision', () => {
        it('approves a request from a direct decision payload', async () => {
            Request.findByIdAndUpdate.mockResolvedValue({
                _id: requestId,
                status: 'approved',
                rejectionReason: null,
                updatedAt: new Date()
            });

            const res = await request(app)
                .patch(`/requests/${requestId}/decision`)
                .send({ decision: 'approve' });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('success', true);
            expect(res.body.request).toHaveProperty('status', 'approved');
            expect(Request.findByIdAndUpdate).toHaveBeenCalledWith(
                requestId,
                { $set: { status: 'approved', rejectionReason: null } },
                expect.objectContaining({ new: true, runValidators: true })
            );
        });

        it('rejects a request and stores an optional reason', async () => {
            Request.findByIdAndUpdate.mockResolvedValue({
                _id: requestId,
                status: 'rejected',
                rejectionReason: 'Teacher unavailable',
                updatedAt: new Date()
            });

            const res = await request(app)
                .patch(`/requests/${requestId}/decision`)
                .send({ decision: 'reject', rejectionReason: 'Teacher unavailable' });

            expect(res.status).toBe(200);
            expect(res.body.request).toHaveProperty('status', 'rejected');
            expect(res.body.request).toHaveProperty('rejectionReason', 'Teacher unavailable');
        });

        it('returns 400 for an invalid decision payload', async () => {
            const res = await request(app)
                .patch(`/requests/${requestId}/decision`)
                .send({ decision: 'maybe' });

            expect(res.status).toBe(400);
            expect(res.body).toHaveProperty('error', 'Invalid decision');
        });
    });

    describe('PATCH /requests/:requestId', () => {
        it('keeps the legacy status payload working', async () => {
            Request.findByIdAndUpdate.mockResolvedValue({
                _id: requestId,
                status: 'approved',
                rejectionReason: null,
                updatedAt: new Date()
            });

            const res = await request(app)
                .patch(`/requests/${requestId}`)
                .send({ status: 'approved' });

            expect(res.status).toBe(200);
            expect(res.body.request).toHaveProperty('status', 'approved');
        });
    });
});