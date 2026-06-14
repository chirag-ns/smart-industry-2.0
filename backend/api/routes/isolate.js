const express = require("express")
const router = express.Router()

const Device = require("../../models/deviceModel")
const SecurityEvent = require("../../models/securityEventModel")
const sendAlert = require("../../services/alertSMS")

router.post("/isolate", async (req,res)=>{

 const { deviceId } = req.body

 await Device.updateOne(
  { deviceId },
  {
   $set:{
    status:"isolated",
    trustScore:10,
    isolated:true
   }
  }
 )

 await SecurityEvent.create({
  type:"DEVICE_ISOLATED",
  severity:"CRITICAL",
  deviceId,
  description:"Device automatically isolated due to security anomaly"
 })

 res.json({status:"isolated"})

})

router.post("/internal-alert", async (req,res)=>{
  const { deviceId, trustScore } = req.body;
  try {
    const device = await Device.findOne({ deviceId });
    if (!device) return res.status(404).json({ error: 'Device not found' });
    
    // As per user specification for AI Containment alert text
    const message = `OrbitGuard Security Alert\n\nDevice: ${device.deviceName}\nThreat: Behavioral anomaly detected\nTrust Score: ${Math.round(trustScore)}\nAction: Device automatically isolated by AI\n\nImmediate investigation recommended.`;
    
    sendAlert(message);
    res.json({success: true});
  } catch (e) {
    res.status(500).json({error: e.message});
  }
})

module.exports = router
