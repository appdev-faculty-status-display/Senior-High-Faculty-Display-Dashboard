const analyticsService = require('../services/analytics.service');

async function facultyActivity(req, res) {
  const { from, to, strand } = req.query || {};
  const statusDistribution = await analyticsService.getStatusDistribution({ from, to, strand });
  const recencyLog = await analyticsService.getRecencyLog(100, { from, to, strand });
  res.json({ statusDistribution, recencyLog });
}

async function consultation(req, res) {
  // Accept optional filters from query string
  const { from, to, faculty, strand } = req.query || {};
  const consultationEfficiency = await analyticsService.getConsultationEfficiency({ from, to, faculty, strand });
  // urgency & purpose analyses
  const { urgencyAnalysis, purposeAnalysis } = await analyticsService.getConsultationUrgencyAndPurpose({ from, to, faculty, strand });

  res.json({ consultationEfficiency, urgencyAnalysis, purposeAnalysis });
}
module.exports = { facultyActivity, consultation };