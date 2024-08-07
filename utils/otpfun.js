const sendMail = require('./email.js');
const Otp = require('./../models/otpModel.js');
const User = require('../models/userModel.js');

exports.sendOtpCode = async (email, otp) => {
  const options = {
    email: email,
    subject: 'Project Management Authentication Token 🔑',
    message: `This is your OTP: ${otp}, valid for 5 minutes`,
  };

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
