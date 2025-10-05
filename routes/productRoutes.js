const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Buyer = require('../models/Buyer');
const mongoose = require('mongoose');

const productController = require('../controllers/productController');

const {
   getProductsByBuyer   
}  = require('../controllers/productController');

// Middleware to log all requests for debugging
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
    console.log(`Found ${products.length} total products`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

//Add a new product
router.post('/', productController.addProduct);

// Get products by user ID
// router.get('/buyer/:buyerId', async (req, res) => {
//   try {
//     const { buyerId } = req.params;
//     if (!buyerId) return res.status(400).json({ message: 'Buyer ID is required' });

//     const products = await Product.find({ userId: buyerId });
//     console.log(`Found ${products.length} products for user ${buyerId}`);
//     res.json(products);
//   } catch (error) {
//     console.error('Error fetching user products:', error);
//     res.status(500).json({ message: 'Internal Server Error' });
//   }
// });

// Get price history for a specific product
router.get('/:productId/prices', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product ID format' 
      });
    }

    console.log(`Fetching price history for product: ${productId}`);

    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // get price history
    const prices = product.priceHistory || [];
    console.log(`Found ${prices.length} price entries for product ${productId}`);

    res.json({
      success: true,
      prices: prices,
      productId: productId,
      productName: product.name
    });

  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
});

// Add new price entry to a product
router.post('/:productId/prices', async (req, res) => {
  try {
    const { productId } = req.params;
    const { pricePer100g, weeklyQuantity, date } = req.body;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product ID format' 
      });
    }

    console.log(`Adding price entry for product: ${productId}`);
    console.log('Price data:', { pricePer100g, weeklyQuantity, date });

    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Create new price entry
    const newPriceEntry = {
      _id: new mongoose.Types.ObjectId(),
      pricePer100g: parseFloat(pricePer100g) || 0,
      weeklyQuantity: parseFloat(weeklyQuantity) || 0,
      date: date || new Date().toISOString()
    };

    // Initialize priceHistory if it doesn't exist
    if (!product.priceHistory) {
      product.priceHistory = [];
    }

    // Add the new price entry
    product.priceHistory.push(newPriceEntry);

    // Save the product
    await product.save();

    console.log(`Price entry added successfully for product ${productId}`);

    res.json({
      success: true,
      message: 'Price added successfully',
      priceEntry: newPriceEntry,
      productId: productId
    });

  } catch (error) {
    console.error('Error adding price:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
});

// Update existing price entry
router.put('/:productId/prices/:priceId', async (req, res) => {
  try {
    const { productId, priceId } = req.params;
    const { pricePer100g, weeklyQuantity } = req.body;

    // Validate Ids
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product ID format' 
      });
    }

    if (!mongoose.Types.ObjectId.isValid(priceId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid price ID format' 
      });
    }

    console.log(`Updating price entry ${priceId} for product: ${productId}`);
    console.log('Update data:', { pricePer100g, weeklyQuantity });

    // Find the product
    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Find and update the price entry
    if (!product.priceHistory) {
      return res.status(404).json({ 
        success: false, 
        message: 'No price history found' 
      });
    }
    // Find the price entry by Id
    const priceEntryIndex = product.priceHistory.findIndex(
      entry => entry._id.toString() === priceId
    );

    if (priceEntryIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Price entry not found' 
      });
    }

    // Update the price entry
    product.priceHistory[priceEntryIndex].pricePer100g = parseFloat(pricePer100g) || 0;
    product.priceHistory[priceEntryIndex].weeklyQuantity = parseFloat(weeklyQuantity) || 0;

    // Save the product
    await product.save();

    console.log(`Price entry updated successfully for product ${productId}`);

    res.json({
      success: true,
      message: 'Price updated successfully',
      priceEntry: product.priceHistory[priceEntryIndex],
      productId: productId
    });

  } catch (error) {
    console.error('Error updating price:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
});

