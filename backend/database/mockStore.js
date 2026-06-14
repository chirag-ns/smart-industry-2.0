const INITIAL_DEVICES = [
    {
        deviceId: "node-cctv",
        deviceName: "CCTV Security Camera",
        deviceType: "CCTV",
        ipAddress: "172.16.0.2",
        baselineFeatures: { traffic_rate: 20000, unique_endpoints: 1, protocol_entropy: 0.2, packet_variance: 500 },
        currentFeatures: { traffic_rate: 20000, unique_endpoints: 1, protocol_entropy: 0.2, packet_variance: 500 },
        policyRules: { allowed_ips: ["172.16.0.4", "10.0.0.1"], allowed_protocols: ["TCP", "HTTP", "RTSP"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 98,
        compromised: false,
        isolated: false,
        aiReasoning: {
            confidence: 95,
            severity: "INFO",
            analysis: "The CCTV Security Camera is currently operating within expected behavioral parameters.\n\nNetwork telemetry shows stable traffic patterns consistent with historical baseline behavior.",
            threat_type: "None"
        },
        lastUpdated: new Date()
    },
    {
        deviceId: "node-sensor",
        deviceName: "Smart Env Sensor",
        deviceType: "Sensor",
        ipAddress: "172.16.0.3",
        baselineFeatures: { traffic_rate: 800, unique_endpoints: 1, protocol_entropy: 0.1, packet_variance: 40 },
        currentFeatures: { traffic_rate: 800, unique_endpoints: 1, protocol_entropy: 0.1, packet_variance: 40 },
        policyRules: { allowed_ips: ["172.16.0.4"], allowed_protocols: ["UDP", "MQTT"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 99,
        compromised: false,
        isolated: false,
        aiReasoning: {
            confidence: 95,
            severity: "INFO",
            analysis: "The Smart Env Sensor is operating within normal baseline limits.",
            threat_type: "None"
        },
        lastUpdated: new Date()
    },
    {
        deviceId: "node-wifi",
        deviceName: "Enterprise WiFi AP",
        deviceType: "WiFi AP",
        ipAddress: "172.16.0.4",
        baselineFeatures: { traffic_rate: 400000, unique_endpoints: 15, protocol_entropy: 1.2, packet_variance: 2000 },
        currentFeatures: { traffic_rate: 400000, unique_endpoints: 15, protocol_entropy: 1.2, packet_variance: 2000 },
        policyRules: { allowed_ips: [], allowed_protocols: ["TCP", "UDP"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 94,
        compromised: false,
        isolated: false,
        aiReasoning: {
            confidence: 95,
            severity: "INFO",
            analysis: "The Enterprise WiFi AP shows high throughput but matches baseline entropy and variance.",
            threat_type: "None"
        },
        lastUpdated: new Date()
    },
    {
        deviceId: "node-gateway",
        deviceName: "Edge Gateway",
        deviceType: "Edge Gateway",
        ipAddress: "172.16.0.1",
        baselineFeatures: { traffic_rate: 800000, unique_endpoints: 30, protocol_entropy: 1.5, packet_variance: 4000 },
        currentFeatures: { traffic_rate: 800000, unique_endpoints: 30, protocol_entropy: 1.5, packet_variance: 4000 },
        policyRules: { allowed_ips: [], allowed_protocols: ["TCP", "UDP", "HTTP", "MQTT"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 96,
        compromised: false,
        isolated: false,
        aiReasoning: {
            confidence: 95,
            severity: "INFO",
            analysis: "The Edge Gateway is processing routing queries normally.",
            threat_type: "None"
        },
        lastUpdated: new Date()
    },
    {
        deviceId: "node-access",
        deviceName: "IoT Access Controller",
        deviceType: "service",
        ipAddress: "172.16.0.5",
        baselineFeatures: { traffic_rate: 25000, unique_endpoints: 5, protocol_entropy: 0.3, packet_variance: 500 },
        currentFeatures: { traffic_rate: 25000, unique_endpoints: 5, protocol_entropy: 0.3, packet_variance: 500 },
        policyRules: { allowed_ips: ["172.16.0.1"], allowed_protocols: ["TCP", "HTTPS"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 95,
        compromised: false,
        isolated: false,
        aiReasoning: {
            confidence: 95,
            severity: "INFO",
            analysis: "Access Controller operation conforms to baseline HTTPS access patterns.",
            threat_type: "None"
        },
        lastUpdated: new Date()
    },
    {
        deviceId: "node-cache",
        deviceName: "Edge Cache",
        deviceType: "service",
        ipAddress: "172.16.0.6",
        baselineFeatures: { traffic_rate: 850000, unique_endpoints: 2, protocol_entropy: 0.1, packet_variance: 2000 },
        currentFeatures: { traffic_rate: 850000, unique_endpoints: 2, protocol_entropy: 0.1, packet_variance: 2000 },
        policyRules: { allowed_ips: ["172.16.0.1"], allowed_protocols: ["HTTP"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 97,
        compromised: false,
        isolated: false,
        aiReasoning: {
            confidence: 95,
            severity: "INFO",
            analysis: "Edge Cache network usage aligns with standard HTTP resource distribution.",
            threat_type: "None"
        },
        lastUpdated: new Date()
    },
    {
        deviceId: "node-db",
        deviceName: "IoT Data Storage Node",
        deviceType: "database",
        ipAddress: "172.16.0.7",
        baselineFeatures: { traffic_rate: 45000, unique_endpoints: 4, protocol_entropy: 0.2, packet_variance: 800 },
        currentFeatures: { traffic_rate: 45000, unique_endpoints: 4, protocol_entropy: 0.2, packet_variance: 800 },
        policyRules: { allowed_ips: ["172.16.0.1"], allowed_protocols: ["TCP"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 98,
        compromised: false,
        isolated: false,
        aiReasoning: {
            confidence: 95,
            severity: "INFO",
            analysis: "Database storage read/write queries are normal.",
            threat_type: "None"
        },
        lastUpdated: new Date()
    },
    {
        deviceId: "node-edge-ai",
        deviceName: "Edge AI Analyzer",
        deviceType: "service",
        ipAddress: "172.16.0.8",
        baselineFeatures: { traffic_rate: 110000, unique_endpoints: 3, protocol_entropy: 0.5, packet_variance: 1500 },
        currentFeatures: { traffic_rate: 110000, unique_endpoints: 3, protocol_entropy: 0.5, packet_variance: 1500 },
        policyRules: { allowed_ips: ["172.16.0.1"], allowed_protocols: ["TCP"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 96,
        compromised: false,
        isolated: false,
        aiReasoning: {
            confidence: 95,
            severity: "INFO",
            analysis: "Edge AI Analyzer is transmitting model inference reports within normal parameters.",
            threat_type: "None"
        },
        lastUpdated: new Date()
    },
    {
        deviceId: "node-operator",
        deviceName: "Operator Terminal",
        deviceType: "Operator Terminal",
        ipAddress: "172.16.0.9",
        baselineFeatures: { traffic_rate: 8000, unique_endpoints: 1, protocol_entropy: 0.1, packet_variance: 400 },
        currentFeatures: { traffic_rate: 8000, unique_endpoints: 1, protocol_entropy: 0.1, packet_variance: 400 },
        policyRules: { allowed_ips: ["172.16.0.1"], allowed_protocols: ["TCP", "HTTPS"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 93,
        compromised: false,
        isolated: false,
        aiReasoning: {
            confidence: 95,
            severity: "INFO",
            analysis: "Operator Terminal interactive session parameters are stable.",
            threat_type: "None"
        },
        lastUpdated: new Date()
    },
    {
        deviceId: "node-cloud-ai",
        deviceName: "Cloud AI Detection Engine",
        deviceType: "cloud",
        ipAddress: "10.0.0.1",
        baselineFeatures: { traffic_rate: 350000, unique_endpoints: 12, protocol_entropy: 0.8, packet_variance: 3000 },
        currentFeatures: { traffic_rate: 350000, unique_endpoints: 12, protocol_entropy: 0.8, packet_variance: 3000 },
        policyRules: { allowed_ips: ["172.16.0.8"], allowed_protocols: ["HTTPS"], allowed_subnet: "172.16.0.0/24" },
        status: "secure",
        trustScore: 99,
        compromised: false,
        isolated: false,
        aiReasoning: {
            confidence: 95,
            severity: "INFO",
            analysis: "Cloud AI sync matches normal ingestion and scheduling baseline.",
            threat_type: "None"
        },
        lastUpdated: new Date()
    }
];

class MockStore {
    constructor() {
        this.devices = JSON.parse(JSON.stringify(INITIAL_DEVICES));
        this.telemetry = [];
        this.securityEvents = [];
    }

    reset() {
        this.devices = JSON.parse(JSON.stringify(INITIAL_DEVICES));
        this.telemetry = [];
        this.securityEvents = [];
        console.log("In-memory mock store reset successfully.");
    }
}

const storeInstance = new MockStore();
module.exports = storeInstance;
