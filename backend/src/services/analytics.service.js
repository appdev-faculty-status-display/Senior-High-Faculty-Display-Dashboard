const Faculty = require('../models/faculty.model');
const Announcement = require('../models/announcement.model');
const ConsultRooms = require('../models/consultation.model');
const Notification = require('../models/notification.model');

async function buildFacultyFilter(opts = {}) {
  const { from, to, strand } = opts || {};
  const filter = {};
  if (from || to) filter.updatedAt = {};
  if (from) filter.updatedAt.$gte = new Date(from);
  if (to) filter.updatedAt.$lte = new Date(to);
  if (strand) filter.strand = strand;
  return filter;
}

async function getStatusDistribution(opts = {}) {
  const statuses = [
    { value: 'in-meeting', label: 'In Meeting' },
    { value: 'off-campus', label: 'Off Campus' },
    { value: 'in-class', label: 'In Class' },
    { value: 'available', label: 'Available' },
    { value: 'do-not-disturb', label: 'Do Not Disturb' },
    { value: 'on-break', label: 'On Break' },
  ];
  const filter = await buildFacultyFilter(opts);

  const counts = {};
  await Promise.all(statuses.map(async (status) => {
    counts[status.label] = await Faculty.countDocuments({ ...filter, status: status.value }).exec();
  }));

  return counts;
}

async function getRecencyLog(limit = 50, opts = {}) {
  const filter = await buildFacultyFilter(opts);
  const docs = await Faculty.find(filter, 'facultyId name strand status updatedAt')
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean()
    .exec();

  return docs.map(d => ({
    facultyId: d.facultyId,
    facultyName: d.name,
    strand: d.strand,
    currentStatus: d.status,
    lastUpdated: d.updatedAt,
    recency: Math.max(0, Math.round((Date.now() - new Date(d.updatedAt)) / 1000 / 60)) + 'm'
  }));
}

// Consultation analytics: urgency & purpose
const Request = require('../models/request.model');

async function getConsultationUrgencyAndPurpose(opts = {}) {
  const { from, to, faculty, strand } = opts || {};
  const filter = {};
  if (from || to) filter.createdAt = {};
  if (from) filter.createdAt.$gte = new Date(from);
  if (to) filter.createdAt.$lte = new Date(to);
  if (faculty) filter.teacher = faculty;
  if (strand) filter.strand = strand;

  const docs = await Request.find(filter).lean().exec();

  // urgency counts
  const urgencyMap = {};
  docs.forEach(d => {
    const u = (d.urgency || 'low').toString();
    urgencyMap[u] = (urgencyMap[u] || 0) + 1;
  });

  // purpose analysis: simple keyword bucketing from reason text
  const purposeBuckets = { Academic: 0, Scheduling: 0, Personal: 0, Other: 0 };
  const keywords = {
    Academic: ['grade', 'exam', 'assessment', 'project', 'assignment', 'subjects', 'course', 'academic'],
    Scheduling: ['schedule', 'time', 'slot', 'reschedule', 'conflict', 'availability'],
    Personal: ['personal', 'family', 'health', 'sick', 'counseling'],
  };
  docs.forEach(d => {
    const text = (d.reason || '').toLowerCase();
    let matched = false;
    for (const cat of Object.keys(keywords)) {
      for (const kw of keywords[cat]) {
        if (text.includes(kw)) { purposeBuckets[cat]++; matched = true; break; }
      }
      if (matched) break;
    }
    if (!matched) purposeBuckets.Other++;
  });

  const urgencyAnalysis = {
    labels: Object.keys(urgencyMap),
    counts: Object.keys(urgencyMap).map(k => urgencyMap[k]),
  };

  const purposeAnalysis = {
    labels: Object.keys(purposeBuckets),
    counts: Object.keys(purposeBuckets).map(k => purposeBuckets[k]),
  };

  return { urgencyAnalysis, purposeAnalysis };
}

async function getConsultationEfficiency(opts = {}) {
  // Simple metrics derived from consult rooms and queues. Accepts filters but currently uses rooms count.
  const { from, to, faculty } = opts || {};
  const rooms = await ConsultRooms.countDocuments({ isActive: true }).exec();
  return {
    quickConsultations: Math.max(0, Math.round(rooms * 3)),
    consultationRoom: rooms,
  };
}

async function getCancellationRate() {
  // Use requests or queues to derive cancellation — fallback to mock-like summary
  return {
    resolved: 85, // percent
    scheduleConflict: 8,
    longWaitTime: 7,
  };
}

async function getApprovalBottleneck() {
  return {
    facultyApprovalMin: 30,
    strandHeadApprovalMin: 120,
  };
}

async function getConsultationParticipants(limit = 200) {
  // Read queues or consultation entries — fallback to empty list if none
  // Use Queue model if present; else return empty
  let Queue;
  try { Queue = require('../models/Queue'); } catch (e) { Queue = null; }
  if (!Queue) return [];
  const docs = await Queue.find({}).limit(limit).lean().exec();
  return docs.map(d => ({
    id: d._id,
    facultyId: d.facultyId,
    student: d.studentName || d.student || 'N/A',
    requestedAt: d.createdAt,
  }));
}

async function getAnnouncementReach() {
  const labels = [];
  const strandSpecific = [];
  const schoolWide = [];

  const announcements = await Announcement.find({}).sort({ createdAt: 1 }).lean().exec();
  // produce monthly labels by YYYY-MM
  const grouped = {};
  announcements.forEach(a => {
    const key = new Date(a.createdAt).toISOString().slice(0,7);
    grouped[key] = grouped[key] || { strand: 0, school: 0 };
    if (a.scope === 'all') grouped[key].school += 1; else grouped[key].strand += 1;
  });
  const keys = Object.keys(grouped).sort();
  keys.forEach(k => {
    labels.push(k);
    strandSpecific.push(grouped[k].strand);
    schoolWide.push(grouped[k].school);
  });

  return { labels, strandSpecific, schoolWide };
}

async function getNotificationSuccess() {
  // derive counts from Notification model if exists
  let NotificationModel;
  try { NotificationModel = require('../models/notification.model'); } catch (e) { NotificationModel = null; }
  if (!NotificationModel) return { labels: [], sent: [], failed: [] };
  const docs = await NotificationModel.find({}).limit(200).lean().exec();
  // group by channel
  const map = {};
  docs.forEach(n => {
    const ch = n.channel || 'unknown';
    map[ch] = map[ch] || { sent: 0, failed: 0 };
    if (n.status === 'sent') map[ch].sent += 1; else map[ch].failed += 1;
  });
  const labels = Object.keys(map);
  return { labels, sent: labels.map(l => map[l].sent), failed: labels.map(l => map[l].failed) };
}

async function getRoomOccupancy() {
  const rooms = await ConsultRooms.find({}).lean().exec();
  return rooms.map(r => ({ room: r.roomCode || r._id, used: r.currentOccupant ? 100 : 0, available: r.currentOccupant ? 0 : 100 }));
}

module.exports = {
  getStatusDistribution,
  getRecencyLog,
  getConsultationEfficiency,
  getConsultationUrgencyAndPurpose,
  getCancellationRate,
  getApprovalBottleneck,
  getConsultationParticipants,
  getAnnouncementReach,
  getNotificationSuccess,
  getRoomOccupancy,
};