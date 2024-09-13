const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    managerId: mongoose.Schema.ObjectId,
    role: {
      type: String,
      required: [true, 'A member must have a role'],
    },
    title: {
      type: String,
      required: [true, 'A member must have a title'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
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

memberSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'firstName lastName email photo bio',
  });
  next();
});

const Member = mongoose.model('Member', memberSchema);
module.exports = Member;
