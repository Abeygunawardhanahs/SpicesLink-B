const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  description: { 
    type: String, 
    default: '',
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  price: { 
    type: String, 
    default: '0',
    validate: {
      validator: function(v) {
        return /^\d*\.?\d+$/.test(v) || v === '';
      },
      message: 'Price must be a valid number'
    }
  },
  category: { 
    type: String, 
    default: 'Uncategorized',
    enum: ['Spices', 'Herbs', 'Seeds', 'Powders', 'Whole Spices', 'Blends', 'Other', 'Uncategorized']
  },
  image: { 
    type: String, 
    default: null 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required'] 
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add indexes for better query performance
productSchema.index({ userId: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Virtual for formatted price
productSchema.virtual('formattedPrice').get(function() {
  return this.price ? `$${parseFloat(this.price).toFixed(2)}` : '$0.00';
});

module.exports = mongoose.model('Product', productSchema);