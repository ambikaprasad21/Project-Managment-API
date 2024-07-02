const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("./../utils/appError");

const isOTPTokenPresent = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.otptoken) {
    token = req.cookies.otptoken;
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (!decoded) {
    return next(new AppError("OTP token has expired", 400));
  } else {
    // req.query.otp = decoded.otp;
    return next();
  }
});

module.exports = isOTPTokenPresent;
