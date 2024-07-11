const express = require('express');
const taskController = require('./../controller/taskController');
const attachmentController = require('./../controller/attachmentController');
const authController = require('./../controller/authController');
const Task = require('./../models/taskModel');

const router = express.Router();

// router.use(authController.protect);

router.post(
  '/:projectId/new/task',
  taskController.uploadTaskMedia,
  taskController.createTask,
  taskController.transformtaskmedia,
  attachmentController.attachMedia(Task),
);

router.get('/:taskId', taskController.getTaskById);

module.exports = router;
