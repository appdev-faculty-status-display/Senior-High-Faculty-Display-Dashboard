const Notification = require('../models/notification.model');
const {
    buildFilter,
    parsePagination,
    NOTIFICATION_LIST_PROJECTION
} = require('../utils/notification.utils');

const getNotifications = async (query, scopeFilter = {}) => {
    const { page, pageSize, skip } = parsePagination(query);
    const filter = buildFilter(query, scopeFilter);

    const [ data, total ] = await Promise.all([
        Notification.find(filter, NOTIFICATION_LIST_PROJECTION)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(pageSize)
            .lean(),
        Notification.countDocuments(filter),
    ]);

    return {
        data, 
        total, 
        page
    };
}

const createNotification = async ({ payload }) => {
    const notification = new Notification(payload);
    return notification.save();
}

module.exports = {
    getNotifications,
    createNotification,
};