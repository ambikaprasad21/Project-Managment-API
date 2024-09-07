const express = require('express');
const taskController = require('./../controller/taskController');
const projectController = require('./../controller/projectController');
const authController = require('./../controller/authController');
const Task = require('./../models/taskModel');

const router = express.Router();

router.post(
  '/:projectId/new/task',
  taskController.uploadTaskMedia,
  taskController.createTask,
  projectController.transformProjectMedia(Task),
);

router.patch(
  '/:id/add-asset',
  taskController.uploadTaskMedia,
  projectController.transformProjectMedia(Task),
);

router.get('/:taskId', taskController.getTaskById);

router.get('/:projectId/get-all-task', taskController.getAllTask);

router.patch('/toggle-marked/:taskId', taskController.toggleMarked);

module.exports = router;
