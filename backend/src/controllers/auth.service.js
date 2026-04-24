const bcrypt = require('bcryptjs');
const { Faculty } = require('../models');
const {
    TIMING_SAFE_DUMMY_HASH,
    signAccessToken,
    signRefreshToken,
    verifyAccessToken,
    verifyRefreshToken
} = require('./auth.token');
const { createAuthError } = require('./auth.errors');

async function loginUser(credentials) {
    const { email, password } = credentials || {};

    if (!email || !password) {
        throw createAuthError('MISSING_CREDENTIALS');
    }

    const facultyCandidates = await Faculty.find({ userId: email })
        .select('+passwordHash')
        .sort({ updatedAt: -1 });

    const faculty = facultyCandidates.find(function (candidate) {
        return Boolean(candidate.facultyId);
    });
    const passwordToCheck = faculty ? faculty.passwordHash : TIMING_SAFE_DUMMY_HASH;
    const passwordMatch = await bcrypt.compare(password, passwordToCheck);

    if (!faculty || !passwordMatch) {
        throw createAuthError('INVALID_LOGIN');
    }

    const payload = {
        id: faculty._id,
        name: faculty.name,
        role: faculty.role,
        strand: faculty.strand
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    faculty.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await faculty.save();

    return {
        token: accessToken,
        refreshToken: refreshToken,
        user: {
            id: faculty._id,
            name: faculty.name,
            role: faculty.role,
            strand: faculty.strand
        }
    };
}

async function refreshTokens(payload) {
    const { refreshToken } = payload || {};

    if (!refreshToken) {
        throw createAuthError('MISSING_REFRESH_TOKEN');
    }

    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw createAuthError('INVALID_OR_EXPIRED_REFRESH_TOKEN');
    }

    const faculty = await Faculty.findById(decoded.id).select('+refreshTokenHash');

    if (!faculty || !faculty.refreshTokenHash) {
        throw createAuthError('INVALID_OR_EXPIRED_REFRESH_TOKEN');
    }

    const isValid = await bcrypt.compare(refreshToken, faculty.refreshTokenHash);

    if (!isValid) {
        throw createAuthError('INVALID_OR_EXPIRED_REFRESH_TOKEN');
    }

    const tokenPayload = {
        id: faculty._id,
        role: faculty.role,
        strand: faculty.strand
    };

    const newAccessToken = signAccessToken(tokenPayload);
    const newRefreshToken = signRefreshToken(tokenPayload);

    faculty.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
    await faculty.save();

    return {
        token: newAccessToken,
        refreshToken: newRefreshToken
    };
}

async function logoutUser(payload) {
    const { refreshToken, authorizationHeader } = payload || {};

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
        throw createAuthError('ACCESS_TOKEN_EXPIRED');
    }

    if (!refreshToken) {
        throw createAuthError('MISSING_REFRESH_TOKEN');
    }

    const accessToken = authorizationHeader.split(' ')[1];

    let decodedAccessToken;
    try {
        decodedAccessToken = verifyAccessToken(accessToken);
    } catch {
        throw createAuthError('ACCESS_TOKEN_EXPIRED');
    }

    const faculty = await Faculty.findById(decodedAccessToken.id).select('+refreshTokenHash');

    if (!faculty || !faculty.refreshTokenHash) {
        throw createAuthError('INVALID_REFRESH_TOKEN');
    }

    let decodedRefreshToken;
    try {
        decodedRefreshToken = verifyRefreshToken(refreshToken);
    } catch {
        throw createAuthError('INVALID_REFRESH_TOKEN');
    }

    if (decodedRefreshToken.id !== decodedAccessToken.id) {
        throw createAuthError('INVALID_REFRESH_TOKEN');
    }

    const isRefreshTokenValid = await bcrypt.compare(refreshToken, faculty.refreshTokenHash);

    if (!isRefreshTokenValid) {
        throw createAuthError('INVALID_REFRESH_TOKEN');
    }

    faculty.refreshTokenHash = null;
    await faculty.save();

    return {
        message: 'Successfully logged out'
    };
}

module.exports = {
    loginUser,
    refreshTokens,
    logoutUser
};
