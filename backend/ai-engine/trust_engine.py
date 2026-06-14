import logging

logger = logging.getLogger(__name__)

def calculate_trust(drift_score, violations_count, anomaly_factor=0):
    """
    Calculate dynamic trust score (0-100).
    Formula:
    Trust = 100
    Trust -= drift_score * 50
    Trust -= violations * 20
    """
    trust = 100.0
    
    # Apply reductions
    drift_reduction = drift_score * 50
    violation_reduction = violations_count * 20
    
    trust -= drift_reduction
    trust -= violation_reduction
    
    # Anomaly factor can be an additional penalty if needed, 
    # but based on requirements, we focus on drift and violations.
    # We can use it as a multiplier or a flat penalty for things like simulated attacks.
    trust -= (anomaly_factor * 30) 
    
    # Clamp between 0 and 100
    final_trust = max(0.0, min(100.0, trust))
    
    logger.info(f"Trust calculation: Base(100) - Drift({drift_reduction:.1f}) - Violations({violation_reduction:.1f}) - Anomaly({anomaly_factor*30:.1f}) = {final_trust:.1f}")
    
    return float(final_trust)
