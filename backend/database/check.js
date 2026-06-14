const mongoose = require('mongoose');
const Device = require('../models/deviceModel');
require('dotenv').config();

const checkDB = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Orbitguard';
    try {
        await mongoose.connect(mongoURI);
        console.log('Checking database:', mongoose.connection.name);
        const count = await Device.countDocuments({});
        console.log('Device count:', count);
        const all = await Device.find({});
        console.log('Devices:', JSON.stringify(all, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkDB();
