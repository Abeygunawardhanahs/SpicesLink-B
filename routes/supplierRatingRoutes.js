const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const SupplierRating = require('../models/SupplierRating');
const Supplier = require('../models/Supplier');
const Buyer = require('../models/Buyer');

//  Get all ratings for a supplier 
router.get('/supplier/:supplierId', async (req, res) => {
  try {
    const { supplierId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({ success: false, message: 'Invalid supplier ID' });
    }

    const ratings = await SupplierRating.find({ supplierId })
      .populate('buyerId', 'name shopName email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SupplierRating.countDocuments({ supplierId });

    const ratingStats = await SupplierRating.aggregate([
      { $match: { supplierId: new mongoose.Types.ObjectId(supplierId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalRatings: { $sum: 1 },
          ratingBreakdown: { $push: '$rating' }
        }
      }
    ]);

    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let stats = { averageRating: 0, totalRatings: 0, ratingDistribution };

    if (ratingStats.length > 0) {
      const stat = ratingStats[0];
      stats.averageRating = parseFloat(stat.averageRating.toFixed(1));
      stats.totalRatings = stat.totalRatings;
      stat.ratingBreakdown.forEach(r => ratingDistribution[r]++);
    }

    res.json({ success: true, data: { ratings, stats, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total/limit), totalRatings: total } } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// --- Add or update rating ---
router.post('/', async (req, res) => {
  try {
    const { buyerId, supplierId, rating, review } = req.body;

    if (!buyerId || !supplierId || !rating) {
      return res.status(400).json({ success: false, message: 'Buyer ID, Supplier ID, and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 1-5' });
    }

    if (!mongoose.Types.ObjectId.isValid(buyerId) || !mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({ success: false, message: 'Invalid buyer or supplier ID' });
    }

    const supplier = await Supplier.findById(supplierId);
    const buyer = await Buyer.findById(buyerId);
    if (!supplier || !buyer) return res.status(404).json({ success: false, message: 'Supplier or Buyer not found' });

    let existing = await SupplierRating.findOne({ buyerId, supplierId });
    let result;
    if (existing) {
      existing.rating = rating;
      existing.review = review || '';
      result = await existing.save();
    } else {
      result = await SupplierRating.create({ buyerId, supplierId, rating, review: review || '' });
    }

    await result.populate('buyerId', 'name shopName email');

    res.json({ success: true, message: existing ? 'Rating updated successfully' : 'Rating added successfully', data: result });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'You have already rated this supplier' });
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// --- Get buyer's rating for supplier ---
router.get('/buyer/:buyerId/supplier/:supplierId', async (req, res) => {
  try {
    const { buyerId, supplierId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(buyerId) || !mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({ success: false, message: 'Invalid IDs' });
    }
    const rating = await SupplierRating.findOne({ buyerId, supplierId }).populate('buyerId', 'name shopName email');
    res.json({ success: true, data: rating });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// --- Delete rating ---
router.delete('/:ratingId', async (req, res) => {
  try {
    const { ratingId } = req.params;
    const { buyerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(ratingId)) return res.status(400).json({ success: false, message: 'Invalid rating ID' });

    const rating = await SupplierRating.findOneAndDelete({ _id: ratingId, buyerId });
    if (!rating) return res.status(404).json({ success: false, message: 'Rating not found or unauthorized' });

    res.json({ success: true, message: 'Rating deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

module.exports = router;
