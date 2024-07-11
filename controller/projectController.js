const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
// const mongoose = require('mongoose');
const User = require('./../models/userModel');

// const ffmpegStatic = require('ffmpeg-static');
// const ffmpeg = require('fluent-ffmpeg');
// const streamifier = require('streamifier');

// // Tell fluent-ffmpeg where it can find FFmpeg
// ffmpeg.setFfmpegPath(ffmpegStatic);

const catchAsync = require('./../utils/catchAsync');
const Project = require('./../models/projectModel');
const AppError = require('./../utils/appError');
const Attachment = require('../models/attachmentModel');
const Notification = require('../models/notificationModel');

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

exports.uploadProjectMedia = upload.fields([
  { name: 'video', maxCount: 1 },
  {
    name: 'images',
    maxCount: 10,
  },
  { name: 'pdfs', maxCount: 10 },
]);

exports.createProject = catchAsync(async (req, res, next) => {
  //   console.log(req.body);
  const user = await User.findById(req.user._id);
  if (user.projectsCreated.length >= user.numberOfProjectsAllowed) {
    return next(
      new AppError('To create more projects you need an upgrade', 400),
    );
  }
  const { title, description } = req.body;
  const newProject = await Project.create({
    title: title,
    description: description,
    manager: req.user._id,
  });
  user.projectsCreated.push(newProject._id);
  // console.log(user.projectsCreated);
  await user.save({ validateBeforeSave: false });
  req.body.id = newProject._id;
  next();
});

exports.transformProjectMedia = async (req, res, next) => {
  if (!req.files) return next();
  // project intro video
  if (req.files.video) {
    const filename = `project-video-${req.user._id}-${Date.now()}.mp4`;
    fs.writeFile(
      `public/uploads/videos/${filename}`,
      req.files.video[0].buffer,
      (err) => {
        if (err) {
          throw new AppError(`can't uplaod file`);
        } else {
          console.log('file uplaoded successfully');
        }
      },
    );
    req.body.videofilename = filename;
    // console.log(req.body.videofilename);
  }

  // project images
  if (req.files.images) {
    req.body.images = [];

    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `project-images-${req.user._id}-${Date.now()}-${i + 1}.jpeg`;
        await sharp(file.buffer)
          .toFormat('jpeg')
          .jpeg({ quality: 90 })
          .toFile(`public/uploads/images/${filename}`);

        req.body.images.push(filename);
      }),
    );
    // console.log(req.body.images);
  }
  // project pdfs
  if (req.files.pdfs) {
    req.body.pdfs = [];

    req.files.pdfs.map(async (file, i) => {
      const filename = `project-pdfs-${req.user._id}-${Date.now()}-${i + 1}.pdf`;
      fs.writeFile(`public/uploads/pdfs/${filename}`, file.buffer, (err) => {
        if (err) {
          throw new AppError(`can't uplaod file`);
        } else {
          console.log('file uplaoded successfully');
        }
      });
      req.body.pdfs.push(filename);
    }),
      console.log(req.body.pdfs);
  }

  next();
};

exports.getProject = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);

  if (!project) {
    return next(
      new AppError('There is no project with the given information', 400),
    );
  }

  res.status(200).json({
    status: 'success',
    data: project,
  });
});

exports.getProjectToTrashToDelete = catchAsync(async (req, res, next) => {
  let { projectId } = req.params;
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('This project does not exist', 401));
  }
  if (!project.manager.equals(req.user._id)) {
    return next(
      new AppError('You do not have access to delete this project', 401),
    );
  }

  req.body.project = project;
  // console.log(project.members[0].user._id);
  next();
});

exports.toTrash = catchAsync(async (req, res, next) => {
  const project = req.body.project;
  project.trashed = true;
  await project.save();
  res.status(200).json({
    status: 'success',
    message: 'Moved project to trash',
  });
});

exports.outTrash = catchAsync(async (req, res, next) => {
  const project = req.body.project;
  project.trashed = false;
  await project.save();
  res.status(200).json({
    status: 'success',
    message: 'Moved out of trash',
  });
});

exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = req.body.project;

  await Attachment.findByIdAndDelete(project.attachments);

  await Promise.all(
    project.members.map(async (member) => {
      const user = await User.findById(member.user._id);
      user.projectIdAssigned = user.projectIdAssigned.filter(
        (el) => !el.equals(project._id),
      );
      const notify = await Notification.create({
        message: `This ${project.title} ❌ was deleted by Manager`,
        user: user._id,
      });
      // user.notifications.push(notify._id);
      await user.save({ validateBeforeSave: false });
    }),
  );

  await Project.findByIdAndDelete(project._id);
  req.user.projectsCreated = req.user.projectsCreated.filter(
    (el) => !el.equals(project._id),
  );

  await req.user.save({ validateBeforeSave: false });
  res.status(204).json({
    status: 'success',
    message: `deleted project ${project._id}`,
  });
});
