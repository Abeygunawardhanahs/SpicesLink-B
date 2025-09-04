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
      email,
      password
    } = req.body;

    // Check if a buyer with the same email already exists
    const existingBuyer = await Buyer.findOne({ email: email.toLowerCase() });
    if (existingBuyer) {
      return res.status(400).json({
        success: false,
        message: 'A buyer with this email already exists.'
      });
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new buyer
    const newBuyer = new Buyer({
      shopName,
      shopOwnerName,
      shopLocation,
      contactNumber,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await newBuyer.save();
    console.log('New buyer saved successfully:', email);

    const buyerResponse = newBuyer.toObject();
    delete buyerResponse.password;

    res.status(201).json({
      success: true,
      message: 'Buyer registered successfully!',
      data: {
        buyer: buyerResponse,
        userId: newBuyer._id
      }
    });

  } catch (error) {
    console.error(error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A buyer with this email already exists.'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

// --- BUYER LOGIN ---
exports.loginBuyer = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const buyer = await Buyer.findOne({ email: email.toLowerCase() });
    if (!buyer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!buyer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Contact support.'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, buyer.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    buyer.lastLogin = new Date();
    await buyer.save();

    const token = jwt.sign(
      { userId: buyer._id, email: buyer.email, role: 'Buyer', shopOwnerName: buyer.shopOwnerName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const buyerResponse = buyer.toObject();
    delete buyerResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: { buyer: buyerResponse, token }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

// --- ADD / UPDATE BANK DETAILS ---
exports.addBankDetails = async (req, res) => {
  try {
    const { userId } = req.params;   // buyer ID from URL
    const { bankName, accountNumber, branch } = req.body;

    const buyer = await Buyer.findById(userId);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    buyer.bankDetails = { bankName, accountNumber, branch, addedAt: new Date() };
    await buyer.save();

    res.status(200).json({
      success: true,
      message: 'Bank details updated successfully',
      data: buyer.bankDetails
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Error updating bank details'
    });
  }
};

// --- GET BUYER BY ID ---
exports.getBuyerById = async (req, res) => {
  try {
    const { _id } = req.params;
    const buyer = await Buyer.findById(_id).select('-password'); // exclude password

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Buyer fetched successfully',
      data: { buyer }
    });

  } catch (error) {
    console.error('Error fetching buyer:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching buyer'
    });
  }
};
