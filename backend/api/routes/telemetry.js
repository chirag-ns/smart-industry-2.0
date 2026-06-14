const express = require('express');
const router = express.Router();
const Device = require('../../models/deviceModel');

/**
 * @route   GET /telemetry
 * @desc    Get latest telemetry snapshot for the whole network
 */
router.get('/telemetry', async (req, res) => {
    try {
        // In a production app, we might query a separate Telemetry collection
        // For the hackathon, we return the aggregated state from all devices
        const devices = await Device.find({}, 'deviceId currentFeatures trustScore status');
        res.json({
            timestamp: Date.now(),
            active_nodes: devices.length,
            network_snapshot: devices
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * @route   POST /simulate_attack
 * @desc    Trigger behavioral drift for hackathon demonstration
 */
router.post('/simulate_attack', async (req, res) => {
    const { deviceId } = req.body;

    try {
        const device = await Device.findOne({ deviceId });
        if (!device) return res.status(404).json({ message: 'Device not found' });

        // Simulate massive traffic spike and unauthorized endpoints
        device.currentFeatures.traffic_rate = device.baselineFeatures.traffic_rate * 5;
        device.currentFeatures.unique_endpoints += 10;
        device.status = 'drift';
        device.trustScore = Math.max(0, device.trustScore - 40);

        await device.save();

        res.json({
            message: `Attack simulation triggered on ${device.deviceName}`,
            current_status: device.status,
            new_trust_score: device.trustScore
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
