const Buyer = require('../models/Buyer');
// for password hashing and JWT
const bcrypt = require('bcryptjs');
// JWT for authentication
const jwt = require('jsonwebtoken');

// BUYER REGISTRATION  
exports.registerBuyer = async (req, res) => {
  try {
    console.log('=== BUYER REGISTRATION ATTEMPT ===');
    console.log('Request body:', { ...req.body, password: '[HIDDEN]' });
   // Get input data
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

    // Create and save a new buyer
    const newBuyer = new Buyer({
      shopName,
      shopOwnerName,
      shopLocation,
      contactNumber,
      email: email.toLowerCase(),
      password: hashedPassword
    });
    // save the new buyer to the DB
    await newBuyer.save();
    console.log('New buyer saved successfully:', email);
    // remove password from response
    const buyerResponse = newBuyer.toObject();
    delete buyerResponse.password;
    // send success response
    res.status(201).json({
      success: true,
      message: 'Buyer registered successfully!',
      data: {
        buyer: buyerResponse,
        userId: newBuyer._id
      }
    });

  } catch (error) {
    // handle errors
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

// BUYER LOGIN
exports.loginBuyer = async (req, res) => {
  try {
    // get email and password from request body
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    // find buyer by email
    const buyer = await Buyer.findOne({ email: email.toLowerCase() });
    if (!buyer) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    // check if buyer is active
    if (!buyer.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is inactive. Contact support.'
      });
    }
    // compare passwords
    const isPasswordValid = await bcrypt.compare(password, buyer.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    // update last login time
    buyer.lastLogin = new Date();
    await buyer.save();
    // generate JWT token
    const token = jwt.sign(
      { userId: buyer._id, email: buyer.email, role: 'Buyer', shopOwnerName: buyer.shopOwnerName },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    // send success response
    const buyerResponse = buyer.toObject();
    // remove password before response
    delete buyerResponse.password;
    // send sucess response
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

// ADD / UPDATE BANK DETAILS
exports.addBankDetails = async (req, res) => {
  try {
    // get buyer Id from url (params) and bank details from body
    const { userId } = req.params;  
    const { bankName, accountNumber, branch } = req.body;
    // find buyer by Id
    const buyer = await Buyer.findById(userId);
    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }
    // update bank details
    buyer.bankDetails = { bankName, accountNumber, branch, addedAt: new Date() };
    await buyer.save();
    // send success response
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

// GET BUYER PROFILE by ID 
exports.getBuyerProfileById = async (req, res) => {
  try {
    const { id } = req.params;
    // Find buyer by ID and exclude sensitive fields
    const buyer = await Buyer.findById(id).select('-password -__v');

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Buyer profile fetched successfully',
      data: { buyer }
    });

  } catch (error) {
    console.error('Error fetching buyer profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching buyer profile'
    });
  }
};


// GET ALL BUYERS/SHOPS
exports.getAllBuyers = async (req, res) => {
  try {
    // Find all buyers and exclude password field
    const buyers = await Buyer.find()
      .select('-password -__v')
      .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
      success: true,
      message: 'Buyers fetched successfully',
      data: { 
        buyers,
        total: buyers.length 
      }
    });

  } catch (error) {
    console.error('Error fetching all buyers:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching buyers'
    });
  }
};


// GET BUYER by ID 
exports.getBuyerById = async (req, res) => {
  try {
    const { _id } = req.params;
    // find buyer by Id
    const buyer = await Buyer.findById(_id).select('-password'); // exclude password

    if (!buyer) {
      return res.status(404).json({
        success: false,
        message: 'Buyer not found'
      });
    }
    // send success response
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
