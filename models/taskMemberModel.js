const mongoose = require('mongoose');

const taskMemberSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: [true, 'user must be assigned a role like software engineer'],
    },
    title: {
      type: String,
      required: [true, 'task member must have a title'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
    },
    projectId: mongoose.Types.ObjectId,
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  },
);

taskMemberSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName email photo',
  });
  next();
});

const TaskMember = mongoose.model('TaskMember', taskMemberSchema);
module.exports = TaskMember;
