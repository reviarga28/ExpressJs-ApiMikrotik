const express = require('express');
const router = express.Router();
const {
  getInterfaceTraffic,
} = require('../controllers/interfaceController.js');

router.get('/traffic/:interfaceName', getInterfaceTraffic);

module.exports = router;