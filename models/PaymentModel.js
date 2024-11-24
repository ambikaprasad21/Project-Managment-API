const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    userId: mongoose.Types.ObjectId,
    plantype: {
      type: String,
    },
    razorpay_order_id: {
      type: String,
    },
    razorpay_payment_id: {
      type: String,
    },
    razorpay_signature: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
