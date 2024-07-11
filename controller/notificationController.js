const catchAsync = require('../utils/catchAsync');
const Notification = require('./../models/notificationModel');

exports.getAllNotifi = catchAsync(async (req, res, next) => {
  const notifi = await Notification.find({ user: req.user._id, seen: false });

  res.status(200).json({
    status: 'success',
    data: notifi,
  });
});

exports.markAsRead = catchAsync(async (req, res, next) => {
  const { notifiId } = req.params;

  await Notification.findByIdAndUpdate(notifiId, { seen: true });
  res.status(200).json({
    status: 'success',
  });
});
