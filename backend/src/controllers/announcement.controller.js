const {
    listAnnouncements,
    createAnnouncement,
    deleteAnnouncement
} = require('../services/announcement.service');

async function getAnnouncements(req, res) {
    try {
        const result = await listAnnouncements(req.query, req.user);
        res.status(200).json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

async function postAnnouncement(req, res) {
    try {
        const announcement = await createAnnouncement(req.body, req.user);
        res.status(201).json({
            id: announcement._id,
            message: announcement.message,
            scope: announcement.scope,
            strand: announcement.strand,
            expiresAt: announcement.expiresAt,
            isActive: announcement.isActive,
            createdAt: announcement.createdAt,
        });
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

async function removeAnnouncement(req, res) {
    try {
        const result = await deleteAnnouncement(req.params.id, req.user);
        res.status(200).json(result);
    } catch (err) {
        res.status(err.status || 500).json({ error: err.message });
    }
}

module.exports = {
    getAnnouncements,
    postAnnouncement,
    removeAnnouncement
};