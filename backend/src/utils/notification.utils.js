// Notification Utilities
const { not } = require("three/tsl");

const VALID_TYPES = [
    'queue_update',
    'consultation_approved',
    'consultaion_rejected',
    'room_assigned',
    'announcement',
    'cancellation_confirmed'
];

const VALID_RECIPIENT_TYPES = [
    'student', 
    'faculty', 
    'strand_head', 
    'principal'
];

const VALID_CHANNELS = [
    'email',
    'teams_card',
];

// validate notification type value 
// @param {string} type 
// returns {boolean}
const isValidNotificationType = (type) => VALID_TYPES.includes(type);

// validate recipient type value
// @param {string} recipientType 
// returns {boolean}
const isValidRecipientType = (recipientType) => VALID_RECIPIENT_TYPES.includes(recipientType);

// validate channel value
// @param {string} channel 
// returns {boolean}
const isValidChannel = (channel) => VALID_CHANNELS.includes(channel);


// build a standardized notificationpayload for creation
// @param {Object} params - notification parameters
// returns {Object} - standardized notification payload
const buildNotificationPayload = ({ 
    recipientId, 
    recipientType, 
    message, 
    type, 
    channel, 
    relatedQueueId = null
}) => {
    if(!recipientId) throw new Error('recipientId is required');
    
    if(!isValidRecipientType(recipientType)) 
        throw new Error(`Invalid recipientType. Must be one of: ${VALID_RECIPIENT_TYPES.join(', ')}`);
    
    if(!message) throw new Error('message is required');

    if(!isValidNotificationType(type))
        throw new Error(`Invalid notification type. Must be one of: ${VALID_TYPES.join(', ')}`);

    if(!isValidChannel(channel))
        throw new Error(`Invalid channel. Must be one of: ${VALID_CHANNELS.join(', ')}`);


    return {
        recipientId,
        recipientType,
        message,
        type,
        channel,

        // teams cards are never automatically read; emails are always marked as read 
        isRead: channel === 'email',
        relatedQueueId: relatedQueueId || null
    };
};


// parse and validate pagination query parameters, providing defaults if not specified
// @param {Object} query - query parameters from request
// returns { page: number, pageSize: number, skip: number }
const parsePagination = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, paraseInt(query.pageSize, 10) || 30));
    const skip = (page - 1) * pageSize;
    
    return { 
        page, 
        pageSize, 
        skip 
    };
};

const buildFilter = (query, extra = {}) => {
  const filter = { ...extra };

  if (query.type && isValidNotificationType(query.type)) {
    filter.type = query.type;
  }

  if (query.recipientType && isValidRecipientType(query.recipientType)) {
    filter.recipientType = query.recipientType;
  }

  return filter;
};

// project only the fields that get /notification response requires
const NOTIFICATION_LIST_PROJECTION = {
    _id: 1,
    recipientId: 1,
    recipientType: 1,
    type: 1,
    channel: 1,
    isRead: 1,
    createdAt: 1,
};

module.exports = {
    VALID_TYPES,
    VALID_RECIPIENT_TYPES,
    VALID_CHANNELS,
    isValidNotificationType,
    isValidRecipientType,
    isValidChannel,
    buildNotificationPayload,
    parsePagination,
    buildFilter,
    NOTIFICATION_LIST_PROJECTION
};