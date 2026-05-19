const request = require('supertest');
const express = require('express');

jest.mock('../services/auth.service', () => ({
  loginUser: jest.fn(),
  refreshTokens: jest.fn(),
  logoutUser: jest.fn()
}));
const { loginUser, refreshTokens, logoutUser } = require('../services/auth.service');

const { login, refresh, logout } = require('../controllers/auth.controller');

const app = express();
app.use(express.json());
app.post('/auth/login', login);
app.post('/auth/refresh', refresh);
app.post('/auth/logout', logout);

describe('Auth Routes', () => {
  afterEach(() => jest.clearAllMocks());

  describe('POST /auth/login', () => {
    it('returns 200 with tokens on valid credentials', async () => {
      loginUser.mockResolvedValue({ accessToken: 'abc', refreshToken: 'xyz' });
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'admin', password: 'password' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('returns error response on invalid credentials', async () => {
      const error = new Error('Invalid credentials');
      error.code = 'INVALID_CREDENTIALS';
      loginUser.mockRejectedValue(error);
      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'wrong', password: 'wrong' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('returns 200 with new tokens on valid refresh token', async () => {
      refreshTokens.mockResolvedValue({ accessToken: 'new_abc', refreshToken: 'new_xyz' });
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'valid_token' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('returns error on invalid refresh token', async () => {
      const error = new Error('Invalid token');
      error.code = 'INVALID_TOKEN';
      refreshTokens.mockRejectedValue(error);
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'bad_token' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /auth/logout', () => {
    it('returns 200 on successful logout', async () => {
      logoutUser.mockResolvedValue({ message: 'Logged out' });
      const res = await request(app)
        .post('/auth/logout')
        .send({ refreshToken: 'valid_token' });
      expect(res.status).toBe(200);
    });
  });
});