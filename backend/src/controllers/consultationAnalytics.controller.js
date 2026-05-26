const { getConsultationAnalytics } = require('../services/consultationAnalytics.service');

async function getConsultationAnalyticsHandler(req, res) {
  try {
    const data = await getConsultationAnalytics(req.query || {});
    return res.status(200).json(data);
  } catch (err) {
    console.error('[consultationAnalytics]', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

module.exports = {
  getConsultationAnalyticsHandler
};
