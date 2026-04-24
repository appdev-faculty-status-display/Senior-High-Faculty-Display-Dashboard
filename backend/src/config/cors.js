function getAllowedOrigins() {
    return (process.env.CORS_ORIGINS || 'http://localhost:5173')
        .split(',')
        .map(function (origin) {
            return origin.trim();
        })
        .filter(Boolean);
}

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = getAllowedOrigins();

        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 204
};

module.exports = {
    corsOptions
};