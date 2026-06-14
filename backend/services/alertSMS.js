/**
 * Mock SMS alerting service for OrbitGuard
 */
function sendSMS(messageOrDevice, trustScore) {
    let alertMessage = "";
    if (typeof messageOrDevice === "string") {
        alertMessage = messageOrDevice;
    } else {
        alertMessage = `[OrbitGuard SMS Alert] Device: ${messageOrDevice} | Trust Score: ${trustScore}% | Action Required.`;
    }
    
    console.log("\n💬 ==========================================");
    console.log("💬 📲 [SMS SENT SUCCESSFULLY]");
    console.log(`💬 Message: \n${alertMessage}`);
    console.log("💬 ==========================================\n");
    return true;
}

module.exports = sendSMS;
