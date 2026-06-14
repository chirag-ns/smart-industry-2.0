import time
import json
from pymongo import MongoClient
from telemetry_collector import TelemetryCollector
from feature_engine import extract_features
from drift_engine import compute_drift
from policy_engine import check_policy
from trust_engine import calculate_trust
from explainability import generate_explanations

class OrbitGuardAIService:
    def __init__(self, mongo_uri="mongodb://localhost:27017/"):
        self.client = MongoClient(mongo_uri)
        self.db = self.client.orbitguard
        
        # Initialize sub-engines
        self.collector = TelemetryCollector(interface="eth0", window_size=10)

    def run_cycle(self):
        """Standard processing loop: Capture -> Analyze -> Update"""
        print("\n--- 🔄 Analytics Cycle Starting ---")
        
        # 1. Collect raw packets
        packets = self.collector.collect_window()
        if not packets:
            print("⚠️ No traffic captured in this window.")
            return

        # 2. Group by Source IP (each IP represents a device)
        device_traffic = {}
        for p in packets:
            src = p['src_ip']
            if src not in device_traffic: device_traffic[src] = []
            device_traffic[src].append(p)

        # 3. Process each device
        for ip, p_list in device_traffic.items():
            device_doc = self.db.devices.find_one({"ipAddress": ip})
            if not device_doc:
                print(f"❓ Unknown device detected at {ip}. Skipping.")
                continue

            print(f"🔍 Analyzing device: {device_doc['deviceName']} ({ip})")

            # A. Compute Features
            current_features = extract_features(p_list)
            
            # B. Analyze Drift
            drift_result = compute_drift(
                current_features, 
                device_doc.get('baselineFeatures', {})
            )
            
            # C. Validate Policies
            policy_result = check_policy(
                device_doc,
                current_features,
                p_list
            )
            violations = policy_result.get("violations", [])
            
            # D. Compute Trust Score
            new_score = calculate_trust(
                drift_score=drift_result.get('drift_score', 0), 
                violations_count=len(violations),
                anomaly_factor=0
            )

            if new_score >= 80:
                status = "SECURE"
            elif new_score >= 50:
                status = "WARNING"
            else:
                status = "CRITICAL"
            
            # E. Generate Insights
            insights = generate_explanations(drift_result, policy_result)
            
            # 4. Update MongoDB
            self.db.devices.update_one(
                {"ipAddress": ip},
                {"$set": {
                    "currentFeatures": current_features,
                    "trustScore": new_score,
                    "status": status,
                    "ai_insights": insights,
                    "lastUpdated": time.time()
                }}
            )
            print(f"✅ Updated {device_doc['deviceName']} | Score: {new_score}")

    def start(self):
        print("🚀 OrbitGuard AI Analytics Service Active.")
        while True:
            try:
                self.run_cycle()
            except Exception as e:
                print(f"❌ Error in analytics cycle: {e}")
                time.sleep(5)

if __name__ == "__main__":
    service = OrbitGuardAIService()
    service.start()
