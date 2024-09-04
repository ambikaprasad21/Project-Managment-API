const express = require('express');
const authController = require('./../controller/authController');
const TaskMemberController = require('../controller/TaskMemberController');
const memberController = require('../controller/memberController');

const router = express.Router();

// router.use(authController.protect);

router.post('/:projectId/create', TaskMemberController.create);
router.patch('/:memberId', TaskMemberController.updateMember);

router.post('/add-member', memberController.addMember);
router.get('/get-all-members', memberController.getAllMembers);
router.patch('/update-member/:id', memberController.updateMember);
router.delete('/delete-member/:id', memberController.deletMember);

module.exports = router;
