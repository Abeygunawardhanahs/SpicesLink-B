const Supplier = require('../models/Supplier');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// SUPPLIER REGISTRATION 

exports.registerSupplier = async (req, res) => {
  try {
    
    const { fullName, contactNumber, email, password } = req.body;

    // Check if supplier already exists using the 'email' field
    const existingSupplier = await Supplier.findOne({ email });
    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message: 'A supplier with this email already exists.'
      });
    }

    // Hash the password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create a new supplier using the simplified model
    const newSupplier = new Supplier({
      fullName,
      contactNumber,
      email: email.toLowerCase(), 
      password: hashedPassword
    });

    // Save the new supplier to the database
    await newSupplier.save();

    // Prepare the response, removing the password for security
    const supplierResponse = newSupplier.toObject();
    delete supplierResponse.password;

    res.status(201).json({
      success: true,
      message: 'Supplier registered successfully!',
      data: supplierResponse
    });

  } catch (error) {
    console.error('SUPPLIER REGISTRATION ERROR:', error);

    // Handle validation errors from the model
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your input.',
        errors: validationErrors
      });
    }

    // Handle other server errors
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred during registration.'
    });
  }
};


// SUPPLIER LOGIN 

exports.loginSupplier = async (req, res) => {
  try {
    // Expect 'email' and 'password' from the login form
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Find the supplier by their email address
    const supplier = await Supplier.findOne({ email: email.toLowerCase() });
    if (!supplier) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if the account is active
    if (!supplier.isActive) {
        return res.status(403).json({
            success: false,
            message: 'Your account is currently inactive.'
        });
    }

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, supplier.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Update the last login time
    supplier.lastLogin = new Date();
    await supplier.save();

    // Generate a JWT token for the authenticated session
    const token = jwt.sign(
      {
        id: supplier._id,
        email: supplier.email,
        role: 'supplier'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare the response, removing the password
    const supplierResponse = supplier.toObject();
    delete supplierResponse.password;

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      data: {
        supplier: supplierResponse,
        token
      }
    });

  } catch (error) {
    console.error('SUPPLIER LOGIN ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'An internal server error occurred during login.'
    });
  }
};

