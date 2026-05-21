const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const request = require('supertest');
const express = require('express');

// ── Mocks ─────────────────────────────────────────────────────────────────────
// Stub auth middleware so we can inject roles freely in tests
jest.mock('../middleware/auth', () => ({
  authToken: (req, _res, next) => {
    const raw = req.headers['x-test-user'];
    req.user = raw ? JSON.parse(raw) : { role: 'principal' };
    next();
  },
}));

jest.mock('../middleware/roles', () => ({
  requireRole: (...roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  },
}));

const Notification = require('../models/notification.model');
const notificationRoutes = require('../routes/notification.route');

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/notifications', notificationRoutes);

// ── DB helpers ────────────────────────────────────────────────────────────────
let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

afterEach(async () => {
  await Notification.deleteMany({});
});

// ── Seed helper ───────────────────────────────────────────────────────────────
const seed = (overrides = {}) =>
  Notification.create({
    recipientId: '@student.nu-laguna.edu.ph',
    recipientType: 'student',
    message: 'Your queue position has been updated.',
    type: 'queue_update',
    channel: 'email',
    isRead: true,
    relatedQueueId: null,
    ...overrides,
  });

// ── Tests ─────────────────────────────────────────────────────────────────────
describe('GET /notifications', () => {
  // ── Access control ──────────────────────────────────────────────────────────
  describe('Access control', () => {
    it('returns 200 for a principal', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('x-test-user', JSON.stringify({ role: 'principal' }));
      expect(res.status).toBe(200);
    });

    it('returns 200 for a strand_head', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('x-test-user', JSON.stringify({ role: 'strand_head', strandId: 'strand1' }));
      expect(res.status).toBe(200);
    });

    it('returns 403 for a faculty member', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('x-test-user', JSON.stringify({ role: 'faculty' }));
      expect(res.status).toBe(403);
    });

    it('returns 403 for a student', async () => {
      const res = await request(app)
        .get('/notifications')
        .set('x-test-user', JSON.stringify({ role: 'student' }));
      expect(res.status).toBe(403);
    });
  });

  // ── Response shape ──────────────────────────────────────────────────────────
  describe('Response shape', () => {
    it('returns data, total, and page fields', async () => {
      await seed();
      const res = await request(app).get('/notifications');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
    });

    it('returns the correct projected fields per record', async () => {
      await seed();
      const res = await request(app).get('/notifications');
      const record = res.body.data[0];
      expect(record).toHaveProperty('_id');
      expect(record).toHaveProperty('recipientId');
      expect(record).toHaveProperty('recipientType');
      expect(record).toHaveProperty('type');
      expect(record).toHaveProperty('channel');
      expect(record).toHaveProperty('isRead');
      expect(record).toHaveProperty('createdAt');
      // message should NOT be in the list projection
      expect(record).not.toHaveProperty('message');
    });

    it('returns an empty array when there are no notifications', async () => {
      const res = await request(app).get('/notifications');
      expect(res.body.data).toHaveLength(0);
      expect(res.body.total).toBe(0);
    });
  });

  // ── Filtering ───────────────────────────────────────────────────────────────
  describe('Filtering', () => {
    beforeEach(async () => {
      await Promise.all([
        seed({ type: 'queue_update', recipientType: 'student' }),
        seed({ type: 'consultation_approved', recipientType: 'faculty' }),
        seed({ type: 'announcement', recipientType: 'strand_head' }),
      ]);
    });

    it('filters by type', async () => {
      const res = await request(app).get('/notifications?type=queue_update');
      expect(res.body.data.every((n) => n.type === 'queue_update')).toBe(true);
      expect(res.body.total).toBe(1);
    });

    it('filters by recipientType', async () => {
      const res = await request(app).get('/notifications?recipientType=faculty');
      expect(res.body.data.every((n) => n.recipientType === 'faculty')).toBe(true);
      expect(res.body.total).toBe(1);
    });

    it('ignores invalid type filter values', async () => {
      const res = await request(app).get('/notifications?type=not_a_real_type');
      // Falls back to no type filter → returns all 3
      expect(res.body.total).toBe(3);
    });
  });

  // ── Pagination ──────────────────────────────────────────────────────────────
  describe('Pagination', () => {
    beforeEach(async () => {
      await Promise.all(Array.from({ length: 5 }, (_, i) => seed({ message: `Msg ${i}` })));
    });

    it('defaults to page 1 with 30 results per page', async () => {
      const res = await request(app).get('/notifications');
      expect(res.body.page).toBe(1);
      expect(res.body.data.length).toBeLessThanOrEqual(30);
    });

    it('respects the page and pageSize params', async () => {
      const res = await request(app).get('/notifications?page=2&pageSize=2');
      expect(res.body.page).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });

    it('caps pageSize at 100', async () => {
      const res = await request(app).get('/notifications?pageSize=999');
      // Only 5 seeded records; just verify no error and total is correct
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(5);
    });

    it('returns total matching the full count, not just the page', async () => {
      const res = await request(app).get('/notifications?page=1&pageSize=2');
      expect(res.body.total).toBe(5);
      expect(res.body.data).toHaveLength(2);
    });
  });

  // ── Sorting ─────────────────────────────────────────────────────────────────
  describe('Sorting', () => {
    it('returns notifications sorted by createdAt descending', async () => {
      await seed({ message: 'Older' });
      await new Promise((r) => setTimeout(r, 20)); // ensure different timestamps
      await seed({ message: 'Newer' });

      const res = await request(app).get('/notifications');
      const dates = res.body.data.map((n) => new Date(n.createdAt).getTime());
      expect(dates[0]).toBeGreaterThanOrEqual(dates[1]);
    });
  });
});

