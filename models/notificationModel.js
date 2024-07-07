const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    time: Date,
    message: {
      type: String,
      required: [true, "notification must have message"],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: [true, "notification must have a user id"],
    },
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
