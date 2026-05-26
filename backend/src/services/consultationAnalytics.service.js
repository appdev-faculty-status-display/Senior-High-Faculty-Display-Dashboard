const crypto = require('crypto');
const Request = require('../models/request.model');
const Queue = require('../models/Queue');
const Faculty = require('../models/Faculty');

const PURPOSE_LABELS = [
  'Grades',
  'Clearance',
  'Schedule',
  'Research',
  'Requirements',
  'Project',
  'Capstone',
  'TOR',
  'Final Grade',
  'Other'
];

const cancellationBuckets = {
  resolved: 'resolved',
  scheduleConflict: 'scheduleConflict',
  longWaitTime: 'longWaitTime'
};

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildDateFilter(from, to) {
  if (!from && !to) return null;

  const filter = {};
  if (from) {
    const start = new Date(`${from}T00:00:00`);
    if (!Number.isNaN(start.getTime())) {
      filter.$gte = start;
    }
  }

  if (to) {
    const end = new Date(`${to}T23:59:59.999`);
    if (!Number.isNaN(end.getTime())) {
      filter.$lte = end;
    }
  }

  return Object.keys(filter).length > 0 ? filter : null;
}

function toMinutes(ms) {
  return Math.round(ms / 60000);
}

function hashStudentId(studentId) {
  const digest = crypto
    .createHash('sha256')
    .update(String(studentId || ''))
    .digest('hex');
  return `STU-${digest.slice(0, 6)}`;
}

function extractStartTime(timeRange) {
  if (!timeRange) return '';
  const parts = String(timeRange).split(/\s*(?:-|\u2013|\u2014)\s*/);
  return parts[0] ? parts[0].trim() : '';
}

