function getRequiredEnv(name) {
    const value = process.env[name];

    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value;
}

const JWT_SECRET = getRequiredEnv('JWT_SECRET');
const JWT_REFRESH_SECRET = getRequiredEnv('JWT_REFRESH_SECRET');
const JWT_ACCESS_EXPIRATION = getRequiredEnv('JWT_ACCESS_EXPIRATION');
const JWT_REFRESH_EXPIRATION = getRequiredEnv('JWT_REFRESH_EXPIRATION');

module.exports = {
    JWT_SECRET,
    JWT_REFRESH_SECRET,
    JWT_ACCESS_EXPIRATION,
    JWT_REFRESH_EXPIRATION,
};
