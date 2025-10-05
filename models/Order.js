const mongoose = require('mongoose');

// Sub-schema for order items
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  priceAtTime: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  }
});
// Main schema for orders.
const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
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
  items: [orderItemSchema],
  
  // Order Details
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'rejected'],
    default: 'pending'
  },
  
  // Shipping Information
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'Sri Lanka' },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Payment Information
  payment: {
    method: {
      type: String,
      enum: ['stripe', 'cash_on_delivery', 'bank_transfer'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    stripePaymentIntentId: String,
    transactionId: String,
    paidAmount: Number,
    paymentDate: Date
  },
  
  // Tracking
  trackingNumber: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  
  // Communication
  notes: String,
  buyerNotes: String,
  supplierNotes: String,
  
  // Ratings 
  buyerRating: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    date: Date
  },
  supplierRating: {
    rating: { type: Number, min: 1, max: 5 },
    comment: String,
    date: Date
  },
  
  // Status History
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'statusHistory.updatedByModel'
    },
    updatedByModel: {
      type: String,
      enum: ['Buyer', 'Supplier', 'Admin']
    },
    notes: String
  }]
}, {
  timestamps: true
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Add status to history when status changes
orderSchema.pre('save', function(next) {
  if (this.isModified('status') && !this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      notes: 'Status updated'
    });
  }
  next();
});

// Indexes
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ supplier: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });

module.exports = mongoose.model('Order', orderSchema);