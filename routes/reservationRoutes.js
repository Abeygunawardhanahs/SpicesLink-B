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

const {
  authenticateToken,
  optionalAuth,
  requireSupplier,
  requireBuyer,
  authenticateSupplier,
  authenticateBuyer
} = require('../middleware/auth');

// PUBLIC ROUTES
router.post('/', createReservation);
router.get('/public/:mobileNo', getBuyerReservations);

// SUPPLIER ROUTES - Fixed: separate routes instead of optional parameter
router.get('/supplier', authenticateSupplier, getSupplierReservations);
router.get('/supplier/:supplierId', authenticateSupplier, getSupplierReservations);
//router.put('/:id/status', authenticateSupplier, updateReservationStatus);
router.get('/stats/:supplierId', authenticateSupplier, getReservationStats);
router.get('/stats', authenticateSupplier, getReservationStats);

// BUYER ROUTES
router.get('/buyer', authenticateBuyer, getBuyerReservations);

// MIXED ROUTES
router.delete('/:id', authenticateToken, deleteReservation);

// SINGLE RESERVATION - Must be last to avoid conflicts
router.get('/:id', getReservationById);

module.exports = router;