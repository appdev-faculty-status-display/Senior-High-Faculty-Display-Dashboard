const { runFacultyImport } = require('../services/facultyImport.service');

async function importFaculty(req, res) {
  if (!req.file) {
    const error = new Error('No file uploaded');
    error.name = 'ValidationError';
    error.errors = {
      file: { message: 'An Excel .xlsx file is required' }
    };
    throw error;
  }

  const replaceSchedule = req.body.replaceSchedule === 'true' || req.body.replaceSchedule === true;

  const result = await runFacultyImport(
    req.file.buffer,
    req.file.originalname,
    req.user.id,
    replaceSchedule,
    req.user
  );

  return res.status(200).json(result);
}

module.exports = { importFaculty };
