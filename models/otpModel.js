const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const optSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First Name is required'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],

    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  email: {
    type: String,
    required: [true, 'User should have a email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email'],
  },
  otp: {
    type: String,
    required: [true, 'There must be otp'],
  },
});

optSchema.pre('save', async function (next) {
  this.otp = await bcrypt.hash(this.otp, 12);
  next();
});

optSchema.methods.compareOtp = async function (otp, hashedOtp) {
  return await bcrypt.compare(otp, hashedOtp);
};

const otpModel = mongoose.model('Otp', optSchema);

module.exports = otpModel;
