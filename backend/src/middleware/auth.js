const { verifyAccessToken } = require('../utils/authToken');
const { createAuthError } = require('../utils/error');

function authToken(req, res, next) {

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
        return next(createAuthError('ACCESS_TOKEN_EXPIRED'));
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