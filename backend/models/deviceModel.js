const mongoose = require('mongoose');
const mockStore = require('../database/mockStore');

// 1. Define standard Mongoose Schema (for MongoDB Mode)
const DeviceSchema = new mongoose.Schema({
    deviceId: { type: String, required: true, unique: true },
    deviceName: { type: String, required: true },
    deviceType: { type: String, required: true },
    ipAddress: { type: String, required: true },
    trustScore: { type: Number, default: 100, min: 0, max: 100 },
    status: { type: String, enum: ['secure', 'drift', 'compromised', 'isolated'], default: 'secure' },

    baselineFeatures: {
        traffic_rate: { type: Number, default: 0 },
        unique_endpoints: { type: Number, default: 0 },
        protocol_entropy: { type: Number, default: 0 },
        packet_variance: { type: Number, default: 0 }
    },

    currentFeatures: {
        traffic_rate: { type: Number, default: 0 },
        unique_endpoints: { type: Number, default: 0 },
        protocol_entropy: { type: Number, default: 0 },
        packet_variance: { type: Number, default: 0 }
    },

    policyRules: {
        allowed_ips: [String],
        allowed_protocols: [String],
        max_traffic_mbps: Number
    },

    compromised: { type: Boolean, default: false },
    isolated: { type: Boolean, default: false },
    aiReasoning: { type: mongoose.Schema.Types.Mixed },
    lastUpdated: { type: Date, default: Date.now }
});

const MongooseDevice = mongoose.models.Device || mongoose.model('Device', DeviceSchema);

// 2. Define Mock Device Document (for Mock Mode)
class DeviceDocument {
    constructor(data) {
        Object.assign(this, data);
    }
    
    async save() {
        const index = mockStore.devices.findIndex(d => d.deviceId === this.deviceId);
        if (index !== -1) {
            mockStore.devices[index] = {
                ...mockStore.devices[index],
                ...this,
                lastUpdated: new Date()
            };
        } else {
            mockStore.devices.push({
                ...this,
                lastUpdated: new Date()
            });
        }
        return this;
    }
}

class MockQuery {
    constructor(operation, query, projection = null) {
        this.operation = operation;
        this.query = query;
        this.projection = projection;
        this._sort = null;
        this._limit = null;
    }

    sort(sortObj) {
        this._sort = sortObj;
        return this;
    }

    limit(limitVal) {
        this._limit = limitVal;
        return this;
    }

    async exec() {
        let results = [...mockStore.devices];
        
        if (this.query && typeof this.query === 'object') {
            results = results.filter(d => {
                for (let key in this.query) {
                    if (this.query[key] !== d[key]) return false;
                }
                return true;
            });
        }

        if (this._sort) {
            const sortKey = Object.keys(this._sort)[0];
            const sortDirection = this._sort[sortKey];
            results.sort((a, b) => {
                let valA = a[sortKey];
                let valB = b[sortKey];
                if (valA instanceof Date) valA = valA.getTime();
                if (valB instanceof Date) valB = valB.getTime();
                if (valA < valB) return -1 * sortDirection;
                if (valA > valB) return 1 * sortDirection;
                return 0;
            });
        }

        if (this._limit !== null) {
            results = results.slice(0, this._limit);
        }

        if (this.projection) {
            const fields = this.projection.split(' ').map(f => f.trim()).filter(Boolean);
            results = results.map(d => {
                const projected = {};
                fields.forEach(f => {
                    projected[f] = d[f];
                });
                return projected;
            });
        }

        if (this.operation === 'findOne') {
            if (results.length === 0) return null;
            return new DeviceDocument(results[0]);
        }

        return results.map(d => new DeviceDocument(d));
    }

    then(onFulfilled, onRejected) {
        return this.exec().then(onFulfilled, onRejected);
    }
}

const MockDeviceModel = {
    find: (query = {}, projection = null) => {
        return new MockQuery('find', query, projection);
    },

    findOne: (query = {}) => {
        return new MockQuery('findOne', query);
    },

    findOneAndUpdate: async (query = {}, update = {}, options = {}) => {
        const device = await MockDeviceModel.findOne(query);
        if (!device) return null;

        if (update.$set) {
            Object.assign(device, update.$set);
        } else {
            Object.assign(device, update);
        }
        
        await device.save();
        return device;
    },

    updateOne: async (query = {}, update = {}) => {
        const device = await MockDeviceModel.findOne(query);
        if (!device) return { nModified: 0 };
        
        if (update.$set) {
            Object.assign(device, update.$set);
        } else {
            Object.assign(device, update);
        }
        
        await device.save();
        return { nModified: 1 };
    },

    updateMany: async (query = {}, update = {}) => {
        const devices = await MockDeviceModel.find(query);
        for (let d of devices) {
            if (update.$set) {
                Object.assign(d, update.$set);
            } else {
                Object.assign(d, update);
            }
            await d.save();
        }
        return { nModified: devices.length };
    },

    countDocuments: async (query = {}) => {
        const devices = await MockDeviceModel.find(query);
        return devices.length;
    }
};

// 3. Dynamic Dispatch Proxy (Dispatches calls dynamically based on DB_MODE)
const DeviceProxy = {
    find: (query, projection) => {
        if (process.env.DB_MODE === 'mock') return MockDeviceModel.find(query, projection);
        return MongooseDevice.find(query, projection);
    },
    findOne: (query) => {
        if (process.env.DB_MODE === 'mock') return MockDeviceModel.findOne(query);
        return MongooseDevice.findOne(query);
    },
    findOneAndUpdate: (query, update, options) => {
        if (process.env.DB_MODE === 'mock') return MockDeviceModel.findOneAndUpdate(query, update, options);
        return MongooseDevice.findOneAndUpdate(query, update, options);
    },
    updateOne: (query, update, options) => {
        if (process.env.DB_MODE === 'mock') return MockDeviceModel.updateOne(query, update, options);
        return MongooseDevice.updateOne(query, update, options);
    },
    updateMany: (query, update, options) => {
        if (process.env.DB_MODE === 'mock') return MockDeviceModel.updateMany(query, update, options);
        return MongooseDevice.updateMany(query, update, options);
    },
    countDocuments: (query) => {
        if (process.env.DB_MODE === 'mock') return MockDeviceModel.countDocuments(query);
        return MongooseDevice.countDocuments(query);
    }
};

module.exports = DeviceProxy;
