const request = require('supertest');
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');

jest.mock('../services/schedImport.service');
const { runImport } = require('../services/schedImport.service');

const { importSchedule } = require('../controllers/schedImport.controller');
const { asyncHandler } = require('../utils/asyncHandler');

const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(express.json());

// Mock auth middleware
app.use((req, _res, next) => {
  req.user = { role: 'principal', id: new mongoose.Types.ObjectId().toString() };
  next();
});

app.post('/schedule/import', upload.single('file'), asyncHandler(importSchedule));

describe('Schedule Import Routes', () => {
  afterEach(() => jest.clearAllMocks());

  describe('POST /schedule/import', () => {
    it('returns 200 on successful import', async () => {
      runImport.mockResolvedValue({ imported: 10, skipped: 0 });
      const res = await request(app)
        .post('/schedule/import')
        .attach('file', Buffer.from('fake xlsx content'), {
          filename: 'schedule.xlsx',
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('imported');
    });

    it('returns error when no file is uploaded', async () => {
      const res = await request(app).post('/schedule/import');
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});