// const Product = require('../models/Product');

// // Controller to get all products
// exports.getAllProducts = async (req, res) => {
//   try {
//     const products = await Product.find();
//     res.json(products);
//   } catch (error) {
//     console.error('Error fetching products:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// // Controller to add a product
// exports.addProduct = async (req, res) => {
//   try {
//     console.log('=== ADD PRODUCT DEBUG ===');
//     console.log('Request method:', req.method);
//     console.log('Request URL:', req.url);
//     console.log('Request headers:', req.headers);
//     console.log('Request body:', req.body);
//     console.log('Request body type:', typeof req.body);
//     console.log('Request body keys:', req.body ? Object.keys(req.body) : 'No body');

//     // Check if request body exists and is not empty
//     if (!req.body || Object.keys(req.body).length === 0) {
//       console.error('Request body is empty or missing');
//       return res.status(400).json({
//         message: 'Request body is missing. Make sure to send Content-Type: application/json and valid JSON data'
//       });
//     }

//     // Accept both userId and buyerId for compatibility
//     const { name, description, price, category, image, userId, buyerId } = req.body;
//     const actualUserId = userId || buyerId;

//     console.log('Extracted data:', {
//       name,
//       description,
//       price,
//       category,
//       image,
//       actualUserId
//     });

//     // Validate required fields
//     if (!name || !name.trim()) {
//       console.error('Product name is missing');
//       return res.status(400).json({ message: 'Product name is required.' });
//     }

//     if (!actualUserId) {
//       console.error('User ID is missing');
//       return res.status(400).json({ message: 'User ID is required.' });
//     }

//     // Create new product instance
//     const productData = {
//       name: name.trim(),
//       description: description ? description.trim() : '',
//       price: price || '0',
//       category: category || 'Uncategorized',
//       image: image || null,
//       userId: actualUserId
//     };

//     console.log('Creating product with data:', productData);

//     const newProduct = new Product(productData);

//     console.log('Product instance created:', newProduct);

//     // Save to database
//     const savedProduct = await newProduct.save();

//     console.log('Product saved successfully to database:', savedProduct);

//     // Send success response
//     const response = {
//       message: 'Product added successfully',
//       product: savedProduct
//     };

//     console.log('Sending response:', response);
//     return res.status(201).json(response);

//   } catch (error) {
//     console.error('=== ADD PRODUCT ERROR ===');
//     console.error('Error type:', error.name);
//     console.error('Error message:', error.message);
//     console.error('Full error:', error);

//     // Check for specific MongoDB validation errors
//     if (error.name === 'ValidationError') {
//       const validationErrors = Object.values(error.errors).map(err => err.message);
//       console.error('Validation errors:', validationErrors);
//       return res.status(400).json({
//         message: 'Validation Error',
//         errors: validationErrors
//       });
//     }

//     // Handle duplicate key errors
//     if (error.code === 11000) {
//       console.error('Duplicate key error:', error);
//       return res.status(400).json({
//         message: 'Duplicate entry',
//         error: 'A product with this information already exists'
//       });
//     }

//     // Handle mongoose connection errors
//     if (error.name === 'MongooseError' || error.name === 'MongoError') {
//       console.error('Database connection error:', error);
//       return res.status(500).json({
//         message: 'Database connection error',
//         error: error.message
//       });
//     }

//     // Handle other types of errors
//     return res.status(500).json({
//       message: 'Failed to add product',
//       error: error.message,
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// };

// // Controller to get products by user ID
// exports.getProductsByUser = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     console.log('Fetching products for user:', userId);
    
//     if (!userId) {
//       return res.status(400).json({ message: 'User ID is required' });
//     }
    
//     const products = await Product.find({ userId: userId });
//     console.log(`Found ${products.length} products for user ${userId}`);
    
//     res.json(products);
//   } catch (error) {
//     console.error('Error fetching user products:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// };

// // Controller to delete a product
// exports.deleteProduct = async (req, res) => {
//   try {
//     const productId = req.params.productId;
//     const userId = req.user?.userId; // Get user ID from token if available

//     console.log('Deleting product:', productId, 'for user:', userId);

//     if (!productId) {
//       return res.status(400).json({ message: 'Product ID is required' });
//     }

//     // If no auth middleware, allow deletion (for development)
//     const query = userId ? { _id: productId, userId: userId } : { _id: productId };
    
//     const product = await Product.findOne(query);

//     if (!product) {
//       return res.status(404).json({ 
//         message: 'Product not found or you are not authorized to delete it' 
//       });
//     }

//     await Product.deleteOne({ _id: productId });
//     console.log('Product deleted successfully');
    
//     res.json({ message: 'Product deleted successfully' });
//   } catch (error) {
//     console.error('Delete product error:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// // Controller to update a product
// exports.updateProduct = async (req, res) => {
//   try {
//     const productId = req.params.productId;
//     const updates = req.body;
//     const userId = req.user?.userId;

