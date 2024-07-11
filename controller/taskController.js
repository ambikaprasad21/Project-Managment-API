const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const catchAsync = require('../utils/catchAsync');
const Task = require('./../models/taskModel');
const AppError = require('./../utils/appError');

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
    name: 'images',
    maxCount: 5,
  },
  { name: 'pdfs', maxCount: 5 },
]);

exports.transformtaskmedia = async (req, res, next) => {
  if (!req.files) return next();

  // project intro video
  //   if (req.files.video) {
  //     const filename = `project-video-${req.user._id}-${Date.now()}.mp4`;
  //     fs.writeFile(
  //       `public/uploads/videos/${filename}`,
  //       req.files.video[0].buffer,
  //       (err) => {
  //         if (err) {
  //           throw new AppError(`can't uplaod file`);
  //         } else {
  //           console.log('file uplaoded successfully');
  //         }
  //       },
  //     );
  //     req.body.videofilename = filename;
  //     // console.log(req.body.videofilename);
  //   }

  // project images
  if (req.files.images) {
    req.body.images = [];

    await Promise.all(
      req.files.images.map(async (file, i) => {
        const filename = `task-images-${req.user._id}-${Date.now()}-${i + 1}.jpeg`;
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
      const filename = `task-pdfs-${req.user._id}-${Date.now()}-${i + 1}.pdf`;
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

exports.createTask = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  const { title, description, deadline, status, members, priorityLevel } =
    req.body;

  //in client side members will be an array of members id which will be present in the select and option html
  const task = await Task.create({
    title,
    description,
    deadline,
    status,
    priorityLevel,
    members,
    projectId,
  });

  req.body.id = task._id;
  next();
});

exports.getTaskById = catchAsync(async (req, res, next) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  if (!task) {
    return next(new AppError('There is no task Document with provided data'));
  }
  res.status(200).json({
    status: 'success',
    data: task,
  });
});
