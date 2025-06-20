const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { checkAndDisableExpiredUsers } = require('./controllers/pppoeController.js');
const pppoeRoutes = require('./routes/pppoeRoutes');
const queueRoutes = require('./routes/queueRoutes');

const app = express();
app.use(cors());
app.use(express.json());

cron.schedule('0 * * * *', () => {
  checkAndDisableExpiredUsers({ query: {} }, {
    json: (msg) => console.log('[ExpiredCheck]', msg),
    status: () => ({ json: () => {} })
  });
});

// Routes
app.use('/api/ppoe', pppoeRoutes);
app.use('/api/queue', queueRoutes);

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
