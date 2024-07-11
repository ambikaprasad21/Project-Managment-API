const express = require('express');
const commentController = require('./../controller/commentController');

const router = express.Router();

router.post('/:taskId', commentController.comment);
router.patch('/:commentId/update', commentController.editComment);
router.delete('/:commentId', commentController.deleteComment);
router.get('/:taskId', commentController.getComments);

module.exports = router;
