const mongoose = require('mongoose');

// supplier schema
const supplierSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
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
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },

  // Rating system
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {       
    type: Number,
    default: 0
  },

  lastLogin: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });


// Create an index on the 'email' field for faster login queries
supplierSchema.index({ email: 1 });
// Add index for rating for faster sorting
supplierSchema.index({ rating: -1 });
// Add compound index for search functionality
supplierSchema.index({ fullName: 'text', email: 'text' });

// You can add other functions like getSupplierProfile and updateSupplierProfile here later.

module.exports = mongoose.model('Supplier', supplierSchema);