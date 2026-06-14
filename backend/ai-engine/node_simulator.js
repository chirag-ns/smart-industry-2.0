const mockStore = require('../database/mockStore');
const Telemetry = require('../models/telemetryModel');
const Device = require('../models/deviceModel');
const SecurityEvent = require('../models/securityEventModel');
const http = require('http');

// Helper to calculate Shannon Entropy
function calculateEntropy(labels) {
    if (!labels || labels.length === 0) return 0;
    const counts = {};
    for (const label of labels) {
        counts[label] = (counts[label] || 0) + 1;
    }
    let entropy = 0;
    const total = labels.length;
    for (const key in counts) {
        const p = counts[key] / total;
        if (p > 0) {
            entropy -= p * Math.log2(p);
        }
    }
    return entropy;
}

// Extract features from a list of telemetry events for a device
function extractFeatures(telemetryData) {
    if (!telemetryData || telemetryData.length === 0) {
        return {
            traffic_rate: 0,
            avg_bytes: 0,
            endpoint_diversity: 0,
            protocol_entropy: 0,
            packet_variance: 0,
            session_frequency: 0
        };
    }

    const bytesList = telemetryData.map(t => t.bytes || 0);
    const packetsList = telemetryData.map(t => t.packet_count || 0);
    const destIps = telemetryData.map(t => t.dst_ip || '');
    const protocols = telemetryData.map(t => t.protocol || '');

    // mean-per-packet or mean-per-record
    const traffic_rate = bytesList.reduce((a, b) => a + b, 0) / bytesList.length;
    
    // avg packet size
    let sumPacketSize = 0;
    for (let i = 0; i < bytesList.length; i++) {
        const p = packetsList[i];
        const b = bytesList[i];
        sumPacketSize += p > 0 ? b / p : 0;
    }
    const avgBytes = sumPacketSize / bytesList.length;

    const endpoint_diversity = new Set(destIps).size;
    const protocol_entropy = calculateEntropy(protocols);

    // variance of packet sizes or packet counts
    let packet_variance = 0;
    if (packetsList.length > 1) {
        const meanPackets = packetsList.reduce((a, b) => a + b, 0) / packetsList.length;
        const squareDiffs = packetsList.map(p => Math.pow(p - meanPackets, 2));
        packet_variance = squareDiffs.reduce((a, b) => a + b, 0) / (packetsList.length - 1);
    }

    const session_frequency = telemetryData.length;

    return {
        traffic_rate: parseFloat(traffic_rate.toFixed(2)),
        avg_bytes: parseFloat(avgBytes.toFixed(2)),
        endpoint_diversity: parseInt(endpoint_diversity),
        protocol_entropy: parseFloat(protocol_entropy.toFixed(4)),
        packet_variance: parseFloat(packet_variance.toFixed(2)),
        session_frequency: parseFloat(session_frequency)
    };
}

// Compute behavioral drift
function computeDrift(currentFeatures, baselineFeatures) {
    const driftDetails = {};
    const featureMap = {
        "traffic_rate": "traffic_rate",
        "endpoint_diversity": "unique_endpoints"
    };

    const driftScores = [];
    for (const currentKey in featureMap) {
        const baselineKey = featureMap[currentKey];
        const currentVal = currentFeatures[currentKey] || 0;
        const baselineVal = baselineFeatures[baselineKey] || 0;

        let drift = 0;
        if (baselineVal > 0) {
            drift = Math.abs(currentVal - baselineVal) / baselineVal;
        } else {
            drift = currentVal > 0 ? 1.0 : 0.0;
        }

        const clampedDrift = Math.min(drift, 1.0);
        driftDetails[currentKey] = clampedDrift;
        driftScores.push(clampedDrift);
    }

    const secondaryFeatures = {
        "protocol_entropy": "protocol_entropy",
        "packet_variance": "packet_variance"
    };

    for (const currentKey in secondaryFeatures) {
        const baselineKey = secondaryFeatures[currentKey];
        const currentVal = currentFeatures[currentKey] || 0;
        const baselineVal = baselineFeatures[baselineKey] || 0;

        if (baselineVal > 0 && currentVal > baselineVal * 2) {
            const drift = Math.min(Math.abs(currentVal - baselineVal) / baselineVal, 1.0);
            driftDetails[currentKey] = drift;
            driftScores.push(drift);
        } else {
            driftDetails[currentKey] = 0.0;
        }
    }

    const avgDrift = driftScores.length > 0 ? driftScores.reduce((a, b) => a + b, 0) / driftScores.length : 0.0;
    const finalDriftScore = Math.max(0.0, Math.min(1.0, avgDrift));

    return {
        drift_score: finalDriftScore,
        drift_features: driftDetails
    };
}

