class AuthError extends Error {
    constructor(definition) {
        super(definition.error);
        this.name = 'AuthError';
        this.status = definition.status;
        this.error = definition.error;
        this.code = definition.code;
    }
}

const AUTH_ERROR_DEFINITIONS = {
    MISSING_CREDENTIALS: {
        status: 400,
        error: 'Email and password are required',
        code: 'MISSING_CREDENTIALS'
    },
    MISSING_REFRESH_TOKEN: {
        status: 400,
        error: 'Refresh token is required',
        code: 'VALIDATION_ERROR'
    },
    INVALID_LOGIN: {
        status: 401,
        error: 'Invalid email or password',
        code: 'UNAUTHORIZED'
    },
    INVALID_OR_EXPIRED_REFRESH_TOKEN: {
        status: 401,
        error: 'Invalid/Expired refresh token',
        code: 'UNAUTHORIZED'
    },
    INVALID_REFRESH_TOKEN: {
        status: 401,
        error: 'Invalid refresh token',
        code: 'UNAUTHORIZED'
    },
    ACCESS_TOKEN_EXPIRED: {
        status: 401,
        error: 'Access token expired, Please re-login',
        code: 'UNAUTHORIZED'
    },
    INTERNAL_ERROR: {
        status: 500,
        error: 'Something went wrong',
        code: 'INTERNAL_ERROR'
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
                error: error.error,
                code: error.code
            }
        };
    }

    const internalError = AUTH_ERROR_DEFINITIONS.INTERNAL_ERROR;

    return {
        status: internalError.status,
        body: {
            error: internalError.error,
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
