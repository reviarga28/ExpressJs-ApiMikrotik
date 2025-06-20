const { RouterOSAPI } = require('node-routeros');

const mikrotik = new RouterOSAPI({
  host: '192.168.56.1', // Ganti sesuai IP Mikrotik kamu
  user: 'admin',
  password: 'admin',
  port: 8728,
});

module.exports = mikrotik;
