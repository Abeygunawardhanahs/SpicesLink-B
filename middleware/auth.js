const jwt = require('jsonwebtoken');
const Buyer = require('../models/Buyer');
const Supplier = require('../models/Supplier');

// General authentication middleware (EXISTING - NO CHANGES)
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

// Buyer-specific authentication middleware (EXISTING - NO CHANGES)
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

// Supplier-specific authentication middleware (EXISTING - NO CHANGES)
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

// Admin authentication (EXISTING - NO CHANGES)
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

// NEW: Enhanced authentication that works with your existing system
// This middleware is compatible with your existing token structure
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify the token using your existing JWT_SECRET
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find the user based on your existing role system
    let user = null;
    let userType = null;

    if (decoded.role === 'supplier') {
      user = await Supplier.findById(decoded.id).select('-password');
      userType = 'supplier';
    } else if (decoded.role === 'buyer') {
      user = await Buyer.findById(decoded.id).select('-password');
      userType = 'buyer';
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user is active (if your models have isActive field)
    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        message: 'User account is inactive'
      });
    }

    // Add user info to request object - compatible with existing code
    req.user = {
      id: decoded.id,
      role: decoded.role, // Keep existing role field
      userType: userType, // Add userType for new reservation system
      email: user.email,
      name: user.name || user.businessName
    };

    // Also keep existing req.buyer or req.supplier for backward compatibility
    if (userType === 'buyer') {
      req.buyer = user;
    } else if (userType === 'supplier') {
      req.supplier = user;
    }

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// NEW: Optional authentication - doesn't fail if no token provided
// Useful for endpoints that work for both authenticated and guest users
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        let user = null;
        let userType = null;

        if (decoded.role === 'supplier') {
          user = await Supplier.findById(decoded.id).select('-password');
          userType = 'supplier';
        } else if (decoded.role === 'buyer') {
          user = await Buyer.findById(decoded.id).select('-password');
          userType = 'buyer';
        }

        if (user && user.isActive !== false) {
          req.user = {
            id: decoded.id,
            role: decoded.role,
            userType: userType,
            email: user.email,
            name: user.name || user.businessName
          };

          // Backward compatibility
          if (userType === 'buyer') {
            req.buyer = user;
          } else if (userType === 'supplier') {
            req.supplier = user;
          }
        }
      } catch (tokenError) {
        // Token is invalid, but continue without authentication
        console.log('Optional auth: Invalid token, continuing without auth');
      }
    }

    next();
  } catch (error) {
    // Continue without authentication if any error occurs
    next();
  }
};

// NEW: Middleware to ensure supplier role (using existing role system)
const requireSupplier = (req, res, next) => {
  if (req.user && req.user.role === 'supplier') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Supplier access required'
    });
  }
};

// NEW: Middleware to ensure buyer role (using existing role system)  
const requireBuyer = (req, res, next) => {
  if (req.user && req.user.role === 'buyer') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Buyer access required'
    });
  }
};

module.exports = {
  // Existing middleware (NO CHANGES)
  authenticate,
  authenticateBuyer,
  authenticateSupplier,
  authenticateAdmin,
  
  // New middleware for reservation system (compatible with existing system)
  authenticateToken,
  optionalAuth,
  requireSupplier,
  requireBuyer
};