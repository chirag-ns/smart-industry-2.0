from pymongo import MongoClient

# -----------------------------
# MongoDB Connection
# -----------------------------
client = MongoClient("mongodb://localhost:27017/")
db = client["Orbitguard"]
devices_collection = db["devices"]

def migrate():
    print("Starting exact MongoDB migration for topology sync...")
    
    # 1. Clear existing devices to ensure clean state for topology
    devices_collection.delete_many({})
    
    # 2. Define the exact 10 nodes from the frontend topology (iotDevices.js)
    nodes = [
        {
            "deviceId": "node-cctv",
            "deviceName": "CCTV Security Camera",
            "deviceType": "CCTV",
            "ipAddress": "172.16.0.10",
            "baselineFeatures": {"traffic_rate": 20000, "unique_endpoints": 2, "protocol_entropy": 0.8, "packet_variance": 800},
            "policyRules": {"allowed_protocols": ["RTSP", "TCP"], "allowed_subnet": "172.16.0.0/16", "max_traffic_mbps": 10},
            "status": "secure",
            "trustScore": 98
        },
        {
            "deviceId": "node-sensor",
            "deviceName": "Smart Env Sensor",
            "deviceType": "Sensor",
            "ipAddress": "172.16.0.11",
            "baselineFeatures": {"traffic_rate": 15000, "unique_endpoints": 2, "protocol_entropy": 0.8, "packet_variance": 500},
            "policyRules": {"allowed_protocols": ["TCP", "MQTT", "CoAP"], "allowed_subnet": "172.16.0.0/16", "max_traffic_mbps": 1},
            "status": "secure",
            "trustScore": 99
        },
        {
            "deviceId": "node-wifi",
            "deviceName": "Enterprise WiFi AP",
            "deviceType": "WiFi AP",
            "ipAddress": "172.16.0.5",
            "baselineFeatures": {"traffic_rate": 50000, "unique_endpoints": 5, "protocol_entropy": 0.9, "packet_variance": 1200},
            "policyRules": {"allowed_protocols": ["TCP", "UDP"], "allowed_subnet": "172.16.0.0/16", "max_traffic_mbps": 50},
            "status": "secure",
            "trustScore": 95
        },
        {
            "deviceId": "node-gateway",
            "deviceName": "Edge Gateway",
            "deviceType": "Edge Gateway",
            "ipAddress": "172.16.0.1",
            "baselineFeatures": {"traffic_rate": 80000, "unique_endpoints": 10, "protocol_entropy": 1.2, "packet_variance": 2000},
            "policyRules": {"allowed_protocols": ["TCP", "UDP", "HTTP", "MQTT"], "allowed_subnet": "172.16.0.0/16", "max_traffic_mbps": 100},
            "status": "secure",
            "trustScore": 92
        },
        {
            "deviceId": "node-access",
            "deviceName": "IoT Access Controller",
            "deviceType": "IoT Access",
            "ipAddress": "172.16.0.20",
            "baselineFeatures": {"traffic_rate": 10000, "unique_endpoints": 3, "protocol_entropy": 0.7, "packet_variance": 400},
            "policyRules": {"allowed_protocols": ["TCP", "HTTPS"], "allowed_subnet": "172.16.0.0/16", "max_traffic_mbps": 5},
            "status": "secure",
            "trustScore": 95
        },
        {
            "deviceId": "node-cache",
            "deviceName": "Edge Cache",
            "deviceType": "Cache Node",
            "ipAddress": "172.16.0.30",
            "baselineFeatures": {"traffic_rate": 60000, "unique_endpoints": 2, "protocol_entropy": 0.8, "packet_variance": 1500},
            "policyRules": {"allowed_protocols": ["TCP", "HTTP"], "allowed_subnet": "172.16.0.0/16", "max_traffic_mbps": 80},
            "status": "secure",
            "trustScore": 90
        },
        {
            "deviceId": "node-db",
            "deviceName": "IoT Data Storage",
            "deviceType": "IoT Storage",
            "ipAddress": "172.16.0.40",
            "baselineFeatures": {"traffic_rate": 40000, "unique_endpoints": 4, "protocol_entropy": 0.9, "packet_variance": 1000},
            "policyRules": {"allowed_protocols": ["TCP"], "allowed_subnet": "172.16.0.0/16", "max_traffic_mbps": 20},
            "status": "secure",
            "trustScore": 99
        },
        {
            "deviceId": "node-edge-ai",
            "deviceName": "Edge AI Analyzer",
            "deviceType": "AI Engine",
            "ipAddress": "172.16.0.50",
            "baselineFeatures": {"traffic_rate": 25000, "unique_endpoints": 3, "protocol_entropy": 0.8, "packet_variance": 900},
            "policyRules": {"allowed_protocols": ["TCP", "UDP"], "allowed_subnet": "172.16.0.0/16", "max_traffic_mbps": 15},
            "status": "secure",
            "trustScore": 88
        },
        {
            "deviceId": "node-operator",
            "deviceName": "Operator Terminal",
            "deviceType": "Endpoint",
            "ipAddress": "172.16.0.100",
            "baselineFeatures": {"traffic_rate": 5000, "unique_endpoints": 2, "protocol_entropy": 0.6, "packet_variance": 200},
            "policyRules": {"allowed_protocols": ["HTTPS", "TCP"], "allowed_subnet": "172.16.0.0/16", "max_traffic_mbps": 5},
            "status": "secure",
            "trustScore": 95
        },
        {
            "deviceId": "node-cloud-ai",
            "deviceName": "Cloud AI Detection",
            "deviceType": "Cloud Service",
            "ipAddress": "10.0.0.1",
            "baselineFeatures": {"traffic_rate": 30000, "unique_endpoints": 12, "protocol_entropy": 1.1, "packet_variance": 1100},
            "policyRules": {"allowed_protocols": ["HTTPS", "TCP"], "allowed_subnet": "172.16.0.0/16", "max_traffic_mbps": 40},
            "status": "secure",
            "trustScore": 99
        }
    ]
    
    # 3. Insert fresh nodes
    devices_collection.insert_many(nodes)
    print(f"Migration complete. {len(nodes)} topology nodes synchronized.")

if __name__ == "__main__":
    migrate()
