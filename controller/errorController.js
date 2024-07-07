/* eslint-disable prettier/prettier */
const AppError = require('../utils/appError');

function sendErrorDev(err, res) {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
}

function handleValidationError(error) {
  const errors = Object.values(error.errors).map((val) => val.message);
  const message = `Invalid input data, ${errors.join('. ')}`;
  return new AppError(message, 400);
}

function handleJWTError(error) {
  const { message } = error;
  return new AppError(message, 401);
}

// function handleTwilioError(error) {
//   return new AppError("Something Went Wrong Verifying OTP, Please retry", 404);
// }

function handleTokenExpireError() {
  return new AppError('Your token has expired please try login again', 500);
}

function sendErrorProd(err, res) {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    res.status(500).json({
      status: 'error',
      message: 'Some Error has Occured 😔',
    });
  }
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // let error = { ...err };

    if (err.name === 'ValidationError')
      sendErrorProd(handleValidationError(err), res);
    if (err.name === 'JsonWebTokenError')
      sendErrorProd(handleJWTError(err), res);
    // if (err.code === 20404) sendErrorProd(handleTwilioError(err), res);
    if (err.name === 'TokenExpiredError')
      sendErrorProd(handleTokenExpireError(err), res);
    sendErrorProd(err, res);
  }
};
