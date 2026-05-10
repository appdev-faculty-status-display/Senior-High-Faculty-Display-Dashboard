const { runImport } = require('../services/schedImport.service');

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

module.exports = { importSchedule };