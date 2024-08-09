const sendMail = require('./email.js');
const Otp = require('./../models/otpModel.js');
const User = require('../models/userModel.js');

exports.sendOtpCode = async (email, otp) => {
  const options = {
    email: email,
    subject: '🔑 Your ProzCollab OTP Code for Account Verification',
  };

  if (process.env.NODE_ENV === 'production') {
    options.html = `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <div style="text-align: center; margin-bottom: 20px;">
        <a href="${process.env.FRONTEND_URL}" target="_blank">
            <img src="https://i.ibb.co/0Y4tmBS/logo.png" alt="ProzCollab Logo" style="max-width: 150px;">
        </a>
    </div>
    <h1 style="font-size: 24px; font-weight: bold; color: #333; text-align: center; margin-bottom: 20px;">Verify Your ProzCollab Account</h1>
    <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <h2 style="font-size: 28px; font-weight: bold; color: #6F93F1; text-align: center; margin-bottom: 10px;">Your OTP Code</h2>
        <p style="font-size: 32px; font-weight: bold; color: #6F93F1; text-align: center; margin: 20px 0;">${otp}</p>
        <p style="font-size: 16px; color: #555; text-align: center;">This OTP is valid for the next 5 minutes.</p>
    </div>
    <div style="margin-top: 20px; text-align: center;">
        <p style="font-size: 16px; color: #555;">Please enter the above OTP to verify your ProzCollab account.</p>
        <p style="font-size: 14px; color: #777; margin-top: 20px;">If you did not request this code, please ignore this email.</p>
    </div>
    <div style="margin-top: 30px; text-align: center;">
        <p style="font-size: 16px; color: #333;">Best regards,<br>The ProzCollab Team</p>
    </div>
</div>
`;
  } else if (process.env.NODE_ENV === 'development') {
    options.message = `This is your OTP: ${otp}, valid for 5 minutes`;
  }
  try {
    await sendMail(options);
    return { status: 'pending' };
  } catch (error) {
    throw new Error('There was an error while sending OTP, please try again');
  }
};

exports.verifyOtpCode = async (email, code) => {
  try {
    const result = await Otp.findOne({ email });
    if (!result) {
      throw new Error('This email is not registered');
    }
    if (!(await result.compareOtp(code, result.otp))) {
      throw new Error('Invalid OTP entered');
    } else {
      const user = await User.create({
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        password: result.password,
        confirmPassword: result.password,
      });
      return { status: 'approved', password: result.password };
    }
  } catch (err) {
    return { status: 'fail' };
  }
};
