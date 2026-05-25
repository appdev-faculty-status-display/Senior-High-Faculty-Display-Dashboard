const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

jest.mock('../models/request.model');
const Request = require('../models/request.model');

const { createRequest, getBookedTimes, getRequest, updateRequestStatus } = require('../controllers/request.controller');
const { asyncHandler } = require('../utils/asyncHandler');

const app = express();
app.use(express.json());
app.post('/requests', asyncHandler(createRequest));
app.get('/requests/booked-times', asyncHandler(getBookedTimes));
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