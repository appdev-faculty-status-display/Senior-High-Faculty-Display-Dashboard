const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const { connectDb } = require('./src/config/config');
const { corsOptions } = require('./src/config/cors');
const { globalLimiter } = require('./src/middleware/rateLimit');
const { notFoundHandler } = require('./src/middleware/notFound');
const { errorHandler } = require('./src/middleware/errorHandler');
const routes = require('./src/routes/route');

const app = express();

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(globalLimiter);
app.use(express.json());

// Routes
app.use('/api', routes);
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

connectDb()
  .then(function () {
    app.listen(PORT, function () {
      console.log('Server running on port ' + PORT);
    });
  })
  .catch(function (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
  