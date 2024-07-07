const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    orderId: String,
    date: Date,
    stripePaymentId: String,
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

const Subscription = mongoose.model("Subscription", subscriptionSchema);
module.exports = Subscription;
