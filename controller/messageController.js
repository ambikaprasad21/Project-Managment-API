const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Message = require('./../models/messageModel');
// const Task = require('./../models/taskModel');

exports.message = catchAsync(async (req, res, next) => {
  const { receiverId } = req.params;
  const { message } = req.body;
  const sender = req.user._id;

  const newMessage = await Message.create({
    message,
    sender,
    receiver: receiverId,
  });
  res.status(200).json({
    status: 'success',
    data: newMessage,
  });
});

exports.getMessages = catchAsync(async (req, res, next) => {
  const allMessages = await Message.find({ receiver: req.user._id });
  res.status(200).json({
    status: 'success',
    data: allMessages,
  });
});

exports.markMessageAsRead = catchAsync(async (req, res, next) => {
  const { messageId } = req.params;

  await Message.findByIdAndUpdate(messageId, { seen: true });
  res.status(200).json({
    status: 'success',
  });
});

exports.deleteMessage = catchAsync(async (req, res, next) => {
  const { messageId } = req.params;
  await Message.findByIdAndDelete(messageId);
  res.status(200).json({
    status: 'success',
  });
});

exports.deleteAllMessage = catchAsync(async (req, res, next) => {
  await Message.deleteMany({ receiver: req.user._id });
  res.status(200).json({
    status: 'success',
  });
});
