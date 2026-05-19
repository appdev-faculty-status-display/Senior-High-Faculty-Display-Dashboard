const request = require('supertest');
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');

jest.mock('../services/facultyImport.service');
const { runFacultyImport } = require('../services/facultyImport.service');

const { importFaculty } = require('../controllers/facultyImport.controller');
const { asyncHandler } = require('../utils/asyncHandler');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, _res, next) => {
  req.user = { role: 'principal', id: new mongoose.Types.ObjectId().toString() };
  next();
});

app.post('/faculty/import', upload.single('file'), asyncHandler(importFaculty));

describe('Faculty Import Routes', () => {
  afterEach(() => jest.clearAllMocks());

  describe('POST /faculty/import', () => {
    it('returns 200 on successful import', async () => {
      runFacultyImport.mockResolvedValue({
        importId: 'import-1',
        status: 'success',
        recordsProcessed: 1,
        recordsCreated: 1,
        recordsUpdated: 0,
        errors: []
      });

      const res = await request(app)
        .post('/faculty/import')
        .attach('file', Buffer.from('fake xlsx content'), {
          filename: 'faculty.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('importId');
    });

    it('returns error when no file is uploaded', async () => {
      const res = await request(app).post('/faculty/import');
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
