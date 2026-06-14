import logging

logger = logging.getLogger(__name__)

def compute_drift(current_features, baseline_features):
    """
    Detect behavioral drift using normalized deviation.
    Prioritizes primary metrics (traffic_rate, endpoint_diversity) 
    over secondary statistical metrics like variance when data is sparse.
    """
    drift_details = {}
    
    # We focus on the most reliable indicators for the dashboard demo
    feature_map = {
        "traffic_rate": "traffic_rate",
        "endpoint_diversity": "unique_endpoints"
    }

    drift_scores = []
    for current_key, baseline_key in feature_map.items():
        current_val = current_features.get(current_key, 0)
        baseline_val = baseline_features.get(baseline_key, 0)

        if baseline_val > 0:
            drift = abs(current_val - baseline_val) / baseline_val
        else:
            drift = 1.0 if current_val > 0 else 0.0
        
        clamped_drift = min(float(drift), 1.0)
        drift_details[current_key] = clamped_drift
        drift_scores.append(clamped_drift)

    # Secondary features: Only count if they are significantly high (anomaly detection)
    secondary_features = {
        "protocol_entropy": "protocol_entropy",
        "packet_variance": "packet_variance"
    }
    
    for current_key, baseline_key in secondary_features.items():
        current_val = current_features.get(current_key, 0)
        baseline_val = baseline_features.get(baseline_key, 0)
        
        # In a single-packet pulse, these are often 0. 
        # We only flag them if they SPIKE way above baseline.
        if baseline_val > 0 and current_val > baseline_val * 2:
            drift = min(abs(current_val - baseline_val) / baseline_val, 1.0)
            drift_details[current_key] = drift
            drift_scores.append(drift)
        else:
            drift_details[current_key] = 0.0

    avg_drift = sum(drift_scores) / len(drift_scores) if drift_scores else 0.0
    final_drift_score = max(0.0, min(1.0, avg_drift))

    logger.info(f"Computed stabilized drift score: {final_drift_score:.4f}")

    return {
        "drift_score": float(final_drift_score),
        "drift_features": drift_details
    }
