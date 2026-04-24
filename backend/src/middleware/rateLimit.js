const rateLimit = require('express-rate-limit');

function parseLimit(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseLimit(process.env.RATE_LIMIT_MAX, 100),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests, please try again later',
        code: 'RATE_LIMITED',
        details: {}
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseLimit(process.env.AUTH_RATE_LIMIT_MAX, 10),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many authentication attempts, please try again later',
        code: 'RATE_LIMITED',
        details: {}
    }
});

module.exports = {
    globalLimiter,
    authLimiter
};