// Generate natural language explanations
function generateAIReasoning(device, currentFeatures, status, trustScore) {
    const baseline = device.baselineFeatures || {};
    const current = currentFeatures;
    const driftSummary = [];
    let highDrift = false;

    let trafficDev = 0;
    let entropyDev = 0;
    let endpointDev = 0;

    for (const feature in baseline) {
        const base = baseline[feature] || 0;
        const curr = current[feature] || 0;
        if (base === 0) continue;

        const deviation = ((curr - base) / base) * 100;

        if (feature === "traffic_rate") trafficDev = deviation;
        else if (feature === "protocol_entropy") entropyDev = deviation;
        else if (feature === "endpoint_diversity") endpointDev = deviation;

        if (deviation > 30) {
            highDrift = true;
            driftSummary.push(`${feature.replace('_', ' ')} increased by ${Math.round(deviation)} percent`);
        } else if (deviation > 15) {
            driftSummary.push(`${feature.replace('_', ' ')} shows moderate deviation from baseline`);
        }
    }

    let threatType = "None";
    if (highDrift) {
        if (trafficDev > 50 && endpointDev > 50) {
            threatType = "Possible Botnet Activity / DDoS Node";
        } else if (entropyDev > 50 && trafficDev < 20) {
            threatType = "Command & Control (C2) Communication";
        } else if (endpointDev > 40 && trafficDev > 20) {
            threatType = "Lateral Movement Attempt";
        } else if (trafficDev > 80) {
            threatType = "Data Exfiltration Pattern";
        } else {
            threatType = "Unknown Behavioral Anomaly";
        }
    }

    const isSecure = (status === "secure" && trustScore >= 80.0);
    const deviceName = device.deviceName || "device";
    let explanation = "";
    let severity = "INFO";
    let confidence = 95;

    if (isSecure) {
        explanation = `The ${deviceName} is currently operating within expected behavioral parameters.\n\nNetwork telemetry shows stable traffic patterns consistent with historical baseline behavior. No abnormal endpoint communication or protocol irregularities were detected.\n\nProtocol entropy and packet variance remain within expected thresholds, indicating that the device is not exhibiting signs of command-and-control communication or lateral movement.\n\nThe device is considered low risk at this time and maintains a strong trust score of ${Math.round(trustScore)}% within the OrbitGuard Zero Trust security framework.`;
        severity = "INFO";
        confidence = 95;
        threatType = "None";
    } else {
        const driftText = driftSummary.length > 0 ? driftSummary.join(", ") : "severe trust degradation and heuristic anomaly patterns";
        if (threatType === "None") {
            threatType = "Targeted Exploit or Critical Compromise";
        }
        explanation = `OrbitGuard has detected a significant behavioral deviation from the historical baseline of the ${deviceName}.\n\nTelemetry analysis indicates that ${driftText}.\n\nSuch deviations can indicate abnormal network activity, including possible command and control communication, credential misuse, or lateral movement across the IoT network.\n\nBased on these observations, OrbitGuard recommends immediate investigation and containment of the affected device.\n\nAutomated containment policies may be triggered if the trust score continues to decline.`;
        severity = "CRITICAL";
        confidence = 92;
    }

    return {
        severity,
        confidence,
        analysis: explanation.trim(),
        threat_type: threatType
    };
}

