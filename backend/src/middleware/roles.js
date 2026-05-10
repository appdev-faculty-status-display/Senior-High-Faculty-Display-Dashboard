const { createAuthError } = require('../utils/error');

function requireRole(...roles) {
    return function (req, res, next) {
        const userRole = req.user?.role;

        if (!userRole || !roles.includes(userRole)) {
            return next(createAuthError('FORBIDDEN'));
        }

        next();
    };
}

module.exports = { requireRole };