const cron = require('node-cron');
const { Faculty } = require('../models');

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getCurrentDayAndTime() {
    const now = new Date();
    const day = DAYS[now.getDay()];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const time = `${hours}:${minutes}`;
    return { day, time };
}

function isWithinPeriod(startTime, endTime, currentTime) {
    return currentTime >= startTime && currentTime < endTime;
}

function hasActivePeriod(schedule, day, currentTime) {
    return schedule.some(function (entry) {
        return entry.day === day && isWithinPeriod(entry.startTime, entry.endTime, currentTime);
    });
}

function getActivePeriod(schedule, day, currentTime) {
    return schedule.find(function (entry) {
        return entry.day === day && isWithinPeriod(entry.startTime, entry.endTime, currentTime);
    });
}

async function runAutoStatusCheck() {
    const { day, time } = getCurrentDayAndTime();

    const facultyList = await Faculty.find({});

    for (const faculty of facultyList) {
        // if there is a manual override that has not expired yet, skip this faculty
        if (faculty.statusOverride && faculty.statusOverride.expiresAt) {
            const overrideStillActive = new Date(faculty.statusOverride.expiresAt) > new Date();

            if (overrideStillActive) {
                continue;
            }

            // override has expired, clear it
            faculty.statusOverride = null;
        }

        const activePeriod = getActivePeriod(faculty.schedule, day, time);

        if (activePeriod) {
            // faculty has a class right now
            if (faculty.status !== 'in-class') {
                faculty.status = 'in-class';
                faculty.currentPeriod = `${activePeriod.subject} - ${activePeriod.room}`;
                await faculty.save();
            }
        } else {
            // no active class period, revert to available if they were in-class
            if (faculty.status === 'in-class') {
                faculty.status = 'available';
                faculty.currentPeriod = null;
                await faculty.save();
            }
        }
    }
}

function startAutoStatusCron() {
    // runs every minute
    cron.schedule('* * * * *', async function () {
        try {
            await runAutoStatusCheck();
        } catch (err) {
            console.error('Auto status cron job failed:', err.message);
        }
    });

    console.log('Auto status cron job started');
}

module.exports = { startAutoStatusCron };