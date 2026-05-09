const request = require('supertest');
const express = require('express');

// Mock authToken so optionalAuthToken's internal call is a no-op.
// req.user is controlled entirely by makeApp's inject middleware.
jest.mock('../middleware/auth', () => ({
  authToken: (req, res, next) => next(),
}));

jest.mock('../services/announcement.service');
const {
  listAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
} = require('../services/announcement.service');

const {
  getAnnouncements,
  postAnnouncement,
  removeAnnouncement,
} = require('../controllers/announcement.controller');

const { authToken } = require('../middleware/auth');

// optionalAuthToken mirrors the real implementation.
// Since authToken is mocked as a no-op, it safely delegates without JWT logic.
const optionalAuthToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  return authToken(req, res, next);
};

// --- App factory ---
// Pass a user object to simulate an authenticated request.
// Pass null (default) to simulate a public/unauthenticated request.

function makeApp(user = null) {
  const app = express();
  app.use(express.json());

  // Inject req.user to simulate decoded JWT from authToken
  app.use((req, res, next) => {
    req.user = user;
    next();
  });

  app.get('/announcements', optionalAuthToken, getAnnouncements);
  app.post('/announcements', postAnnouncement);
  app.delete('/announcements/:id', removeAnnouncement);

  // JSON error handler — required to catch errors forwarded by asyncHandler via next(err)
  app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ message: err.message });
  });

  return app;
}

// --- Shared fixtures ---

const principalUser = { id: 'user-1', role: 'principal', strand: 'STEM' };
const strandHeadUser = { id: 'user-2', role: 'strand_head', strand: 'STEM' };

const mockAnnouncement = {
  _id: 'ann-1',
  message: 'Test announcement',
  scope: 'school_wide',
  strand: null,
  isActive: true,
  createdAt: new Date().toISOString(),
};

// ─────────────────────────────────────────────────────────────────────────────

describe('Announcement Routes', () => {
  afterEach(() => jest.clearAllMocks());

  // ── GET /announcements ──────────────────────────────────────────────────────

  describe('GET /announcements', () => {
    it('returns 200 with paginated results for public (unauthenticated) request', async () => {
      listAnnouncements.mockResolvedValue({
        data: [mockAnnouncement],
        total: 1,
        page: 1,
      });

      // No Authorization header — simulates a public request
      const res = await request(makeApp()).get('/announcements');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
    });

    it('passes query params to the service', async () => {
      listAnnouncements.mockResolvedValue({ data: [], total: 0, page: 1 });

      await request(makeApp())
        .get('/announcements?scope=strand&strand=STEM&page=2&pageSize=10');

      expect(listAnnouncements).toHaveBeenCalledWith(
        expect.objectContaining({
          scope: 'strand',
          strand: 'STEM',
          page: '2',
          pageSize: '10',
        }),
        null
      );
    });

    it('returns 403 when non-principal requests inactive announcements', async () => {
      const err = new Error('Admin auth required to view inactive announcements.');
      err.status = 403;
      listAnnouncements.mockRejectedValue(err);

      const res = await request(makeApp(strandHeadUser))
        .get('/announcements?isActive=false');

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 200 when principal requests inactive announcements', async () => {
      listAnnouncements.mockResolvedValue({ data: [], total: 0, page: 1 });

      const res = await request(makeApp(principalUser))
        .get('/announcements?isActive=false');

      expect(res.status).toBe(200);
    });

    it('returns 500 on unexpected service error', async () => {
      listAnnouncements.mockRejectedValue(new Error('DB failure'));

      const res = await request(makeApp()).get('/announcements');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── POST /announcements ─────────────────────────────────────────────────────

  describe('POST /announcements', () => {
    it('returns 201 with announcement data on valid principal request', async () => {
      createAnnouncement.mockResolvedValue(mockAnnouncement);

      const res = await request(makeApp(principalUser))
        .post('/announcements')
        .send({ message: 'Test announcement', scope: 'school_wide' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('scope');
      expect(res.body).toHaveProperty('isActive');
      expect(res.body).toHaveProperty('createdAt');
    });

    it('returns 201 when strand head posts to their own strand', async () => {
      createAnnouncement.mockResolvedValue({
        ...mockAnnouncement,
        scope: 'strand',
        strand: 'STEM',
      });

      const res = await request(makeApp(strandHeadUser))
        .post('/announcements')
        .send({ message: 'Strand announcement', scope: 'strand', strand: 'STEM' });

      expect(res.status).toBe(201);
    });

    it('returns 400 when scope is strand but strand field is missing', async () => {
      const err = new Error('Strand is required when scope is "strand".');
      err.status = 400;
      createAnnouncement.mockRejectedValue(err);

      const res = await request(makeApp(strandHeadUser))
        .post('/announcements')
        .send({ message: 'Missing strand', scope: 'strand' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 403 when strand head tries to post school_wide', async () => {
      const err = new Error('Unauthorized to create announcement with the specified scope and strand.');
      err.status = 403;
      createAnnouncement.mockRejectedValue(err);

      const res = await request(makeApp(strandHeadUser))
        .post('/announcements')
        .send({ message: 'Overreach', scope: 'school_wide' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 403 when strand head tries to post to a different strand', async () => {
      const err = new Error('Unauthorized to create announcement with the specified scope and strand.');
      err.status = 403;
      createAnnouncement.mockRejectedValue(err);

      const res = await request(makeApp(strandHeadUser))
        .post('/announcements')
        .send({ message: 'Wrong strand', scope: 'strand', strand: 'ABM' });

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 500 on unexpected service error', async () => {
      createAnnouncement.mockRejectedValue(new Error('DB failure'));

      const res = await request(makeApp(principalUser))
        .post('/announcements')
        .send({ message: 'Test', scope: 'school_wide' });

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });

  // ── DELETE /announcements/:id ───────────────────────────────────────────────

  describe('DELETE /announcements/:id', () => {
    it('returns 200 with confirmation when principal deletes any announcement', async () => {
      deleteAnnouncement.mockResolvedValue({
        message: 'Announcement deleted successfully.',
        id: 'ann-1',
      });

      const res = await request(makeApp(principalUser)).delete('/announcements/ann-1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('id');
    });

    it('returns 200 when strand head deletes their own announcement', async () => {
      deleteAnnouncement.mockResolvedValue({
        message: 'Announcement deleted successfully.',
        id: 'ann-2',
      });

      const res = await request(makeApp(strandHeadUser)).delete('/announcements/ann-2');

      expect(res.status).toBe(200);
    });

    it("returns 403 when strand head tries to delete another strand's announcement", async () => {
      const err = new Error('You are not authorized to delete this announcement.');
      err.status = 403;
      deleteAnnouncement.mockRejectedValue(err);

      const res = await request(makeApp(strandHeadUser)).delete('/announcements/ann-3');

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty('error'); 
    });

    it('returns 404 when announcement does not exist', async () => {
      const err = new Error('Announcement not found.');
      err.status = 404;
      deleteAnnouncement.mockRejectedValue(err);

      const res = await request(makeApp(principalUser)).delete('/announcements/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error');
    });

    it('returns 500 on unexpected service error', async () => {
      deleteAnnouncement.mockRejectedValue(new Error('DB failure'));

      const res = await request(makeApp(principalUser)).delete('/announcements/ann-1');

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error');
    });
  });
});
