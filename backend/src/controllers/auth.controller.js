const { loginUser, refreshTokens, logoutUser } = require('../services/auth.service');
const { isAuthError, toErrorResponse } = require('../utils/error');

function sendError(res, error) {
    const { status, body } = toErrorResponse(error);
    return res.status(status).json({
        message: body.message,
        code: body.code,
        details: body.details || {}
    });
}

// POST /auth/login
async function login(req, res) {
    try {
        const result = await loginUser(req.body);
        return res.status(200).json(result);
    } catch (error) {
        return sendError(res, error);
    }
}

// POST /auth/refresh
async function refresh(req, res) {
    try {
        const result = await refreshTokens(req.body);
        return res.status(200).json(result);
    } catch (error) {
        if (!isAuthError(error)) {
            console.error('Error in refresh token:', error);
        }

        return sendError(res, error);
    }
}

// POST /auth/logout
async function logout(req, res) {
    try {
        const result = await logoutUser({
            refreshToken: req.body && req.body.refreshToken,
            authorizationHeader: req.headers && req.headers['authorization']
        });

        return res.status(200).json(result);
    } catch (error) {
        return sendError(res, error);
    }
}

module.exports = {
    login,
    refresh,
    logout
};