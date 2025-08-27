// Initialize Stripe only if secret key is provided
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;
const Order = require('../models/Order');
const Notification = require('../models/Notification');

// Create payment intent (for existing orders)
exports.createPaymentIntent = async (req, res) => {
  try {
    const { orderId, amount, currency = 'lkr' } = req.body;
    const userId = req.user.id;

    // Validate order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user is the buyer
    if (order.buyer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if payment already completed
    if (order.payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    let paymentIntent;

    if (!stripe) {
      // Demo mode - create mock payment intent
      paymentIntent = {
        id: `pi_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        client_secret: `pi_demo_${Date.now()}_secret`,
        status: 'requires_payment_method',
        amount: Math.round(amount * 100),
        currency: currency.toLowerCase()
      };
    } else {
      // Create payment intent with Stripe
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        metadata: {
          orderId: order._id.toString(),
          orderNumber: order.orderNumber,
          buyerId: userId
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
    }

    // Update order with payment intent
    order.payment.stripePaymentIntentId = paymentIntent.id;
    order.payment.status = 'processing';
    await order.save();

    res.json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      }
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};

// Create payment intent for new checkout (direct from cart)
exports.createCheckoutPaymentIntent = async (req, res) => {
  try {
    const { amount, currency = 'usd', items } = req.body;
    const userId = req.user.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount'
      });
    }

    let paymentIntent;
    const amountInCents = Math.round(amount * 100);

    if (!stripe) {
      // Demo mode - create mock payment intent
      paymentIntent = {
        id: `pi_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        client_secret: `pi_demo_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
        status: 'requires_payment_method',
        amount: amountInCents,
        currency: currency.toLowerCase()
      };

      console.log('Demo payment intent created:', paymentIntent.client_secret);
    } else {
      // Create payment intent with Stripe
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: {
          buyerId: userId,
          itemCount: items?.length || 0,
          source: 'checkout'
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
    }

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: paymentIntent.status
      }
    });

  } catch (error) {
    console.error('Create checkout payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message
    });
  }
};

// Confirm payment
exports.confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;

    if (!stripe) {
      // For demo purposes, simulate successful payment when Stripe is not configured
      const order = await Order.findOne({
        'payment.stripePaymentIntentId': paymentIntentId
      }).populate('buyer supplier');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Order not found'
        });
      }

      // Simulate successful payment
      order.payment.status = 'completed';
      order.payment.paidAmount = order.totalAmount;
      order.payment.paymentDate = new Date();
      order.payment.transactionId = paymentIntentId;

      if (order.status === 'pending') {
        order.status = 'confirmed';
      }

      await order.save();

      // Create success notification for supplier
      await Notification.createNotification({
        recipient: order.supplier._id,
        recipientModel: 'Supplier',
        sender: order.buyer._id,
        senderModel: 'Buyer',
        type: 'payment_successful',
        title: 'Payment Received',
        message: `Payment of LKR ${order.payment.paidAmount.toLocaleString()} received for order ${order.orderNumber}`,
        relatedOrder: order._id,
        priority: 'high'
      });

      return res.json({
        success: true,
        message: 'Payment confirmed successfully',
        payment: {
          id: paymentIntentId,
          amount: order.payment.paidAmount,
          status: 'succeeded',
          order: order.orderNumber
        }
      });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return res.status(404).json({
        success: false,
        message: 'Payment intent not found'
      });
    }

    const orderId = paymentIntent.metadata.orderId;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (paymentIntent.status === 'succeeded') {
      // Update order payment status
      order.payment.status = 'completed';
      order.payment.paidAmount = paymentIntent.amount / 100;
      order.payment.paymentDate = new Date();
      order.payment.transactionId = paymentIntent.id;

      // Update order status if still pending
      if (order.status === 'pending') {
        order.status = 'confirmed';
      }

      await order.save();

      // Create success notification for supplier
      await Notification.createNotification({
        recipient: order.supplier,
        recipientModel: 'Supplier',
        sender: order.buyer,
        senderModel: 'Buyer',
        type: 'payment_successful',
        title: 'Payment Received',
        message: `Payment of LKR ${order.payment.paidAmount.toLocaleString()} received for order ${order.orderNumber}`,
        relatedOrder: order._id,
        priority: 'high'
      });

      res.json({
        success: true,
        message: 'Payment confirmed successfully',
        payment: {
          id: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: paymentIntent.status,
          order: order.orderNumber
        }
      });

    } else if (paymentIntent.status === 'requires_payment_method') {
      // Payment failed
      order.payment.status = 'failed';
      await order.save();

      res.status(400).json({
        success: false,
        message: 'Payment failed - requires payment method'
      });

    } else {
      res.json({
        success: true,
        message: 'Payment status updated',
        status: paymentIntent.status
      });
    }

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm payment',
      error: error.message
    });
  }
};

// Handle Stripe webhooks
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Helper function to handle successful payment
const handlePaymentSucceeded = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  const order = await Order.findById(orderId);

  if (order && order.payment.status !== 'completed') {
    order.payment.status = 'completed';
    order.payment.paidAmount = paymentIntent.amount / 100;
    order.payment.paymentDate = new Date();
    order.payment.transactionId = paymentIntent.id;

    if (order.status === 'pending') {
      order.status = 'confirmed';
    }

    await order.save();

    // Send notification to supplier
    await Notification.createNotification({
      recipient: order.supplier,
      recipientModel: 'Supplier',
      type: 'payment_successful',
      title: 'Payment Received',
      message: `Payment confirmed for order ${order.orderNumber}`,
      relatedOrder: order._id,
      priority: 'high'
    });
  }
};

// Helper function to handle failed payment
const handlePaymentFailed = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  const order = await Order.findById(orderId);

  if (order) {
    order.payment.status = 'failed';
    await order.save();

    // Send notification to buyer
    await Notification.createNotification({
      recipient: order.buyer,
      recipientModel: 'Buyer',
      type: 'payment_failed',
      title: 'Payment Failed',
      message: `Payment failed for order ${order.orderNumber}. Please try again.`,
      relatedOrder: order._id,
      priority: 'high'
    });
  }
};

// Helper function to handle canceled payment
const handlePaymentCanceled = async (paymentIntent) => {
  const orderId = paymentIntent.metadata.orderId;
  const order = await Order.findById(orderId);

  if (order) {
    order.payment.status = 'cancelled';
    await order.save();
  }
};

// Get payment methods for user
exports.getPaymentMethods = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // In a real app, you'd store customer ID in user profile
    // For now, we'll return empty array
    res.json({
      success: true,
      paymentMethods: [],
      message: 'Payment methods retrieved successfully'
    });

  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment methods',
      error: error.message
    });
  }
};

// Get payment history
exports.getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page = 1, limit = 10, status } = req.query;

    // Build query based on user role
    const query = {
      'payment.status': { $in: ['completed', 'failed', 'refunded'] }
    };

    if (userRole === 'buyer') {
      query.buyer = userId;
    } else {
      query.supplier = userId;
    }

    if (status) {
      query['payment.status'] = status;
    }

    const skip = (page - 1) * limit;

    const payments = await Order.find(query)
      .select('orderNumber totalAmount payment buyer supplier createdAt')
      .populate('buyer', 'fullName email')
      .populate('supplier', 'fullName email')
      .sort({ 'payment.paymentDate': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    // Calculate totals
    const totals = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$payment.status',
          total: { $sum: '$payment.paidAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      summary: totals
    });

  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment history',
      error: error.message
    });
  }
};

// Refund payment
exports.refundPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions (suppliers can refund)
    if (order.supplier.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    if (order.payment.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot refund incomplete payment'
      });
    }

    // Process refund with Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.payment.stripePaymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined, // Partial or full refund
      reason: reason || 'requested_by_customer',
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber
      }
    });

    if (refund.status === 'succeeded') {
      order.payment.status = 'refunded';
      order.status = 'cancelled';
      await order.save();

      // Create notification for buyer
      await Notification.createNotification({
        recipient: order.buyer,
        recipientModel: 'Buyer',
        sender: userId,
        senderModel: 'Supplier',
        type: 'payment_refunded',
        title: 'Payment Refunded',
        message: `Refund processed for order ${order.orderNumber}`,
        relatedOrder: order._id,
        priority: 'high'
      });

      res.json({
        success: true,
        message: 'Refund processed successfully',
        refund: {
          id: refund.id,
          amount: refund.amount / 100,
          status: refund.status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Refund failed',
        status: refund.status
      });
    }

  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
};

// No need for module.exports = exports, we're using individual exports