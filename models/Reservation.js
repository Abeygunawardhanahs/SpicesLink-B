const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxLength: [100, 'Name cannot exceed 100 characters']
  },
  mobileNo: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true,
    validate: {
      validator: function(v) {
        return /^\+?[\d\s\-\(\)]{10,15}$/.test(v);
      },
      message: 'Please enter a valid mobile number'
    }
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxLength: [200, 'Location cannot exceed 200 characters']
  },

  // Product Information
  spiceName: {
    type: String,
    required: [true, 'Spice name is required'],
    trim: true
  },
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  totalQuantity: {
    type: Number,
    required: [true, 'Total quantity is required'],
    min: [0.1, 'Quantity must be at least 0.1 kg'],
    max: [10000, 'Quantity cannot exceed 10000 kg']
  },
  qualityGrade: {
    type: String,
    trim: true,
    default: 'Standard'
  },

  // Delivery & Payment
  deliveryDate: {
    type: Date,
    validate: {
      validator: function(v) {
        return !v || v > new Date();
      },
      message: 'Delivery date must be in the future'
    }
  },
  paymentMethod: {
    type: String,
    required: [true, 'Payment method is required'],
    enum: {
      values: ['advance', 'cod'],
      message: 'Payment method must be either advance or cod'
    }
  },
  advancePayment: {
    type: Boolean,
    default: false
  },
  cashOnDelivery: {
    type: Boolean,
    default: false
  },

  // Bank Details (optional, only for advance payment)
  bankDetails: {
    accountNumber: {
      type: String,
      trim: true
    },
    bankName: {
      type: String,
      trim: true
    },
    branchHolderName: {
      type: String,
      trim: true
    }
  },

  // Relations - Compatible with your existing User models
  supplier: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: [true, 'Supplier is required']
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Buyer'
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },

  // Shop Information
  shopInfo: {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier'
    },
    shopName: String,
    shopLocation: String
  },

  // Status and Metadata
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  notes: {
    type: String,
    maxLength: [500, 'Notes cannot exceed 500 characters']
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // Response from supplier
  supplierResponse: {
    respondedAt: Date,
    message: String,
    estimatedPrice: Number,
    counterOffer: {
      quantity: Number,
      pricePerKg: Number,
      deliveryDate: Date
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
reservationSchema.index({ supplier: 1, createdAt: -1 });
reservationSchema.index({ status: 1, createdAt: -1 });
reservationSchema.index({ mobileNo: 1 });
reservationSchema.index({ 'shopInfo.shopId': 1 });

// Virtual for total estimated cost
reservationSchema.virtual('estimatedTotalCost').get(function() {
  if (this.supplierResponse && this.supplierResponse.estimatedPrice) {
    return this.totalQuantity * this.supplierResponse.estimatedPrice;
  }
  return null;
});

// Pre-save middleware to update timestamps and set bank details
reservationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Set bank details object based on payment method
  if (this.paymentMethod === 'advance') {
    this.advancePayment = true;
    this.cashOnDelivery = false;
  } else if (this.paymentMethod === 'cod') {
    this.cashOnDelivery = true;
    this.advancePayment = false;
    // Clear bank details for COD
    this.bankDetails = {
      accountNumber: '',
      bankName: '',
      branchHolderName: ''
    };
  }
  
  next();
});

// Static methods
reservationSchema.statics.getSupplierReservations = function(supplierId, status = null) {
  const query = { supplier: supplierId };
  if (status) query.status = status;
  
  return this.find(query)
    .populate('buyer', 'name email mobileNo')
    .populate('product', 'name category')
    .sort({ createdAt: -1 });
};

reservationSchema.statics.getBuyerReservations = function(buyerId) {
  return this.find({ buyer: buyerId })
    .populate('supplier', 'businessName location contactNumber')
    .populate('product', 'name category')
    .sort({ createdAt: -1 });
};

// Instance methods
reservationSchema.methods.updateStatus = function(newStatus, supplierMessage = null) {
  this.status = newStatus;
  this.updatedAt = Date.now();
  
  if (supplierMessage && ['accepted', 'rejected'].includes(newStatus)) {
    this.supplierResponse = {
      respondedAt: new Date(),
      message: supplierMessage
    };
  }
  
  return this.save();
};

module.exports = mongoose.model('Reservation', reservationSchema);