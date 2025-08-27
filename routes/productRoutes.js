const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const productController = require('../controllers/productController');

// Middleware to log all requests
router.use((req, res, next) => {
  console.log(`=== PRODUCT ROUTE DEBUG ===`);
  console.log(`${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  console.log('Params:', req.params);
  next();
});

// GET all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Add a new product (POST /)
router.post('/', productController.addProduct);

// Get products by user ID
router.get('/buyer/:buyerId', async (req, res) => {
  try {
    const { buyerId } = req.params;
    console.log('Fetching products for buyer:', buyerId);
    
    if (!buyerId) {
      return res.status(400).json({ message: 'Buyer ID is required' });
    }
    
    const products = await Product.find({ userId: buyerId });
    console.log(`Found ${products.length} products for buyer ${buyerId}`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a product
router.delete('/:productId', productController.deleteProduct);

// Update a product
router.put('/:productId', productController.updateProduct);

module.exports = router;