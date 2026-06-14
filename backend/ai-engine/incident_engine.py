from pymongo import MongoClient
from datetime import datetime, UTC
import logging

logger = logging.getLogger(__name__)

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["Orbitguard"]
security_events_collection = db["security_events"]

def generate_incident(device_id, trust_score, explanations):
    """
    Generate security events when trust score drops below threshold.
    Thresholds:
    - Trust < 70 -> WARNING
    - Trust < 50 -> CRITICAL
    """
    if trust_score >= 70:
        return None

    severity = "CRITICAL" if trust_score < 50 else "WARNING"
    
    # Flatten explanations into a reason string
    reasons = []
    for ex in explanations:
        if isinstance(ex, dict):
            if ex.get('severity') != 'INFO':
                reasons.append(ex.get('reason', 'Unknown anomaly'))
        elif isinstance(ex, str):
            reasons.append(ex)
    
    reason = " | ".join(reasons)
    if not reason:
        reason = "Drift from behavioral baseline detected"

    incident = {
        "deviceId": device_id,
        "severity": severity,
        "reason": reason,
        "trustScore": trust_score,
        "timestamp": datetime.now(UTC)
    }

    try:
        security_events_collection.insert_one(incident)
        logger.warning(f"[INCIDENT] {severity} incident created for {device_id} (Score: {trust_score})")
        return incident
    except Exception as e:
        logger.error(f"Error inserting security event: {e}")
        return None
