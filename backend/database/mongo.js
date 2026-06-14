const mongoose = require('mongoose');

const connectDB = async () => {
    if (process.env.DB_MODE === 'mock') {
        console.log('🔌 Using OrbitGuard in-memory database mock (MongoDB bypassed)');
        return Promise.resolve();
    }

    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Orbitguard';
    try {
        // Attempt connecting to live MongoDB database
        await mongoose.connect(mongoURI);
        console.log(`🔌 MongoDB Connected successfully to: ${mongoURI}`);
        process.env.DB_MODE = 'mongo';
    } catch (err) {
        console.warn('⚠️  MongoDB connection failed! Falling back to in-memory database mock...');
        console.warn(`Reason: ${err.message}`);
        process.env.DB_MODE = 'mock';
    }
};

module.exports = connectDB;
