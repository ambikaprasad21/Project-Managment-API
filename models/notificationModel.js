const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: mongoose.Types.ObjectId,
    text: {
      type: String,
      required: [true, 'notification must have message'],
    },
    seen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