function formatDateLabel(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function resolvePurpose(purpose, reason) {
  const trimmedPurpose = String(purpose || '').trim();
  if (trimmedPurpose) {
    return trimmedPurpose;
  }

  const text = String(reason || '').toLowerCase();
  if (text.includes('grade')) return 'Grades';
  if (text.includes('clearance')) return 'Clearance';
  if (text.includes('schedule')) return 'Schedule';
  if (text.includes('research')) return 'Research';
  if (text.includes('requirement')) return 'Requirements';
  if (text.includes('project')) return 'Project';
  if (text.includes('capstone')) return 'Capstone';
  if (text.includes('tor')) return 'TOR';
  if (text.includes('final')) return 'Final Grade';

  return 'Other';
}

function mapParticipantStatus(status) {
  if (status === 'cancelled' || status === 'rejected') return 'Cancelled';
  if (status === 'no_show') return 'No-show';
  return 'Completed';
}

function bucketCancellation(request) {
  const reason = String(request.cancellationReason || request.rejectionReason || '').toLowerCase();
  if (reason.includes('schedule')) return cancellationBuckets.scheduleConflict;
  if (reason.includes('wait')) return cancellationBuckets.longWaitTime;
  return cancellationBuckets.resolved;
}

async function getConsultationAnalytics(query) {
  const facultySearch = String(query.faculty || '').trim();
  const from = query.from ? String(query.from).trim() : '';
  const to = query.to ? String(query.to).trim() : '';

  const dateFilter = buildDateFilter(from, to);

  const requestFilter = {};
  if (dateFilter) {
    requestFilter.createdAt = dateFilter;
  }
  if (facultySearch) {
    requestFilter.teacher = new RegExp(escapeRegex(facultySearch), 'i');
  }

  const requests = await Request.find(requestFilter).lean();

  const queueFilter = {};
  if (dateFilter) {
    queueFilter.createdAt = dateFilter;
  }

  if (facultySearch) {
    const matchingFaculty = await Faculty.find({
      name: new RegExp(escapeRegex(facultySearch), 'i')
    })
      .select('facultyId')
      .lean();

    const facultyIds = matchingFaculty.map((f) => f.facultyId).filter(Boolean);
    queueFilter.facultyId = facultyIds.length > 0 ? { $in: facultyIds } : '__none__';
  }

  const queueEntries = await Queue.find(queueFilter).lean();

  const consultationRoom = requests.filter((request) => {
    const room = String(request.room || '').toLowerCase();
    return room && room !== 'walk-in';
  }).length;

  const quickConsultations = queueEntries.filter((entry) => {
    const inferredType = entry.type || (entry.roomId ? 'room_consultation' : 'quick_consultation');
    return inferredType === 'quick_consultation';
  }).length;

  const waitEntries = queueEntries.filter((entry) =>
    ['approved', 'in_progress', 'completed'].includes(entry.status)
  );

  const totalWaitMs = waitEntries.reduce((sum, entry) => {
    const created = new Date(entry.createdAt).getTime();
    const updated = new Date(entry.updatedAt).getTime();
    if (Number.isNaN(created) || Number.isNaN(updated)) return sum;
    return sum + Math.max(0, updated - created);
  }, 0);

  const avgQueueWaitMin = waitEntries.length > 0
    ? toMinutes(totalWaitMs / waitEntries.length)
    : 0;

  const cancellationCounts = {
    resolved: 0,
    scheduleConflict: 0,
    longWaitTime: 0
  };

  requests
    .filter((request) => ['cancelled', 'rejected'].includes(request.status))
    .forEach((request) => {
      const bucket = bucketCancellation(request);
      cancellationCounts[bucket] += 1;
    });

  const facultyApprovalDurations = [];
  const strandApprovalDurations = [];

  requests.forEach((request) => {
    if (request.facultyApprovedAt) {
      const facultyMs = new Date(request.facultyApprovedAt).getTime() - new Date(request.createdAt).getTime();
      if (!Number.isNaN(facultyMs)) {
        facultyApprovalDurations.push(Math.max(0, facultyMs));
      }
    }

    if (request.facultyApprovedAt && request.strandHeadApprovedAt) {
      const strandMs = new Date(request.strandHeadApprovedAt).getTime() - new Date(request.facultyApprovedAt).getTime();
      if (!Number.isNaN(strandMs)) {
        strandApprovalDurations.push(Math.max(0, strandMs));
      }
    }
  });

  const facultyApprovalMin = facultyApprovalDurations.length
    ? toMinutes(facultyApprovalDurations.reduce((sum, ms) => sum + ms, 0) / facultyApprovalDurations.length)
    : 0;

  const strandHeadApprovalMin = strandApprovalDurations.length
    ? toMinutes(strandApprovalDurations.reduce((sum, ms) => sum + ms, 0) / strandApprovalDurations.length)
    : 0;

  const urgencyCounts = { low: 0, medium: 0, high: 0 };
  const purposeMap = new Map();

  requests.forEach((request) => {
    if (request.urgency && urgencyCounts[request.urgency] !== undefined) {
      urgencyCounts[request.urgency] += 1;
    }

    const label = resolvePurpose(request.purpose, request.reason);
    purposeMap.set(label, (purposeMap.get(label) || 0) + 1);
  });

  PURPOSE_LABELS.forEach((label) => {
    if (!purposeMap.has(label)) {
      purposeMap.set(label, 0);
    }
  });

  const purposes = Array.from(purposeMap.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const participants = requests
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((request) => ({
      id: String(request._id),
      hashedStudentId: hashStudentId(request.studentId),
      facultyName: request.teacher || 'Unknown',
      strand: request.strand || 'Unknown',
      consultationUsed: Boolean(request.room && String(request.room).toLowerCase() !== 'walk-in'),
      date: formatDateLabel(request.createdAt),
      time: extractStartTime(request.time),
      status: mapParticipantStatus(request.status)
    }));

  return {
    range: {
      from: from || null,
      to: to || null,
      faculty: facultySearch || null
    },
    efficiency: {
      quickConsultations,
      consultationRoom,
      avgQueueWaitMin
    },
    cancellationRate: {
      resolved: cancellationCounts.resolved,
      scheduleConflict: cancellationCounts.scheduleConflict,
      longWaitTime: cancellationCounts.longWaitTime
    },
    approvalBottleneck: {
      facultyApprovalMin,
      strandHeadApprovalMin
    },
    urgencyPurpose: {
      urgency: urgencyCounts,
      purposes
    },
    participants,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  getConsultationAnalytics
};
