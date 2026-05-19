class AuthError extends Error {
    constructor(definition) {
        super(definition.message);
        this.name = 'AuthError';
        this.status = definition.status;
        this.code = definition.code;
    }
}

const AUTH_ERROR_DEFINITIONS = {
    MISSING_CREDENTIALS: {
        status: 400,
        message: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
    },
    MISSING_REFRESH_TOKEN: {
        status: 400,
        message: 'Refresh token is required',
        code: 'VALIDATION_ERROR'
    },
    INVALID_LOGIN: {
        status: 401,
        message: 'Invalid email or password',
        code: 'UNAUTHORIZED'
    },
    INVALID_OR_EXPIRED_REFRESH_TOKEN: {
        status: 401,
        message: 'Invalid/Expired refresh token',
        code: 'UNAUTHORIZED'
    },
    INVALID_REFRESH_TOKEN: {
        status: 401,
        message: 'Invalid refresh token',
        code: 'UNAUTHORIZED'
    },
    ACCESS_TOKEN_EXPIRED: {
        status: 401,
        message: 'Access token expired, Please re-login',
        code: 'UNAUTHORIZED'
    },
    INTERNAL_ERROR: {
        status: 500,
        message: 'Something went wrong',
        code: 'INTERNAL_ERROR'
    },
    FORBIDDEN: {
        status: 403,
        message: 'You do not have permission to perform this action',
        code: 'FORBIDDEN'
    },
    NOT_FOUND: {
        status: 404,
        message: 'The requested resource was not found',
        code: 'NOT_FOUND'
    },
    DUPLICATE_QUEUE: {
        status: 409,
        message: 'Duplicate queue entry',
        code: 'DUPLICATE_QUEUE'
    },
    INVALID_TRANSITION: {
        status: 409,
        message: 'Invalid status transition',
        code: 'INVALID_TRANSITION'
    },
    INVALID_ACCESS_KEY: {
        status: 401,
        message: 'Invalid access key',
        code: 'UNAUTHORIZED'
    }
};

function createAuthError(key) {
    const definition = AUTH_ERROR_DEFINITIONS[key];

    if (!definition) {
        throw new Error(`Unknown auth error key: ${key}`);
    }

    return new AuthError(definition);
}

function isAuthError(error) {
    return error instanceof AuthError;
}

function toErrorResponse(error) {
    if (isAuthError(error)) {
        return {
            status: error.status,
            body: {
                message: error.message,
                code: error.code
            }
        };
    }

    const internalError = AUTH_ERROR_DEFINITIONS.INTERNAL_ERROR;

    return {
        status: internalError.status,
        body: {
            message: internalError.message,
            code: internalError.code
        }
    };
}

module.exports = {
    AUTH_ERROR_DEFINITIONS,
    AuthError,
    createAuthError,
    isAuthError,
    toErrorResponse
};
