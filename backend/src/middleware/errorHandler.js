const { isAuthError, toErrorResponse } = require('../utils/error');

function getValidationDetails(error) {
    return Object.keys(error.errors || {}).reduce(function (details, field) {
        details[field] = error.errors[field].message;
        return details;
    }, {});
}

function mapError(error) {
    if (isAuthError(error)) {
        const { status, body } = toErrorResponse(error);

        return {
            status,
            body: {
                message: body.message,
                code: body.code,
                details: body.details || {}
            }
        };
    }

    if (error && error.message === 'Not allowed by CORS') {
        return {
            status: 403,
            body: {
                message: 'Origin is not allowed by CORS',
                code: 'FORBIDDEN',
                details: {}
            }
        };
    }

    if (error && error.name === 'ValidationError') {
        return {
            status: 400,
            body: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: getValidationDetails(error)
            }
        };
    }

    if (error && error.name === 'CastError') {
        return {
            status: 400,
            body: {
                message: 'Invalid request parameter',
                code: 'VALIDATION_ERROR',
                details: {
                    path: error.path
                }
            }
        };
    }

    return {
        status: 500,
        body: {
            message: 'Something went wrong',
            code: 'INTERNAL_ERROR',
            details: {}
        }
    };
}

function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    const { status, body } = mapError(error);

    if (status >= 500) {
        console.error('Unhandled error:', error);
    }

    return res.status(status).json(body);
}

module.exports = {
    errorHandler
};