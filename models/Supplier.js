const mongoose = require('mongoose');

// This schema now perfectly matches your frontend registration form + rating field
const supplierSchema = new mongoose.Schema({
  // Matches the 'fullName' state in your app
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  // Matches the 'contactNumber' state in your app
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    validate: {
      validator: function(v) {
        return /\d{10,15}/.test(v);
      },
      message: 'Contact number should be between 10-15 digits'
    }
  },
  // Matches the 'email' state in your app
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  // Matches the 'password' state in your app
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  // ✅ NEW: Rating field for supplier rating system
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
    validate: {
      validator: function(v) {
        return v >= 0 && v <= 5;
      },
      message: 'Rating must be between 0 and 5'
    }
  },
  lastLogin: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  // Adds createdAt and updatedAt timestamps automatically
  timestamps: true
});

// Create an index on the 'email' field for faster login queries
supplierSchema.index({ email: 1 });
// Add index for rating for faster sorting
supplierSchema.index({ rating: -1 });
// Add compound index for search functionality
supplierSchema.index({ fullName: 'text', email: 'text' });

// You can add other functions like getSupplierProfile and updateSupplierProfile here later.

module.exports = mongoose.model('Supplier', supplierSchema);