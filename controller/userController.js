const multer = require('multer');
const mongoose = require('mongoose');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cloudinary = require('./../config/cloudinary');
const User = require('./../models/userModel');
const Project = require('./../models/projectModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const {
  createLoginToken,
  sendLoginTokenToCookie,
} = require('../utils/cookies');
const stripe = require('stripe')(process.env.STRIPE);

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (
    file.mimetype == 'image/png' ||
    file.mimetype == 'image/jpg' ||
    file.mimetype == 'image/jpeg'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new AppError('Only .png, .jpg, .jpeg format allowed!'));
  }
};

exports.upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

exports.resizeUserPic = async (req, res, next) => {
  try {
    if (!req.file) return next();
    req.file.filename = `user-${req.user._id}-${Date.now()}.jpeg`;
    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 90 })
      .toFile(`public/uploads/images/${req.file.filename}`);
    next();
  } catch (err) {
    console.log(err.message);
    next();
  }
};

exports.uploadPic = catchAsync(async (req, res) => {
  const userpic = await cloudinary.uploader.upload(
    `${path.resolve(__dirname, '../public/uploads/images')}/${
      req.file.filename
    }`,
    {
      format: 'jpeg',
    },
  );
  if (!userpic) {
    return next(new AppError('Error uploading profile pic', 400));
  }

  await User.findByIdAndUpdate(req.user._id, { photo: userpic.secure_url });

  fs.unlink(
    `${path.resolve(__dirname, '../public/uploads/images')}/${
      req.file.filename
    }`,
    (err) => {
      if (err) {
        throw new AppError('Error removing file from server');
      } else {
        console.log('file deleted from server successfully');
      }
    },
  );

  res.status(200).json({
    status: 'success',
    data: {
      cloudianryPath: userpic.secure_url,
      filename: req.file.filename,
    },
  });
});

exports.bio = catchAsync(async (req, res, next) => {
  const bio = req.body.bio;
  await User.findByIdAndUpdate(req.user._id, { bio: bio });
  res.status(200).json({
    statsu: 'success',
  });
});

exports.skills = catchAsync(async (req, res, next) => {
  const skill = req.body.skill;
  const user = await User.findById(req.user._id);

  const updatedSkills = [...user.skills, skill];
  await User.findByIdAndUpdate(req.user._id, { skills: updatedSkills });
  res.status(200).json({
    statsu: 'success',
  });
});

exports.changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.correctPassword(currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong', 401));
  }

  user.password = newPassword;
  user.confirmPassword = confirmPassword;
  await user.save();
  const token = await createLoginToken(user._id);
  sendLoginTokenToCookie(res, token);
});

exports.visibility = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  console.log(user);

  if (!user) {
    return next(new AppError('There is no user with this credential', 400));
  }

  user.profile = !user.profile;
  await user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
  });
});

exports.purchase = catchAsync(async (req, res, next) => {
  const { type, logo } = req.body;
  console.log(logo);

  const unitAmount = type === 'advanced' ? 3500 : 2000; // Amount in cents
  const lineItems = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: type === 'advanced' ? 'Advanced Plan' : 'Basic Plan',
        },
        unit_amount: unitAmount,
      },
      quantity: 1,
    },
  ];

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: process.env.FRONTEND_URL,
    cancel_url: process.env.FRONTEND_URL,
    customer_email: req.user.email,
  });

  res.status(200).json({
    id: session.id,
  });
});

exports.monitor = catchAsync(async (req, res, next) => {
  const data = await User.find({ email: 'prozcollab.team@gmail.com' });
  res.status(200).json({
    status: 'success',
    data: data,
  });
});

exports.getDashboardAnalytics = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const user = await User.findById(userId);
  const { projectsCreated } = user;

  if (!projectsCreated || projectsCreated.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        numberOfProjects: 0,
        overallProjectProgress: 0,
        numberOfTasks: 0,
        overallTaskProgress: 0,
        projectDeadlines: [],
        taskDeadlines: [],
      },
    });
  }

  const projects = await Project.aggregate([
    {
      $match: {
        _id: {
          $in: projectsCreated.map((id) => new mongoose.Types.ObjectId(id)),
        },
      },
    },
    {
      $lookup: {
        from: 'tasks',
        localField: '_id',
        foreignField: 'projectId',
        as: 'tasks',
      },
    },
    {
      $project: {
        title: 1,
        deadline: 1,
        tasks: 1,
      },
    },
  ]);

  let totalProjectProgress = 0;
  let totalTaskProgress = 0;
  let totalTasks = 0;
  const projectDeadlines = [];
  const taskDeadlines = [];

  projects.forEach((project) => {
    let projectTaskProgressSum = 0;
    let projectTaskCount = project.tasks.length;

    project.tasks.forEach((task) => {
      const markedCount = task.taskMembers.filter(
        (member) => member.marked === true,
      ).length;
      const taskProgress = markedCount / task.taskMembers.length;

      projectTaskProgressSum += taskProgress;
      totalTaskProgress += taskProgress;
      totalTasks++;

      taskDeadlines.push({
        title: task.title,
        deadline: task.deadline,
      });
    });

    const projectProgress =
      projectTaskCount > 0
        ? (projectTaskProgressSum / projectTaskCount) * 100
        : 0;
    totalProjectProgress += projectProgress;

    projectDeadlines.push({
      title: project.title,
      deadline: project.deadline,
    });
  });

  const overallProjectProgress =
    projects.length > 0 ? totalProjectProgress / projects.length : 0;
  const overallTaskProgress =
    totalTasks > 0 ? (totalTaskProgress / totalTasks) * 100 : 0;

  res.status(200).json({
    status: 'success',
    data: {
      numberOfProjects: projects.length,
      overallProjectProgress: Math.round(overallProjectProgress * 100) / 100,
      numberOfTasks: totalTasks,
      overallTaskProgress: Math.round(overallTaskProgress * 100) / 100,
      projectDeadlines,
      taskDeadlines,
    },
  });
});
