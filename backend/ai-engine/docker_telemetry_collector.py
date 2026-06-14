from scapy.all import sniff
from pymongo import MongoClient
from datetime import datetime

# MongoDB connection
client = MongoClient("mongodb://localhost:27017/")
db = client["Orbitguard"]
telemetry_collection = db["telemetry"]

print("OrbitGuard Docker Telemetry Collector Started")

def process_packet(packet):

    if packet.haslayer("IP"):

        src = packet["IP"].src
        dst = packet["IP"].dst
        size = len(packet)

        record = {
            "src_ip": src,
            "dst_ip": dst,
            "protocol": "ICMP",
            "packet_count": 1,
            "bytes": size,
            "timestamp": datetime.utcnow()
        }

        telemetry_collection.insert_one(record)

        print("Captured:", src, "→", dst)

# start packet capture
sniff(prn=process_packet, store=False)