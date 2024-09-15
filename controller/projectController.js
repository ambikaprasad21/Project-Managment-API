const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const Project = require('./../models/projectModel');
const Task = require('./../models/taskModel');
const Member = require('./../models/memberModel');
const AppError = require('./../utils/appError');
const Attachment = require('../models/attachmentModel');
const Notification = require('../models/notificationModel');
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

exports.uploadProjectMedia = upload.fields([
  { name: 'video', maxCount: 1 },
  {
    name: 'image',
    maxCount: 1,
  },
  { name: 'pdf', maxCount: 1 },
]);

const calculateTaskProgress = (task) => {
  const numberOfMembers = task.taskMembers.length;
  const totalMarked = task.taskMembers.filter((member) => member.marked).length;
  return numberOfMembers > 0 ? totalMarked / numberOfMembers : 0;
};

exports.createProject = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  // if (user.projectsCreated.length >= user.numberOfProjectsAllowed) {
  //   return next(
  //     new AppError('To create more projects you need an upgrade', 400),
  //   );
  // }
  const { title, description, deadline } = req.body;
  const managerName = `${user.firstName} ${user.lastName}`;
  const newProject = await Project.create({
    title: title,
    description: description,
    manager: req.user._id,
    managerName,
    deadline,
  });
  user.projectsCreated.push(newProject._id);
  await user.save({ validateBeforeSave: false });
  req.body.id = newProject._id;
  next();
});

exports.transformProjectMedia = (model) => {
  return async (req, res, next) => {
    const id = req.body.id || req.params.id;
    let modelName;
    if (model === Task) {
      modelName = 'task';
    } else if (model === Project) {
      modelName = 'project';
    } else {
      return next(new AppError('Invalid model type specified', 400));
    }
    const project = await model.findById(id);
    if (!req.files) {
      res.status(200).json({
        status: 'success',
        data: project,
      });
    }
    try {
      if (req.files.video) {
        const filename = `${modelName}-video-${req.user._id}-${Date.now()}.mp4`;
        fs.writeFile(
          `public/uploads/videos/${filename}`,
          req.files.video[0].buffer,
          (err) => {
            if (err) {
              throw new AppError(`can't uplaod file`);
            } else {
              console.log('file uplaoded successfully video');
            }
          },
        );
        project.video = filename;
      }

      // project images
      if (req.files.image) {
        const file = req.files.image[0];
        const originalName = file.originalname;
        const filename = `${modelName}-images-${req.user._id}-${Date.now()}.jpeg`;
        try {
          await sharp(file.buffer)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/uploads/images/${filename}`);

          project.images.unshift({
            location: filename,
            name: originalName,
          });
        } catch (err) {
          return next(new AppError(err.message, 401));
        }
      }
      // project pdfs
      if (req.files.pdf) {
        console.log(req.files.pdf);
        const file = req.files.pdf[0];
        const originalName = file.originalname;
        const filename = `${modelName}-pdfs-${req.user._id}-${Date.now()}.pdf`;
        fs.writeFile(`public/uploads/pdfs/${filename}`, file.buffer, (err) => {
          if (err) {
            throw new AppError(`can't uplaod file`);
          } else {
            console.log('file uplaoded successfully pdf');
          }
        });

        project.pdfs.unshift({
          location: filename,
          name: originalName,
        });
      }

      await project.save({ validateBeforeSave: false });

      if (req.body?.membersArray) {
        const { projectId } = req.params;
        const memberIds = req.body.membersArray;
        const members = await Member.find({ _id: { $in: memberIds } });
        const userIds = members.map((member) => member.user._id);
        await User.updateMany(
          { _id: { $in: userIds } },
          { $addToSet: { projectIdAssigned: projectId } },
        );

        const users = await User.find({ _id: { $in: userIds } }).select(
          'firstName',
        );
        const projectTitle = await Project.findById(projectId).select('title');

        for (const user of users) {
          const text = `Hey ${user.firstName}! 🎉 You've been handpicked for an exciting new project: "${projectTitle.title}". Time to showcase your skills! 🚀`;

          const notification = await Notification.create({
            user: user._id,
            text,
          });
        }
      }

      res.status(200).json({
        status: 'success',
        data: project,
      });
    } catch (err) {
      await model.findByIdAndDelete(req.body.id);
      const user = await User.findById(req.user._id);
      user.projectsCreated = user.projectsCreated.filter(
        (item) => !item.equals(req.body.id),
      );
      await user.save({ validateBeforeSave: false });
      return next(
        new AppError('There was error uploading the media, try again', 400),
      );
    }
  };
};

