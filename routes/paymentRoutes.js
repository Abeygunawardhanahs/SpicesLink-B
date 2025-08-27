const express = require('express');
const router = express.Router();
const {
  createPaymentIntent,
  createCheckoutPaymentIntent,
  confirmPayment,
  handleWebhook,
  getPaymentMethods,
  getPaymentHistory,
  refundPayment
} = require('../controllers/paymentController');
const { authenticate } = require('../middleware/auth');

// Webhook route (no auth required, Stripe handles verification)
router.post('/webhook', express.raw({type: 'application/json'}), handleWebhook);

// All other routes require authentication
router.use(authenticate);

// Payment routes
router.post('/create-payment-intent', createPaymentIntent);
router.post('/create-checkout-payment-intent', createCheckoutPaymentIntent);
router.post('/confirm-payment', confirmPayment);
router.get('/methods', getPaymentMethods);
router.get('/history', getPaymentHistory);
router.post('/:orderId/refund', refundPayment);

module.exports = router;