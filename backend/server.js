const dns = require('dns');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const routes = require('./src/routes/route');
const consultRoutes = require('./src/routes/consultation.route');
const { connectDb } = require('./src/config/config');
const { corsOptions } = require('./src/config/cors');
const { globalLimiter } = require('./src/middleware/rateLimit');
const { notFoundHandler } = require('./src/middleware/notFound');
const { errorHandler } = require('./src/middleware/errorHandler');
const { startAutoStatusCron } = require('./src/services/autoStatus.service');

const app = express();

dns.setServers(['8.8.8.8', '1.1.1.1']);

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json());

// Routes
app.use('/api', routes);
app.use('/api/consultRooms', consultRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDb()
  .then(function () {
    app.listen(PORT, function () {
      console.log('Server running on port ' + PORT);
    });
    startAutoStatusCron();
  })
  .catch(function (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
