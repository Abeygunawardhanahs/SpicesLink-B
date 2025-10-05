const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier'); // Correct path to your supplier model
const supplierController = require('../controllers/supplierController');

// AUTH
router.post('/register',supplierController.registerSupplier);
router.post('/login',supplierController.loginSupplier);


// GET- Fetch all active suppliers
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

// GET- Fetch all suppliers including inactive (admin only)
router.get('/all', async (req, res) => {
  try {
    
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

// GET - Fetch single supplier by ID
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

// PUT - Update supplier rating
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

// PUT - Update supplier profile
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, contactNumber, email } = req.body;

    // Validation
    if (!fullName || !contactNumber || !email) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate contact number
    if (!/\d{10,15}/.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Contact number should be between 10-15 digits'
      });
    }

    // Validate email
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Check if email already exists for another supplier
    const existingSupplier = await Supplier.findOne({ 
      email: email.toLowerCase(), 
      _id: { $ne: id } 
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'This email is already in use by another supplier'
      });
    }

    // Update supplier profile
    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      {
        fullName: fullName.trim(),
        contactNumber: contactNumber.trim(),
        email: email.toLowerCase().trim()
      },
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password');

    if (!updatedSupplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedSupplier
    });

  } catch (error) {
    console.error('Error updating supplier profile:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// GET  - Search suppliers by name or email
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