const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  // description: {
  //   type: String,
  //   default: '',
  //   maxlength: [500, 'Description cannot exceed 500 characters']
  // },
  // category: {
  //   type: String,
  //   default: 'Uncategorized',
  //   enum: ['Spices', 'Herbs', 'Seeds', 'Powders', 'Whole Spices', 'Blends', 'Other', 'Uncategorized']
  // },
  // REMOVED: image field - no longer needed
  
  // User identification fields
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required']
  },
  userName: {
    type: String,
    required: [true, 'User name is required'],
    trim: true,
    maxlength: [100, 'User name cannot exceed 100 characters']
  },
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    maxlength: [100, 'Shop name cannot exceed 100 characters']
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
    maxlength: [200, 'Location cannot exceed 200 characters']
  },
  userType: {
    type: String,
    required: [true, 'User type is required'],
    enum: ['Buyer', 'Supplier'],
    default: 'Buyer'
  },
  
  // Price History with enhanced structure
  priceHistory: [{
    pricePer100g: {
      type: String,
      default: '0'
    },
    weeklyQuantity: {
      type: String,
      default: '0'
    },
    date: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId
    },
    reason: {
      type: String,
      default: 'Price update'
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
productSchema.index({ userId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ 'priceHistory.date': -1 });
productSchema.index({ location: 1 }); // New index for location-based queries
productSchema.index({ shopName: 1 }); // New index for shop-based queries

// Pre-save middleware
productSchema.pre('save', async function(next) {
  next();
});

// Method to add price history manually
productSchema.methods.addPriceHistory = function(priceData, userId, reason = 'Manual price update') {
  this.priceHistory.push({
    pricePer100g: priceData.pricePer100g || '0',
    weeklyQuantity: priceData.weeklyQuantity || '0',
    date: new Date(),
    updatedBy: userId || this.userId,
    reason: reason
  });
  
  return this.save();
};

// Method to get recent price history
productSchema.methods.getRecentPriceHistory = function(limit = 10) {
  return this.priceHistory
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
};

// Static method to get price trends
productSchema.statics.getPriceTrends = function(productId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.findById(productId).select({
    priceHistory: {
      $elemMatch: {
        date: { $gte: startDate }
      }
    }
  });
};

module.exports = mongoose.model('Product', productSchema);