exports.removeAsset = (model) => {
  return catchAsync(async (req, res, next) => {
    const { modelId, fileLocation } = req.params;

    let modelName;
    if (model === Task) {
      modelName = 'task';
    } else if (model === Project) {
      modelName = 'project';
    } else {
      return next(new AppError('Invalid model type specified', 400));
    }

    const doc = await model.findById(modelId);
    if (!doc) {
      return next(new AppError(`No ${model} found with that ID`, 404));
    }

    let fileArray, folderPath;
    if (fileLocation.startsWith(`${modelName}-images`)) {
      fileArray = doc.images;
      folderPath = 'public/uploads/images';
    } else if (fileLocation.startsWith(`${modelName}-pdfs`)) {
      fileArray = doc.pdfs;
      folderPath = 'public/uploads/pdfs';
    } else {
      return next(new AppError('Invalid file name', 400));
    }
    const fileIndex = fileArray.findIndex((file) =>
      file.location.includes(fileLocation),
    );
    if (fileIndex === -1) {
      return next(new AppError('File not found in the model', 404));
    }
    fileArray.splice(fileIndex, 1);
    await doc.save({ validateBeforeSave: false });
    const filePath = `${path.resolve(__dirname, `../${folderPath}`)}/${fileLocation}`;
    fs.unlink(filePath, (err) => {
      if (err) {
        return next(
          new AppError('Error deleting the file from the server', 500),
        );
      }

      // Only send the response after the file has been successfully deleted
      res.status(200).json({
        status: 'success',
        message: 'File removed successfully',
      });
    });
  });
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

exports.getAllProject = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const projects = await Project.find({
    manager: userId,
    trashed: false,
  }).populate('tasks');

  const projectWithProgress = projects.map((project) => {
    let totalTaskProgress = 0;

    project.tasks.forEach((task) => {
      const taskProgress = calculateTaskProgress(task);
      totalTaskProgress += taskProgress;
    });

    const projectProgress =
      project.tasks.length > 0
        ? (totalTaskProgress / project.tasks.length) * 100
        : 0;

    return {
      ...project.toObject(),
      progress: Math.round(projectProgress),
    };
  });

  res.status(200).json({
    status: 'success',
    data: projectWithProgress,
  });
});

exports.getAllAssignedProjects = catchAsync(async (req, res, next) => {
  const projectIdAssigned = req.user.projectIdAssigned;
  const projects = await Project.find({
    _id: { $in: projectIdAssigned },
    trashed: false,
  }).populate('tasks');

  const projectWithProgress = projects.map((project) => {
    let totalTaskProgress = 0;

    project.tasks.forEach((task) => {
      const taskProgress = calculateTaskProgress(task);
      totalTaskProgress += taskProgress;
    });

    const projectProgress =
      project.tasks.length > 0
        ? (totalTaskProgress / project.tasks.length) * 100
        : 0;
    return {
      ...project.toObject(),
      progress: Math.round(projectProgress),
    };
  });

  res.status(200).json({
    status: 'success',
    data: projectWithProgress,
  });
});

exports.getProjectToTrashToDelete = catchAsync(async (req, res, next) => {
  let { projectId } = req.params;
  const project = await Project.findById(projectId).populate({
    path: 'tasks',
    select: 'this.taskMembers',
  });
  if (!project) {
    return next(new AppError('This project does not exist', 401));
  }
  if (!project.manager.equals(req.user._id)) {
    return next(
      new AppError('You do not have access to delete this project', 401),
    );
  }

  req.body.project = project;
  next();
});

exports.toTrash = catchAsync(async (req, res, next) => {
  const project = req.body.project;
  project.trashed = true;
  await project.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
    message: 'Moved project to trash',
  });
});

exports.outTrash = catchAsync(async (req, res, next) => {
  const project = req.body.project;
  project.trashed = false;
  await project.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
    message: 'Moved out of trash',
  });
});

