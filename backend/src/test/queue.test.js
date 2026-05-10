const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

jest.mock('../services/queue.service');
const {
  getQueueByFaculty,
  createQueueEntry,
  cancelQueueEntry,
  updateQueueStatus,
  assignQueueRoom
} = require('../services/queue.service');

const {
  getQueue,
  createQueue,
  cancelQueue,
  updateQueue,
  assignRoom
} = require('../controllers/queue.controller');

const { asyncHandler } = require('../utils/asyncHandler');
const { requireRole } = require('../middleware/roles');

const app = express();
app.use(express.json());

const mockAuth = (role = 'faculty') => (req, _res, next) => {
  req.user = { role, id: new mongoose.Types.ObjectId().toString() };
  next();
};

app.get('/faculty/:id/queue', asyncHandler(getQueue));
app.post('/faculty/:id/queue', asyncHandler(createQueue));
app.patch('/faculty/:facultyId/queue/:queueId/cancel', asyncHandler(cancelQueue));
app.patch(
  '/faculty/:facultyId/queue/:queueId/status',
  mockAuth('faculty'),
  requireRole('faculty', 'strand_head', 'principal'),
  asyncHandler(updateQueue)
);
app.patch(
  '/faculty/:facultyId/queue/:queueId/room',
  mockAuth('strand_head'),
  requireRole('faculty', 'strand_head', 'principal'),
  asyncHandler(assignRoom)
);

const facultyId = new mongoose.Types.ObjectId().toString();
const queueId = new mongoose.Types.ObjectId().toString();

describe('Consultation Queue Routes', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /faculty/:id/queue', () => {
    it('returns 200 with queue data', async () => {
      getQueueByFaculty.mockResolvedValue({
        facultyId,
        queue: [],
        total: 0
      });

      const res = await request(app).get(`/faculty/${facultyId}/queue`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('queue');
      expect(res.body).toHaveProperty('total', 0);
    });

    it('returns error on service failure', async () => {
      const error = new Error('Database error');
      error.code = 'INTERNAL_ERROR';
      getQueueByFaculty.mockRejectedValue(error);

      const res = await request(app).get(`/faculty/${facultyId}/queue`);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /faculty/:id/queue', () => {
    it('returns 201 with queue entry info', async () => {
      createQueueEntry.mockResolvedValue({
        queueId,
        position: 1,
        accessKey: 'abc123',
        status: 'pending',
        message: 'Request added'
      });

      const res = await request(app)
        .post(`/faculty/${facultyId}/queue`)
        .send({
          studentId: '2025-123456',
          studentName: 'Student One',
          studentEmail: 'student@example.com',
          reason: 'Need help',
          urgency: 'normal',
          type: 'quick_consultation'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('queueId');
      expect(res.body).toHaveProperty('accessKey');
    });

    it('returns error on duplicate queue entry', async () => {
      const error = new Error('Duplicate');
      error.code = 'DUPLICATE_QUEUE';
      createQueueEntry.mockRejectedValue(error);

      const res = await request(app)
        .post(`/faculty/${facultyId}/queue`)
        .send({
          studentId: '2025-123456',
          studentName: 'Student One',
          studentEmail: 'student@example.com',
          reason: 'Need help',
          urgency: 'normal',
          type: 'quick_consultation'
        });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PATCH /faculty/:facultyId/queue/:queueId/cancel', () => {
    it('returns 200 on successful cancellation', async () => {
      cancelQueueEntry.mockResolvedValue({
        message: 'Queue entry cancelled',
        queueId
      });

      const res = await request(app)
        .patch(`/faculty/${facultyId}/queue/${queueId}/cancel`)
        .send({ accessKey: 'abc123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('queueId');
    });

    it('returns error on invalid access key', async () => {
      const error = new Error('Invalid access key');
      error.code = 'INVALID_ACCESS_KEY';
      cancelQueueEntry.mockRejectedValue(error);

      const res = await request(app)
        .patch(`/faculty/${facultyId}/queue/${queueId}/cancel`)
        .send({ accessKey: 'bad_key' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PATCH /faculty/:facultyId/queue/:queueId/status', () => {
    it('returns 200 on status update', async () => {
      updateQueueStatus.mockResolvedValue({
        queueId,
        status: 'approved',
        notificationSent: false
      });

      const res = await request(app)
        .patch(`/faculty/${facultyId}/queue/${queueId}/status`)
        .send({ status: 'approved' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'approved');
    });

    it('returns error on invalid transition', async () => {
      const error = new Error('Invalid transition');
      error.code = 'INVALID_TRANSITION';
      updateQueueStatus.mockRejectedValue(error);

      const res = await request(app)
        .patch(`/faculty/${facultyId}/queue/${queueId}/status`)
        .send({ status: 'completed' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PATCH /faculty/:facultyId/queue/:queueId/room', () => {
    it('returns 200 on room assignment', async () => {
      assignQueueRoom.mockResolvedValue({
        queueId,
        roomId: new mongoose.Types.ObjectId().toString(),
        strandHeadApproval: 'pending',
        status: 'approved',
        notificationSent: false
      });

      const res = await request(app)
        .patch(`/faculty/${facultyId}/queue/${queueId}/room`)
        .send({
          roomId: new mongoose.Types.ObjectId().toString(),
          approvalRole: 'faculty'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('roomId');
    });

    it('returns error on invalid request', async () => {
      const error = new Error('Invalid request');
      error.code = 'VALIDATION_ERROR';
      assignQueueRoom.mockRejectedValue(error);

      const res = await request(app)
        .patch(`/faculty/${facultyId}/queue/${queueId}/room`)
        .send({ approvalRole: 'faculty' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
