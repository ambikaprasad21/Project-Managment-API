const express = require('express');
// const multer = require('multer');

const authController = require('./../controller/authController.js');
const projectController = require('./../controller/projectController.js');
const attachmentController = require('./../controller/attachmentController.js');
const isLoginTokenPresent = require('../middleware/isLoginTokenPresent.js');
const Project = require('./../models/projectModel');
// const userController = require('./../controller/userController.js');

const router = express.Router();
// const upload = multer();

// router.use(authController.protect);

router.get('/get/:projectId', projectController.getProject);

router.post(
  '/create/new',
  projectController.uploadProjectMedia,
  projectController.createProject,
  projectController.transformProjectMedia,
  attachmentController.attachMedia(Project),
);

router.delete(
  '/delete/:projectId',
  isLoginTokenPresent,
  projectController.getProjectToTrashToDelete,
  projectController.deleteProject,
);

router.patch(
  '/totrash/:projectId',
  isLoginTokenPresent,
  projectController.getProjectToTrashToDelete,
  projectController.toTrash,
);

router.patch(
  '/outtrash/:projectId',
  isLoginTokenPresent,
  projectController.getProjectToTrashToDelete,
  projectController.outTrash,
);

module.exports = router;
