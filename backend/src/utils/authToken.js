const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_ACCESS_EXPIRATION, JWT_REFRESH_EXPIRATION } = require('../config/auth.config');

// Valid bcrypt hash used only for timing-safe comparisons when a user record is missing.
const TIMING_SAFE_DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8p1pG7QW8Z0pniS3pSkeCZMt2rt7Nm';

function signAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_ACCESS_EXPIRATION });
}

function signRefreshToken(payload) {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION });
}

function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = {
    TIMING_SAFE_DUMMY_HASH,
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
};