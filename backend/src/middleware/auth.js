const jwt = require('jsonwebtoken');
const { verifyAccessToken } = require('../utils/authToken');
const { createAuthError } = require('../utils/error');

const SERVICE_SECRET = process.env.SERVICE_SECRET || 'MY_SHARED_SECRET';

function authToken(req, res, next) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
        return next(createAuthError('ACCESS_TOKEN_EXPIRED'));
    }

    if (token === SERVICE_SECRET) {
        req.user = { role: 'service', id: 'n8n_automate' };
        return next();
    }

    try {
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        // Try to decode token to provide helpful debug info (expiry, issued-at)
        try {
            const decoded = jwt.decode(token) || {};
            const now = Date.now();
            const expMs = decoded.exp ? decoded.exp * 1000 : null;
            console.warn('Access token verification failed:', error && error.message);
            console.warn('Token decoded exp (ms):', expMs, 'now (ms):', now, 'token payload:', decoded);
        } catch (e) {
            console.warn('Failed to decode token for debug:', e && e.message);
        }

        return next(createAuthError('ACCESS_TOKEN_EXPIRED'));
    }

}

module.exports = { authToken }