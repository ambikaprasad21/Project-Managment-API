const catchAsync = require('../utils/catchAsync');
const Notification = require('./../models/notificationModel');

exports.getAllNotifi = catchAsync(async (req, res, next) => {
  const notifications = await Notification.find({ user: req.user._id });

  res.status(200).json({
    status: 'success',
    data: notifications,
  });
});

exports.markAsRead = catchAsync(async (req, res, next) => {
  const { notifiId } = req.params;

  await Notification.findByIdAndUpdate(notifiId, { seen: true });
  res.status(200).json({
    status: 'success',
  });
});

exports.deleteNotifi = catchAsync(async (req, res, next) => {
  const { notifiId } = req.params;
  await Notification.findByIdAndDelete(notifiId);
  res.status(200).json({
    status: 'success',
  });
});
