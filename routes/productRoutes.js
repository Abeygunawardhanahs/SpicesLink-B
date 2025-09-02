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

// **FIXED ROUTE** - Get price history for a product (REMOVED POPULATE)
router.get('/:id/prices', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, days } = req.query;
    
    console.log('Fetching price history for product:', id);
    console.log('Limit:', limit, 'Days:', days);
    
    // FIXED: Removed .populate() that was causing the User schema error
    const product = await Product.findById(id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    let prices = product.priceHistory || [];
    
    // Filter by days if specified
    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      prices = prices.filter(entry => entry.date >= startDate);
    }
    
    // Sort by date (newest first) and limit results
    prices = prices
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, parseInt(limit));
    
    // Response format that matches your frontend expectations
    const response = {
      success: true,
      productId: id,
      productName: product.name,
      totalEntries: product.priceHistory?.length || 0,
      filteredEntries: prices.length,
      prices: prices // This matches what your frontend expects
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// **UPDATED ROUTE** - Add price history entry manually (PRICE FIELD REMOVED)
router.post('/:id/prices', async (req, res) => {
  try {
    const { id } = req.params;
    const { pricePer100g, weeklyQuantity, reason = 'Manual price update' } = req.body;
    
    console.log('Adding price history for product:', id);
    console.log('Price data:', { pricePer100g, weeklyQuantity });
    
    // Validate that at least one field is provided
    if (!pricePer100g && !weeklyQuantity) {
      return res.status(400).json({ 
        success: false,
        message: 'At least pricePer100g or weeklyQuantity is required' 
      });
    }
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }
    
    // Add new price entry to history
    const newPriceEntry = {
      pricePer100g: pricePer100g ? pricePer100g.toString() : '0',
      weeklyQuantity: weeklyQuantity ? weeklyQuantity.toString() : '0',
      date: new Date(),
      updatedBy: product.userId, // Use the product owner's ID
      reason: reason
    };
    
    product.priceHistory.push(newPriceEntry);
    
    await product.save();
    
    res.json({
      success: true,
      message: 'Price data added successfully',
      priceEntry: newPriceEntry
    });
    
  } catch (error) {
    console.error('Error adding price history:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Price analytics route (updated without main price field)
router.get('/:id/price-analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;
    
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const recentHistory = product.priceHistory
      .filter(entry => entry.date >= startDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    if (recentHistory.length === 0) {
      return res.json({
        message: 'No price data available for the specified period',
        analytics: null
      });
    }
    
    // Calculate analytics based on pricePer100g
    const pricesPer100g = recentHistory
      .map(entry => parseFloat(entry.pricePer100g))
      .filter(price => price > 0);
    
    const weeklyQuantities = recentHistory
      .map(entry => parseFloat(entry.weeklyQuantity))
      .filter(qty => qty > 0);
    
    let analytics = {
      period: `${days} days`,
      totalEntries: recentHistory.length,
    };
    
    if (pricesPer100g.length > 0) {
      const minPrice = Math.min(...pricesPer100g);
      const maxPrice = Math.max(...pricesPer100g);
      const avgPrice = pricesPer100g.reduce((sum, price) => sum + price, 0) / pricesPer100g.length;
      
      const firstPrice = pricesPer100g[0];
      const lastPrice = pricesPer100g[pricesPer100g.length - 1];
      const priceChange = lastPrice - firstPrice;
      const percentChange = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;
      
      analytics.pricePer100g = {
        current: lastPrice.toFixed(2),
        min: minPrice.toFixed(2),
        max: maxPrice.toFixed(2),
        avg: avgPrice.toFixed(2),
        change: priceChange.toFixed(2),
        percentChange: percentChange.toFixed(2),
        trend: priceChange > 0 ? 'increasing' : priceChange < 0 ? 'decreasing' : 'stable'
      };
    }
    
    if (weeklyQuantities.length > 0) {
      const avgQuantity = weeklyQuantities.reduce((sum, qty) => sum + qty, 0) / weeklyQuantities.length;
      const minQuantity = Math.min(...weeklyQuantities);
      const maxQuantity = Math.max(...weeklyQuantities);
      
      analytics.weeklyQuantity = {
        avg: avgQuantity.toFixed(2),
        min: minQuantity.toFixed(2),
        max: maxQuantity.toFixed(2)
      };
    }
    
    res.json({
      productId: id,
      productName: product.name,
      analytics: analytics,
      recentHistory: recentHistory
    });
    
  } catch (error) {
    console.error('Error calculating price analytics:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete a product
router.delete('/:productId', productController.deleteProduct);

// Update a product
router.put('/:productId', productController.updateProduct);

module.exports = router;