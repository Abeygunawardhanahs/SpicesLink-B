const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  getOrderStatistics
} = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Order routes
router.post('/', createOrder);
router.get('/', getOrders);
router.get('/statistics', getOrderStatistics);
router.get('/:orderId', getOrder);
router.put('/:orderId/status', updateOrderStatus);

module.exports = router;