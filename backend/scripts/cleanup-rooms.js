const dns = require('dns');
const mongoose = require('mongoose');
require('dotenv').config();

const ConsultRooms = require('../src/models/consultation.model');
const Request = require('../src/models/request.model');

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function cleanupRooms() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Missing required environment variable: MONGODB_URI');
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  try {
    // Clear occupancy so all rooms are available again.
    const roomResult = await ConsultRooms.updateMany(
      {},
      { $set: { currentOccupant: null, occupiedUntil: null } }
    );

    // Remove consultation requests to clear room reservations from the request form flow.
    const requestResult = await Request.deleteMany({});

    console.log('Rooms updated:', roomResult.modifiedCount ?? roomResult.nModified ?? 0);
    console.log('Requests deleted:', requestResult.deletedCount ?? 0);
  } finally {
    await mongoose.disconnect();
  }
}

cleanupRooms().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
