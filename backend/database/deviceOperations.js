const Device = require('../models/deviceModel');

/**
 * Get all IoT infrastructure nodes
 */
async function getAllDevices() {
    try {
        const devices = await Device.find({});
        console.log('Device data retrieved');
        return devices;
    } catch (err) {
        throw new Error(`Failed to retrieve devices: ${err.message}`);
    }
}

/**
 * Get detailed telemetry for a single device
 */
async function getDeviceById(id) {
    try {
        const device = await Device.findOne({ deviceId: id });
        if (device) console.log(`Device data retrieved for ${id}`);
        return device;
    } catch (err) {
        throw new Error(`Failed to retrieve device ${id}: ${err.message}`);
    }
}

/**
 * Update trust score for a node
 */
async function updateDeviceTrust(deviceId, trustScore) {
    try {
        const updated = await Device.findOneAndUpdate(
            { deviceId },
            { trustScore, lastUpdated: Date.now() },
            { new: true }
        );
        if (updated) console.log(`Device trust score updated for ${deviceId}`);
        return updated;
    } catch (err) {
        throw new Error(`Failed to update trust for ${deviceId}: ${err.message}`);
    }
}

/**
 * Update telemetry features for a node
 */
async function updateDeviceTelemetry(deviceId, telemetryFeatures) {
    try {
        const updated = await Device.findOneAndUpdate(
            { deviceId },
            {
                currentFeatures: telemetryFeatures,
                lastUpdated: Date.now()
            },
            { new: true }
        );
        if (updated) console.log(`Telemetry update received for ${deviceId}`);
        return updated;
    } catch (err) {
        throw new Error(`Failed to update telemetry for ${deviceId}: ${err.message}`);
    }
}

module.exports = {
    getAllDevices,
    getDeviceById,
    updateDeviceTrust,
    updateDeviceTelemetry
};
