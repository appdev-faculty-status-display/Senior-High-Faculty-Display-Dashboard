const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const { connectDb } = require('./src/config/config');
const routes = require('./src/routes/route');

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(function (origin) {
    return origin.trim();
  })
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api', routes);

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