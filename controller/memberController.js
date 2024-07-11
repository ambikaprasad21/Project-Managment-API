const TaskMember = require('../models/taskMemberModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.create = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  const { title, role, email } = req.body;

  if (!title || !role || !email)
    return next(new AppError('title, role and email is required', 400));

  const user = await User.findOne({ email: email });

  if (!user) {
    return next(
      new AppError(
        'There is no user with this email, you can mention only registered user email',
        400,
      ),
    );
  }

  if (!user.projectIdAssigned.includes(projectId)) {
    user.projectIdAssigned.push(projectId);
  }
  const notify = await Notification.create({
    message: 'You were added to a new project 🏢',
    user: user._id,
  });
  // user.notifications.push(notify._id);
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

exports.updateMember = catchAsync(async (req, res, next) => {
  const { memberId } = req.params;
  // const user = await TaskMember.findById(memberId);
  // const userId = user._id;
  // user = await User.findById(userId);
  const { role, title } = req.body;
  const member = await TaskMember.findByIdAndUpdate(
    memberId,
    {
      role,
      title,
    },
    { returnDocument: 'after' },
  );
  res.status(200).json({
    status: 'success',
    data: member,
  });
});
