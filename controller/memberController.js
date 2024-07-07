const TaskMember = require('../models/taskMemberModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.create = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  const { title, role, email } = req.body;

  if (!title || !role || !email)
    return next(new AppError('title, role and email is required', 400));

  const user = await User.findOne({ email: email });
  if (!user.projectIdAssigned.includes(projectId)) {
    user.projectIdAssigned.push(projectId);
  }
  await user.save({ validateBeforeSave: false });

  const member = await TaskMember.create({
    title: title,
    role: role,
    projectId: projectId,
    user: user._id,
  });

  res.status(200).json({
    status: 'success',
    data: member,
  });
});
