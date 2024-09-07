const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const Task = require('./../models/taskModel');
const AppError = require('./../utils/appError');
const mongoose = require('mongoose');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (
    file.mimetype == 'image/png' ||
    file.mimetype == 'image/jpg' ||
    file.mimetype == 'image/jpeg' ||
    file.mimetype == 'video/mp4' ||
    file.mimetype == 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(
      new AppError('Only .png, .jpg, .jpeg .mp4 and .pdf format allowed!'),
    );
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.uploadTaskMedia = upload.fields([
  {
    name: 'image',
    maxCount: 1,
  },
  { name: 'pdf', maxCount: 1 },
]);

exports.createTask = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  const { title, description, deadline, members, priorityLevel } = req.body;

  const membersArray = Array.isArray(members) ? members : [members];

  const taskMembers = membersArray.map((memberId) => ({
    member: memberId,
  }));

  const task = await Task.create({
    projectId,
    title,
    description,
    deadline,
    taskMembers,
    priorityLevel,
  });

  req.body.membersArray = membersArray;
  req.body.id = task._id;
  next();
});

exports.getTaskById = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError('There is no task document with provided data'));
  }
  res.status(200).json({
    status: 'success',
    data: task,
  });
});

exports.getAllTask = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  const result = await Task.aggregate([
    {
      $match: { projectId: new mongoose.Types.ObjectId(projectId) },
    },
    {
      $lookup: {
        from: 'members',
        localField: 'taskMembers.member',
        foreignField: '_id',
        as: 'memberDetails',
      },
    },
    {
      $unwind: '$taskMembers',
    },
    {
      $addFields: {
        'taskMembers.memberDetails': {
          $arrayElemAt: [
            {
              $filter: {
                input: '$memberDetails',
                as: 'memberDetail',
                cond: { $eq: ['$$memberDetail._id', '$taskMembers.member'] },
              },
            },
            0,
          ],
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'taskMembers.memberDetails.user',
        foreignField: '_id',
        as: 'userDetails',
      },
    },
    {
      $unwind: {
        path: '$userDetails',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        'taskMembers.memberDetails.user': {
          firstName: '$userDetails.firstName',
          lastName: '$userDetails.lastName',
          email: '$userDetails.email',
          photo: '$userDetails.photo',
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        projectId: { $first: '$projectId' },
        title: { $first: '$title' },
        description: { $first: '$description' },
        deadline: { $first: '$deadline' },
        taskMembers: {
          $push: {
            member: '$taskMembers.memberDetails',
            marked: '$taskMembers.marked',
          },
        },
        priorityLevel: { $first: '$priorityLevel' },
        pdfs: { $first: '$pdfs' },
        images: { $first: '$images' },
        progress: { $first: '$progress' },
      },
    },
    {
      $addFields: {
        progress: {
          $cond: {
            if: { $eq: [{ $size: '$taskMembers' }, 0] }, // If no members
            then: 0,
            else: {
              $multiply: [
                {
                  $divide: [
                    {
                      $size: {
                        $filter: {
                          input: '$taskMembers',
                          as: 'member',
                          cond: { $eq: ['$$member.marked', true] },
                        },
                      },
                    },
                    { $size: '$taskMembers' },
                  ],
                },
                100,
              ],
            },
          },
        },
      },
    },
    {
      $group: {
        _id: null,
        completed: {
          $sum: {
            $cond: { if: { $eq: ['$progress', 100] }, then: 1, else: 0 },
          },
        },
        inProgress: {
          $sum: {
            $cond: {
              if: {
                $and: [{ $gt: ['$progress', 0] }, { $lt: ['$progress', 100] }],
              },
              then: 1,
              else: 0,
            },
          },
        },
        totalTasks: { $sum: 1 },
        tasks: { $push: '$$ROOT' },
      },
    },
    {
      $project: {
        _id: 0,
        completed: 1,
        inProgress: 1,
        pending: {
          $subtract: ['$totalTasks', { $add: ['$completed', '$inProgress'] }],
        },
        tasks: 1,
      },
    },
  ]);

  if (result.length === 0) {
    res.status(200).json({
      status: 'success',
      message: 'There are no tasks',
    });
  }

  res.status(200).json({
    status: 'success',
    data: result[0],
  });
});

exports.toggleMarked = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;
  const task = await Task.findById(taskId);
  const userId = req.user._id;

  if (!task) {
    return next(new AppError('No task found.', 400));
  }
  const member = task.taskMembers.find(
    (entry) => String(entry.member.user._id) === String(userId),
  );

  if (!member) {
    return next(new AppError('You cannot perform this action.', 400));
  }

  member.marked = !member.marked;

  await task.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    data: task,
  });
});
