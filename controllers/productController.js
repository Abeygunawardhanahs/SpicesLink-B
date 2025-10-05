const Product = require('../models/Product');
const mongoose = require('mongoose'); 

// Add a new product (Updated for new fields, no image)
const addProduct = async (req, res) => {
  try {
    console.log('=== ADD PRODUCT DEBUG ===');
    console.log('Request body:', req.body);

    // Extract data from request body
    const { name, userId, userName, shopName, location, description, category } = req.body;

    console.log('Extracted data:', {
      name,
      userId,
      userName,
      shopName,
      location,
    
    });

    // Validate required fields
    if (!name || !name.trim()) {
      console.error('Product name is missing');
      return res.status(400).json({ 
        success: false,
        message: 'Product name is required.' 
      });
    }

    if (!userId) {
      console.error('User ID is missing');
      return res.status(400).json({ 
        success: false,
        message: 'User ID is required.' 
      });
    }

    if (!userName || !userName.trim()) {
      console.error('User name is missing');
      return res.status(400).json({ 
        success: false,
        message: 'User name is required.' 
      });
    }

    if (!shopName || !shopName.trim()) {
      console.error('Shop name is missing');
      return res.status(400).json({ 
        success: false,
        message: 'Shop name is required.' 
      });
    }

    if (!location || !location.trim()) {
      console.error('Location is missing');
      return res.status(400).json({ 
        success: false,
        message: 'Location is required.' 
      });
    }

    // Create new product data (no image field)
    const productData = {
      name: name.trim(),
      userId: userId,
      userName: userName.trim(),
      shopName: shopName.trim(),
      location: location.trim(),
      description: description ? description.trim() : '',
      category: category || 'Uncategorized',
      userType: 'Buyer' 
    };

    console.log('Creating product with data:', productData);

    // Create and save new product
    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();

    console.log('Product saved successfully:', savedProduct);

    // Send success response
    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: savedProduct
    });

  } catch (error) {
    console.error('=== ADD PRODUCT ERROR ===');
    console.error('Error:', error.message);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      console.error('Duplicate key error:', error);
      return res.status(400).json({
        success: false,
        message: 'A product with this information already exists'
      });
    }

    // Handle other errors
    res.status(500).json({
      success: false,
      message: 'Failed to add product',
      error: error.message
    });
  }
};

// Update a product (enhanced for new fields)
const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const updateData = req.body;
    
    console.log('Updating product:', productId);
    console.log('Update data:', updateData);
    
    // Find and update the product
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    console.log('Product updated successfully:', updatedProduct.name);
    
    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
    
  } catch (error) {
    console.error('Error updating product:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      success: false,
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
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    console.log('Product deleted:', deletedProduct.name);
    
    res.json({ 
      success: true,
      message: 'Product deleted successfully',
      deletedProduct: {
        id: deletedProduct._id,
        name: deletedProduct.name,
        shopName: deletedProduct.shopName
      }
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// Get a single product with full details
const getProductWithHistory = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    // Sort price history by date (newest first)
    if (product.priceHistory) {
      product.priceHistory.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
    
    res.json({
      success: true,
      product
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error',
      error: error.message 
    });
  }
};

// Get products by buyer ID
const getProductsByBuyer = async (req, res) => {
  try {
    const { buyerId } = req.params;
    console.log('Fetching products for buyerId:', buyerId);

       if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid buyer ID format'
      });
    }

    const products = await Product.find({
      userId: new mongoose.Types.ObjectId(buyerId)
    });

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No products found for this buyer'
      });
    }
    res.json(products);
  } catch (error) {
    console.error('Error fetching buyer products:', error);
    res.status(500).json({
      success: false,
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
  getProductsByBuyer,
};