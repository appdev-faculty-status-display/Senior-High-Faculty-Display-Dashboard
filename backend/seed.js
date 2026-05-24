const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Faculty } = require('./src/models');
require('dotenv').config();

async function seed() {
    if (!process.env.MONGODB_URI) {
        throw new Error('Missing required environment variable: MONGODB_URI');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    try {
        const passwordHash = await bcrypt.hash('Test1234!', 10);

        const facultyRecords = [
            {
                facultyId: 'FAC001',
                userId: 'test.faculty@nu-laguna.edu.ph',
                name: 'Test Faculty',
                role: 'faculty',
                strand: 'STEM',
                currentLocation: 'Room 101'
            },
            {
                facultyId: 'FAC002',
                userId: 'test.faculty2@nu-laguna.edu.ph',
                name: 'Test Faculty Two',
                role: 'faculty',
                strand: 'STEM',
                currentLocation: 'Room 102'
            },
            {
                facultyId: 'SHD001',
                userId: 'test.strandhead@nu-laguna.edu.ph',
                name: 'Test Strand Head',
                role: 'strand_head',
                strand: 'STEM',
                currentLocation: 'Room 201'
            },
            {
                facultyId: 'ADM001',
                userId: 'test.admin@nu-laguna.edu.ph',
                name: 'Test Principal',
                role: 'principal',
                strand: 'STEM',
                currentLocation: 'Admin Office'
            }
        ];

        for (const record of facultyRecords) {
            await Faculty.updateOne(
                { facultyId: record.facultyId },
                {
                    $set: {
                        facultyId: record.facultyId,
                        userId: record.userId,
                        name: record.name,
                        role: record.role,
                        passwordHash,
                        strand: record.strand,
                        photoUrl: 'https://placeholder.com/photo.jpg',
                        status: 'available',
                        currentLocation: record.currentLocation
                    }
                },
                { upsert: true, runValidators: true, setDefaultsOnInsert: true }
            );
            console.log(`${record.name} upserted successfully`);
        }

    } catch (error) {
        console.error('Error during seed operation:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
    }
}

seed().catch(console.error);