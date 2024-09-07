const express = require('express');
const projectController = require('./../controller/projectController.js');
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
  projectController.getProjectToTrashToDelete,
  projectController.deleteProject,
);

router.patch(
  '/totrash/:projectId',
  projectController.getProjectToTrashToDelete,
  projectController.toTrash,
);

router.patch(
  '/outtrash/:projectId',
  projectController.getProjectToTrashToDelete,
  projectController.outTrash,
);

router.get(
  '/get-project-analytics/:projectId',
  projectController.getProjectAnalytics,
);

module.exports = router;
