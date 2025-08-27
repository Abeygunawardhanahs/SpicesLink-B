const express = require('express');
const router = express.Router();
const {
  registerSupplier,
  loginSupplier,
  getSupplierProfile,
  updateSupplierProfile,
  getSuppliers
} = require('../controllers/supplierController');
const { authenticateSupplier, authenticateBuyer } = require('../middleware/auth');

// Public routes
router.post('/register', registerSupplier);
router.post('/login', loginSupplier);
//router.get('/search', authenticateBuyer, getSuppliers); // Buyers can search suppliers

// Protected routes (require authentication)
//router.get('/profile', authenticateSupplier, getSupplierProfile);
//router.put('/profile', authenticateSupplier, updateSupplierProfile);

module.exports = router;