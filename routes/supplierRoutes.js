const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier'); // Correct path to your supplier model

// GET /api/suppliers - Fetch all active suppliers
router.get('/', async (req, res) => {
  try {
    // Fetch all active suppliers, excluding sensitive information like password
    const suppliers = await Supplier.find({ isActive: true })
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch suppliers',
      message: error.message 
    });
  }
});

// GET /api/suppliers/all - Fetch all suppliers including inactive (admin only)
router.get('/all', async (req, res) => {
  try {
    // You might want to add authentication middleware here for admin access
    const suppliers = await Supplier.find({})
      .select('-password')
      .sort({ createdAt: -1 });

    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error fetching all suppliers:', error);
    res.status(500).json({ 
      error: 'Failed to fetch suppliers',
      message: error.message 
    });
  }
});

// GET /api/suppliers/:id - Fetch single supplier by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await Supplier.findById(id).select('-password');
    
    if (!supplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.status(200).json(supplier);
  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({ 
      error: 'Failed to fetch supplier',
      message: error.message 
    });
  }
});

// PUT /api/suppliers/:id/rating - Update supplier rating
router.put('/:id/rating', async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    if (rating === undefined || rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 0 and 5' });
    }

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      { rating: rating },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedSupplier) {
      return res.status(404).json({ error: 'Supplier not found' });
    }

    res.status(200).json({
      message: 'Rating updated successfully',
      supplier: updatedSupplier
    });
  } catch (error) {
    console.error('Error updating supplier rating:', error);
    res.status(500).json({ 
      error: 'Failed to update rating',
      message: error.message 
    });
  }
});

// GET /api/suppliers/search - Search suppliers by name or email
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query; // search query
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const suppliers = await Supplier.find({
      isActive: true,
      $or: [
        { fullName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('-password')
    .sort({ createdAt: -1 });

    res.status(200).json(suppliers);
  } catch (error) {
    console.error('Error searching suppliers:', error);
    res.status(500).json({ 
      error: 'Failed to search suppliers',
      message: error.message 
    });
  }
});

module.exports = router;