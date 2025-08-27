const Buyer = require('../models/Buyer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// --- BUYER REGISTRATION ---
exports.registerBuyer = async (req, res) => {
  try {
    console.log('=== BUYER REGISTRATION ATTEMPT ===');
    console.log('Request body:', { ...req.body, password: '[HIDDEN]' });
    
    const {
      shopName,
      shopOwnerName,
      shopLocation,
      contactNumber,
      email,  // ← FIXED: Back to 'email' since you changed frontend
      password
    } = req.body;

    // Check if a buyer with the same email already exists
    const existingBuyer = await Buyer.findOne({ email: email.toLowerCase() });
    if (existingBuyer) {
      console.log('Buyer already exists with email:', email);
      return res.status(400).json({
        success: false,
        message: 'A buyer with this email already exists.'
      });
    }

    // Hash the password before saving
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new buyer
    const newBuyer = new Buyer({
      shopName,
      shopOwnerName,
      shopLocation,
      contactNumber,
      email: email.toLowerCase(),  // ← FIXED: Now using email directly
      password: hashedPassword
    });

    // Save the new buyer to the database
    await newBuyer.save();
    console.log('New buyer saved successfully:', email);

    // Prepare the user data to send back, removing the password for security
    const buyerResponse = newBuyer.toObject();
    delete buyerResponse.password;

    res.status(201).json({
      success: true,
      message: 'Buyer registered successfully!',
      data: {
        buyer: buyerResponse,
        userId: newBuyer._id  // ← Added userId for frontend compatibility
      }
    });

  } catch (error) {
    console.error('=== BUYER REGISTRATION ERROR ===');
    console.error(error);

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.log('Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors (email already exists)
    if (error.code === 11000) {
      console.log('Duplicate key error:', error.keyValue);
      return res.status(400).json({
        success: false,
        message: 'A buyer with this email already exists.'
      });
    }

    // Handle any other server-side errors
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred during registration.'
    });
  }
};

// --- BUYER LOGIN ---
exports.loginBuyer = async (req, res) => {
  try {
    console.log('=== BUYER LOGIN ATTEMPT ===');
    console.log('Request body:', { ...req.body, password: '[HIDDEN]' });
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find buyer by email
    const buyer = await Buyer.findOne({ email: email.toLowerCase() });
    console.log('Buyer found:', buyer ? 'Yes' : 'No');
    
    if (!buyer) {
      console.log('No buyer found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if account is active
    if (!buyer.isActive) {
      console.log('Buyer account is inactive');
      return res.status(401).json({
        success: false,
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, buyer.password);
    console.log('Password valid:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Invalid password for email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    buyer.lastLogin = new Date();
    await buyer.save();

    // FIXED: Use consistent field names that match your frontend expectations
    const token = jwt.sign(
      { 
        userId: buyer._id,           // ← Changed from 'id' to 'userId'
        email: buyer.email,   // ← Changed to match what frontend expects
        role: 'Buyer',              // ← Capitalized to match frontend expectations
        shopOwnerName: buyer.shopOwnerName  // ← Added this field as seen in server logs
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }  // ← Extended to 7 days for better UX
    );

    // Prepare buyer response without password
    const buyerResponse = buyer.toObject();
    delete buyerResponse.password;

    console.log('Login successful for buyer:', buyer.email);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        buyer: buyerResponse,
        token: token
      }
    });

  } catch (error) {
    console.error('=== BUYER LOGIN ERROR ===');
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};