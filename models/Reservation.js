const mongoose = require('mongoose');

const reservationItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  requestedQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  proposedPrice: {
    type: Number,
    required: true,
    min: 0
  },
  notes: String
});

const reservationSchema = new mongoose.Schema({
  reservationNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Parties
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer',
    required: true
  },
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  
  // Items
  items: [reservationItemSchema],
  
  // Status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired', 'converted_to_order'],
    default: 'pending'
  },
  
  // Pricing
  totalEstimatedAmount: {
    type: Number,
    required: true
  },
  
  // Delivery Information
  requestedDeliveryDate: {
    type: Date,
    required: true
  },
  proposedDeliveryDate: Date,
  
  // Location
  deliveryAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'Sri Lanka' },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Communication
  buyerNotes: String,
  supplierNotes: String,
  
  // Expiry
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  
  // Response details
  respondedAt: Date,
  responseNotes: String,
  
  // Conversion to order
  convertedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  convertedAt: Date,
  
  // Terms and Conditions
  terms: {
    paymentTerms: String,
    deliveryTerms: String,
    qualityRequirements: String,
    cancellationPolicy: String
  },
  
  // Priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Pre-save middleware to generate reservation number
reservationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Reservation').countDocuments();
    this.reservationNumber = `RES-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Mark as responded when status changes from pending
reservationSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.respondedAt) {
    this.respondedAt = new Date();
  }
  next();
});

// Indexes
reservationSchema.index({ buyer: 1, createdAt: -1 });
reservationSchema.index({ supplier: 1, createdAt: -1 });
reservationSchema.index({ reservationNumber: 1 });
reservationSchema.index({ status: 1 });
reservationSchema.index({ expiresAt: 1 });

// Methods
reservationSchema.methods.accept = async function(supplierNotes, proposedDeliveryDate) {
  this.status = 'accepted';
  this.supplierNotes = supplierNotes;
  this.proposedDeliveryDate = proposedDeliveryDate;
  this.respondedAt = new Date();
  
  await this.save();
  
  // Create notification for buyer
  const Notification = mongoose.model('Notification');
  await Notification.createNotification({
    recipient: this.buyer,
    recipientModel: 'Buyer',
    sender: this.supplier,
    senderModel: 'Supplier',
    type: 'reservation_accepted',
    title: 'Reservation Accepted',
    message: `Your reservation ${this.reservationNumber} has been accepted by the supplier.`,
    relatedReservation: this._id
  });
  
  return this;
};

reservationSchema.methods.reject = async function(supplierNotes) {
  this.status = 'rejected';
  this.supplierNotes = supplierNotes;
  this.respondedAt = new Date();
  
  await this.save();
  
  // Create notification for buyer
  const Notification = mongoose.model('Notification');
  await Notification.createNotification({
    recipient: this.buyer,
    recipientModel: 'Buyer',
    sender: this.supplier,
    senderModel: 'Supplier',
    type: 'reservation_rejected',
    title: 'Reservation Rejected',
    message: `Your reservation ${this.reservationNumber} has been rejected by the supplier.`,
    relatedReservation: this._id
  });
  
  return this;
};

reservationSchema.methods.convertToOrder = async function() {
  const Order = mongoose.model('Order');
  
  const orderItems = this.items.map(item => ({
    product: item.product,
    quantity: item.availableQuantity,
    priceAtTime: item.proposedPrice,
    subtotal: item.availableQuantity * item.proposedPrice
  }));
  
  const totalAmount = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  
  const order = new Order({
    buyer: this.buyer,
    supplier: this.supplier,
    items: orderItems,
    totalAmount,
    shippingAddress: this.deliveryAddress,
    estimatedDelivery: this.proposedDeliveryDate,
    notes: `Converted from reservation ${this.reservationNumber}`,
    payment: {
      method: 'stripe', // Default, can be changed
      status: 'pending'
    }
  });
  
  await order.save();
  
  this.status = 'converted_to_order';
  this.convertedOrder = order._id;
  this.convertedAt = new Date();
  await this.save();
  
  // Create notification for both parties
  const Notification = mongoose.model('Notification');
  await Notification.createNotification({
    recipient: this.buyer,
    recipientModel: 'Buyer',
    sender: this.supplier,
    senderModel: 'Supplier',
    type: 'order_created',
    title: 'Order Created',
    message: `Your reservation ${this.reservationNumber} has been converted to order ${order.orderNumber}.`,
    relatedOrder: order._id
  });
  
  return order;
};

// Static method to expire old reservations
reservationSchema.statics.expireOldReservations = async function() {
  const result = await this.updateMany(
    {
      status: 'pending',
      expiresAt: { $lt: new Date() }
    },
    {
      status: 'expired'
    }
  );
  
  return result.modifiedCount;
};

module.exports = mongoose.model('Reservation', reservationSchema);