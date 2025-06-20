const mikrotik = require('../services/mikrotikClient');

exports.getAllQueues = async (req, res) => {
  try {
    await mikrotik.connect();
    const queues = await mikrotik.write('/queue/simple/print');
    await mikrotik.close();
    res.json(queues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getQueueByName = async (req, res) => {
  const { name } = req.params;
  try {
    await mikrotik.connect();
    const queues = await mikrotik.write('/queue/simple/print');
    await mikrotik.close();

    const queue = queues.find(q => q.name === name);
    if (!queue) return res.status(404).json({ error: 'Queue not found' });

    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.addQueue = async (req, res) => {
  const { name, target, maxLimit = '1M/1M' } = req.body;
  try {
    await mikrotik.connect();
    const result = await mikrotik.write('/queue/simple/add', [
      `=name=${name}`,
      `=target=${target}`,
      `=max-limit=${maxLimit}`,
    ]);
    await mikrotik.close();
    res.status(201).json({ message: 'Queue added', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.updateQueueLimit = async (req, res) => {
  const { name } = req.params;
  const { maxLimit, target, interface: iface } = req.body;

  try {
    await mikrotik.connect();
    const queues = await mikrotik.write('/queue/simple/print');
    const queue = queues.find(q => q.name === name);

    if (!queue) {
      await mikrotik.close();
      return res.status(404).json({ error: 'Queue not found' });
    }

    const payload = [`=.id=${queue[".id"]}`];

    if (maxLimit) payload.push(`=max-limit=${maxLimit}`);
    if (target) payload.push(`=target=${target}`);
    if (iface) payload.push(`=interface=${iface}`); // optional

    const result = await mikrotik.write('/queue/simple/set', payload);
    await mikrotik.close();
    res.json({ message: 'Queue updated', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.deleteQueue = async (req, res) => {
  const { name } = req.params;

  try {
    await mikrotik.connect();
    const queues = await mikrotik.write('/queue/simple/print');
    const target = queues.find(q => q.name === name);

    if (!target) {
      await mikrotik.close();
      return res.status(404).json({ error: 'Queue not found' });
    }

    const result = await mikrotik.write('/queue/simple/remove', [
      `=.id=${target['.id']}`,
    ]);
    await mikrotik.close();
    res.json({ message: 'Queue deleted', result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
