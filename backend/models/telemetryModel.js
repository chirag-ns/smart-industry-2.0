const mongoose = require('mongoose');
const mockStore = require('../database/mockStore');

const telemetrySchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    src_ip: String,
    dst_ip: String,
    protocol: String,
    bytes: Number,
    packet_count: Number
});

const MongooseTelemetry = mongoose.models.Telemetry || mongoose.model('Telemetry', telemetrySchema);

class TelemetryDocument {
    constructor(data) {
        Object.assign(this, data);
        if (!this.timestamp) this.timestamp = new Date();
    }
}

class MockQuery {
    constructor(operation, query) {
        this.operation = operation;
        this.query = query;
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
        let results = [...mockStore.telemetry];
        
        if (this.query && typeof this.query === 'object') {
            results = results.filter(t => {
                for (let key in this.query) {
                    if (this.query[key] !== t[key]) return false;
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

        return results.map(t => new TelemetryDocument(t));
    }

    then(onFulfilled, onRejected) {
        return this.exec().then(onFulfilled, onRejected);
    }
}

const MockTelemetryModel = {
    find: (query = {}) => {
        return new MockQuery('find', query);
    },

    create: async (data) => {
        const record = new TelemetryDocument(data);
        mockStore.telemetry.push(record);
        if (mockStore.telemetry.length > 1000) {
            mockStore.telemetry.shift();
        }
        return record;
    }
};

const TelemetryProxy = {
    find: (query) => {
        if (process.env.DB_MODE === 'mock') return MockTelemetryModel.find(query);
        return MongooseTelemetry.find(query);
    },
    create: (data) => {
        if (process.env.DB_MODE === 'mock') return MockTelemetryModel.create(data);
        return MongooseTelemetry.create(data);
    }
};

module.exports = TelemetryProxy;
