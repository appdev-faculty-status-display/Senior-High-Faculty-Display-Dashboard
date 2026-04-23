const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Faculty } = require('./src/models');
require('dotenv').config();

async function seed() {
    if (!process.env.MONGODB_URI) {
        throw new Error('Missing required environment variable: MONGODB_URI');
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const hash = await bcrypt.hash('Test1234!', 10);

        await Faculty.updateOne(
            { facultyId: 'FAC001' },
            {
                $set: {
                    userId: 'test.faculty@nu-laguna.edu.ph',
                    name: 'Test Faculty',
                    role: 'faculty',
                    passwordHash: hash,
                    strand: 'STEM',
                    photoUrl: 'https://placeholder.com/photo.jpg',
                    status: 'available',
                    currentLocation: 'Room 101'
                }
            },
            { upsert: true, runValidators: true, setDefaultsOnInsert: true }
        );

        console.log('Test faculty upserted successfully');
    } finally {
        await mongoose.disconnect();
    }
}

seed().catch(console.error);