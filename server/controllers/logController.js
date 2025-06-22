const { RouterOSAPI } = require('node-routeros');

exports.pollLogs = async (req, res) => {
  const conn = new RouterOSAPI({
    host: '192.168.56.1', // Ganti dengan IP Mikrotik
    user: 'admin',
    password: 'admin',
    port: 8728,
  });

  try {
    await conn.connect();

    // Ambil semua log
    const logs = await conn.write('/log/print');

    await conn.close();

    // Batasi manual di backend (ambil 20 terakhir)
    const recentLogs = logs.slice(-20).reverse(); // dari paling baru ke lama

    res.json(recentLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};