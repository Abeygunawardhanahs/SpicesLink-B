// const express = require('express');
// const router = express.Router();
// const mongoose = require('mongoose');
// const Rating = require('../models/Rating');
// const { authenticate } = require('../middleware/auth');

// // All routes require authentication
// router.use(authenticate);

// // Create or update rating
// router.post('/', async (req, res) => {
//   try {
//     const {
//       rating,
//       comment,
//       ratee,
//       rateeModel,
//       categories
//     } = req.body;

//     const userId = req.user.id;
//     const userModel = req.user.role === 'supplier' ? 'Supplier' : 'Buyer';

//     // Validate required fields
//     if (!rating || !ratee || !rateeModel) {
//       return res.status(400).json({
//         success: false,
//         message: 'Rating, ratee, and rateeModel are required'
//       });
//     }

//     if (rating < 1 || rating > 5) {
//       return res.status(400).json({
//         success: false,
//         message: 'Rating must be between 1 and 5'
//       });
//     }

//     // Check if rating already exists for this rater-ratee combination
//     const existingRating = await Rating.findOne({
//       rater: userId,
//       raterModel: userModel,
//       ratee: ratee,
//       rateeModel: rateeModel
//     });

//     let result;
    
//     if (existingRating) {
//       // Update existing rating
//       existingRating.rating = rating;
//       existingRating.comment = comment || '';
//       existingRating.categories = categories || {};
//       existingRating.verified = true;
//       result = await existingRating.save();
      
//       await result.populate([
//         { path: 'rater', select: 'fullName name' },
//         { path: 'ratee', select: 'fullName name' }
//       ]);

//       return res.json({
//         success: true,
//         message: 'Rating updated successfully',
//         rating: result
//       });
//     } else {
//       // Create new rating
//       const newRating = new Rating({
//         rater: userId,
//         raterModel: userModel,
//         ratee,
//         rateeModel,
//         rating,
//         comment: comment || '',
//         categories: categories || {},
//         verified: true
//       });

//       result = await newRating.save();
      
//       await result.populate([
//         { path: 'rater', select: 'fullName name' },
//         { path: 'ratee', select: 'fullName name' }
//       ]);

//       return res.status(201).json({
//         success: true,
//         message: 'Rating submitted successfully',
//         rating: result
//       });
//     }

//   } catch (error) {
//     console.error('Create/Update rating error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to process rating',
//       error: error.message
//     });
//   }
// });

// // Get ratings for a specific user (supplier/buyer)
// router.get('/user/:userId', async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const { userModel = 'Supplier', page = 1, limit = 10 } = req.query;

//     if (!mongoose.Types.ObjectId.isValid(userId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid user ID'
//       });
//     }

//     const skip = (page - 1) * limit;

//     // Get ratings for the user
//     const ratings = await Rating.find({
//       ratee: userId,
//       rateeModel: userModel,
//       verified: true
//     })
//     .populate('rater', 'fullName name shopName email')
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(parseInt(limit));

//     // Get average rating and statistics
//     const averageData = await Rating.getAverageRating(userId, userModel);

//     const total = await Rating.countDocuments({
//       ratee: userId,
//       rateeModel: userModel,
//       verified: true
//     });

//     res.json({
//       success: true,
//       data: {
//         ratings,
//         stats: averageData,
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(total / limit),
//           total,
//           hasNext: page * limit < total,
//           hasPrev: page > 1
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get ratings error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch ratings',
//       error: error.message
//     });
//   }
// });

// // Get current user's rating for a specific ratee
// router.get('/my-rating/:rateeId', async (req, res) => {
//   try {
//     const { rateeId } = req.params;
//     const { rateeModel = 'Supplier' } = req.query;
//     const userId = req.user.id;
//     const userModel = req.user.role === 'supplier' ? 'Supplier' : 'Buyer';

//     if (!mongoose.Types.ObjectId.isValid(rateeId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid ratee ID'
//       });
//     }

