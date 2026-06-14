const express = require('express');
const cors = require('cors');
const connectDB = require('../database/mongo');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Load Routes
const isolateRoutes = require("./routes/isolate");
app.use("/security", isolateRoutes);
const deviceRoutes = require("./routes/device");
app.use("/device", deviceRoutes);
app.use('/devices', require('./routes/devices'));
app.use('/attack', require('./routes/attack'));
const attackGraphRoutes = require("./routes/attackGraph");
app.use("/attack", attackGraphRoutes);
const alertRoutes = require("./routes/alerts");
app.use("/alerts", alertRoutes);
app.use('/', require('./routes/telemetry'));
app.use('/ai', require('./routes/ai'));

// Root Endpoint
app.get('/', (req, res) => {
    res.json({ message: 'OrbitGuard API Layer Active', status: 'Healthy' });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Connect to Database then Initialize Server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 OrbitGuard API Server running on port ${PORT}`);
        
        // Start background IoT telemetry simulation and AI analytics cycle
        const { startSimulation } = require('../ai-engine/node_simulator');
        startSimulation();
    });
});
