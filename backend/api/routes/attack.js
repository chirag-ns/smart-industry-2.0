const express = require('express');
const router = express.Router();
const Device = require('../../models/deviceModel');
const sendAlert = require("../../services/alertSMS");

/**
 * @route   POST /attack/simulate
 * @desc    Trigger compromise on a specific device
 */
router.post('/simulate', async (req, res) => {
    const { deviceId } = req.body;

    try {
        const device = await Device.findOne({ deviceId });
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }

        // Set compromised flag
        device.compromised = true;
        device.status = 'compromised';
        device.trustScore = Math.floor(Math.random() * 20) + 10; // Instantly drop to 10-30
        device.lastUpdated = Date.now();

        await device.save();

        console.log(`⚠️  Attack simulated on ${deviceId}`);
        
        // Send SMS alert via Fast2SMS
        sendAlert(`OrbitGuard Alert\nDevice: ${device.deviceName}\nThreat: Behavioral anomaly detected\nTrust Score dropped below threshold.`);

        res.json({
            message: `Attack successfully triggered on ${device.deviceName}`,
            deviceId: device.deviceId,
            status: device.status,
            trustScore: device.trustScore
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error during attack simulation', message: err.message });
    }
});

/**
 * @route   POST /attack/reset
 * @desc    Reset all devices to secure state
 */
router.post('/reset', async (req, res) => {
    try {
        await Device.updateMany({}, {
            compromised: false,
            status: 'secure',
            trustScore: 98,
            lastUpdated: Date.now()
        });

        console.log('✅ All devices reset to secure state');
        res.json({ message: 'System status restored to SECURE' });
    } catch (err) {
        res.status(500).json({ error: 'Reset failed' });
    }
});

module.exports = router;
