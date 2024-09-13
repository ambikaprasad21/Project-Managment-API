const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: [true, 'Message text is required'],
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    receiver: mongoose.Types.ObjectId,
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

messageSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'sender',
    select: 'firstName lastName email photo',
  });
  next();
});

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;
