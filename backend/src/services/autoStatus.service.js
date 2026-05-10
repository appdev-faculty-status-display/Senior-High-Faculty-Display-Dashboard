const cron = require('node-cron');
const { Faculty } = require('../models');

const { DateTime } = require('luxon');

function getCurrentDayAndTime() {
    const now = DateTime.now().setZone('Asia/Manila');
    const parts = new Intl.DateTimeFormat('en-PH', {
        timeZone: 'Asia/Manila',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    }).formatToParts(now);

    const get = (type) => parts.find(p => p.type === type)?.value;

    return {
        day: now.toFormat('cccc'),      // "Monday", "Tuesday", etc.
        time: now.toFormat('HH:mm')     // always zero-padded, no midnight quirk
    };
}

function timeToMinutes(t) {
    const [h, m] = String(t).split(':').map(Number);
    return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function isWithinPeriod(startTime, endTime, currentTime) {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    const current = timeToMinutes(currentTime);

    // Normal period (same day)
    if (start <= end) {
        return current >= start && current < end;
    }

    // Overnight period (e.g., 23:00 - 02:00) spans midnight
    return current >= start || current < end;
}

function getActivePeriod(schedule, day, currentTime) {
    return schedule.find(function (entry) {
        return entry.day === day && isWithinPeriod(entry.startTime, entry.endTime, currentTime);
    });
}

async function runAutoStatusCheck() {
    const { day, time } = getCurrentDayAndTime();
    const cursor = Faculty.find({}).cursor();

    for await (const faculty of cursor) {
        // Check if status override is still active
        if (faculty.statusOverride) {
            if (faculty.statusOverride.expiresAt) {
                const overrideStillActive = faculty.statusOverride.expiresAt > new Date();
                if (overrideStillActive) {
                    continue;  // Keep override active, skip schedule check
                }
            } else {
                // Override has no expiry; preserve it indefinitely
                continue;
            }
            // Override has expired; clear it and proceed to schedule check
            faculty.statusOverride = null;
        }

        const activePeriod = getActivePeriod(faculty.schedule, day, time);

        if (activePeriod) {
            // in-class faculty
            if (faculty.status !== 'in-class') {
                faculty.status = 'in-class';
                faculty.currentPeriod = `${activePeriod.subject} - ${activePeriod.room}`;
                await faculty.save();
            }
        } else {
            // no active class period
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
            console.error(err);
        }
    });

    console.log('Auto status cron job started');
}

module.exports = { startAutoStatusCron };