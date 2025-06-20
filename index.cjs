const express = require('express');
const cors = require('cors');
const { RouterOSAPI } = require('node-routeros');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const mikrotikConfig = {
  host: '192.168.56.1',
  user: 'admin',
  password: 'admin',
  port: 8728,
};

app.get('/api/hotspot-users', async (req, res) => {
  const conn = new RouterOSAPI(mikrotikConfig);
  try {
    await conn.connect();
    const users = await conn.write('/ip/hotspot/user/print');
    res.json(users);
    await conn.close();
  } catch (err) {
    console.error('Mikrotik error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/hotspot-users', async (req, res) => {
  const { name, password, profile } = req.body;

  if (!name || !password || !profile) {
    return res.status(400).json({ error: 'name, password, and profile are required' });
  }

  const conn = new RouterOSAPI(mikrotikConfig);

  try {
    await conn.connect();
    const result = await conn.write('/ip/hotspot/user/add', [
      `=name=${name}`,
      `=password=${password}`,
      `=profile=${profile}`
    ]);
    res.status(201).json({ message: 'User added successfully', result });
    await conn.close();
  } catch (err) {
    console.error('Error adding hotspot user:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`API server running at http://localhost:${port}`);
});
