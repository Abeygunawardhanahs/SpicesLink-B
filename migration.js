// migration.js - Run this once to add price history to existing products
const mongoose = require('mongoose');
const Product = require('./models/Product'); // Adjust path as needed

// Update your MongoDB connection string
const MONGODB_URI = 'mongodb://localhost:27017/spices-link'; // Replace with your actual URI

async function migratePriceHistory() {
  try {
    console.log('🚀 Starting price history migration...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('📦 Connected to MongoDB');
    
    // Find all products that don't have price history or have empty price history
    const products = await Product.find({
      $or: [
        { priceHistory: { $exists: false } },
        { priceHistory: { $size: 0 } },
        { priceHistory: null }
      ]
    });
    
    console.log(`📊 Found ${products.length} products to migrate`);
    
    let migratedCount = 0;
    
    for (const product of products) {
      try {
        // Initialize empty price history array if it doesn't exist
        if (!product.priceHistory) {
          product.priceHistory = [];
        }
        
        // Add current price to history if product has a price
        if (product.price && product.price !== '0' && product.price !== '') {
          product.priceHistory.push({
            price: product.price,
            date: product.createdAt || new Date(),
            updatedBy: product.userId,
            reason: 'Initial price (migration)'
          });
          
          // Save without triggering pre-save middleware
          await Product.updateOne(
            { _id: product._id },
            { 
              $set: { 
                priceHistory: product.priceHistory 
              } 
            }
          );
          
          migratedCount++;
          console.log(`✅ Migrated product: ${product.name} (ID: ${product._id})`);
        } else {
          console.log(`⚠️  Skipped product with no price: ${product.name} (ID: ${product._id})`);
        }
      } catch (error) {
        console.error(`❌ Error migrating product ${product._id}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Migration completed!`);
    console.log(`📈 Successfully migrated ${migratedCount} products`);
    console.log(`⏩ Skipped ${products.length - migratedCount} products`);
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Alternative function to fix products with missing priceHistory field
async function fixMissingPriceHistoryField() {
  try {
    console.log('🔧 Fixing products with missing priceHistory field...');
    
    await mongoose.connect(MONGODB_URI);
    
    const result = await Product.updateMany(
      { priceHistory: { $exists: false } },
      { $set: { priceHistory: [] } }
    );
    
    console.log(`✅ Fixed ${result.modifiedCount} products`);
    
  } catch (error) {
    console.error('❌ Error fixing products:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// Run the migration
if (require.main === module) {
  // Check command line argument
  const command = process.argv[2];
  
  if (command === 'fix-field') {
    fixMissingPriceHistoryField();
  } else {
    migratePriceHistory();
  }
}

module.exports = { migratePriceHistory, fixMissingPriceHistoryField };