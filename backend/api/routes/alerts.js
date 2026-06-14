const express = require("express")
const router = express.Router()

const sendSMS = require("../../services/alertSMS")

router.post("/sendAlert",(req,res)=>{

try{

const device = req.body.device
const trust = req.body.trust

console.log("Triggering SMS Alert for:", device)

sendSMS(device,trust)

res.json({
status:"alert triggered"
})

}
catch(error){

console.error("Alert error:",error)

res.status(500).json({
error:"Alert failed"
})

}

})

router.get("/test",(req,res)=>{

sendSMS("TEST DEVICE",25)

res.json({
status:"test SMS triggered"
})

})

router.get("/history", async (req, res) => {
    try {
        const SecurityEvent = require("../../models/securityEventModel");
        const events = await SecurityEvent.find({}).sort({ timestamp: -1 }).limit(50);
        res.json(events);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch event history" });
    }
});

module.exports = router
