import numpy as np
from collections import Counter
import math

def calculate_entropy(labels):
    """Calculates the Shannon entropy of a list of labels."""
    if not labels:
        return 0
    counts = Counter(labels)
    probs = [count / len(labels) for count in counts.values()]
    return -sum(p * math.log2(p) for p in probs if p > 0)

def extract_features(telemetry_data):
    """
    Standardizes feature extraction for baseline comparison.
    Uses mean-per-packet or mean-per-record for traffic assessment
    to avoid time-window oscillation during short polling cycles.
    """
    if not telemetry_data:
        return {
            "traffic_rate": 0,
            "avg_bytes": 0,
            "endpoint_diversity": 0,
            "protocol_entropy": 0,
            "packet_variance": 0,
            "session_frequency": 0
        }

    # Extract raw values
    bytes_list = [t.get('bytes', 0) for t in telemetry_data]
    packets_list = [t.get('packet_count', 0) for t in telemetry_data]
    dest_ips = [t.get('dst_ip', '') for t in telemetry_data]
    protocols = [t.get('protocol', '') for t in telemetry_data]

    # For stabilization, traffic_rate in this demo context is treated as 
    # the average volume per telemetry pulse, aligning with business logic baselines.
    traffic_rate = np.mean(bytes_list)
    
    avg_packet_size = np.mean([b/p if p > 0 else 0 for b, p in zip(bytes_list, packets_list)])
    
    endpoint_diversity = len(set(dest_ips))
    
    protocol_entropy = calculate_entropy(protocols)
    
    packet_variance = float(np.var(packets_list)) if len(packets_list) > 1 else 0.0
    
    session_frequency = len(telemetry_data) # simplified for pulse counting

    return {
        "traffic_rate": float(traffic_rate),
        "avg_bytes": float(avg_packet_size),
        "endpoint_diversity": int(endpoint_diversity),
        "protocol_entropy": float(protocol_entropy),
        "packet_variance": float(packet_variance),
        "session_frequency": float(session_frequency)
    }
