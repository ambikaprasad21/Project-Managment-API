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
const hiringMail = require('./../utils/hiringmail');

exports.sendOtpToUser = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (!firstName || !lastName || !email || !password || !confirmPassword) {
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
    await Otp.create({ firstName, lastName, email, password, otp });
    setTimeout(async () => {
      await Otp.findOneAndDelete({ email });
    }, 60000);
    const token = await createOtpToken(otp, email);
    sendOtpTokenToCookie(res, token, email);
  }
});

exports.verifyOTPAndRegister = catchAsync(async (req, res, next) => {
  const { code, user, verify } = req.query;

  const decoded = jwt.verify(verify, process.env.JWT_SECRET);
  if (user !== decoded.email) {
    return next(new AppError('user and verify did not match', 400));
  }

  if (!code) {
    return next(new AppError('Verification code is required', 400));
  }

  const { status, password } = await verifyOtpCode(user, code);
  if (status === 'approved') {
    req.body = { email: user, password };
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
  sendLoginTokenToCookie(res, token, user);
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

  // if (currentUser.email === 'test@gmail.com') {
  //   return next(
  //     new AppError('Demo account, no changes allowed due to security 😀', 401),
  //   );
  // }

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
  const { email } = req.body;
  if (!validator.isEmail(email)) {
    return next(new AppError(`${email} is not valid Email Id`, 400));
  }
  const user = await User.findOne({ email: email });

  if (!user) {
    return next(new AppError(`Email ${req.body.email} is not registered`, 404));
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

  const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password/${resetToken}`;

  const options = {
    email: user.email,
    subject: '🔑 password reset token for prozCollab account',
  };

  if (process.env.NODE_ENV === 'production') {
    options.html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f4f4; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <div style="text-align: center; margin-bottom: 20px;">
        <a href="${process.env.FRONTEND_URL}" target="_blank">
            <img src="https://i.ibb.co/0Y4tmBS/logo.png" alt="ProzCollab Logo" style="max-width: 150px;">
        </a>
    </div>
    <h1 style="font-size: 24px; font-weight: bold; color: #333; text-align: center; margin-bottom: 20px;">Reset Your ProzCollab Password</h1>
    <div style="background-color: #ffffff; padding: 20px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <p style="font-size: 16px; color: #555; text-align: center; margin-bottom: 20px;">Hi ${user?.firstName} ${user?.lastName},</p>
        <p style="font-size: 16px; color: #555; text-align: center; margin-bottom: 20px;">We received a request to reset your password. Click the button below to reset it:</p>
        <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" style="background-color: #6F93F1; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 5px; font-size: 16px;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #777; text-align: center; margin-top: 20px;">If you did not request a password reset, please ignore this email or contact support if you have questions.</p>
    </div>
    <div style="margin-top: 30px; text-align: center;">
        <p style="font-size: 16px; color: #333;">Best regards,<br>The ProzCollab Team</p>
    </div>
</div>
    `;
  } else if (process.env.NODE_ENV === 'development') {
    options.message = `This is your password reset linke ${resetUrl}, valid for 5 minutes`;
  }

  try {
    await sendMail(options);
    res.status(200).json({
      status: 'success',
      message: `Password reset link send to ${user.email}`,
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

  const token = await createLoginToken(user._id);
  sendLoginTokenToCookie(res, token);
});
