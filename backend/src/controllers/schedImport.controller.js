const { runImport, addEntry } = require('../services/schedImport.service');

async function importSchedule(req, res) {
    if (!req.file) {
        const error = new Error('No file uploaded');
        error.name = 'ValidationError';
        error.errors = {
            file: { message: 'An Excel .xlsx file is required' }
        };
        throw error;
    }

    const replaceAll = req.body.replaceAll === 'true' || req.body.replaceAll === true;

    const result = await runImport(
        req.file.buffer,
        req.file.originalname,
        req.user.id,
        replaceAll,
        req.user
    );

    return res.status(200).json(result);
}

async function addScheduleEntry(req, res) {
    const { facultyId } = req.params;
    const { 
        day, 
        startTime, 
        endTime, 
        subject, 
        room 
    } = req.body;

    const result = await addEntry(
        facultyId,
        { day, startTime, endTime, subject, room },
        req.user
    );
    
    return res.status(201).json(result);
}

module.exports = { importSchedule, addScheduleEntry };