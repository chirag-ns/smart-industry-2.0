from pymongo import MongoClient
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='[AI] %(message)s')
logger = logging.getLogger(__name__)

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["Orbitguard"]
devices_collection = db["devices"]
telemetry_collection = db["telemetry"]

def get_devices():
    """Retrieve all devices from the database."""
    try:
        devices = list(devices_collection.find({}))
        return devices
    except Exception as e:
        logger.error(f"Error fetching devices: {e}")
        return []

def get_recent_telemetry(device_id, limit=5):
    """Retrieve the latest telemetry data for a specific device."""
    try:
        # Sort by timestamp descending to get the most recent records
        telemetry = list(telemetry_collection.find({"deviceId": device_id})
                         .sort("timestamp", -1)
                         .limit(limit))
        return telemetry
    except Exception as e:
        logger.error(f"Error fetching telemetry for {device_id}: {e}")
        return []

if __name__ == "__main__":
    # Quick test
    devices = get_devices()
    print(f"Total devices: {len(devices)}")
    if devices:
        test_id = devices[0]['deviceId']
        recent = get_recent_telemetry(test_id)
        print(f"Recent telemetry for {test_id}: {len(recent)} records")
