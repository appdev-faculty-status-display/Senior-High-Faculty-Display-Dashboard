const dns = require('dns');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { Faculty } = require('./src/models');
require('dotenv').config();

dns.setServers(['8.8.8.8', '1.1.1.1']);

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
                facultyId: 'ADM001',
                userId: 'principal@nu-laguna.edu.ph',
                name: 'Test Principal',
                role: 'principal',
                strand: 'STEM',
                currentLocation: 'Admin Office'
            },
            {
                facultyId: 'SHD-STEM',
                userId: 'strandhead.stem@nu-laguna.edu.ph',
                name: 'Test STEM Strand Head',
                role: 'strand_head',
                strand: 'STEM',
                currentLocation: 'Room 201'
            },
            {
                facultyId: 'SHD-ABM',
                userId: 'strandhead.abm@nu-laguna.edu.ph',
                name: 'Test ABM Strand Head',
                role: 'strand_head',
                strand: 'ABM',
                currentLocation: 'Room 202'
            },
            {
                facultyId: 'SHD-HUMSS',
                userId: 'strandhead.humss@nu-laguna.edu.ph',
                name: 'Test HUMSS Strand Head',
                role: 'strand_head',
                strand: 'HUMSS',
                currentLocation: 'Room 203'
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