const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Buyer = require('../models/Buyer');
const productController = require('../controllers/productController');

// Middleware to log all requests (for debugging)
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

// Add a new product
router.post('/', productController.addProduct);

// Get products by user ID
router.get('/buyer/:buyerId', async (req, res) => {
  try {
    const { buyerId } = req.params;
    if (!buyerId) return res.status(400).json({ message: 'Buyer ID is required' });

    const products = await Product.find({ userId: buyerId });
    console.log(`Found ${products.length} products for user ${buyerId}`);
    res.json(products);
  } catch (error) {
    console.error('Error fetching user products:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// **UPDATED** - Get shops by product name (MAIN FIX HERE)
router.get('/shops/:productName', async (req, res) => {
  try {
    const { productName } = req.params;
    
    console.log('=== SEARCHING FOR SHOPS ===');
    console.log('Product Name:', productName);

    // Search for products with matching name (case-insensitive)
    const products = await Product.find({ 
      name: new RegExp(productName, 'i') 
    });

    console.log('Found products:', products.length);
    products.forEach(p => console.log(`- ${p.name} by user ${p.userId} (${p.userType || 'Unknown type'})`));

    if (!products.length) {
      return res.status(404).json({ 
        success: false, 
        message: `No products found matching "${productName}"` 
      });
    }

    // FIXED: Get unique buyer IDs from products (filter for buyer products only)
    const buyerIds = [...new Set(
      products
        .filter(p => p.userType === 'Buyer') // Only get products from buyers
        .map(p => p.userId) // FIXED: Use userId instead of buyerId
    )];

    console.log('Unique buyer IDs:', buyerIds);

    if (buyerIds.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: `No buyer shops found selling "${productName}"` 
      });
    }

    // Fetch buyer details
    const buyers = await Buyer.find({ _id: { $in: buyerIds } });
    console.log('Found buyers:', buyers.length);

    // Create shops array with enhanced product info
    const shops = buyers.map(buyer => {
      // Find the product(s) for this buyer
      const buyerProducts = products.filter(p => 
        p.userId.toString() === buyer._id.toString() && p.userType === 'Buyer'
      );

      // Get latest price data if available
      let latestPrice = 'Contact for price';
      let weeklyQuantity = 'Contact for quantity';
      let availability = 'Available';

      if (buyerProducts.length > 0) {
        // Use the first matching product's latest price data
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
        weeklyQuantity: weeklyQuantity,
        availability: availability,
        // Additional data
        productCount: buyerProducts.length,
        productId: buyerProducts[0]?._id,
        hasCurrentStock: buyerProducts.some(p => p.priceHistory?.length > 0)
      };
    });

    console.log('Final shops data:', shops.length, 'shops');
    shops.forEach(shop => console.log(`- ${shop.shopName} at ${shop.shopLocation}`));

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

// **NEW** - Alternative broader search route
router.get('/shops-search/:productName', async (req, res) => {
  try {
    const { productName } = req.params;
    
    console.log('=== BROAD SHOP SEARCH ===');
    console.log('Product Name:', productName);

    // More flexible search - includes partial matches
    const searchTerms = productName.split(' ').filter(term => term.length > 2);
    const searchRegex = new RegExp(searchTerms.join('|'), 'i');
    
    const products = await Product.find({ 
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ],
      userType: 'Buyer' // Only search buyer products
    });

    console.log('Found products with broad search:', products.length);

    if (!products.length) {
      return res.status(404).json({ 
        success: false, 
        message: `No buyer products found related to "${productName}"` 
      });
    }

    const buyerIds = [...new Set(products.map(p => p.userId))];
    const buyers = await Buyer.find({ _id: { $in: buyerIds } });

    const shops = buyers.map(buyer => {
      const relatedProducts = products.filter(p => 
        p.userId.toString() === buyer._id.toString()
      );

      return {
        shopId: buyer._id,
        shopName: buyer.shopName || buyer.name,
        shopLocation: buyer.shopLocation || buyer.location,
        contactNumber: buyer.contactNumber || buyer.phone,
        relatedProducts: relatedProducts.map(p => ({
          name: p.name,
          id: p._id,
          hasPrice: p.priceHistory?.length > 0
        })),
        productCount: relatedProducts.length
      };
    });

    res.json({ 
      success: true, 
      shops,
      searchTerm: productName,
      totalShops: shops.length,
      totalProducts: products.length
    });
  } catch (err) {
    console.error('Error in broad shop search:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});

// **NEW** - Debug route to check data consistency
router.get('/debug/data-check', async (req, res) => {
  try {
    console.log('=== DATA CONSISTENCY CHECK ===');
    
    // Get all products
    const allProducts = await Product.find();
    const allBuyers = await Buyer.find();
    
    // Group products by userType
    const buyerProducts = allProducts.filter(p => p.userType === 'Buyer');
    const supplierProducts = allProducts.filter(p => p.userType === 'Supplier');
    const unknownTypeProducts = allProducts.filter(p => !p.userType);
    
    // Check for orphaned products (products with userId that doesn't exist in Buyer collection)
    const buyerIds = allBuyers.map(b => b._id.toString());
    const orphanedProducts = buyerProducts.filter(p => 
      !buyerIds.includes(p.userId.toString())
    );
    
    const debugInfo = {
      totalProducts: allProducts.length,
      totalBuyers: allBuyers.length,
      buyerProducts: buyerProducts.length,
      supplierProducts: supplierProducts.length,
      unknownTypeProducts: unknownTypeProducts.length,
      orphanedProducts: orphanedProducts.length,
      
      productNames: [...new Set(allProducts.map(p => p.name))].sort(),
      buyerProductNames: [...new Set(buyerProducts.map(p => p.name))].sort(),
      
      sampleBuyerProduct: buyerProducts[0] || null,
      sampleBuyer: allBuyers[0] || null,
      
      orphanedProductDetails: orphanedProducts.map(p => ({
        name: p.name,
        userId: p.userId,
        userType: p.userType
      }))
    };
    
    console.log('Debug Info:', JSON.stringify(debugInfo, null, 2));
    res.json(debugInfo);
    
  } catch (error) {
    console.error('Error in debug check:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get price history for a product
router.get('/:id/prices', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 50, days } = req.query;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    let prices = product.priceHistory || [];

    if (days) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
      prices = prices.filter((entry) => entry.date >= startDate);
    }

    prices = prices.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, parseInt(limit));

    res.json({
      success: true,
      productId: id,
      productName: product.name,
      totalEntries: product.priceHistory?.length || 0,
      filteredEntries: prices.length,
      prices: prices,
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Add price history entry
router.post('/:id/prices', async (req, res) => {
  try {
    const { id } = req.params;
    const { pricePer100g, weeklyQuantity, reason = 'Manual price update' } = req.body;

    if (!pricePer100g && !weeklyQuantity) {
      return res
        .status(400)
        .json({ success: false, message: 'At least pricePer100g or weeklyQuantity is required' });
    }

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const newPriceEntry = {
      pricePer100g: pricePer100g ? pricePer100g.toString() : '0',
      weeklyQuantity: weeklyQuantity ? weeklyQuantity.toString() : '0',
      date: new Date(),
      updatedBy: product.userId,
      reason: reason,
    };

    product.priceHistory.push(newPriceEntry);
    await product.save();

    res.json({ success: true, message: 'Price data added successfully', priceEntry: newPriceEntry });
  } catch (error) {
    console.error('Error adding price history:', error);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

// Price analytics
router.get('/:id/price-analytics', async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const recentHistory = product.priceHistory
      .filter((entry) => entry.date >= startDate)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    if (recentHistory.length === 0)
      return res.json({ message: 'No price data available', analytics: null });

    const pricesPer100g = recentHistory.map((e) => parseFloat(e.pricePer100g)).filter((p) => p > 0);
    const weeklyQuantities = recentHistory.map((e) => parseFloat(e.weeklyQuantity)).filter((q) => q > 0);

    const analytics = {
      period: `${days} days`,
      totalEntries: recentHistory.length,
      ...(pricesPer100g.length > 0 && {
        pricePer100g: {
          current: pricesPer100g.at(-1).toFixed(2),
          min: Math.min(...pricesPer100g).toFixed(2),
          max: Math.max(...pricesPer100g).toFixed(2),
          avg: (pricesPer100g.reduce((a, b) => a + b, 0) / pricesPer100g.length).toFixed(2),
          change: (pricesPer100g.at(-1) - pricesPer100g[0]).toFixed(2),
          trend: pricesPer100g.at(-1) - pricesPer100g[0] > 0 ? 'increasing' : 'decreasing',
        },
      }),
      ...(weeklyQuantities.length > 0 && {
        weeklyQuantity: {
          avg: (weeklyQuantities.reduce((a, b) => a + b, 0) / weeklyQuantities.length).toFixed(2),
          min: Math.min(...weeklyQuantities).toFixed(2),
          max: Math.max(...weeklyQuantities).toFixed(2),
        },
      }),
    };

    res.json({ productId: id, productName: product.name, analytics, recentHistory });
  } catch (error) {
    console.error('Error calculating price analytics:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Delete product
router.delete('/:productId', productController.deleteProduct);

// Update product
router.put('/:productId', productController.updateProduct);

module.exports = router;