//     console.log('Updating product:', productId, 'with:', updates);

//     if (!productId) {
//       return res.status(400).json({ message: 'Product ID is required' });
//     }

//     if (!updates || Object.keys(updates).length === 0) {
//       return res.status(400).json({ message: 'Update data is required' });
//     }

//     // If no auth middleware, allow update (for development)
//     const query = userId ? { _id: productId, userId: userId } : { _id: productId };

//     const product = await Product.findOneAndUpdate(
//       query,
//       updates,
//       { new: true, runValidators: true }
//     );

//     if (!product) {
//       return res.status(404).json({ 
//         message: 'Product not found or you are not authorized to update it' 
//       });
//     }

//     console.log('Product updated successfully:', product);
//     res.json(product);
//   } catch (error) {
//     console.error('Update product error:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };

// productController.js - Enhanced version with price history tracking
const Product = require('../models/Product');

// Add a new product
const addProduct = async (req, res) => {
  try {
    const productData = req.body;
    
    // Add user ID from authenticated user (assuming you have auth middleware)
    if (req.user) {
      productData.userId = req.user.id;
    }
    
    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();
    
    console.log('✅ Product added successfully:', savedProduct.name);
    console.log('📊 Initial price history entries:', savedProduct.priceHistory.length);
    
    res.status(201).json({
      message: 'Product added successfully',
      product: savedProduct
    });
  } catch (error) {
    console.error('❌ Error adding product:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// Update a product (with price history tracking)
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;
    
    console.log('🔄 Updating product:', productId);
    console.log('📝 Update data:', updateData);
    
    // Find the current product first
    const currentProduct = await Product.findById(productId);
    if (!currentProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const oldPrice = currentProduct.price;
    const newPrice = updateData.price;
    
    // Check if price is being updated
    const priceChanged = newPrice && oldPrice !== newPrice;
    
    if (priceChanged) {
      console.log(`💰 Price change detected: ${oldPrice} → ${newPrice}`);
      
      // Add to price history manually before updating
      currentProduct.priceHistory.push({
        price: newPrice,
        date: new Date(),
        updatedBy: req.user?.id || currentProduct.userId,
        reason: 'Product update'
      });
    }
    
    // Update the product
    Object.assign(currentProduct, updateData);
    const updatedProduct = await currentProduct.save();
    
    const response = {
      message: 'Product updated successfully',
      product: updatedProduct
    };
    
    if (priceChanged) {
      response.priceHistory = {
        oldPrice: oldPrice,
        newPrice: newPrice,
        historyEntries: updatedProduct.priceHistory.length
      };
    }
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ Error updating product:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const deletedProduct = await Product.findByIdAndDelete(productId);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    console.log('🗑️ Product deleted:', deletedProduct.name);
    console.log('📊 Price history entries lost:', deletedProduct.priceHistory?.length || 0);
    
    res.json({ 
      message: 'Product deleted successfully',
      deletedProduct: {
        id: deletedProduct._id,
        name: deletedProduct.name,
        priceHistoryEntries: deletedProduct.priceHistory?.length || 0
      }
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// Get a single product with full price history
const getProductWithHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId)
      .populate('userId', 'name email')
      .populate('priceHistory.updatedBy', 'name email');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Sort price history by date (newest first)
    if (product.priceHistory) {
      product.priceHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    res.json(product);
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// Bulk update prices (useful for market price updates)
const bulkUpdatePrices = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { productId, newPrice, reason }
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates array is required' });
    }
    
    console.log(`📦 Bulk updating prices for ${updates.length} products`);
    
    const results = [];
    
    for (const update of updates) {
      try {
        const { productId, newPrice, reason = 'Bulk price update' } = update;
        
        const product = await Product.findById(productId);
        if (!product) {
          results.push({ productId, status: 'error', message: 'Product not found' });
          continue;
        }
        
        const oldPrice = product.price;
        
        if (oldPrice !== newPrice) {
          await product.addPriceHistory(newPrice, req.user?.id, reason);
          results.push({ 
            productId, 
            status: 'success', 
            oldPrice, 
            newPrice,
            message: 'Price updated successfully'
          });
        } else {
          results.push({ 
            productId, 
            status: 'skipped', 
            message: 'Price unchanged'
          });
        }
      } catch (error) {
        results.push({ 
          productId: update.productId, 
          status: 'error', 
          message: error.message 
        });
      }
    }
    
    const successful = results.filter(r => r.status === 'success').length;
    const errors = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    
    res.json({
      message: 'Bulk price update completed',
      summary: {
        total: updates.length,
        successful,
        errors,
        skipped
      },
      results
    });
    
  } catch (error) {
    console.error('❌ Error in bulk price update:', error);
    res.status(500).json({ 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

module.exports = {
  addProduct,
  updateProduct,
  deleteProduct,
  getProductWithHistory,
  bulkUpdatePrices
};