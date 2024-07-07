/* eslint-disable prettier/prettier */
/* eslint-disable arrow-body-style */
/* eslint-disable prettier/prettier */
const crypto = require('crypto');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const {
  createOtpToken,
  sendOtpTokenToCookie,
  createLoginToken,
  sendLoginTokenToCookie,
} = require('../utils/cookies');
const { sendOtpCode } = require('../utils/otpfun');
const { verifyOtpCode } = require('../utils/otpfun');
const User = require('../models/userModel');
const Otp = require('../models/otpModel');
const catchAsync = require('../utils/catchAsync');
const sendMail = require('../utils/email');

exports.sendOtpToUser = catchAsync(async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;

  if (!email || !password || !confirmPassword) {
    return next(new AppError('Please enter all the fields', 400));
  }

  if (password !== confirmPassword) {
    return next(
      new AppError('password and confirm password are not same', 400),
    );
  }

  if (!validator.isEmail(email)) {
    return next(new AppError('Please enter valid email id', 400));
  }

  const isEmailRegistered = await User.findOne({ email: email });
  if (isEmailRegistered) {
    return next(new AppError('Email Id already registered', 400));
  }
  const optpresent = await Otp.findOne({ email: email });
  if (optpresent) {
    return next(new AppError('Please try after 5 minutes', 400));
  }

  //sendotp
  const otp = Math.ceil(Math.random() * 899999) + 100000;

  const result = await sendOtpCode(email, otp);
  if (result.status === 'pending') {
    await Otp.create({ email, otp });
    setTimeout(async () => {
      await Otp.findOneAndDelete({ email });
    }, 60000);
    const token = await createOtpToken(otp);
    sendOtpTokenToCookie(res, token, email);
  }
});

exports.verifyOTPAndRegister = catchAsync(async (req, res, next) => {
  // const otp = req.query.otp;
  const { code } = req.query.code;

  const { firstName, lastName, email, password, confirmPassword, role } =
    req.body;

  if (!code) {
    return next(new AppError('Verification code is required', 400));
  }

  const result = await verifyOtpCode(email, code);
  if (result.status === 'approved') {
    //  register new user
    await User.create({
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      role,
    });

    // (await currentUser).save();
    req.body = { email, password };
    next();
  } else {
    return next(new AppError('Invalid OTP', 400));
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body || '';

  if (!email || !password) {
    return next(new AppError('User should have email & password', 400));
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) return next(new AppError('Entered Email Id is invlaid', 401));

  if (!(await user.correctPassword(password, user.password))) {
    return next(new AppError('Entered password is invalid', 401));
  }

  const token = await createLoginToken(user._id);
  sendLoginTokenToCookie(res, token);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.loginToken) {
    token = req.cookies.loginToken;
  }

  if (!token) {
    return next(new AppError('You are not logged in, please login', 401));
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.userId);
  // console.log(currentUser);

  if (!currentUser) {
    return next(
      new AppError('User belonging to this token does no longer exist'),
    );
  }

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password, login again', 401),
    );
  }

  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403),
      );
    }

    next();
  };
};

exports.getLoggedInUser = async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: req.user,
  });
};

exports.logout = (req, res, next) => {
  // req.headers.authorization = "";
  res.cookie('loginToken', null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: 'User logged out',
  });
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email } = req.body.email;
  if (!validator.isEmail(email)) {
    return next(new AppError(`${email} Id is not valid`, 400));
  }
  const user = await User.findOne({ email: email });

  if (!user) {
    return next(
      new AppError(`Email ${req.body.email} Id is not registered`, 404),
    );
  }

  if (user.passwordResetExpiresAt > Date.now()) {
    return next(
      new AppError(
        `Password reset link was sent to your email recently, please retry after ${(
          (user.passwordResetExpiresAt - Date.now()) /
          (60 * 1000)
        ).toFixed(1)} minutes`,
        400,
      ),
    );
  }

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${req.protocol}://${req.get(
    'host',
  )}/pm/api/v1/user/resetpassword/${resetToken}`;
  const message = `This is your password reset linke ${resetUrl}, valid for 5 minutes`;

  const options = {
    email: user.email,
    subject: 'Password reset token 🔑',
    message: message,
  };

  try {
    await sendMail(options);
    res.status(200).json({
      status: 'success',
      message: `Token send to ${user.email}`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError('There was some error sending password rest link', 500),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const resetToken = req.params.token;

  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiresAt: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError('Reset token is invalid or has expired', 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  //login the user
  const token = await createLoginToken(user._id);
  sendLoginTokenToCookie(res, token);
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  await user.save();
  const token = await createLoginToken(user._id);
  sendLoginTokenToCookie(res, token);
});
