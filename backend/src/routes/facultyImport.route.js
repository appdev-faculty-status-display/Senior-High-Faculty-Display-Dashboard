const express = require('express');
const router = express.Router();
const multer = require('multer');
const { importFaculty } = require('../controllers/facultyImport.controller');
const { authToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { asyncHandler } = require('../utils/asyncHandler');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (_req, file, cb) {
    if (
      file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only .xlsx files are allowed'));
    }
  }
});

router.post(
  '/import',
  authToken,
  requireRole('principal', 'strand_head'),
  upload.single('file'),
  asyncHandler(importFaculty)
);

module.exports = router;