exports.getTrashedProjects = catchAsync(async (req, res, next) => {
  const userId = req.user._id;
  const projects = await Project.find({
    manager: userId,
    trashed: true,
  }).select('title');
  res.status(200).json({
    status: 'success',
    data: projects,
  });
});

exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = req.body.project;

  const allMembers = [];

  project.tasks.forEach((task) => {
    task.taskMembers.forEach((taskMember) => {
      allMembers.push(taskMember.member.user._id);
    });
  });

  const uniqueUserIds = [...new Set(allMembers)];

  console.log(uniqueUserIds);
  await Promise.all(
    uniqueUserIds.map(async (userId) => {
      const user = await User.findById(userId);
      user.projectIdAssigned = user.projectIdAssigned.filter(
        (el) => !el.equals(project._id),
      );
      const notify = await Notification.create({
        text: `❌ This ${project.title} project was deleted by Manager`,
        user: userId,
      });
      await user.save({ validateBeforeSave: false });
    }),
  );

  await Task.deleteMany({ projectId: project._id });

  await Project.findByIdAndDelete(project._id);
  req.user.projectsCreated = req.user.projectsCreated.filter(
    (el) => !el.equals(project._id),
  );

  await req.user.save({ validateBeforeSave: false });
  res.status(200).json({
    status: 'success',
    message: `deleted project ${project._id}`,
  });
});

exports.updateProject = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;
  const { title, description, deadline } = req.body;

  const updatedFields = {};
  if (title) updatedFields.title = title;
  if (description) updatedFields.description = description;
  if (deadline) updatedFields.deadline = deadline;

  const updatedProject = await Project.findByIdAndUpdate(
    projectId,
    updatedFields,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!updatedProject) {
    return next(new AppError('No project found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: updatedProject,
  });
});

exports.getProjectAnalytics = catchAsync(async (req, res, next) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId)
    .populate({
      path: 'tasks',
      populate: {
        path: 'taskMembers.member',
        populate: {
          path: 'user',
          select: 'email firstName lastName photo',
        },
      },
    })
    .exec();

  if (!project) {
    return next(new AppError('Project not found.', 404));
  }

  let totalTaskCount = 0;
  let completedTasks = 0;
  let pendingTasks = 0;
  let inProgressTasks = 0;
  let lowPriorityCountTask = 0;
  let mediumPriorityCountTask = 0;
  let highPriorityTask = 0;
  let totalTaskProgress = 0;

  const tasks = project.tasks.map((task) => {
    totalTaskCount++;

    const totalMembers = task.taskMembers.length;
    const completedMembers = task.taskMembers.filter(
      (taskMember) => taskMember.marked,
    ).length;

    const taskProgress =
      totalMembers > 0
        ? Math.round((completedMembers / totalMembers) * 100)
        : 0;
    totalTaskProgress += taskProgress;

    if (taskProgress === 100) {
      completedTasks++;
    } else if (taskProgress > 0 && taskProgress < 100) {
      inProgressTasks++;
    } else {
      pendingTasks++;
    }

    switch (task.priorityLevel) {
      case 'Low':
        lowPriorityCountTask++;
        break;
      case 'Medium':
        mediumPriorityCountTask++;
        break;
      case 'High':
        highPriorityTask++;
        break;
      default:
        break;
    }

    const members = task.taskMembers.map((taskMember) => {
      if (taskMember.member && taskMember.member.user) {
        const user = taskMember.member.user;
        return {
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        };
      }
      return {};
    });

    return {
      id: task._id,
      title: task.title,
      deadline: task.deadline,
      progress: taskProgress,
      members,
    };
  });

  const projectProgress =
    totalTaskCount > 0 ? Math.round(totalTaskProgress / totalTaskCount) : 0;

  res.status(200).json({
    status: 'success',
    data: {
      totalTask: totalTaskCount,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      lowPriorityCountTask,
      mediumPriorityCountTask,
      highPriorityTask,
      projectTitle: project.title,
      projectDescription: project.description,
      managerName: project.managerName,
      projectDeadline: project.deadline,
      projectProgress,
      tasks,
    },
  });
});
