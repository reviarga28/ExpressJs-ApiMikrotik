const express = require('express');
const router = express.Router();
const {
  getAllQueues,
  getQueueByName,
  addQueue,
  updateQueueLimit,
  deleteQueue,
} = require('../controllers/queueController');

router.get('/', getAllQueues);
router.post('/', addQueue);
router.patch('/:name', updateQueueLimit);
router.delete('/:name', deleteQueue);
router.get('/:name', getQueueByName);


module.exports = router;
