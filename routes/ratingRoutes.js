const express = require('express');
const router = express.Router();
const Rating = require('../models/Rating');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Create rating
router.post('/', async (req, res) => {
  try {
    const {
      rating,
      comment,
      order,
      ratee,
      rateeModel,
      categories
    } = req.body;

    const userId = req.user.id;
    const userModel = req.user.role === 'supplier' ? 'Supplier' : 'Buyer';

    // Check if user already rated this order
    const existingRating = await Rating.findOne({
      rater: userId,
      order: order
    });

    if (existingRating) {
      return res.status(400).json({
        success: false,
        message: 'You have already rated this order'
      });
    }

    const newRating = new Rating({
      rater: userId,
      raterModel: userModel,
      ratee,
      rateeModel,
      rating,
      comment,
      order,
      categories,
      verified: true // Auto-verify for now
    });

    await newRating.save();

    // Populate the rating for response
    await newRating.populate([
      { path: 'rater', select: 'fullName' },
      { path: 'ratee', select: 'fullName' },
      { path: 'order', select: 'orderNumber' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Rating submitted successfully',
      rating: newRating
    });

  } catch (error) {
    console.error('Create rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create rating',
      error: error.message
    });
  }
});

// Get ratings for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { userModel = 'Supplier', page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const ratings = await Rating.find({
      ratee: userId,
      rateeModel: userModel,
      verified: true
    })
    .populate('rater', 'fullName')
    .populate('order', 'orderNumber')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const averageData = await Rating.getAverageRating(userId, userModel);

    const total = await Rating.countDocuments({
      ratee: userId,
      rateeModel: userModel,
      verified: true
    });

    res.json({
      success: true,
      ratings,
      average: averageData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ratings',
      error: error.message
    });
  }
});

// Get my ratings (ratings I gave)
router.get('/my-ratings', async (req, res) => {
  try {
    const userId = req.user.id;
    const userModel = req.user.role === 'supplier' ? 'Supplier' : 'Buyer';
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const ratings = await Rating.find({
      rater: userId,
      raterModel: userModel
    })
    .populate('ratee', 'fullName')
    .populate('order', 'orderNumber status')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

    const total = await Rating.countDocuments({
      rater: userId,
      raterModel: userModel
    });

    res.json({
      success: true,
      ratings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get my ratings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your ratings',
      error: error.message
    });
  }
});

// Update rating (add response)
router.put('/:ratingId/response', async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { message } = req.body;
    const userId = req.user.id;

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    // Check if user is the ratee (can respond to ratings about them)
    if (rating.ratee.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    rating.response = {
      message,
      timestamp: new Date()
    };

    await rating.save();

    res.json({
      success: true,
      message: 'Response added successfully',
      rating
    });

  } catch (error) {
    console.error('Add rating response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add response',
      error: error.message
    });
  }
});

// Report rating
router.put('/:ratingId/report', async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { reason } = req.body;

    const rating = await Rating.findById(ratingId);
    if (!rating) {
      return res.status(404).json({
        success: false,
        message: 'Rating not found'
      });
    }

    rating.reported = true;
    rating.reportReason = reason;
    await rating.save();

    res.json({
      success: true,
      message: 'Rating reported successfully'
    });

  } catch (error) {
    console.error('Report rating error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to report rating',
      error: error.message
    });
  }
});

module.exports = router;