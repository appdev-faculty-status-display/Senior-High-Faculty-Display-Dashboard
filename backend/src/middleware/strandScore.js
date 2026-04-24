const { Faculty } = require('../models');
const { createAuthError } = require('../auth/errors');

function reqSameStrand(req, res, next) {
    return async function (req, res, next) {
        try {
            const facultyId = req.params[paramName];
            const reqStrand = req.user.strand;
            const faculty = await Faculty.findById(facultyId).select('strand');

            if (!faculty) {
                return next(createAuthError('NOT_FOUND'));
            }

            if (faculty.strand !== reqStrand) {
                return next(createAuthError('FORBIDDEN'));
            }
            next();
        } catch (error) {
            next(error);
        }
    };
}

module.exports = { reqSameStrand };