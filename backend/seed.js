const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const hash = await bcrypt.hash('Test1234!', 10);

    await mongoose.connection.collection('faculties').insertOne({
        id: 'FAC001',
        userId: 'test.faculty@nu-laguna.edu.ph',
        name: 'Test Faculty',
        role: 'faculty',
        passwordHash: hash,
        strand: 'STEM',
        photoUrl: 'https://placeholder.com/photo.jpg',
        status: 'available',
        currentLocation: 'Room 101',
        createdAt: new Date(),
        updatedAt: new Date()
    });

    console.log('Test faculty inserted successfully');
    await mongoose.disconnect();
}

seed().catch(console.error);