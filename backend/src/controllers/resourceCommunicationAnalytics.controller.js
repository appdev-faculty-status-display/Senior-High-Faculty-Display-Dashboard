const { getResourceCommunicationAnalytics } = require('../services/resourceCommunicationAnalytics.service');

async function getResourceCommunicationAnalyticsHandler(req, res) {
  try {
    const data = await getResourceCommunicationAnalytics(req.query || {});
    return res.status(200).json(data);
  } catch (err) {
    console.error('[resourceCommunicationAnalytics]', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

module.exports = {
  getResourceCommunicationAnalyticsHandler
};
