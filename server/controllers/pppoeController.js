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
    'remote-address': remoteAddress,
    maxLimit = '1M/1M',
    expiredAt
  } = req.body;

  if (!remoteAddress) {
    return res.status(400).json({ error: 'remote-address (IP) wajib diisi' });
  }

  try {
    await mikrotik.connect();

    // Cek user duplikat
    const existingUsers = await mikrotik.write('/ppp/secret/print');
    const duplicateUser = existingUsers.find(u => u.name === name);
    if (duplicateUser) {
      await mikrotik.close();
      return res.status(400).json({ error: 'User PPPoE sudah ada' });
    }

    // Cek IP address sudah digunakan
    const ipUsed = existingUsers.find(u => u['remote-address'] === remoteAddress);
    if (ipUsed) {
      await mikrotik.close();
      return res.status(400).json({ error: 'IP address sudah digunakan oleh user lain' });
    }

    // Cek queue duplikat
    const existingQueues = await mikrotik.write('/queue/simple/print');
    const duplicateQueue = existingQueues.find(q => q.name === name || q.target?.includes(remoteAddress));
    if (duplicateQueue) {
      await mikrotik.close();
      return res.status(400).json({ error: 'Queue dengan nama atau IP tersebut sudah ada' });
    }

    const comment = expiredAt ? `expired:${expiredAt}` : '';

    // Tambah user
    await mikrotik.write('/ppp/secret/add', [
      `=name=${name}`,
      `=password=${password}`,
      `=profile=${profile}`,
      `=remote-address=${remoteAddress}`,
      `=comment=${comment}`,
      `=service=pppoe`,
    ]);

    // Tambah queue otomatis
    await mikrotik.write('/queue/simple/add', [
      `=name=${name}`,
      `=target=${remoteAddress}`,
      `=max-limit=${maxLimit}`
    ]);

    await mikrotik.close();
    res.status(201).json({ message: 'User dan Queue berhasil ditambahkan' });
  } catch (err) {
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
