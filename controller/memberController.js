const AppError = require('./../utils/appError');
const catchAsync = require('./../utils/catchAsync');
const User = require('./../models/userModel');
const Member = require('./../models/memberModel');

exports.addMember = catchAsync(async (req, res, next) => {
  const { role, title, email } = req.body;
  const managerId = req.user._id;
  const user = await User.findOne({ email: email });

  if (!user) {
    return next(new AppError(`There is no user with ${email} email.`, 400));
  }

  const member = await Member.create({
    managerId,
    role,
    title,
    user: user._id,
  });

  res.status(200).json({
    status: 'success',
    data: member,
  });
});

exports.getAllMembers = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const members = await Member.find({ managerId: userId });

  res.status(200).json({
    status: 'success',
    data: members,
  });
});

exports.updateMember = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { role, title } = req.body;

  const member = await Member.findByIdAndUpdate(
    id,
    { role, title },
    { returnDocument: 'after' },
  );
  res.status(200).json({
    status: 'success',
    data: member,
  });
});

exports.deletMember = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  await Member.findByIdAndDelete(id);
  res.status(200).json({
    status: 'success',
  });
});
