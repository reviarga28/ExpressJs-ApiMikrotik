const mikrotik = require('../services/mikrotikClient');

exports.getInterfaceTraffic = async (req, res) => {
  const { interfaceName } = req.params;

  try {
    await mikrotik.connect();
    const traffic = await mikrotik.write('/interface/monitor-traffic', [
      `=interface=${interfaceName}`,
      `=once=`
    ]);
    await mikrotik.close();

    res.json(traffic[0]); // TX, RX, packet info
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
