import logging
import ipaddress

logger = logging.getLogger(__name__)

def is_ip_in_subnet(ip_str, subnet_str):
    """Check if an IP address belongs to a subnet."""
    try:
        ip = ipaddress.ip_address(ip_str)
        subnet = ipaddress.ip_network(subnet_str, strict=False)
        return ip in subnet
    except Exception:
        return False

def check_policy(device_data, current_features, telemetry_data):
    """
    Enforce Zero Trust communication rules.
    Aggregates violations by type to prevent score explosion.
    """
    policy_rules = device_data.get("policyRules", {})
    violations = []
    
    # 1. Protocol violations
    allowed_protocols = policy_rules.get("allowed_protocols", [])
    if allowed_protocols:
        seen_protocols = set(t.get("protocol") for t in telemetry_data if t.get("protocol"))
        bad_protos = [p for p in seen_protocols if p not in allowed_protocols]
        if bad_protos:
            violations.append(f"Unauthorized protocols detected: {', '.join(bad_protos)}")

    # 2. Unauthorized endpoints
    allowed_ips = policy_rules.get("allowed_ips", [])
    allowed_subnet = policy_rules.get("allowed_subnet")
    
    seen_ips = set(t.get("dst_ip") for t in telemetry_data if t.get("dst_ip"))
    unauthorized_count = 0
    for ip in seen_ips:
        is_allowed = False
        if ip in allowed_ips:
            is_allowed = True
        elif allowed_subnet and is_ip_in_subnet(ip, allowed_subnet):
            is_allowed = True
        
        if (allowed_ips or allowed_subnet) and not is_allowed:
            unauthorized_count += 1
    
    if unauthorized_count > 0:
        violations.append(f"Unauthorized communication with {unauthorized_count} unknown endpoints")

    # 3. Traffic spikes
    max_mbps = policy_rules.get("max_traffic_mbps")
    if max_mbps:
        traffic_rate_bps = current_features.get("traffic_rate", 0) * 8
        traffic_mbps = traffic_rate_bps / 1_000_000
        if traffic_mbps > max_mbps:
            violations.append(f"Traffic spike detected: {traffic_mbps:.2f} Mbps")

    severity = "NONE"
    if violations:
        severity = "HIGH" if len(violations) > 1 else "MEDIUM"
        for v in violations:
            logger.warning(f"[POLICY] {v}")

    return {
        "violations": violations,
        "severity": severity
    }
