const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    manager: mongoose.Types.ObjectId,
    managerName: {
      type: String,
    },
    title: {
      type: String,
      required: [true, 'A project must have a title'],
      maxlength: 30,
    },
    description: {
      type: String,
      required: [true, 'A project must have description'],
    },
    deadline: {
      type: Date,
      required: [true, 'Project must have a deadline'],
    },
    video: {
      type: String,
    },
    images: [],
    pdfs: [],
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

projectSchema.virtual('tasks', {
  ref: 'Task',
  foreignField: 'projectId',
  localField: '_id',
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
