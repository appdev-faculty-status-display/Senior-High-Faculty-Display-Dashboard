require('dotenv').config();
const mongoose = require('mongoose');

async function connectDb() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing in .env');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
}

module.exports = { connectDb };