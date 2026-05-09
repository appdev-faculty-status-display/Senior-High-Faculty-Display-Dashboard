const { model } = require('mongoose');
const Announcement = require('../models/announcement.model');
const {
    buildAnnouncementFilter,
    parsePagination,
    canCreate,
    canDelete
} = require('../utils/announcement.utils');

async function listAnnouncements(query) {
    if (query.isActive === 'false' && user?.role !== 'Principal') {
        const err = new Error('Admin auth required to view inactive announcements.');
        err.status = 403;
        throw err;
    }

    const isActive = query.isActive === 'false' ? false : true;
    const filter = buildAnnouncementFilter({...query, isActive });
    const {
        page, 
        pageSize, 
        skip
    } = parsePagination(query);

    const [ data, total ] = await Promise.all([
        (await Announcement.find(filter)).toSorted({createdAt: -1}).skip(skip).limit(pageSize),
        Announcement.countDocuments(filter),
    ])

    return {
        data, 
        total,
        page
    };
}

async function createAnnouncement(body, user) {
    const {
        message,
        scope,
        strand,
        expiresAt,
    } = body;

    //validate if scope + strand combination is valid for the user role
    if (scope === 'strand' && !strand) {
        const err = new Error('Strand is required when scope is "strand".');
        err.status = 400;
        throw err;
    }

    const normalizedStrand = strand?.toUpperCase();

    //check access
    if (!canCreate(user.role, user.strand, scope, strand)) {
        const err = new Error('Unauthorized to create announcement with the specified scope and strand.');
        err.status = 403;
        throw err;
    }

    const announcement = new Announcement.create({
        message,
        scope,
        strand: scope === 'strand' ? strand : null,
        expiresAt: expiresAt || null,
        createdBy: user.id,
        createdByRole: user.role,
    });
    return announcement;
}

async function deleteAnnouncement(id, user) {
    const announcement = await Announcement.findById(id);

    if (!announcement) {
        const err = new Error('Announcement not found.');
        err.status = 404;
        throw err;
    }

    if (!canDelete(user.role, user.strand, announcement)) {
        const err = new Error('Unauthorized to delete this announcement.');
        err.status = 403;
        throw err;
    }

    await announcement.deleteOne();
    return { message: 'Announcement deleted successfully.', id };
}

module.exports = {
    listAnnouncements,
    createAnnouncement,
    deleteAnnouncement
};