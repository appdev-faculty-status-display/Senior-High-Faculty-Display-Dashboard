const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

// Matches any dynamic preview URL or production URL coming from Azure Static Web Apps
const azureStaticAppPattern = /^https:\/\/[a-z0-9-]+\.[0-9]+\.azurestaticapps\.net$/i;
const azureProdAppPattern = /^https:\/\/[a-z0-9-]+\.azurestaticapps\.net$/i;
const devTunnelOriginPattern = /^https:\/\/[a-z0-9-]+-\d+\.asse\.devtunnels\.ms$/i;

const corsOptions = {
    origin: function (origin, callback) {
        // 1. Allow server-to-server or local script requests (no origin)
        // 2. Allow explicitly listed origins from environment variables
        // 3. Allow standard dev tunnels
        // 4. Dynamically allow any Azure SWA Preview or Prod environments
        if (
            !origin || 
            allowedOrigins.includes(origin) || 
            devTunnelOriginPattern.test(origin) ||
            azureStaticAppPattern.test(origin) ||
            azureProdAppPattern.test(origin)
        ) {
            return callback(null, true);
        }
        
        // Pass a structured object or cleanly reject so it logs nicely
        return callback(null, false); 
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    optionsSuccessStatus: 204
};

module.exports = {
    corsOptions
};