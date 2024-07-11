const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'comment must have text'],
    },
    kind: {
      type: String,
      enum: {
        values: ['Message', 'Link', 'Error', 'Debug', 'Bug'],
        message: 'kind can be either Message, Link, Error or Debug',
      },
      default: 'Message',
      required: [true, 'A comment must have a kind'],
    },
    task: {
      type: mongoose.Schema.ObjectId,
      ref: 'Task',
      required: [true, 'a comment must have a task id'],
    },
    author: {
      type: Object,
      required: [true, 'A task must have a author'],
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

const Comment = mongoose.model('Comment', commentSchema);
module.exports = Comment;
