import numpy as np
from sklearn.ensemble import IsolationForest
import logging

logger = logging.getLogger(__name__)

class AnomalyDetectorML:
    def __init__(self):
        # Configuration for our anomaly detector
        self.model = IsolationForest(
            n_estimators=100, 
            contamination=0.1,  # Assume 10% of training data could be anomalous
            random_state=42
        )
        self.is_trained = False
        self.history_buffer = []    # Sliding window of real-world telemetry
        self.max_history = 500      # Keep last 500 clean telemetry pulses
        self.retrain_interval = 50  # Retrain every 50 new nodes
        self.training_cycle_tick = 0
        
        # We need to simulate some normal behavior data to fit the model initially.
        # This matches our realistic SOC constraints (CCTVs, Sensors, APs).
        self._fit_simulated_baselines()

    def _fit_simulated_baselines(self):
        # Generate synthetic baseline data
        # feature columns: [traffic_rate, unique_endpoints, protocol_entropy, packet_variance]
        X_train = []
        
        # Simulate 200 normal points
        for _ in range(200):
            X_train.append([
                np.random.uniform(10000, 50000000),      # traffic_rate
                np.random.randint(1, 10),                # unique_endpoints
                np.random.uniform(0.1, 0.5),             # protocol_entropy
                np.random.uniform(10, 500)               # packet_variance
            ])
            
        self.model.fit(X_train)
        self.is_trained = True
        logger.info("ML Isolation Forest initialized and fitted on synthetic baseline.")

    def update_model(self, features):
        """
        Dynamically adjusts the AI model based on continuous real-world telemetry streams.
        Requires trusted, non-anomalous device features.
        """
        f_array = [
            features.get("traffic_rate", 0),
            features.get("endpoint_diversity", 1),
            features.get("protocol_entropy", 0),
            features.get("packet_variance", 0)
        ]
        
        self.history_buffer.append(f_array)
        
        # Maintain sliding window memory limit
        if len(self.history_buffer) > self.max_history:
            self.history_buffer.pop(0)
            
        self.training_cycle_tick += 1
        
        if self.training_cycle_tick >= self.retrain_interval:
            self.training_cycle_tick = 0
            # Retrain model actively on latest baseline shifts
            if len(self.history_buffer) >= self.retrain_interval:
                try:
                    self.model.fit(self.history_buffer)
                    logger.info(f"AI Model dynamically retrained on rolling buffer (N={len(self.history_buffer)}). Adaptations recorded.")
                except Exception as e:
                    logger.error(f"Failed to dynamically retrain model: {e}")

    def predict_anomaly(self, features):
        """
        Takes raw feature dict, predicts anomaly score.
        Returns a float between 0.0 (normal) and 1.0 (highly anomalous)
        """
        if not self.is_trained:
            logger.warning("Model not trained prior to prediction.")
            return 0.0

        # Extract features into the format expected by the model
        f_array = [[
            features.get("traffic_rate", 0),
            features.get("endpoint_diversity", 1),       # Map unique_endpoints
            features.get("protocol_entropy", 0),
            features.get("packet_variance", 0)
        ]]

        # score_samples returns negative anomaly score (-1 for anomalies, 1 for normal)
        # We normalize this to a 0.0 - 1.0 probability range for our drift calculations
        score = self.model.score_samples(f_array)[0]
        
        # scikit-learn IsolationForest anomaly scores typically range from -0.5 to 0.5 where lower == more anomalous
        # We invert and map to (0, 1) probability scale conceptually
        normalized_score = max(0.0, min(1.0, -score))
        
        return float(normalized_score)

# For direct testing
if __name__ == "__main__":
    detector = AnomalyDetectorML()
    test_normal = {"traffic_rate": 20000, "endpoint_diversity": 2, "protocol_entropy": 0.2, "packet_variance": 50}
    test_attack = {"traffic_rate": 900000000, "endpoint_diversity": 50, "protocol_entropy": 0.9, "packet_variance": 5000}
    
    print(f"Normal Anomaly Score: {detector.predict_anomaly(test_normal)}")
    print(f"Attack Anomaly Score: {detector.predict_anomaly(test_attack)}")
