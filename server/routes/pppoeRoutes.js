const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  addUser,
  deleteUser,
  getActiveUsers,
  getUserByName,
  updateUser
} = require('../controllers/pppoeController');

router.get('/users', getAllUsers);
router.post('/users', addUser);           // POST /api/pppoe/users
router.delete('/users/:name', deleteUser); // DELETE /api/pppoe/users/:name
router.get('/active', getActiveUsers);    // GET /api/pppoe/active
router.get('/users/:name', getUserByName);   // GET user by name
router.patch('/users/:name', updateUser);    // UPDATE user PPPoE


module.exports = router;
