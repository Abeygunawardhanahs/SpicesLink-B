const mongoose = require('mongoose');

// This schema now perfectly matches your frontend registration form.
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

module.exports = mongoose.model('Supplier', supplierSchema);