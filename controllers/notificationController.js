const Notification = require('../models/Notification');

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 20, unreadOnly = false, type } = req.query;

    // Build query
    const query = {
      recipient: userId,
      recipientModel: userRole === 'buyer' ? 'Buyer' : 'Supplier'
    };

    if (unreadOnly === 'true') {
      query.read = false;
    }

    if (type) {
      query.type = type;
    }

    const skip = (page - 1) * limit;

    const notifications = await Notification.find(query)
      .populate('sender', 'fullName')
      .populate('relatedOrder', 'orderNumber status')
      .populate('relatedReservation', 'reservationNumber status')
      .populate('relatedProduct', 'name price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId, userRole === 'buyer' ? 'Buyer' : 'Supplier');

    res.json({
      success: true,
      notifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      unreadCount
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await notification.markAsRead();

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    await Notification.updateMany(
      {
        recipient: userId,
        recipientModel: userRole === 'buyer' ? 'Buyer' : 'Supplier',
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns this notification
    if (notification.recipient.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({
      success: true,
      message: 'Notification deleted'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const stats = await Notification.aggregate([
      {
        $match: {
          recipient: userId,
          recipientModel: userRole === 'buyer' ? 'Buyer' : 'Supplier'
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unread: {
            $sum: {
              $cond: [{ $eq: ['$read', false] }, 1, 0]
            }
          }
        }
      }
    ]);

    const totalNotifications = await Notification.countDocuments({
      recipient: userId,
      recipientModel: userRole === 'buyer' ? 'Buyer' : 'Supplier'
    });

    const unreadCount = await Notification.getUnreadCount(
      userId, 
      userRole === 'buyer' ? 'Buyer' : 'Supplier'
    );

    res.json({
      success: true,
      statistics: {
        total: totalNotifications,
        unread: unreadCount,
        typeBreakdown: stats
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification statistics',
      error: error.message
    });
  }
};

// Create notification (admin/system use)
exports.createNotification = async (req, res) => {
  try {
    const {
      recipient,
      recipientModel,
      type,
      title,
      message,
      priority = 'medium',
      data
    } = req.body;

    const notification = await Notification.createNotification({
      recipient,
      recipientModel,
      sender: req.user.id,
      senderModel: req.user.role === 'buyer' ? 'Buyer' : 'Supplier',
      type,
      title,
      message,
      priority,
      data
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

// Send bulk notifications
exports.sendBulkNotifications = async (req, res) => {
  try {
    const {
      recipients, // Array of {id, model}
      type,
      title,
      message,
      priority = 'medium',
      data
    } = req.body;

    const notifications = [];
    
    for (const recipient of recipients) {
      const notification = await Notification.createNotification({
        recipient: recipient.id,
        recipientModel: recipient.model,
        sender: req.user.id,
        senderModel: req.user.role === 'buyer' ? 'Buyer' : 'Supplier',
        type,
        title,
        message,
        priority,
        data
      });
      notifications.push(notification);
    }

    res.json({
      success: true,
      message: `${notifications.length} notifications sent successfully`,
      count: notifications.length
    });

  } catch (error) {
    console.error('Send bulk notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send bulk notifications',
      error: error.message
    });
  }
};

// No need for module.exports = exports, we're using individual exports