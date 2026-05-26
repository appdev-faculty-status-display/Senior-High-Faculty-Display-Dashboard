const Announcement = require('../models/announcement.model');
const Room = require('../models/Room');

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDateParam(value, endOfDay) {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }
  return date;
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

function buildMonthRange(from, to) {
  const months = [];
  let cursor = startOfMonth(from);
  const end = startOfMonth(to);

  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    months.push({
      key: `${year}-${String(month + 1).padStart(2, '0')}`,
      label: MONTH_LABELS[month],
      year,
      month: month + 1
    });
    cursor = addMonths(cursor, 1);
  }

  return months;
}

function buildDefaultRange() {
  const end = new Date();
  const start = addMonths(startOfMonth(end), -5);
  return { start, end };
}

function buildAnnouncementMatch(start, end) {
  const match = {};
  if (start || end) {
    match.createdAt = {};
    if (start) match.createdAt.$gte = start;
    if (end) match.createdAt.$lte = end;
  }
  return match;
}

function formatRoomLabel(room, index) {
  return room.teacher || room.facultyId || `Room ${index + 1}`;
}

async function getResourceCommunicationAnalytics(query) {
  const from = parseDateParam(query.from, false);
  const to = parseDateParam(query.to, true);
  const strand = String(query.strand || '').trim().toUpperCase();

  const range = from || to ? {
    start: from || startOfMonth(new Date(to)),
    end: to || new Date()
  } : buildDefaultRange();

  const months = buildMonthRange(range.start, range.end);

  const baseMatch = buildAnnouncementMatch(range.start, range.end);

  const scopeMatch = {
    $match: {
      ...baseMatch
    }
  };

  const aggregation = await Announcement.aggregate([
    scopeMatch,
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          scope: '$scope',
          strand: '$strand'
        },
        count: { $sum: 1 }
      }
    }
  ]);

  const strandSpecific = months.map((m) => {
    return aggregation
      .filter((row) => row._id.scope === 'strand')
      .filter((row) => row._id.year === m.year && row._id.month === m.month)
      .filter((row) => !strand || String(row._id.strand || '').toUpperCase() === strand)
      .reduce((sum, row) => sum + row.count, 0);
  });

  const schoolWide = months.map((m) => {
    return aggregation
      .filter((row) => row._id.scope === 'all')
      .filter((row) => row._id.year === m.year && row._id.month === m.month)
      .reduce((sum, row) => sum + row.count, 0);
  });

  const rooms = await Room.find().lean();
  const occupancy = rooms.map((room, index) => {
    const isAvailable = String(room.status || '').toUpperCase() === 'AVAILABLE';
    return {
      room: formatRoomLabel(room, index),
      used: isAvailable ? 0 : 100,
      available: isAvailable ? 100 : 0
    };
  });

  return {
    range: {
      from: range.start.toISOString(),
      to: range.end.toISOString(),
      strand: strand || null
    },
    announcementReach: {
      labels: months.map((m) => m.label),
      strandSpecific,
      schoolWide
    },
    roomOccupancy: {
      rooms: occupancy
    },
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  getResourceCommunicationAnalytics
};
