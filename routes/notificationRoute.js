const express = require('express');
const notificationController = require('./../controller/notificationController');

const router = express.Router();

router.patch('/:notifiId', notificationController.markAsRead);
router.delete('/:notifiId', notificationController.deleteNotifi);
router.get('/', notificationController.getAllNotifi);

module.exports = router;
