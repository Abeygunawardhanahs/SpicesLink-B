const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  rater: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'raterModel'
  },
  raterModel: {
    type: String,
    required: true,
    enum: ['Buyer', 'Supplier']
  },
  ratee: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'rateeModel'
  },
  rateeModel: {
    type: String,
    required: true,
    enum: ['Buyer', 'Supplier']
  },
  
  // Rating Details
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  
  // Related Order/Transaction
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  
  // Categories for detailed rating
  categories: {
    quality: { type: Number, min: 1, max: 5 },
    delivery: { type: Number, min: 1, max: 5 },
    communication: { type: Number, min: 1, max: 5 },
    packaging: { type: Number, min: 1, max: 5 },
    value: { type: Number, min: 1, max: 5 }
  },
  
  // Status
  verified: {
    type: Boolean,
    default: false
  },
  
  // Response from ratee
  response: {
    message: String,
    timestamp: Date
  },
  
  // Helpful votes (for future use)
  helpfulVotes: {
    type: Number,
    default: 0
  },
  
  // Report status
  reported: {
    type: Boolean,
    default: false
  },
  reportReason: String
}, {
  timestamps: true
});

// Ensure one rating per order per rater
ratingSchema.index({ rater: 1, order: 1 }, { unique: true });

// Indexes for queries
ratingSchema.index({ ratee: 1, createdAt: -1 });
ratingSchema.index({ raterModel: 1, rateeModel: 1 });
ratingSchema.index({ rating: 1 });

// Calculate average rating for a user
ratingSchema.statics.getAverageRating = async function(userId, userModel) {
  const result = await this.aggregate([
    {
      $match: {
        ratee: userId,
        rateeModel: userModel,
        verified: true
      }
    },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalRatings: { $sum: 1 },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  if (result.length === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
  
  const data = result[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  data.ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });
  
  return {
    averageRating: Math.round(data.averageRating * 10) / 10,
    totalRatings: data.totalRatings,
    ratingDistribution: distribution
  };
};

// Get recent ratings
ratingSchema.statics.getRecentRatings = function(userId, userModel, limit = 10) {
  return this.find({
    ratee: userId,
    rateeModel: userModel,
    verified: true
  })
  .populate('rater', 'fullName')
  .populate('order', 'orderNumber')
  .sort({ createdAt: -1 })
  .limit(limit);
};

module.exports = mongoose.model('Rating', ratingSchema);