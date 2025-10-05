const mongoose = require('mongoose');

// Define the rating schema to store ratings for buyers and suppliers
const ratingSchema = new mongoose.Schema({
  rater: { // The user giving the rating
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'raterModel'
  },
  raterModel: {
    type: String,
    required: true,
    enum: ['Buyer', 'Supplier']
  },
  ratee: { // The user being rated
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
    maxlength: 500,
    default: ''
  },
  
  // Related Order/Transaction (optional)
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: false
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
    default: true
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

// Compound index to ensure one rating per rater-ratee combination
ratingSchema.index({ rater: 1, ratee: 1, raterModel: 1, rateeModel: 1 }, { unique: true });

// Indexes for queries
ratingSchema.index({ ratee: 1, rateeModel: 1, createdAt: -1 });
ratingSchema.index({ rater: 1, raterModel: 1, createdAt: -1 });
ratingSchema.index({ rating: 1 });
ratingSchema.index({ verified: 1 });

// Calculate average rating for a user
ratingSchema.statics.getAverageRating = async function(userId, userModel) {
  try {
    const result = await this.aggregate([
      {
        $match: {
          ratee: new mongoose.Types.ObjectId(userId),
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

    // If no ratings, return defaults
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
  } catch (error) {
    console.error('Error calculating average rating:', error);
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
};

// Get recent verified ratings
ratingSchema.statics.getRecentRatings = function(userId, userModel, limit = 10) {
  return this.find({
    ratee: new mongoose.Types.ObjectId(userId),
    rateeModel: userModel,
    verified: true
  })
  .populate('rater', 'fullName name')
  .populate('order', 'orderNumber')
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Get rating summary for a user
ratingSchema.statics.getRatingSummary = async function(userId, userModel) {
  try {
    const [averageData, recentRatings] = await Promise.all([
      this.getAverageRating(userId, userModel),
      this.getRecentRatings(userId, userModel, 5)
    ]);

    return {
      ...averageData,
      recentRatings
    };
  } catch (error) {
    console.error('Error getting rating summary:', error);
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      recentRatings: []
    };
  }
};

// Pre-save hook to prevent self-rating
ratingSchema.pre('save', function(next) {
  if (this.rater.toString() === this.ratee.toString()) {
    const error = new Error('Users cannot rate themselves');
    error.status = 400;
    return next(error);
  }
  next();
});

module.exports = mongoose.model('Rating', ratingSchema);