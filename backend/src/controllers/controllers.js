const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Faculty } = require('../models/model');

// Helpers

// The access token will have a shorter expiration time and is used to authenticate API requests
function signAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' });
}


// The refresh token will have a longer expiration time and can be used to get a new access token when the old one expires
function signRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// POST /auth/login
async function login(req, res) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                error: 'Email and password are required',
                code: 'MISSING_CREDENTIALS'
            });
        }

        // Find faculty by email
        const faculty = await Faculty.findOne({ userId: email }).select('+passwordHash');

        // If faculty not found, still run bcrypt compare to prevent timing attacks
        // then return generic error message
        const dummyHash = '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012345';
        const passwordToCheck = faculty ? faculty.passwordHash : dummyHash;
        const passwordMatch = await bcrypt.compare(password, passwordToCheck);

        if (!faculty || !passwordMatch) {
            return res.status(401).json({
                error: 'Invalid email or password',
                code: 'UNAUTHORIZED'
            });
        }

        // Build token payload
        const payload = {
            id: faculty._id,
            name: faculty.name,
            role: faculty.role,
            strand: faculty.strand
        };

        // Sign tokens
        const accessToken = signAccessToken(payload);
        const refreshToken = signRefreshToken(payload);

        // Save refresh token in DB
        faculty.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
        await faculty.save();

        // Send response
        return res.status(200).json({
            token: accessToken,
            refreshToken: refreshToken,
            user: {
                id: faculty._id,
                name: faculty.name,
                role: faculty.role,
                strand: faculty.strand
            }
        });

    } catch (err) {
        return res.status(500).json({
            error: 'Something went wrong',
            code: 'INTERNAL_ERROR'
        });
    }
}

// POST /auth/refresh
async function refresh(req, res) {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                error: 'Refresh token is required',
                code: 'VALIDATION_ERROR'
            });
        }

        //Verify refresh token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch {
            return res.status(401).json({
                error: 'Invalid/Expired refresh token',
                code: 'UNAUTHORIZED'
            });
        }

        // Find faculty and get their stored refresh token hash
        const faculty = await Faculty.findById(decoded.id).select('+refreshTokenHash');

        if (!faculty || !faculty.refreshTokenHash) {
            return res.status(401).json({
                error: 'Invalid/Expired refresh token',
                code: 'UNAUTHORIZED'
            });
        }

        // Compare the incoming token against the stored hash
        const isValid = await bcrypt.compare(refreshToken, faculty.refreshTokenHash);

        if (!isValid) {
            return res.status(401).json({
                error: 'Invalid/Expired refresh token',
                code: 'UNAUTHORIZED'
            });
        }

        // Issue new access tokens
        const payload = {
            id: faculty._id,
            role: faculty.role,
            strand: faculty.strand
        };

        const newAccessToken = signAccessToken(payload);
        const newRefreshToken = signRefreshToken(payload);

        // Replace stored hash with new token hash
        faculty.refreshTokenHash = await bcrypt.hash(newRefreshToken, 10);
        await faculty.save();

        return res.status(200).json({
            token: newAccessToken,
            refreshToken: newRefreshToken
        });

    } catch (err) {
        console.error('Error in refresh token:', err);
        return res.status(500).json({
            error: 'Something went wrong',
            code: 'INTERNAL_ERROR'
        });
    }
}

// POST /auth/logout
async function logout(req, res) {
    try {
        const { refreshToken } = req.body;
        const authHeader = req.headers['authorization'];

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Access token expired, Please re-login',
                code: 'UNAUTHORIZED'
            });
        }

        if (!refreshToken) {
            return res.status(400).json({
                error: 'Refresh token is required',
                code: 'VALIDATION_ERROR'
            });
        }

        // Verify access token to get faculty ID
        const accessToken = authHeader.split(' ')[1];
        let decoded;
        try {
            decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({
                error: 'Access token expired, Please re-login',
                code: 'UNAUTHORIZED'
            });
        }

        // Find faculty and validate the provided refresh token before clearing its hash
        const faculty = await Faculty.findById(decoded.id).select('+refreshTokenHash');

        if (!faculty || !faculty.refreshTokenHash) {
            return res.status(401).json({
                error: 'Invalid refresh token',
                code: 'UNAUTHORIZED'
            });
        }

        let decodedRefreshToken;
        try {
            decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch {
            return res.status(401).json({
                error: 'Invalid refresh token',
                code: 'UNAUTHORIZED'
            });
        }

        if (decodedRefreshToken.id !== decoded.id) {
            return res.status(401).json({
                error: 'Invalid refresh token',
                code: 'UNAUTHORIZED'
            });
        }

        const isRefreshTokenValid = await bcrypt.compare(refreshToken, faculty.refreshTokenHash);

        if (!isRefreshTokenValid) {
            return res.status(401).json({
                error: 'Invalid refresh token',
                code: 'UNAUTHORIZED'
            });
        }

        faculty.refreshTokenHash = null;
        await faculty.save();
        return res.status(200).json({
            message: 'Successfully logged out'
        });

    } catch (err) {
        return res.status(500).json({
            error: 'Something went wrong',
            code: 'INTERNAL_ERROR'
        });
    }

}

module.exports = {
    login,
    refresh,
    logout
};