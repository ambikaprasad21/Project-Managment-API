const express = require('express');
const messageController = require('./../controller/messageController');
const router = express.Router();

router.post('/:receiverId', messageController.message);
router.get('/', messageController.getMessages);
router.patch('/:messageId', messageController.markMessageAsRead);
router.delete('/:messageId', messageController.deleteMessage);
router.delete('/', messageController.deleteAllMessage);

module.exports = router;
