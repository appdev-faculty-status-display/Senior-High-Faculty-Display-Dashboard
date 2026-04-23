const strandValues = ['STEM', 'ABM', 'HUMSS'];

function normalizeStrand(value) {
    if (typeof value !== 'string') {
        return value;
    }

    return value.trim().toUpperCase();
}

function isMissing(value) {
    return value === undefined || value === null || value === '';
}

function sendError(res, status, error, code) {
    return res.status(status).json({ error, code });
}

function requireRole(allowedRoles) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return function roleGuard(req, res, next) {
        const role = req.user && req.user.role;

        if (!role) {
            return sendError(res, 401, 'Unauthorized', 'UNAUTHORIZED');
        }

        if (!roles.includes(role)) {
            return sendError(res, 403, 'Forbidden', 'FORBIDDEN');
        }

        return next();
    };
}

function validateStrandByRole(options) {
    const config = options || {};
    const source = config.source || 'body';
    const strandField = config.strandField || 'strand';
    const roleField = config.roleField || 'role';

    return function roleStrandValidator(req, res, next) {
        const container = req[source] || {};
        const role = container[roleField];

        // Skip when this route payload does not include role updates.
        if (isMissing(role)) {
            return next();
        }

        if (role === 'principal') {
            return next();
        }

        const strand = normalizeStrand(container[strandField]);

        if (isMissing(strand)) {
            return sendError(res, 400, 'Strand is required for this role', 'VALIDATION_ERROR');
        }

        if (!strandValues.includes(strand)) {
            return sendError(res, 400, 'Invalid strand value', 'VALIDATION_ERROR');
        }

        container[strandField] = strand;
        return next();
    };
}

function enforceStrandScope(options) {
    const config = options || {};
    const source = config.source || 'body';
    const strandField = config.strandField || 'strand';

    return function strandScopeGuard(req, res, next) {
        const user = req.user || {};

        if (!user.role) {
            return sendError(res, 401, 'Unauthorized', 'UNAUTHORIZED');
        }

        if (user.role === 'principal') {
            return next();
        }

        const userStrand = normalizeStrand(user.strand);

        if (isMissing(userStrand) || !strandValues.includes(userStrand)) {
            return sendError(res, 403, 'Invalid user strand scope', 'FORBIDDEN');
        }

        const sourceContainer = req[source] || {};
        const requestStrand = normalizeStrand(sourceContainer[strandField]);

        if (isMissing(requestStrand)) {
            return next();
        }

        if (!strandValues.includes(requestStrand)) {
            return sendError(res, 400, 'Invalid strand value', 'VALIDATION_ERROR');
        }

        if (requestStrand !== userStrand) {
            return sendError(res, 403, 'Forbidden: outside strand scope', 'FORBIDDEN');
        }

        sourceContainer[strandField] = requestStrand;
        return next();
    };
}

module.exports = {
    strandValues,
    requireRole,
    validateStrandByRole,
    enforceStrandScope
};