const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "comment must have text"],
    },
    kind: {
      type: String,
      enum: {
        values: ["message", "link", "error", "debug"],
        message: "kind can be either message, link, error or debug",
      },
      default: "comment",
    },
    date: Date,
    task: {
      type: mongoose.Schema.ObjectId,
      ref: "Task",
      required: [true, "a comment must have a task id"],
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

const Comment = mongoose.model("Comment", commentSchema);
module.exports = Comment;
