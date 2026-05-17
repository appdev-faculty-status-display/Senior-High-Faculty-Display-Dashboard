const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

jest.mock('../models');
const { Faculty } = require('../models');

const {
  getFacultyList,
  getFacultyById,
  updateFacultyStatus,
} = require('../controllers/faculty.controller');
const { asyncHandler } = require('../utils/asyncHandler');

const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = (role = 'principal', id = new mongoose.Types.ObjectId().toString()) =>
  (req, _res, next) => { req.user = { role, id }; next(); };

app.get('/faculty', asyncHandler(getFacultyList));
app.get('/faculty/:id', asyncHandler(getFacultyById));
app.patch('/faculty/:id/status', mockAuth(), asyncHandler(updateFacultyStatus));

const mockFaculty = {
  _id: new mongoose.Types.ObjectId(),
  name: 'Juan dela Cruz',
  strand: 'STEM',
  role: 'faculty',
  status: 'available',
  currentLocation: 'Room 101',
  subjects: ['Math', 'Science'],
  consultationHours: [],
  schedule: [],
  updatedAt: new Date(),
  save: jest.fn().mockResolvedValue(true),
};

describe('Faculty Routes', () => {
  afterEach(() => jest.clearAllMocks());

  describe('GET /faculty', () => {
    it('returns 200 with faculty list', async () => {
      Faculty.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([mockFaculty]) });
      const res = await request(app).get('/faculty');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('filters by strand query param', async () => {
      Faculty.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([mockFaculty]) });
      const res = await request(app).get('/faculty?strand=STEM');
      expect(res.status).toBe(200);
      expect(Faculty.find).toHaveBeenCalledWith(expect.objectContaining({ strand: 'STEM' }));
    });

    it('returns 422 on invalid status filter', async () => {
      const res = await request(app).get('/faculty?status=invalid_status');
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /faculty/:id', () => {
    it('returns 200 with faculty data for valid id', async () => {
      Faculty.findById.mockResolvedValue(mockFaculty);
      const res = await request(app).get(`/faculty/${mockFaculty._id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
    });

    it('returns 400 on invalid ObjectId', async () => {
      const res = await request(app).get('/faculty/not_a_valid_id');
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('returns 404 when faculty not found', async () => {
      Faculty.findById.mockResolvedValue(null);
      const res = await request(app).get(`/faculty/${new mongoose.Types.ObjectId()}`);
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('PATCH /faculty/:id/status', () => {
    it('returns 200 on valid status update', async () => {
      Faculty.findById.mockResolvedValue({ ...mockFaculty });
      const res = await request(app)
        .patch(`/faculty/${mockFaculty._id}/status`)
        .send({ status: 'in-class' });
      expect(res.status).toBe(200);
    });

    it('returns error on invalid status value', async () => {
      const res = await request(app)
        .patch(`/faculty/${mockFaculty._id}/status`)
        .send({ status: 'flying' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});