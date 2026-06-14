const express = require('express');
const router = express.Router();
const { getAllDevices, getDeviceById } = require('../../database/deviceOperations');

/**
 * @route   GET /devices
 * @desc    Get all monitored IoT devices
 */
router.get('/', async (req, res) => {
    try {
        const devices = await getAllDevices();
        // Return structured list with all necessary fields for dashboard
        const summary = devices.map(d => ({
            deviceId: d.deviceId,
            deviceName: d.deviceName,
            deviceType: d.deviceType,
            trustScore: d.trustScore,
            status: d.status,
            lastUpdated: d.lastUpdated,
            currentFeatures: d.currentFeatures,
            baselineFeatures: d.baselineFeatures
        }));
        res.json(summary);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve devices', message: err.message });
    }
});

/**
 * @route   GET /devices/:id
 * @desc    Get detailed analytics for a single device
 */
router.get('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const device = await getDeviceById(id);
        if (!device) {
            return res.status(404).json({ error: 'Device not found' });
        }
        res.json(device);
    } catch (err) {
        res.status(500).json({ error: 'Failed to retrieve device details', message: err.message });
    }
});

module.exports = router;
