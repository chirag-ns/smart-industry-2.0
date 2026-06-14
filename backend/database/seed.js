const mongoose = require('mongoose');
const Device = require('../models/deviceModel');
require('dotenv').config();

const INITIAL_DEVICES = [
    {
        deviceId: "node-cctv",
        deviceName: "CCTV Security Camera",
        deviceType: "CCTV",
        ipAddress: "172.16.0.2",
        baselineFeatures: { traffic_rate: 20000, unique_endpoints: 1, protocol_entropy: 0.2, packet_variance: 500 },
        policyRules: { allowed_ips: ["172.16.0.4", "10.0.0.1"], allowed_protocols: ["TCP", "HTTP", "RTSP"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 98,
        compromised: false
    },
    {
        deviceId: "node-sensor",
        deviceName: "Smart Env Sensor",
        deviceType: "Sensor",
        ipAddress: "172.16.0.3",
        baselineFeatures: { traffic_rate: 800, unique_endpoints: 1, protocol_entropy: 0.1, packet_variance: 40 },
        policyRules: { allowed_ips: ["172.16.0.4"], allowed_protocols: ["UDP", "MQTT"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 99,
        compromised: false
    },
    {
        deviceId: "node-wifi",
        deviceName: "Enterprise WiFi AP",
        deviceType: "WiFi AP",
        ipAddress: "172.16.0.4",
        baselineFeatures: { traffic_rate: 400000, unique_endpoints: 15, protocol_entropy: 1.2, packet_variance: 2000 },
        policyRules: { allowed_ips: [], allowed_protocols: ["TCP", "UDP"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 94,
        compromised: false
    },
    {
        deviceId: "node-gateway",
        deviceName: "Edge Gateway",
        deviceType: "Edge Gateway",
        ipAddress: "172.16.0.1",
        baselineFeatures: { traffic_rate: 800000, unique_endpoints: 30, protocol_entropy: 1.5, packet_variance: 4000 },
        policyRules: { allowed_ips: [], allowed_protocols: ["TCP", "UDP", "HTTP", "MQTT"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 96,
        compromised: false
    },
    {
        deviceId: "node-access",
        deviceName: "IoT Access Controller",
        deviceType: "service",
        ipAddress: "172.16.0.5",
        baselineFeatures: { traffic_rate: 25000, unique_endpoints: 5, protocol_entropy: 0.3, packet_variance: 500 },
        policyRules: { allowed_ips: ["172.16.0.1"], allowed_protocols: ["TCP", "HTTPS"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 95,
        compromised: false
    },
    {
        deviceId: "node-cache",
        deviceName: "Edge Cache",
        deviceType: "service",
        ipAddress: "172.16.0.6",
        baselineFeatures: { traffic_rate: 850000, unique_endpoints: 2, protocol_entropy: 0.1, packet_variance: 2000 },
        policyRules: { allowed_ips: ["172.16.0.1"], allowed_protocols: ["HTTP"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 97,
        compromised: false
    },
    {
        deviceId: "node-db",
        deviceName: "IoT Data Storage Node",
        deviceType: "database",
        ipAddress: "172.16.0.7",
        baselineFeatures: { traffic_rate: 45000, unique_endpoints: 4, protocol_entropy: 0.2, packet_variance: 800 },
        policyRules: { allowed_ips: ["172.16.0.1"], allowed_protocols: ["TCP"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 98,
        compromised: false
    },
    {
        deviceId: "node-edge-ai",
        deviceName: "Edge AI Analyzer",
        deviceType: "service",
        ipAddress: "172.16.0.8",
        baselineFeatures: { traffic_rate: 110000, unique_endpoints: 3, protocol_entropy: 0.5, packet_variance: 1500 },
        policyRules: { allowed_ips: ["172.16.0.1"], allowed_protocols: ["TCP"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 96,
        compromised: false
    },
    {
        deviceId: "node-operator",
        deviceName: "Operator Terminal",
        deviceType: "Operator Terminal",
        ipAddress: "172.16.0.9",
        baselineFeatures: { traffic_rate: 8000, unique_endpoints: 1, protocol_entropy: 0.1, packet_variance: 400 },
        policyRules: { allowed_ips: ["172.16.0.1"], allowed_protocols: ["TCP", "HTTPS"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 93,
        compromised: false
    },
    {
        deviceId: "node-cloud-ai",
        deviceName: "Cloud AI Detection Engine",
        deviceType: "cloud",
        ipAddress: "10.0.0.1",
        baselineFeatures: { traffic_rate: 350000, unique_endpoints: 12, protocol_entropy: 0.8, packet_variance: 3000 },
        policyRules: { allowed_ips: ["172.16.0.8"], allowed_protocols: ["HTTPS"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 99,
        compromised: false
    }
];

const seedDB = async () => {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/Orbitguard';

    try {
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB for final stabilized restoration...');

        await Device.deleteMany({});
        await Device.insertMany(INITIAL_DEVICES);
        console.log('✅ Final 10 IoT Nodes seeded.');

        const telemetryCollection = mongoose.connection.db.collection('telemetry');
        await telemetryCollection.deleteMany({});
        console.log('✅ Telemetry cleared for fresh run.');

        console.log('🚀 OrbitGuard Final Stabilization Complete!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Stabilization Failed:', err);
        process.exit(1);
    }
};

seedDB();
