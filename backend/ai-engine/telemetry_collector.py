import json
import time
from scapy.all import sniff, IP, TCP, UDP

class TelemetryCollector:
    """
    Captures network packet metadata and aggregates it into processing windows.
    """
    def __init__(self, interface="eth0", window_size=5):
        self.interface = interface
        self.window_size = window_size
        self.packet_buffer = []

    def handle_packet(self, packet):
        """Extracts metadata from an captured IP packet."""
        if IP in packet:
            metadata = {
                "src_ip": packet[IP].src,
                "dst_ip": packet[IP].dst,
                "proto": packet[IP].proto,
                "len": len(packet),
                "timestamp": time.time()
            }
            
            # Map protocol numbers to names
            if TCP in packet:
                metadata["proto_name"] = "TCP"
            elif UDP in packet:
                metadata["proto_name"] = "UDP"
            else:
                metadata["proto_name"] = "OTHER"
                
            self.packet_buffer.append(metadata)

    def collect_window(self):
        """Sniffs traffic for the duration of one window."""
        print(f"📡 Collecting telemetry on {self.interface} ({self.window_size}s window)...")
        sniff(iface=self.interface, prn=self.handle_packet, timeout=self.window_size)
        
        window_data = list(self.packet_buffer)
        self.packet_buffer = [] # Clear for next window
        return window_data

if __name__ == "__main__":
    # Test execution
    collector = TelemetryCollector(interface="eth0", window_size=5)
    while True:
        data = collector.collect_window()
        print(f"📦 Captured {len(data)} packets.")
        # Output to stdout for piping or log files
        print(json.dumps(data, indent=2))
