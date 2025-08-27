const Product = require('../models/Product');

// Controller to get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Controller to add a product
exports.addProduct = async (req, res) => {
  try {
    console.log('=== ADD PRODUCT DEBUG ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Request body type:', typeof req.body);
    console.log('Request body keys:', req.body ? Object.keys(req.body) : 'No body');

    // Check if request body exists and is not empty
    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Request body is empty or missing');
      return res.status(400).json({
        message: 'Request body is missing. Make sure to send Content-Type: application/json and valid JSON data'
      });
    }

    // Accept both userId and buyerId for compatibility
    const { name, description, price, category, image, userId, buyerId } = req.body;
    const actualUserId = userId || buyerId;

    console.log('Extracted data:', {
      name,
      description,
      price,
      category,
      image,
      actualUserId
    });

    // Validate required fields
    if (!name || !name.trim()) {
      console.error('Product name is missing');
      return res.status(400).json({ message: 'Product name is required.' });
    }

    if (!actualUserId) {
      console.error('User ID is missing');
      return res.status(400).json({ message: 'User ID is required.' });
    }

    // Create new product instance
    const productData = {
      name: name.trim(),
      description: description ? description.trim() : '',
      price: price || '0',
      category: category || 'Uncategorized',
      image: image || null,
      userId: actualUserId
    };

    console.log('Creating product with data:', productData);

    const newProduct = new Product(productData);

    console.log('Product instance created:', newProduct);

    // Save to database
    const savedProduct = await newProduct.save();

    console.log('Product saved successfully to database:', savedProduct);

    // Send success response
    const response = {
      message: 'Product added successfully',
      product: savedProduct
    };

    console.log('Sending response:', response);
    return res.status(201).json(response);

  } catch (error) {
    console.error('=== ADD PRODUCT ERROR ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Full error:', error);

    // Check for specific MongoDB validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.error('Validation errors:', validationErrors);
      return res.status(400).json({
        message: 'Validation Error',
        errors: validationErrors
      });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      console.error('Duplicate key error:', error);
      return res.status(400).json({
        message: 'Duplicate entry',
        error: 'A product with this information already exists'
      });
    }

    // Handle mongoose connection errors
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      console.error('Database connection error:', error);
      return res.status(500).json({
        message: 'Database connection error',
        error: error.message
      });
    }

    // Handle other types of errors
    return res.status(500).json({
      message: 'Failed to add product',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Controller to get products by user ID
exports.getProductsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching products for user:', userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const products = await Product.find({ userId: userId });
    console.log(`Found ${products.length} products for user ${userId}`);
    
    res.json(products);
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Controller to delete a product
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user?.userId; // Get user ID from token if available

    console.log('Deleting product:', productId, 'for user:', userId);

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // If no auth middleware, allow deletion (for development)
    const query = userId ? { _id: productId, userId: userId } : { _id: productId };
    
    const product = await Product.findOne(query);

    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found or you are not authorized to delete it' 
      });
    }

    await Product.deleteOne({ _id: productId });
    console.log('Product deleted successfully');
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Controller to update a product
exports.updateProduct = async (req, res) => {
  try {
    const productId = req.params.productId;
    const updates = req.body;
    const userId = req.user?.userId;

    console.log('Updating product:', productId, 'with:', updates);

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Update data is required' });
    }

    // If no auth middleware, allow update (for development)
    const query = userId ? { _id: productId, userId: userId } : { _id: productId };

    const product = await Product.findOneAndUpdate(
      query,
      updates,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ 
        message: 'Product not found or you are not authorized to update it' 
      });
    }

    console.log('Product updated successfully:', product);
    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};