// Generate device telemetry matching telemetry_simulator.py
function generateTelemetry(device) {
    const dId = device.deviceId;
    const dType = device.deviceType;
    const isCompromised = device.compromised || false;
    
    const baseline = device.baselineFeatures || {};
    const allowedProtocols = (device.policyRules && device.policyRules.allowed_protocols) || ["TCP"];
    const allowedIps = (device.policyRules && device.policyRules.allowed_ips) || ["172.16.0.1"];
    
    let baseTraffic = 0;
    if (dType === "CCTV") {
        baseTraffic = Math.random() * (2500000 - 625000) + 625000;
    } else if (dType === "Sensor") {
        baseTraffic = Math.random() * (62500 - 12500) + 12500;
    } else if (dType === "WiFi AP") {
        baseTraffic = Math.random() * (100000000 - 12500000) + 12500000;
    } else if (dType === "Edge Gateway") {
        baseTraffic = Math.random() * (625000000 - 125000000) + 125000000;
    } else {
        baseTraffic = baseline.traffic_rate || 1000;
    }

    const basePackets = baseline.packet_variance ? (baseline.packet_variance / 10) : 50;
    
    let protocol = "";
    let bytesSent = 0;
    let packetCount = 0;
    let dstIp = "";

    if (isCompromised) {
        // Attack behaviour
        protocol = allowedProtocols.includes("RTSP") ? "SSH" : "RTSP";
        bytesSent = baseTraffic * (Math.random() * (10 - 5) + 5);
        packetCount = basePackets * (Math.random() * (8 - 4) + 4);
        dstIp = `192.168.1.${Math.floor(Math.random() * (250 - 100)) + 100}`;
    } else {
        // Normal behavior
        protocol = allowedProtocols[0] || "TCP";
        bytesSent = baseTraffic * (Math.random() * (1.02 - 0.98) + 0.98);
        packetCount = basePackets * (Math.random() * (1.02 - 0.98) + 0.98);
        dstIp = allowedIps[0] || "172.16.0.1";
    }

    return {
        deviceId: dId,
        deviceName: device.deviceName || "",
        src_ip: device.ipAddress || "172.16.0.1",
        dst_ip: dstIp,
        protocol: protocol,
        packet_count: Math.round(packetCount),
        bytes: Math.round(bytesSent),
        timestamp: new Date()
    };
}

// Build attack path propagation graph
function buildAttackPath(source, devices) {
    const path = [];
    for (const device of devices) {
        if (device.deviceId !== source) {
            path.push({
                from: source,
                to: device.deviceId,
                type: "potential_lateral_movement"
            });
        }
    }
    return path;
}

