const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Comment = require('./../models/commentModel');

exports.comment = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { text, kind } = req.body;

  const author = {
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    email: req.user.email,
    photo: req.user.photo,
  };

  const comment = await Comment.create({
    text,
    kind,
    task: taskId,
    author,
  });

  res.status(200).json({
    status: 'success',
    data: comment,
  });
});

exports.getComments = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const comments = await Comment.find({ task: taskId });
  res.status(200).json({
    status: 'success',
    data: comments,
  });
});

exports.editComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { text, kind } = req.body;

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      text,
      kind,
    },
    { returnDocument: 'after' },
  );

  res.status(200).json({
    status: 'success',
    data: comment,
  });
});

exports.deleteComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;

  const comment = await Comment.findByIdAndDelete(commentId);

  if (!comment) {
    return next(
      new AppError('There is no comment with the provided data', 400),
    );
  }
  res.status(200).json({
    status: 'success',
    data: comment,
  });
});
