const jwt = require('jsonwebtoken');

exports.createOtpToken = async (otp, email) => {
  const token = jwt.sign({ otp: otp, email }, process.env.JWT_SECRET, {
    expiresIn: '5m',
  });

  return token;
};

exports.sendOtpTokenToCookie = (res, token, email) => {
  const expiresAt = new Date(new Date().getTime() + 60 * 1000);
  res.cookie('otptoken', token, {
    expires: expiresAt,
    sameSite: 'none',
    secure: true,
  });

  res.status(200).json({
    status: 'success',
    token,
    email,
  });
};

exports.createLoginToken = async (userId) => {
  const token = jwt.sign({ userId: userId }, process.env.JWT_SECRET);
  return token;
};

exports.sendLoginTokenToCookie = (res, token, user = {}) => {
  // const expiresAt = new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000);
  // res.cookie('loginToken', token, {
  //   expires: expiresAt,
  //   httpOnly: true,
  // });

  res.status(200).json({
    status: 'success',
    token: token,
    message: `Logged in Successfully`,
    data: user,
  });
};
