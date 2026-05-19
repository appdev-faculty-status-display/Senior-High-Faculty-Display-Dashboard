const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const { createAuthError } = require('../utils/error');
const { errorHandler } = require('../middleware/errorHandler');

jest.mock('../services/consultation.service');
const { getAllConsultRooms, getConsultRoomById } = require('../services/consultation.service');

const { getRooms, getRoomById } = require('../controllers/consultation.controller');

const app = express();
app.use(express.json());
app.get('/rooms', getRooms);
app.get('/rooms/:id', getRoomById);
app.use(errorHandler);

const mockOccupant = {
    id: new mongoose.Types.ObjectId().toString(),
    name: 'Juan dela Cruz',
};

const mockRooms = [
    {
        id: new mongoose.Types.ObjectId().toString(),
        roomCode: 'CR-01',
        capacity: 4,
        isActive: true,
        currentOccupant: null,
        occupiedUntil: null,
    },
    {
        id: new mongoose.Types.ObjectId().toString(),
        roomCode: 'CR-02',
        capacity: 4,
        isActive: true,
        currentOccupant: mockOccupant,
        occupiedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    },
    {
        id: new mongoose.Types.ObjectId().toString(),
        roomCode: 'CR-03',
        capacity: 4,
        isActive: false,
        currentOccupant: null,
        occupiedUntil: null,
    },
];

describe('Consultation Room Routes', () => {
    afterEach(() => jest.clearAllMocks());

    describe('GET /rooms', () => {
        it('returns 200 with all rooms, total, and available count', async () => {
            getAllConsultRooms.mockResolvedValue({
                data: mockRooms,
                total: mockRooms.length,
                available: 1,
            });
            const res = await request(app).get('/rooms');
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('data');
            expect(res.body).toHaveProperty('total', 3);
            expect(res.body).toHaveProperty('available', 1);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('does not count inactive rooms as available', async () => {
            getAllConsultRooms.mockResolvedValue({
                data: mockRooms,
                total: mockRooms.length,
                available: 1,
            });
            const res = await request(app).get('/rooms');
            expect(res.status).toBe(200);
            expect(res.body.available).toBe(1);
        });

        it('does not count occupied rooms as available', async () => {
            getAllConsultRooms.mockResolvedValue({
                data: mockRooms,
                total: mockRooms.length,
                available: 1,
            });
            const res = await request(app).get('/rooms');
            const occupiedRooms = res.body.data.filter(
                (room) => room.currentOccupant !== null
            );
            expect(occupiedRooms.every((room) => room.isActive)).toBe(true);
            expect(res.body.available).toBeLessThan(res.body.total);
        });

        it('returns empty data array when no rooms exist', async () => {
            getAllConsultRooms.mockResolvedValue({ data: [], total: 0, available: 0 });
            const res = await request(app).get('/rooms');
            expect(res.status).toBe(200);
            expect(res.body.data).toHaveLength(0);
            expect(res.body.total).toBe(0);
            expect(res.body.available).toBe(0);
        });

        it('returns error on service failure', async () => {
            getAllConsultRooms.mockRejectedValue(createAuthError('INTERNAL_ERROR'));

            const res = await request(app).get('/rooms');

            expect(res.body).toHaveProperty('code', 'INTERNAL_ERROR');
            expect(res.body).toHaveProperty('message');
        });
    });

    describe('GET /rooms/:id', () => {
        it('returns 200 with room data for a valid id', async () => {
            const room = mockRooms[0];
            getConsultRoomById.mockResolvedValue(room);
            const res = await request(app).get(`/rooms/${room.id}`);
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('roomCode');
            expect(res.body).toHaveProperty('isActive');
            expect(res.body).toHaveProperty('currentOccupant');
            expect(res.body).toHaveProperty('occupiedUntil');
        });

        it('returns occupant details when room is occupied', async () => {
            const room = mockRooms[1];
            getConsultRoomById.mockResolvedValue(room);
            const res = await request(app).get(`/rooms/${room.id}`);
            expect(res.status).toBe(200);
            expect(res.body.currentOccupant).not.toBeNull();
            expect(res.body.currentOccupant).toHaveProperty('name');
            expect(res.body.occupiedUntil).not.toBeNull();
        });

        it('returns null occupant when room is vacant', async () => {
            const room = mockRooms[0];
            getConsultRoomById.mockResolvedValue(room);
            const res = await request(app).get(`/rooms/${room.id}`);
            expect(res.status).toBe(200);
            expect(res.body.currentOccupant).toBeNull();
            expect(res.body.occupiedUntil).toBeNull();
        });

        it('returns correct data for an inactive room', async () => {
            const room = mockRooms[2];
            getConsultRoomById.mockResolvedValue(room);
            const res = await request(app).get(`/rooms/${room.id}`);
            expect(res.status).toBe(200);
            expect(res.body.isActive).toBe(false);
        });

        it('returns 404 when room is not found', async () => {
            getConsultRoomById.mockRejectedValue(createAuthError('NOT_FOUND'));

            const res = await request(app).get(
                `/rooms/${new mongoose.Types.ObjectId()}`
            );

            expect(res.body).toHaveProperty('code', 'NOT_FOUND');
            expect(res.body).toHaveProperty('message');
        });

        it('returns error on invalid ObjectId format', async () => {
            getConsultRoomById.mockRejectedValue(createAuthError('NOT_FOUND'));
            const res = await request(app).get('/rooms/not_a_valid_id');
            expect(res.status).toBeGreaterThanOrEqual(400);
            expect(res.body).toHaveProperty('message');
        });
    });
});