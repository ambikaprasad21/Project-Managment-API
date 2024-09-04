const express = require('express');

const authController = require('./../controller/authController.js');
const projectController = require('./../controller/projectController.js');
const attachmentController = require('./../controller/attachmentController.js');
const isLoginTokenPresent = require('../middleware/isLoginTokenPresent.js');
const Project = require('./../models/projectModel');

const router = express.Router();

router.get('/get/:projectId', projectController.getProject);

router.get('/get-all-project', projectController.getAllProject);

router.post(
  '/create/new',
  projectController.uploadProjectMedia,
  projectController.createProject,
  projectController.transformProjectMedia(Project),
);

router.patch(
  '/:id/add-asset',
  projectController.uploadProjectMedia,
  projectController.transformProjectMedia(Project),
);

router.delete(
  '/delete/:projectId',
  // isLoginTokenPresent,
  projectController.getProjectToTrashToDelete,
  projectController.deleteProject,
);

router.patch(
  '/totrash/:projectId',
  // isLoginTokenPresent,
  projectController.getProjectToTrashToDelete,
  projectController.toTrash,
);

router.patch(
  '/outtrash/:projectId',
  // isLoginTokenPresent,
  projectController.getProjectToTrashToDelete,
  projectController.outTrash,
);

router.get(
  '/get-project-analytics/:projectId',
  projectController.getProjectAnalytics,
);

module.exports = router;
