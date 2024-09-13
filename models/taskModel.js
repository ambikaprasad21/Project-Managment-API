const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    projectId: mongoose.Types.ObjectId,
    title: {
      type: String,
      require: [true, 'task must have a title'],
    },
    description: {
      type: String,
      required: [true, 'task must have description'],
    },
    deadline: {
      type: Date,
      required: [true, 'A task must have a deadline'],
    },
    taskMembers: [
      {
        member: {
          type: mongoose.Schema.ObjectId,
          ref: 'Member',
        },
        marked: {
          type: Boolean,
          default: false,
        },
      },
    ],
    priorityLevel: {
      type: String,
      enum: {
        values: ['High', 'Medium', 'Low'],
        message: 'task status can be High, Medium, Low',
      },
      default: 'Low',
    },
    pdfs: [
      {
        location: String,
        name: String,
      },
    ],
    images: [
      {
        location: String,
        name: String,
      },
    ],
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
  this.populate('taskMembers.member');
  next();
});

const Task = mongoose.model('Task', taskSchema);
module.exports = Task;
