const {
  getQueueByFaculty,
  createQueueEntry,
  cancelQueueEntry,
  updateQueueStatus,
  assignQueueRoom
} = require('../services/queue.service');

async function getQueue(req, res) {
  const { id } = req.params;
  const { status } = req.query;

  const result = await getQueueByFaculty(id, status);
  return res.status(200).json(result);
}

async function createQueue(req, res) {
  const { id } = req.params;
  const result = await createQueueEntry(id, req.body);
  return res.status(201).json(result);
}

async function cancelQueue(req, res) {
  const { facultyId, queueId } = req.params;
  const { accessKey } = req.body || {};

  const result = await cancelQueueEntry(facultyId, queueId, accessKey);
  return res.status(200).json(result);
}

async function updateQueue(req, res) {
  const { facultyId, queueId } = req.params;
  const { status, rejectionReason } = req.body || {};

  const result = await updateQueueStatus(
    facultyId,
    queueId,
    status,
    rejectionReason
  );

  return res.status(200).json(result);
}

async function assignRoom(req, res) {
  const { facultyId, queueId } = req.params;
  const { roomId, approvalRole, strandHeadApproval, rejectionReason } = req.body || {};

  const result = await assignQueueRoom(
    facultyId,
    queueId,
    { roomId, approvalRole, strandHeadApproval, rejectionReason },
    req.user
  );

  return res.status(200).json(result);
}

module.exports = {
  getQueue,
  createQueue,
  cancelQueue,
  updateQueue,
  assignRoom
};
