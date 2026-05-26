const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

const devTunnelOriginPattern = /^https:\/\/[a-z0-9-]+-\d+\.asse\.devtunnels\.ms$/i;

const corsOptions = {
    origin: function (origin, callback) {
        // if (!origin || allowedOrigins.includes(origin)) { // <-- using for test deployed site
        if (!origin || allowedOrigins.includes(origin) || devTunnelOriginPattern.test(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 204
};

module.exports = {
    corsOptions
};