const jwt = require("jsonwebtoken");
const catchAsync = require("../utils/catchAsync");
const AppError = require("./../utils/appError");
const User = require("./../models/userModel");

const isLoginTokenPresent = catchAsync(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.loginToken) {
    token = req.cookies.loginToken;
  } else {
    return next(new AppError("You are not logged in, please login", 401));
  }

  //will be using promisify afterwards to decoded cookie
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  const currentUser = await User.findById(decoded.userId).select("-password");

  if (!currentUser) {
    return next(new AppError("User not found", 404));
  }

  req.user = currentUser;
  next();
});

module.exports = isLoginTokenPresent;
