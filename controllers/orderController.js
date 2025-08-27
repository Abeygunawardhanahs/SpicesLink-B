const Order = require('../models/Order');
const Product = require('../models/Product');
const Notification = require('../models/Notification');
// Initialize Stripe only if secret key is provided
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const { items, shippingAddress, paymentMethod, notes } = req.body;
    const userId = req.user.id;
    const userModel = req.user.role === 'supplier' ? 'Supplier' : 'Buyer';

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];
    let supplierId = null;

    for (const item of items) {
      const product = await Product.findById(item.productId).populate('userId');
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productId} not found`
        });
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}`
        });
      }

      // Ensure all products are from the same supplier
      if (!supplierId) {
        supplierId = product.userId._id;
      } else if (supplierId.toString() !== product.userId._id.toString()) {
        return res.status(400).json({
          success: false,
          message: 'All items must be from the same supplier'
        });
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItems.push({
        product: product._id,
        quantity: item.quantity,
        priceAtTime: product.price,
        subtotal
      });
    }

    // Create order
    const order = new Order({
      buyer: userModel === 'Buyer' ? userId : supplierId, // Adjust based on who's creating
      supplier: supplierId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      payment: {
        method: paymentMethod,
        status: 'pending'
      },
      notes
    });

    await order.save();

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } }
      );
    }

    // Create notifications
    await Notification.createNotification({
      recipient: supplierId,
      recipientModel: 'Supplier',
      sender: userId,
      senderModel: userModel,
      type: 'order_created',
      title: 'New Order Received',
      message: `New order ${order.orderNumber} for $${totalAmount}`,
      relatedOrder: order._id
    });

    // Populate order details for response
    await order.populate([
      { path: 'buyer', select: 'fullName email' },
      { path: 'supplier', select: 'fullName email' },
      { path: 'items.product', select: 'name price category' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Get user orders
exports.getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, page = 1, limit = 10 } = req.query;

    // Build query based on user role
    const query = {};
    if (userRole === 'buyer') {
      query.buyer = userId;
    } else {
      query.supplier = userId;
    }

    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const orders = await Order.find(query)
      .populate('buyer', 'fullName email contactNumber')
      .populate('supplier', 'fullName email contactNumber')
      .populate('items.product', 'name price category image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
};

// Get single order
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await Order.findById(orderId)
      .populate('buyer', 'fullName email contactNumber')
      .populate('supplier', 'fullName email contactNumber')
      .populate('items.product', 'name price category image description');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user has access to this order
    const hasAccess = (userRole === 'buyer' && order.buyer._id.toString() === userId) ||
                     (userRole === 'supplier' && order.supplier._id.toString() === userId);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      order
    });

  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes, trackingNumber } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions
    const canUpdate = (userRole === 'supplier' && order.supplier.toString() === userId) ||
                     (userRole === 'buyer' && order.buyer.toString() === userId);

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Validate status transitions
    const validTransitions = {
      pending: ['confirmed', 'rejected', 'cancelled'],
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [], // Terminal state
      cancelled: [], // Terminal state
      rejected: [] // Terminal state
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot transition from ${order.status} to ${status}`
      });
    }

    // Update order
    order.status = status;
    if (notes) {
      if (userRole === 'buyer') {
        order.buyerNotes = notes;
      } else {
        order.supplierNotes = notes;
      }
    }
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    if (status === 'delivered') {
      order.actualDelivery = new Date();
    }

    await order.save();

    // Create notification
    const recipientId = userRole === 'buyer' ? order.supplier : order.buyer;
    const recipientModel = userRole === 'buyer' ? 'Supplier' : 'Buyer';

    await Notification.createNotification({
      recipient: recipientId,
      recipientModel,
      sender: userId,
      senderModel: userRole === 'buyer' ? 'Buyer' : 'Supplier',
      type: `order_${status}`,
      title: 'Order Status Updated',
      message: `Order ${order.orderNumber} status changed to ${status}`,
      relatedOrder: order._id
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      order
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentMethodId, amount } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    if (order.payment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed'
      });
    }

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'lkr', // Sri Lankan Rupee
      payment_method: paymentMethodId,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber
      }
    });

    if (paymentIntent.status === 'succeeded') {
      order.payment.status = 'completed';
      order.payment.stripePaymentIntentId = paymentIntent.id;
      order.payment.paidAmount = amount;
      order.payment.paymentDate = new Date();
      
      if (order.status === 'pending') {
        order.status = 'confirmed';
      }

      await order.save();

      // Create notification
      await Notification.createNotification({
        recipient: order.supplier,
        recipientModel: 'Supplier',
        sender: order.buyer,
        senderModel: 'Buyer',
        type: 'payment_successful',
        title: 'Payment Received',
        message: `Payment of LKR ${amount.toLocaleString()} received for order ${order.orderNumber}`,
        relatedOrder: order._id
      });

      res.json({
        success: true,
        message: 'Payment processed successfully',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status
        }
      });
    } else {
      order.payment.status = 'failed';
      await order.save();

      res.status(400).json({
        success: false,
        message: 'Payment failed',
        paymentIntent: {
          id: paymentIntent.id,
          status: paymentIntent.status
        }
      });
    }

  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed',
      error: error.message
    });
  }
};

// Get order statistics
exports.getOrderStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // Build query based on user role
    const query = {};
    if (userRole === 'buyer') {
      query.buyer = userId;
    } else {
      query.supplier = userId;
    }

    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments(query);
    const totalRevenue = await Order.aggregate([
      { $match: { ...query, 'payment.status': 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    res.json({
      success: true,
      statistics: {
        totalOrders,
        totalRevenue: totalRevenue[0]?.total || 0,
        statusBreakdown: stats,
        monthlyData: [] // TODO: Implement monthly breakdown
      }
    });

  } catch (error) {
    console.error('Get order statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// No need for module.exports = exports, we're using individual exports