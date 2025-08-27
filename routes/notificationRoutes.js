const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStats,
  createNotification,
  sendBulkNotifications
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Notification routes
router.get('/', getNotifications);
router.get('/stats', getNotificationStats);
router.put('/:notificationId/read', markAsRead);
router.put('/read-all', markAllAsRead);
router.delete('/:notificationId', deleteNotification);
router.post('/', createNotification);
router.post('/bulk', sendBulkNotifications);

module.exports = router;