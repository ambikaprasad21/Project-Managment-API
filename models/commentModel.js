const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    taskId: mongoose.Types.ObjectId,
    text: {
      type: String,
      required: [true, 'comment must have text'],
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'Member',
    },
    manager: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    edited: {
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

commentSchema.pre(/^find/, function (next) {
  this.populate('author').populate({
    path: 'manager',
    select: 'firstName lastName email photo',
  });
  next();
});

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
