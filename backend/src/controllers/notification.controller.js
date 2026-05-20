const notificationService = require('../services/notification.service');

const getNotifications = async (req, res) => {
    try {
        const { role, strand } = req.user;

        const scopeFilter =
            role === 'strand_head' && strandId? { strandId } : {};
        
        const result = await notificationService.getNotifications(req.query, scopeFilter);

        return res.status(200).json(result);
    } catch (err) {
        console.error('Error fetching notifications:', err);
        return res.status(500).json({ error: 'An error occurred while fetching notifications.' });
    }
}

module.exports = {
    getNotifications,
};