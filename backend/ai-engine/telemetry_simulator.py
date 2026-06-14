from pymongo import MongoClient
import random
import time
from datetime import datetime, UTC

client = MongoClient("mongodb://localhost:27017/")
db = client["Orbitguard"]
devices_collection = db["devices"]
telemetry_collection = db["telemetry"]

def generate_telemetry(device):
    d_id = device["deviceId"]
    d_type = device["deviceType"]
    is_compromised = device.get("compromised", False)
    
    baseline = device.get("baselineFeatures", {})
    allowed_protocols = device.get("policyRules", {}).get("allowed_protocols", ["TCP"])
    allowed_ips = device.get("policyRules", {}).get("allowed_ips", ["172.16.0.1"])
    
    # Baseline values derived from actual realism constraints
    # Camera: 5-20 Mbps -> ~ 625000 - 2500000 bytes
    # Sensor: 100-500 Kbps -> ~ 12500 - 62500 bytes
    # WiFi AP: 100-800 Mbps -> ~ 12500000 - 100000000 bytes
    # Gateway: 1-5 Gbps -> ~ 125000000 - 625000000 bytes
    
    if d_type == "CCTV":
        base_traffic = random.uniform(625000, 2500000)
    elif d_type == "Sensor":
        base_traffic = random.uniform(12500, 62500)
    elif d_type == "WiFi AP":
        base_traffic = random.uniform(12500000, 100000000)
    elif d_type == "Edge Gateway":
        base_traffic = random.uniform(125000000, 625000000)
    else:
        base_traffic = baseline.get("traffic_rate", 1000)

    base_packets = baseline.get("packet_variance", 100) / 10 if baseline.get("packet_variance") else 50
    
    if is_compromised:
        # Attack behavior: High entropy and volume
        protocol = "SSH" if "RTSP" in allowed_protocols else "RTSP"
        bytes_sent = base_traffic * random.uniform(5, 10)
        packet_count = base_packets * random.uniform(4, 8)
        dst_ip = f"192.168.1.{random.randint(100, 250)}"
    else:
        # Normal behavior: Tight adherence to baseline
        protocol = allowed_protocols[0] if allowed_protocols else "TCP"
        bytes_sent = base_traffic * random.uniform(0.98, 1.02)
        packet_count = base_packets * random.uniform(0.98, 1.02)
        
        # SENSITIVE: Scale unique_endpoints by destination selection
        # If baseline unique_endpoints is 1, use ONLY the first allowed IP.
        dst_ip = allowed_ips[0] if allowed_ips else "172.16.0.1"

    return {
        "deviceId": d_id,
        "deviceName": device.get("deviceName", ""),
        "src_ip": device.get("ipAddress", "172.16.0.x"),
        "dst_ip": dst_ip,
        "protocol": protocol,
        "packet_count": int(packet_count),
        "bytes": int(bytes_sent),
        "timestamp": datetime.now(UTC)
    }

def run_simulator():
    print("🚀 IoT Telemetry Simulator: ULTRA STABILITY MODE (SOC Ready)")
    while True:
        try:
            devices = list(devices_collection.find({}))
            for device in devices:
                telemetry = generate_telemetry(device)
                telemetry_collection.insert_one(telemetry)
            time.sleep(3)
        except Exception as e:
            print(f"Simulator error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    run_simulator()