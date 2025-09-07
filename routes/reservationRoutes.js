const express = require('express');
const router = express.Router();
const {
  createReservation,
  getSupplierReservations,
  getReservationById,
  updateReservationStatus,
  getBuyerReservations,
  deleteReservation,
  getReservationStats
} = require('../controllers/reservationController');

// Import your existing middleware - UPDATE THIS PATH TO MATCH YOUR FILE STRUCTURE
// Common paths: '../middleware/auth', '../middleware/authMiddleware', '../middlewares/authenticate'
const {
  authenticateToken,
  optionalAuth,
  requireSupplier,
  requireBuyer,
  authenticateSupplier,  // Your existing middleware
  authenticateBuyer      // Your existing middleware
} = require('../middleware/auth'); // UPDATED PATH - adjust this to match your actual file path

// Alternative import options if the path is different:
// const { authenticateSupplier, authenticateBuyer } = require('../middleware/authMiddleware');
// const { authenticateSupplier, authenticateBuyer } = require('../middlewares/authenticate');

// ==============================================
// PUBLIC ROUTES (No authentication required)
// ==============================================

// Create reservation - works for both authenticated and guest users
router.post('/', optionalAuth, createReservation);

// Get reservations by mobile number (for guest users to track their reservations)
router.get('/public/:mobileNo', getBuyerReservations);

// Get single reservation by ID (public access for tracking)
router.get('/:id', getReservationById);

// ==============================================
// SUPPLIER ROUTES (Require supplier authentication)
// ==============================================

// Get supplier's reservations - using your existing authenticateSupplier middleware
router.get('/supplier/:supplierId', authenticateSupplier, getSupplierReservations);

// Update reservation status - suppliers only, using your existing middleware
router.put('/:id/status', authenticateSupplier, updateReservationStatus);

// Get supplier statistics - using your existing middleware
router.get('/stats/:supplierId', authenticateSupplier, getReservationStats);

// ==============================================
// BUYER ROUTES (Require buyer authentication)
// ==============================================

// Get buyer's own reservations - using your existing authenticateBuyer middleware
router.get('/buyer', authenticateBuyer, getBuyerReservations);

// ==============================================
// MIXED ROUTES (Require any authentication)
// ==============================================

// Delete reservation - require authentication but allow both buyer and supplier
router.delete('/:id', authenticateToken, deleteReservation);

// ==============================================
// ALTERNATIVE ROUTES (Using new middleware for flexibility)
// ==============================================

// Alternative supplier routes using new middleware (you can choose which to use)
// router.get('/supplier/:supplierId?', authenticateToken, requireSupplier, getSupplierReservations);
// router.put('/:id/status', authenticateToken, requireSupplier, updateReservationStatus);
// router.get('/stats/:supplierId?', authenticateToken, requireSupplier, getReservationStats);

// Alternative buyer routes using new middleware
// router.get('/buyer', authenticateToken, requireBuyer, getBuyerReservations);

module.exports = router;