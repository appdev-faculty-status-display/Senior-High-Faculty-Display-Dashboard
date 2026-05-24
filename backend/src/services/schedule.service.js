const { Faculty } = require('../models/Faculty');

async function listSchedule() {
    const filter = requestingUser.role === 'strand_head'
    ? { strand: requestingUser.strand}
    : {};

    const faculty = await Faculty.find(filter, {
        facultyId: 1,
        name: 1,
        strand: 1,
        schedule: 1,
    });

    return faculty.flatMap((f) => {
        f.schedule.map((entry) => ({
            // Faculty-level fields — joined from the Faculty document root
            facultyId: f.facultyId,
            mongoId:   f._id.toString(),
            name:      f.name,
            strand:    f.strand,

            // Schedule sub-document fields
            _id:       entry._id.toString(),
            day:       entry.day,
            startTime: entry.startTime,
            endTime:   entry.endTime,
            subject:   entry.subject,
            room:      entry.room,
        }))
    })
}

module.exports = { listSchedule };