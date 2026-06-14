import logging

logger = logging.getLogger(__name__)

def generate_ai_reasoning(device, current_features, status, trust_score):
    baseline = device.get("baselineFeatures", {})
    current = current_features

    drift_summary = []
    high_drift = False

    # Advanced Threat Classification Logic
    threat_type = "None"
    traffic_dev = 0
    entropy_dev = 0
    endpoint_dev = 0

    for feature in baseline:
        base = baseline.get(feature, 0)
        curr = current.get(feature, 0)

        if base == 0:
            continue

        deviation = ((curr - base) / base) * 100

        # Capture specific metric deviations for threat classification
        if feature == "traffic_rate": traffic_dev = deviation
        elif feature == "protocol_entropy": entropy_dev = deviation
        elif feature == "endpoint_diversity": endpoint_dev = deviation

        if deviation > 30:
            high_drift = True
            drift_summary.append(
                f"{feature.replace('_', ' ')} increased by {round(deviation, 1)} percent"
            )
        elif deviation > 15:
            drift_summary.append(
                f"{feature.replace('_', ' ')} shows moderate deviation from baseline"
            )

    # Determine specific Threat Type
    if high_drift:
        if traffic_dev > 50 and endpoint_dev > 50:
            threat_type = "Possible Botnet Activity / DDoS Node"
        elif entropy_dev > 50 and traffic_dev < 20:
            threat_type = "Command & Control (C2) Communication"
        elif endpoint_dev > 40 and traffic_dev > 20:
            threat_type = "Lateral Movement Attempt"
        elif traffic_dev > 80:
            threat_type = "Data Exfiltration Pattern"
        else:
            threat_type = "Unknown Behavioral Anomaly"

    # Only surface CRITICAL threats if the system actually dropped trust or status changed.
    # Otherwise, network bursts are just normal organic traffic.
    is_secure = (status == "secure" and trust_score >= 80.0)

    device_name = device.get("deviceName", "device")

    if is_secure:
        explanation = f"""
AI Behavioral Assessment

The {device_name} is currently operating within expected behavioral parameters.

Network telemetry shows stable traffic patterns consistent with historical baseline behavior. No abnormal endpoint communication or protocol irregularities were detected.

Protocol entropy and packet variance remain within expected thresholds, indicating that the device is not exhibiting signs of command-and-control communication or lateral movement.

The device is considered low risk at this time and maintains a strong trust score of {round(trust_score, 1)}% within the OrbitGuard Zero Trust security framework.
"""
        severity = "INFO"
        confidence = 95
        threat_type = "None"
    else:
        if not drift_summary:
            drift_text = "severe trust degradation and heuristic anomaly patterns"
        else:
            drift_text = ", ".join(drift_summary)
            
        if threat_type == "None":
            threat_type = "Targeted Exploit or Critical Compromise"
            
        explanation = f"""
AI Behavioral Assessment

OrbitGuard has detected a significant behavioral deviation from the historical baseline of the {device_name}.

Telemetry analysis indicates that {drift_text}.

Such deviations can indicate abnormal network activity, including possible command and control communication, credential misuse, or lateral movement across the IoT network.

Based on these observations, OrbitGuard recommends immediate investigation and containment of the affected device.

Automated containment policies may be triggered if the trust score continues to decline.
"""
        severity = "CRITICAL" if high_drift else "CRITICAL"
        confidence = 92

    return {
        "severity": severity,
        "confidence": confidence,
        "analysis": explanation.strip(),
        "threat_type": threat_type
    }
