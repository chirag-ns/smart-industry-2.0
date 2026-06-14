const express = require("express");
const router = express.Router();
const SecurityEvent = require("../../models/securityEventModel");

router.get("/attack-path", async (req, res) => {
    try {
        const events = await SecurityEvent.find({ type: "attack_propagation" })
            .sort({ timestamp: -1 })
            .limit(1);

        res.json(events[0] || {});
    } catch (err) {
        console.error("Attack path fetch failed", err);
        res.status(500).json({ error: "Failed to fetch attack path" });
    }
});

module.exports = router;
