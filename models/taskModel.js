const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      require: [true, 'task must have a title'],
    },
    description: {
      type: String,
      required: [true, 'task must have description'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in-progress', 'completed'],
        message: 'task status can be pending, in-progress, completed',
      },
      default: 'pending',
    },
    members: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'TaskMember',
      },
    ],
    projectId: mongoose.Types.ObjectId,
    attachments: {
      type: mongoose.Schema.ObjectId,
      ref: 'Attachment',
    },
    deadline: {
      type: Date,
      required: [true, 'A task must have a deadline'],
    },
    priorityLevel: {
      type: String,
      enum: {
        values: ['High', 'Medium', 'Low'],
        message: 'task status can be High, Medium, Low',
      },
      default: 'Low',
    },
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

// taskSchema.virtual('comments', {
//   ref: 'Comment',
//   foreignField: 'task',
//   localField: '_id',
// });

taskSchema.pre(/^find/, function (next) {
  this.populate('attachments').populate('members');
  next();
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