// ── Unit: notificationUtils ───────────────────────────────────────────────────
const {
  buildNotificationPayload,
  parsePagination,
  buildFilter,
  isValidNotificationType,
  isValidRecipientType,
} = require('../utils/notification.utils');

describe('notificationUtils', () => {
  describe('buildNotificationPayload', () => {
    const base = {
      recipientId: 'faculty@shs.edu',
      recipientType: 'faculty',
      message: 'Room assigned.',
      type: 'room_assigned',
      channel: 'teams_card',
    };

    it('builds a valid payload', () => {
      const p = buildNotificationPayload(base);
      expect(p.isRead).toBe(false); // teams_card → false
      expect(p.relatedQueueId).toBeNull();
    });

    it('sets isRead to true for email channel', () => {
      const p = buildNotificationPayload({ ...base, channel: 'email' });
      expect(p.isRead).toBe(true);
    });

    it('throws when recipientId is missing', () => {
      expect(() => buildNotificationPayload({ ...base, recipientId: '' })).toThrow();
    });

    it('throws for an invalid type', () => {
      expect(() => buildNotificationPayload({ ...base, type: 'bad_type' })).toThrow();
    });

    it('throws for an invalid recipientType', () => {
      expect(() => buildNotificationPayload({ ...base, recipientType: 'ghost' })).toThrow();
    });
  });

  describe('parsePagination', () => {
    it('returns defaults when no params supplied', () => {
      expect(parsePagination({})).toEqual({ page: 1, pageSize: 30, skip: 0 });
    });

    it('calculates skip correctly', () => {
      expect(parsePagination({ page: '3', pageSize: '10' })).toEqual({
        page: 3,
        pageSize: 10,
        skip: 20,
      });
    });

    it('clamps pageSize to max 100', () => {
      expect(parsePagination({ pageSize: '500' }).pageSize).toBe(100);
    });

    it('clamps page to minimum 1', () => {
      expect(parsePagination({ page: '-5' }).page).toBe(1);
    });
  });

  describe('buildFilter', () => {
    it('returns an empty filter with no query params', () => {
      expect(buildFilter({})).toEqual({});
    });

    it('adds type to filter when valid', () => {
      expect(buildFilter({ type: 'announcement' })).toEqual({ type: 'announcement' });
    });

    it('ignores unknown type values', () => {
      expect(buildFilter({ type: 'unknown' })).toEqual({});
    });

    it('merges scopeFilter with query filter', () => {
      const result = buildFilter({ type: 'announcement' }, { strandId: 'ABC' });
      expect(result).toEqual({ strandId: 'ABC', type: 'announcement' });
    });
  });

  describe('isValidNotificationType / isValidRecipientType', () => {
    it('recognises all valid notification types', () => {
      const types = [
        'queue_update',
        'consultation_approved',
        'consultation_rejected',
        'room_assigned',
        'announcement',
        'cancellation_confirmed',
      ];
      types.forEach((t) => expect(isValidNotificationType(t)).toBe(true));
    });

    it('rejects unknown notification types', () => {
      expect(isValidNotificationType('magic_type')).toBe(false);
    });

    it('recognises all valid recipient types', () => {
      ['student', 'faculty', 'strand_head', 'principal'].forEach((r) =>
        expect(isValidRecipientType(r)).toBe(true)
      );
    });
  });
});