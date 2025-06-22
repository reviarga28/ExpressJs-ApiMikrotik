const express = require('express');
const router = express.Router();
const { pollLogs } = require('../controllers/logController');

router.get('/poll', pollLogs); // GET /api/logs/poll

module.exports = router;
