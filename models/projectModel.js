const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A project must have a title'],
      maxlength: 30,
    },
    description: {
      type: String,
      required: [true, 'A project must have description'],
    },
    manager: mongoose.Types.ObjectId,

    attachments: {
      type: mongoose.Schema.ObjectId,
      ref: 'Attachment',
    },
    trashed: {
      type: Boolean,
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

projectSchema.virtual('members', {
  ref: 'TaskMember',
  foreignField: 'projectId',
  localField: '_id',
});

projectSchema.virtual('tasks', {
  ref: 'Task',
  foreignField: 'projectId',
  localField: '_id',
});

projectSchema.pre(/^find/, function (next) {
  this.populate({ path: 'attachments', select: '' })
    .populate({
      path: 'members',
      select: 'title role user -projectId',
    })
    .populate('tasks');
  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
