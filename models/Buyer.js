const mongoose = require('mongoose');

// Buyer schema 
const buyerSchema = new mongoose.Schema({
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true
  },
  shopOwnerName: {
    type: String,
    required: [true, 'Owner name is required'],
    trim: true
  },
  shopLocation: {
    type: String,
    required: [true, 'Shop location is required'],
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    validate: {
      validator: function(v) {
        return /\d{10,15}/.test(v);
      },
      message: 'Contact number must be between 10 and 15 digits.'
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
      message: 'Please enter a valid email address.'
    }
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  
  // decimalnumber: {
  //   type: Double,
  //   required: [true ,'only have two decimal points'],
  //   validate: {
  //     validator: function(v) {
  //       return /^\d+(\.\d{1,2})?$/.test(v);
  //     },
  //     message: 'Value must have at most two decimal points.'
  //   }
  // },

  //  Bank Details 
  bankDetails: {
    accountNumber: { type: String, default: null },
    ifscCode: { type: String, default: null },
    bankName: { type: String, default: null },
    branch: { type: String, default: null },
    addedAt: { type: Date, default: null }
  },

  // Tracks when buyer last logged in
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
  timestamps: true
});

// Indexes -searching buyers by location
buyerSchema.index({ shopLocation: 1 });

module.exports = mongoose.model('Buyer', buyerSchema);
