// Mongoose Filter object from validated query params
// function only no db, no http

function buildAnnouncementFilter({ scope, strand, isActive }) {
    const filter = {};

    if (isActive !== undefined) {
        filter.isActive = isActive;
    } else {
        filter.isActive = true;
    }

    //only apply date filter for active announcement queries
    if (filter.isActive === true) {
        const now = new Date();
        filter.startsAt = { $lte: now };
        filter.$or = [
            { expiresAt: null },
            { expiresAt: { $gt: now } },
        ];
    }

    if (scope) {
        filter.scope = scope;
    }

    if (scope === 'strand' && strand) {
        filter.strand = strand;
    }
    return filter;
}

// normalizes and clamps pagination params
function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    return {
        page,
        pageSize,
        skip
    };
}

// principal => any scope/strand, strand head => only strand announcements for their strand
function canCreate(userRole, userStrand, scope, strand) {
    if (userRole === 'principal') return true;

    if (userRole === 'strand_head') {
        return scope === 'strand' && strand === userStrand;
    }

    return false;
}

function canDelete(userRole, userStrand, announcement) {
    if (userRole === 'principal') return true;

    if (userRole === 'strand_head') {
        return (
            announcement.createdByRole === 'strand_head' &&
            announcement.strand === userStrand
        );
    }

    return false;
} 

module.exports = {
    buildAnnouncementFilter,
    parsePagination,
    canCreate,
    canDelete
}