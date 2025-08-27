const jwt = require('jsonwebtoken');
const Buyer = require('../models/Buyer');
const Supplier = require('../models/Supplier');

// General authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, access denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();

  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token, access denied'
    });
  }
};

// Buyer-specific authentication middleware
const authenticateBuyer = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, access denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is a buyer
    if (decoded.role !== 'buyer') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Buyer role required'
      });
    }

    // Verify buyer exists and is active
    const buyer = await Buyer.findById(decoded.id).select('-password');
    if (!buyer || !buyer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Buyer account not found or inactive'
      });
    }

    req.user = decoded;
    req.buyer = buyer;
    next();

  } catch (error) {
    console.error('Buyer authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token, access denied'
    });
  }
};

// Supplier-specific authentication middleware
const authenticateSupplier = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, access denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user is a supplier
    if (decoded.role !== 'supplier') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Supplier role required'
      });
    }

    // Verify supplier exists and is active
    const supplier = await Supplier.findById(decoded.id).select('-password');
    if (!supplier || !supplier.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Supplier account not found or inactive'
      });
    }

    req.user = decoded;
    req.supplier = supplier;
    next();

  } catch (error) {
    console.error('Supplier authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token, access denied'
    });
  }
};

// Admin authentication (if needed later)
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, access denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required'
      });
    }

    req.user = decoded;
    next();

  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token, access denied'
    });
  }
};

module.exports = {
  authenticate,
  authenticateBuyer,
  authenticateSupplier,
  authenticateAdmin
};