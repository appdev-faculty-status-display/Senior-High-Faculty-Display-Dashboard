const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const { connectDb } = require('./src/config/config');
const { connect } = require('mongoose');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/api', (req, res) => {
  res.json({ message: 'API is working' });
});

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

  // run node "server.js" in terminal, make sure to cd into backend folder first