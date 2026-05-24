const Faculty = require('../models/Faculty');

// requestingUser is required — strand_head sees only their strand,
// principal sees all strands. Passed in from the controller via req.user.

async function listSchedules(requestingUser) {
    const filter = requestingUser.role === 'strand_head'
    ? { strand: requestingUser.strand}
    : {};

    const faculty = await Faculty.find(filter, {
        facultyId: 1,
        name: 1,
        strand: 1,
        schedule: 1,
    });

    return faculty.flatMap((f) =>
        f.schedule.map((entry) => ({                  
            facultyId: f.facultyId,
            mongoId:   f._id.toString(),
            name:      f.name,
            strand:    f.strand,
            entryKey:  `${f.facultyId}_${entry.day}_${entry.startTime}_${entry.endTime}`,
            day:       entry.day,
            startTime: entry.startTime,
            endTime:   entry.endTime,
            subject:   entry.subject,
            room:      entry.room,
        }))
    );
}

module.exports = { listSchedules };