//     const rating = await Rating.findOne({
//       rater: userId,
//       raterModel: userModel,
//       ratee: rateeId,
//       rateeModel: rateeModel
//     })
//     .populate('ratee', 'fullName name shopName email');

//     res.json({
//       success: true,
//       data: rating
//     });

//   } catch (error) {
//     console.error('Get my rating error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch your rating',
//       error: error.message
//     });
//   }
// });

// // Get all ratings given by the current user
// router.get('/my-ratings', async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const userModel = req.user.role === 'supplier' ? 'Supplier' : 'Buyer';
//     const { page = 1, limit = 10 } = req.query;

//     const skip = (page - 1) * limit;

//     const ratings = await Rating.find({
//       rater: userId,
//       raterModel: userModel
//     })
//     .populate('ratee', 'fullName name shopName email')
//     .sort({ createdAt: -1 })
//     .skip(skip)
//     .limit(parseInt(limit));

//     const total = await Rating.countDocuments({
//       rater: userId,
//       raterModel: userModel
//     });

//     res.json({
//       success: true,
//       data: {
//         ratings,
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(total / limit),
//           total,
//           hasNext: page * limit < total,
//           hasPrev: page > 1
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Get my ratings error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch your ratings',
//       error: error.message
//     });
//   }
// });

// // Add response to a rating
// router.put('/:ratingId/response', async (req, res) => {
//   try {
//     const { ratingId } = req.params;
//     const { message } = req.body;
//     const userId = req.user.id;

//     if (!mongoose.Types.ObjectId.isValid(ratingId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid rating ID'
//       });
//     }
    
//     const rating = await Rating.findById(ratingId);
//     if (!rating) {
//       return res.status(404).json({
//         success: false,
//         message: 'Rating not found'
//       });
//     }

//     // Check if user is the ratee (can respond to ratings about them)
//     if (rating.ratee.toString() !== userId) {
//       return res.status(403).json({
//         success: false,
//         message: 'Access denied'
//       });
//     }

//     rating.response = {
//       message,
//       timestamp: new Date()
//     };

//     await rating.save();

//     res.json({
//       success: true,
//       message: 'Response added successfully',
//       rating
//     });

//   } catch (error) {
//     console.error('Add rating response error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to add response',
//       error: error.message
//     });
//   }
// });

// // Delete rating
// router.delete('/:ratingId', async (req, res) => {
//   try {
//     const { ratingId } = req.params;
//     const userId = req.user.id;
//     const userModel = req.user.role === 'supplier' ? 'Supplier' : 'Buyer';

//     if (!mongoose.Types.ObjectId.isValid(ratingId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid rating ID'
//       });
//     }

//     const rating = await Rating.findOneAndDelete({
//       _id: ratingId,
//       rater: userId,
//       raterModel: userModel
//     });

//     if (!rating) {
//       return res.status(404).json({
//         success: false,
//         message: 'Rating not found or unauthorized'
//       });
//     }

//     res.json({
//       success: true,
//       message: 'Rating deleted successfully'
//     });

//   } catch (error) {
//     console.error('Delete rating error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to delete rating',
//       error: error.message
//     });
//   }
// });

// // Report rating
// router.put('/:ratingId/report', async (req, res) => {
//   try {
//     const { ratingId } = req.params;
//     const { reason } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(ratingId)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid rating ID'
//       });
//     }

//     const rating = await Rating.findById(ratingId);
//     if (!rating) {
//       return res.status(404).json({
//         success: false,
//         message: 'Rating not found'
//       });
//     }

//     rating.reported = true;
//     rating.reportReason = reason;
//     await rating.save();

//     res.json({
//       success: true,
//       message: 'Rating reported successfully'
//     });

//   } catch (error) {
//     console.error('Report rating error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to report rating',
//       error: error.message
//     });
//   }
// });

// module.exports = router;

const express = require('express');
const router = express.Router();
const { rateSupplier } = require('../controllers/ratingController');

// POST /api/ratings
router.post('/', rateSupplier);

module.exports = router;