// Get price analytics for a product
router.get('/:productId/price-analytics', async (req, res) => {
  try {
    const { productId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid product ID format' 
      });
    }

    const product = await Product.findById(productId);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    const prices = product.priceHistory || [];
    
    if (prices.length === 0) {
      return res.json({
        success: true,
        analytics: {
          totalEntries: 0,
          averagePrice: 0,
          minPrice: 0,
          maxPrice: 0,
          priceData: []
        }
      });
    }

    // Calculate analytics
    const priceValues = prices.map(p => p.pricePer100g).filter(p => p > 0);
    const averagePrice = priceValues.reduce((sum, price) => sum + price, 0) / priceValues.length;
    const minPrice = Math.min(...priceValues);
    const maxPrice = Math.max(...priceValues);

    res.json({
      success: true,
      analytics: {
        totalEntries: prices.length,
        averagePrice: averagePrice.toFixed(2),
        minPrice,
        maxPrice,
        priceData: prices.map(p => ({
          date: p.date,
          price: p.pricePer100g,
          quantity: p.weeklyQuantity
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching price analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal Server Error',
      error: error.message 
    });
  }
});

// Get shops by product name
router.get('/shops/:productName', async (req, res) => {
  try {
    const { productName } = req.params;

    console.log('=== SEARCHING FOR SHOPS ===');
    console.log('Product Name:', productName);
    // find products matching the name 
    const products = await Product.find({ 
      name: new RegExp(productName, 'i') 
    });

    console.log('Found products:', products.length);

    if (!products.length) {
      return res.status(404).json({ 
        success: false, 
        message: `No products found matching "${productName}"` 
      });
    }
    // Extract unique buyer IDs from products
    const buyerIds = [...new Set(
      products
        .filter(p => p.userType === 'Buyer')
        .map(p => p.userId)
    )];

    console.log('Unique buyer IDs:', buyerIds);

    if (!buyerIds.length) {
      return res.status(404).json({ 
        success: false, 
        message: `No buyer shops found selling "${productName}"` 
      });
    }
    // Find buyers (shops) by Ids.
    const buyers = await Buyer.find({ _id: { $in: buyerIds } });
    console.log('Found buyers:', buyers.length);
    // map buyers to shop details with product info
    const shops = buyers.map(buyer => {
      const buyerProducts = products.filter(p => 
        p.userId.toString() === buyer._id.toString() && p.userType === 'Buyer'
      );

      let latestPrice = 'Contact for price';
      let weeklyQuantity = 'Contact for quantity';
      let availability = 'Available';

      if (buyerProducts.length > 0) {
        const buyerProduct = buyerProducts[0];
        if (buyerProduct.priceHistory && buyerProduct.priceHistory.length > 0) {
          const latestPriceEntry = buyerProduct.priceHistory
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

          if (latestPriceEntry.pricePer100g && latestPriceEntry.pricePer100g !== '0') {
            latestPrice = `Rs. ${latestPriceEntry.pricePer100g}/100g`;
          }
          if (latestPriceEntry.weeklyQuantity && latestPriceEntry.weeklyQuantity !== '0') {
            weeklyQuantity = `${latestPriceEntry.weeklyQuantity} units/week`;
            availability = parseInt(latestPriceEntry.weeklyQuantity) > 0 ? 'In Stock' : 'Limited Stock';
          }
        }
      }

      return {
        shopId: buyer._id,
        shopName: buyer.shopName || buyer.name || 'Shop Name Not Set',
        shopLocation: buyer.shopLocation || buyer.location || 'Location not specified',
        contactNumber: buyer.contactNumber || buyer.phone || 'Contact not available',
        price: latestPrice,
        weeklyQuantity,
        availability,
        productCount: buyerProducts.length,
        productId: buyerProducts[0]?._id,
        hasCurrentStock: buyerProducts.some(p => p.priceHistory?.length > 0)
      };
    });

    res.json({ 
      success: true, 
      shops,
      productName: productName,
      totalShops: shops.length
    });
  } catch (err) {
    console.error('Error in /shops/:productName route:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching shops',
      error: err.message 
    });
  }
});

// Get shop details by shopId and productName
router.get('/shops/:shopId/details', async (req, res) => {
  try {
    const { shopId } = req.params;
    const { productName } = req.query;
    // Validate shopId
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({ success: false, message: 'Invalid shopId' });
    }

    const buyer = await Buyer.findById(shopId);
    if (!buyer) return res.status(404).json({ success: false, message: 'Shop not found' });
    //Find products for the shop
    const products = await Product.find({
      userId: buyer._id,
      name: new RegExp(productName, 'i'),
      userType: 'Buyer',
    });

    res.json({
      success: true,
      shopDetails: {
        ...buyer.toObject(),
        products,
      },
    });
  } catch (err) {
    console.error('Error fetching shop details:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});
// Get products 
// router.get('/buyer/:buyerId', getProductsByBuyer);
router.get('/buyer/:buyerId', async (req, res) => {
  try {
    const { buyerId } = req.params;
    if (!buyerId) return res.status(400).json({ message: 'Buyer ID is required' });

    if (!mongoose.Types.ObjectId.isValid(buyerId)) {
      return res.status(400).json({ message: 'Invalid buyer ID format' });
    }

    const products = await Product.find({
      userId: new mongoose.Types.ObjectId(buyerId)
    });

    console.log(`Found ${products.length} products for user ${buyerId}`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete product
router.delete('/:productId', productController.deleteProduct);

// Update product
router.put('/:productId', productController.updateProduct);

module.exports = router;