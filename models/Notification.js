const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'recipientModel'
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['Buyer', 'Supplier']
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'senderModel'
  },
  senderModel: {
    type: String,
    enum: ['Buyer', 'Supplier', 'Admin']
  },
  
  // Notification Content
  type: {
    type: String,
    required: true,
    enum: [
      'order_created',
      'order_confirmed', 
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'reservation_received',
      'reservation_accepted',
      'reservation_rejected',
      'payment_successful',
      'payment_failed',
      'rating_received',
      'price_updated',
      'stock_low',
      'general'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  
  // Related Data
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedReservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation'
  },
  relatedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  
  // Status
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  
  // Push notification
  pushSent: {
    type: Boolean,
    default: false
  },
  pushSentAt: Date,
  
  // Email notification
  emailSent: {
    type: Boolean,
    default: false
  },
  emailSentAt: Date,
  
  // Additional data
  data: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ priority: 1 });

// Mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // TODO: Send push notification
  // TODO: Send email if required
  
  return notification;
};

// Static method to get unread count
notificationSchema.statics.getUnreadCount = function(userId, userModel) {
  return this.countDocuments({
    recipient: userId,
    recipientModel: userModel,
    read: false
  });
};

module.exports = mongoose.model('Notification', notificationSchema);