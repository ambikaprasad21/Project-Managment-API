// const twilio = require("twilio");
const AppError = require("./appError");

// const client = twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );

exports.sendOtpCode = async (mobNumber) => {
  try {
    const response = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verifications.create({
        to: `+${mobNumber}`,
        channel: "sms",
      });
    return response;
  } catch (error) {
    throw error;
  }
};

exports.verifyOtpCode = async (mobNumber, code) => {
  try {
    // console.log(process.env.TWILIO_SERVICE_SID);
    const response = await client.verify.v2
      .services(process.env.TWILIO_SERVICE_SID)
      .verificationChecks.create({
        to: `+${mobNumber}`,
        code,
      });
    return response;
  } catch (error) {
    console.error("Twilio Verify Error:", error);
    throw error;
  }
};
