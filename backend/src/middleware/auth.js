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
        return next(createAuthError('ACCESS_TOKEN_EXPIRED'));
    }

}

module.exports = { authToken }