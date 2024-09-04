const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const Comment = require('./../models/commentModel');
const Task = require('./../models/taskModel');

async function canComment(taskId, email, userId) {
  const task = await Task.findById(taskId);

  if (!task) {
    throw new AppError('Task not found.', 404);
  }

  const result = {
    author: null,
    manager: null,
  };

  const memberByEmail = task.taskMembers.find(
    (member) => member.member.user.email === email,
  );
  if (memberByEmail) {
    result.author = {
      id: memberByEmail.member._id,
    };
  }

  const memberByManager = task.taskMembers.find(
    (member) => String(member.member.managerId) === String(userId),
  );
  if (memberByManager) {
    result.manager = {
      id: memberByManager.member.managerId,
    };
  }
  if (result.author === null && result.manager === null) {
    return null;
  }

  return result;
}

exports.comment = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const { text, email } = req.body;
  const userId = req.user._id;
  const result = await canComment(taskId, email, userId);
  if (result === null) {
    return next(
      new AppError(
        'You are not member in this task, so you cannot make comments.',
        400,
      ),
    );
  }

  const author = result.author?.id;
  const manager = result.manager?.id;
  let comment;
  if (author) {
    comment = await Comment.create({
      taskId,
      text,
      author,
    });
  } else {
    comment = await Comment.create({
      taskId,
      text,
      manager,
    });
  }
  res.status(200).json({
    status: 'success',
    data: comment,
  });
});

exports.getComments = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const comments = await Comment.find({ taskId });
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
