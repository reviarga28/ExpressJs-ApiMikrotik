const mikrotik = require('../services/mikrotikClient');

exports.getAllUsers = async (req, res) => {
  try {
    await mikrotik.connect();
    const users = await mikrotik.write('/ppp/secret/print');
    await mikrotik.close();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getUserByName = async (req, res) => {
  const { name } = req.params;
  try {
    await mikrotik.connect();
    const users = await mikrotik.write('/ppp/secret/print');
    await mikrotik.close();

    const user = users.find(u => u.name === name);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.addUser = async (req, res) => {
  const {
    name,
    password,
    profile = 'default',
    maxLimit = '2M/2M',
    expiredAt
  } = req.body;

  const ipBase = '192.168.56';
  const ipStart = 10;
  const ipEnd = 254;

  try {
    await mikrotik.connect();

    const existingUsers = await mikrotik.write('/ppp/secret/print');
    const existingQueues = await mikrotik.write('/queue/simple/print');

    // Cek user duplikat
    const duplicateUser = existingUsers.find(u => u.name === name);
    if (duplicateUser) {
      await mikrotik.close();
      return res.status(400).json({ error: 'User PPPoE sudah ada' });
    }

    // Ambil semua IP yang sudah digunakan oleh user atau queue
    const usedIPs = new Set([
      ...existingUsers.map(u => u['remote-address']),
      ...existingQueues.map(q => q.target && q.target.split('/')[0])
    ]);

    // Cari IP yang belum dipakai
    let availableIP = null;
    for (let i = ipStart; i <= ipEnd; i++) {
      const candidate = `${ipBase}.${i}`;
      if (!usedIPs.has(candidate)) {
        availableIP = candidate;
        break;
      }
    }

    if (!availableIP) {
      await mikrotik.close();
      return res.status(400).json({ error: 'Tidak ada IP tersedia' });
    }

    const comment = expiredAt ? `expired:${expiredAt}` : '';
    const localAddress = `${ipBase}.1`;

    // Tambah user
    await mikrotik.write('/ppp/secret/add', [
      `=name=${name}`,
      `=password=${password}`,
      `=profile=${profile}`,
      `=remote-address=${availableIP}`,
      `=local-address=${localAddress}`,
      `=comment=${comment}`,
      `=service=pppoe`,
    ]);

    // Tambah queue
    await mikrotik.write('/queue/simple/add', [
      `=name=${name}`,
      `=target=${availableIP}`,
      `=max-limit=${maxLimit}`
    ]);

    await mikrotik.close();
    res.status(201).json({ message: 'User dan Queue berhasil ditambahkan', ip: availableIP });
  } catch (err) {
    await mikrotik.close();
    res.status(500).json({ error: err.message });
  }
};


// Endpoint untuk memeriksa dan menonaktifkan user yang expired
exports.checkAndDisableExpiredUsers = async (req, res) => {
  try {
    await mikrotik.connect();
    const users = await mikrotik.write('/ppp/secret/print');

    const now = new Date();
    const expiredUsers = users.filter(user => {
      if (!user.comment || !user.comment.includes('expired:')) return false;
      const dateStr = user.comment.split('expired:')[1];
      const expDate = new Date(dateStr);
      return now >= expDate && user.disabled !== 'true';
    });

    for (const user of expiredUsers) {
      await mikrotik.write('/ppp/secret/set', [
        `=.id=${user[".id"]}`,
        `=disabled=yes`
      ]);
    }

    await mikrotik.close();
    res.json({ message: 'Expired users disabled', count: expiredUsers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



exports.updateUser = async (req, res) => {
  const { name } = req.params;
  const updateFields = req.body;

  try { 
    await mikrotik.connect();
    const users = await mikrotik.write('/ppp/secret/print');
    const user = users.find(u => u.name === name);

    if (!user) {
      await mikrotik.close();
      return res.status(404).json({ error: 'User not found' });
    }

    const payload = [`=.id=${user[".id"]}`];
    for (const key in updateFields) {
      payload.push(`=${key}=${updateFields[key]}`);
    }

    const result = await mikrotik.write('/ppp/secret/set', payload);
    await mikrotik.close();
    res.json({ message: 'User updated', result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  const { name } = req.params;
  try {
    await mikrotik.connect();
    const users = await mikrotik.write('/ppp/secret/print');
    const target = users.find(u => u.name === name);

    if (!target) {
      await mikrotik.close();
      return res.status(404).json({ error: 'User not found' });
    }

    await mikrotik.write('/ppp/secret/remove', [`=.id=${target['.id']}`]);
    await mikrotik.close();
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getActiveUsers = async (req, res) => {
  try {
    await mikrotik.connect();
    const active = await mikrotik.write('/ppp/active/print');
    await mikrotik.close();
    res.json(active);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
