const express = require('express');
const authController = require('./../controller/authController');
const memberController = require('./../controller/memberController');

const router = express.Router();

// router.use(authController.protect);

router.post('/:projectId/create', memberController.create);
router.patch('/:memberId', memberController.updateMember);

module.exports = router;