// Trigger alert SMS internally via API or routes helper
function triggerAlertSMS(deviceName, trustScore) {
    const options = {
        hostname: 'localhost',
        port: process.env.PORT || 5000,
        path: '/alerts/sendAlert',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const req = http.request(options, (res) => {});
    req.on('error', (e) => {
        // Suppress errors if server is shutting down or not listening yet
    });
    req.write(JSON.stringify({ device: deviceName, trust: trustScore }));
    req.end();
}

// Main loops
function startSimulation() {
    console.log("🚀 Node IoT Telemetry Simulation and AI Engine Active.");

    // Loop 1: Ingest telemetry every 3 seconds
    setInterval(async () => {
        try {
            const devices = mockStore.devices;
            for (const device of devices) {
                // Suspended/Isolated devices do not generate active standard traffic
                if (device.status === 'isolated' || device.isolated) continue;
                
                const telemetry = generateTelemetry(device);
                await Telemetry.create(telemetry);
            }
        } catch (e) {
            console.error("Simulator error:", e);
        }
    }, 3000);

    // Loop 2: Run AI analysis and containment logic every 5 seconds
    setInterval(async () => {
        try {
            const devices = mockStore.devices;
            for (const device of devices) {
                const deviceId = device.deviceId;
                
                // Skip fully isolated devices to avoid noise
                if (device.status === 'isolated' || device.isolated) continue;

                // 1. Fetch telemetry
                const telemetry = await Telemetry.find({ deviceId })
                    .sort({ timestamp: -1 })
                    .limit(3);
                
                // Extract features
                const features = extractFeatures(telemetry);
                
                let trustScore = 100;
                let status = "secure";
                let mlAnomalyScore = 0.0;
                let driftScore = 0.0;
                
                if (device.compromised) {
                    // ATTACK MODE
                    driftScore = 1.0;
                    mlAnomalyScore = 0.95;
                    trustScore = Math.floor(Math.random() * (25 - 10)) + 10;
                    status = "compromised";
                    
                    // Create security event for telemetry breach
                    await SecurityEvent.create({
                        deviceId,
                        severity: "CRITICAL",
                        type: "BEHAVIORAL_BREACH",
                        description: `Critical telemetry anomalies detected on ${device.deviceName}. Potential network attack in progress.`
                    });
                } else {
                    // NORMAL MODE
                    const driftResults = computeDrift(features, device.baselineFeatures || {});
                    driftScore = driftResults.drift_score;
                    
                    // Simple heuristic anomaly calculation representing ML model prediction
                    mlAnomalyScore = driftScore > 0.4 ? 0.8 : 0.05;
                    
                    const finalDrift = driftScore + (mlAnomalyScore * 0.4);
                    const baseTrust = 98.0 - (finalDrift * 5.0);
                    // Add small random noise (-1 to 1) for natural visualization
                    trustScore = Math.max(94.0, Math.min(99.0, baseTrust + (Math.random() * 2 - 1)));
                    status = "secure";
                }

                // Check for drift alerts
                if (status === 'secure' && trustScore < 95 && driftScore > 0.3) {
                    status = 'drift';
                }

                // Generate explainable AI reasoning
                const aiReasoning = generateAIReasoning(device, features, status, trustScore);

                // Auto containment check (if trust drops below 40)
                if (trustScore < 40) {
                    status = "isolated";
                    aiReasoning.analysis += "\n\nAuto containment executed. Device automatically isolated by AI containment engine.";
                    
                    // Update in database mock
                    await Device.updateOne(
                        { deviceId },
                        {
                            status: "isolated",
                            trustScore: trustScore,
                            isolated: true,
                            aiReasoning: aiReasoning
                        }
                    );

                    // PUSH Auto containment event
                    await SecurityEvent.create({
                        deviceId,
                        severity: "CRITICAL",
                        type: "AUTO_CONTAINMENT",
                        description: `AI automatically isolated compromised device ${device.deviceName} to prevent lateral spreading`
                    });

                    // Trigger SMS alert
                    triggerAlertSMS(device.deviceName, trustScore);

                    // Build and push attack path propagation
                    const allDevices = mockStore.devices;
                    const path = buildAttackPath(deviceId, allDevices);

                    await SecurityEvent.create({
                        type: "attack_propagation",
                        source: deviceId,
                        path: path,
                        timestamp: new Date()
                    });

                    console.log(`⚠️ AUTO-CONTAINMENT: Device ${device.deviceName} isolated. Attack graph populated.`);
                } else {
                    // Standard update
                    await Device.updateOne(
                        { deviceId },
                        {
                            trustScore: trustScore,
                            currentFeatures: {
                                traffic_rate: features.traffic_rate,
                                unique_endpoints: features.endpoint_diversity,
                                protocol_entropy: features.protocol_entropy,
                                packet_variance: features.packet_variance
                            },
                            status: status,
                            aiReasoning: aiReasoning
                        }
                    );
                }
            }
        } catch (e) {
            console.error("AI pipeline error:", e);
        }
    }, 5000);
}

module.exports = { startSimulation };
