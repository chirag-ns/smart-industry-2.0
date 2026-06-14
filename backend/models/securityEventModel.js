const mongoose = require('mongoose');
const mockStore = require('../database/mockStore');

const securityEventSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    type: String,
    severity: String,
    description: String
});

const MongooseSecurityEvent = mongoose.models.SecurityEvent || mongoose.model('SecurityEvent', securityEventSchema);

class SecurityEventDocument {
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
        let results = [...mockStore.securityEvents];
        
        if (this.query && typeof this.query === 'object') {
            results = results.filter(e => {
                for (let key in this.query) {
                    if (this.query[key] !== e[key]) return false;
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

        return results.map(e => new SecurityEventDocument(e));
    }

    then(onFulfilled, onRejected) {
        return this.exec().then(onFulfilled, onRejected);
    }
}

const MockSecurityEventModel = {
    find: (query = {}) => {
        return new MockQuery('find', query);
    },

    create: async (data) => {
        const newEvent = new SecurityEventDocument(data);
        mockStore.securityEvents.push(newEvent);
        return newEvent;
    }
};

const SecurityEventProxy = {
    find: (query) => {
        if (process.env.DB_MODE === 'mock') return MockSecurityEventModel.find(query);
        return MongooseSecurityEvent.find(query);
    },
    create: (data) => {
        if (process.env.DB_MODE === 'mock') return MockSecurityEventModel.create(data);
        return MongooseSecurityEvent.create(data);
    }
};

module.exports = SecurityEventProxy;
