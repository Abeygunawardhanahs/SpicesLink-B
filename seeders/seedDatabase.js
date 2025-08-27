require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import models
const Buyer = require('../models/Buyer');
const Supplier = require('../models/Supplier');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const Rating = require('../models/Rating');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await Promise.all([
      Buyer.deleteMany({}),
      Supplier.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Notification.deleteMany({}),
      Rating.deleteMany({})
    ]);
    console.log('🗑️  Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
  }
};

// Seed data
const seedDatabase = async () => {
  try {
    // Create Suppliers
    const suppliers = await Supplier.create([
      {
        fullName: 'Ceylon Spice Gardens',
        email: 'ceylon@spices.lk',
        password: await bcrypt.hash('supplier123', 10),
        contactNumber: '+94771234567',
        companyName: 'Ceylon Spice Gardens Ltd',
        companyRegistrationNumber: 'REG001234',
        address: '123 Cinnamon Road, Matale',
        city: 'Matale',
        state: 'Central Province',
        zipCode: '21000',
        country: 'Sri Lanka',
        bankAccountDetails: {
          accountHolderName: 'Ceylon Spice Gardens Ltd',
          bankName: 'Commercial Bank',
          accountNumber: '1234567890',
          swiftCode: 'CCEYLKLX'
        },
        isActive: true,
        isVerified: true,
        averageRating: 4.5
      },
      {
        fullName: 'Mountain Fresh Spices',
        email: 'mountain@spices.lk',
        password: await bcrypt.hash('supplier123', 10),
        contactNumber: '+94812345678',
        companyName: 'Mountain Fresh Spices Co',
        companyRegistrationNumber: 'REG005678',
        address: '456 Spice Lane, Kandy',
        city: 'Kandy',
        state: 'Central Province',
        zipCode: '20000',
        country: 'Sri Lanka',
        bankAccountDetails: {
          accountHolderName: 'Mountain Fresh Spices Co',
          bankName: 'Sampath Bank',
          accountNumber: '9876543210',
          swiftCode: 'BSAMLKLX'
        },
        isActive: true,
        isVerified: true,
        averageRating: 4.8
      },
      {
        fullName: 'Southern Spice Traders',
        email: 'southern@spices.lk',
        password: await bcrypt.hash('supplier123', 10),
        contactNumber: '+94912345678',
        companyName: 'Southern Spice Traders',
        companyRegistrationNumber: 'REG009012',
        address: '789 Galle Road, Matara',
        city: 'Matara',
        state: 'Southern Province',
        zipCode: '81000',
        country: 'Sri Lanka',
        bankAccountDetails: {
          accountHolderName: 'Southern Spice Traders',
          bankName: 'Bank of Ceylon',
          accountNumber: '5555666677',
          swiftCode: 'BCEYLKLX'
        },
        isActive: true,
        isVerified: true,
        averageRating: 4.2
      }
    ]);

    console.log(`✅ Created ${suppliers.length} suppliers`);

    // Create Buyers
    const buyers = await Buyer.create([
      {
        fullName: 'John Anderson',
        email: 'john@buyer.com',
        password: await bcrypt.hash('buyer123', 10),
        contactNumber: '+94701234567',
        companyName: 'Global Imports Ltd',
        shopName: 'Global Spice Imports',
        shopOwnerName: 'John Anderson',
        shopLocation: 'Colombo Trade Center',
        address: '100 Trade Center, Colombo',
        city: 'Colombo',
        state: 'Western Province',
        zipCode: '00100',
        country: 'Sri Lanka',
        isActive: true,
        totalOrders: 5
      },
      {
        fullName: 'Sarah Williams',
        email: 'sarah@buyer.com',
        password: await bcrypt.hash('buyer123', 10),
        contactNumber: '+94702345678',
        companyName: 'European Spice Co',
        shopName: 'Euro Spice Market',
        shopOwnerName: 'Sarah Williams',
        shopLocation: 'Negombo Export Zone',
        address: '200 Export Zone, Negombo',
        city: 'Negombo',
        state: 'Western Province',
        zipCode: '11500',
        country: 'Sri Lanka',
        isActive: true,
        totalOrders: 3
      },
      {
        fullName: 'Ahmed Hassan',
        email: 'ahmed@buyer.com',
        password: await bcrypt.hash('buyer123', 10),
        contactNumber: '+94703456789',
        companyName: 'Middle East Trading',
        shopName: 'Arabian Spice Bazaar',
        shopOwnerName: 'Ahmed Hassan',
        shopLocation: 'Galle Harbor',
        address: '300 Harbor View, Galle',
        city: 'Galle',
        state: 'Southern Province',
        zipCode: '80000',
        country: 'Sri Lanka',
        isActive: true,
        totalOrders: 7
      }
    ]);

    console.log(`✅ Created ${buyers.length} buyers`);

    // Create Products for each supplier
    const productData = [
      // Ceylon Spice Gardens products
      {
        name: 'Ceylon Cinnamon (Alba)',
        description: 'Premium quality Ceylon cinnamon sticks, Alba grade - the finest quality',
        price: 2500,
        category: 'Spices',
        subcategory: 'Alba',
        unit: 'kg',
        stock: 150,
        minOrderQuantity: 5,
        image: 'cinnamon-alba.jpg',
        userId: suppliers[0]._id,
        gradeOrQuality: 'Alba',
        origin: 'Matale District',
        harvestDate: new Date('2024-01-15'),
        certifications: ['Organic', 'Fair Trade'],
        shippingInfo: 'Ships within 3-5 business days',
        isActive: true
      },
      {
        name: 'Ceylon Cinnamon (C5)',
        description: 'High quality Ceylon cinnamon sticks, C5 grade',
        price: 1800,
        category: 'Spices',
        subcategory: 'C5',
        unit: 'kg',
        stock: 200,
        minOrderQuantity: 10,
        image: 'cinnamon-c5.jpg',
        userId: suppliers[0]._id,
        gradeOrQuality: 'C5',
        origin: 'Matale District',
        harvestDate: new Date('2024-01-15'),
        certifications: ['Organic'],
        shippingInfo: 'Ships within 3-5 business days',
        isActive: true
      },
      {
        name: 'Black Pepper (Premium)',
        description: 'Premium grade black pepper, bold and aromatic',
        price: 3500,
        category: 'Spices',
        subcategory: 'Black',
        unit: 'kg',
        stock: 100,
        minOrderQuantity: 3,
        image: 'black-pepper.jpg',
        userId: suppliers[0]._id,
        gradeOrQuality: 'Premium',
        origin: 'Matale District',
        harvestDate: new Date('2024-02-01'),
        certifications: ['Organic', 'ISO Certified'],
        shippingInfo: 'Ships within 2-4 business days',
        isActive: true
      },
      // Mountain Fresh Spices products
      {
        name: 'Cardamom Pods (Green)',
        description: 'Fresh green cardamom pods, intense aroma and flavor',
        price: 8500,
        category: 'Whole Spices',
        subcategory: 'Green',
        unit: 'kg',
        stock: 50,
        minOrderQuantity: 1,
        image: 'cardamom-green.jpg',
        userId: suppliers[1]._id,
        gradeOrQuality: 'AAA',
        origin: 'Kandy District',
        harvestDate: new Date('2024-01-20'),
        certifications: ['Organic', 'Rainforest Alliance'],
        shippingInfo: 'Ships within 2-3 business days',
        isActive: true
      },
      {
        name: 'Cloves (Whole)',
        description: 'Premium whole cloves, hand-picked and sun-dried',
        price: 5500,
        category: 'Whole Spices',
        subcategory: 'Whole',
        unit: 'kg',
        stock: 80,
        minOrderQuantity: 2,
        image: 'cloves-whole.jpg',
        userId: suppliers[1]._id,
        gradeOrQuality: 'Premium',
        origin: 'Kandy District',
        harvestDate: new Date('2024-01-10'),
        certifications: ['Organic'],
        shippingInfo: 'Ships within 3-4 business days',
        isActive: true
      },
      {
        name: 'Nutmeg (Whole)',
        description: 'High quality whole nutmeg with shells',
        price: 4500,
        category: 'Whole Spices',
        subcategory: 'Whole',
        unit: 'kg',
        stock: 60,
        minOrderQuantity: 2,
        image: 'nutmeg-whole.jpg',
        userId: suppliers[1]._id,
        gradeOrQuality: 'Grade A',
        origin: 'Kandy District',
        harvestDate: new Date('2024-02-05'),
        certifications: ['Fair Trade'],
        shippingInfo: 'Ships within 3-5 business days',
        isActive: true
      },
      // Southern Spice Traders products
      {
        name: 'White Pepper (Ground)',
        description: 'Finely ground white pepper, mild and aromatic',
        price: 4200,
        category: 'Spices',
        subcategory: 'White',
        unit: 'kg',
        stock: 70,
        minOrderQuantity: 5,
        image: 'white-pepper.jpg',
        userId: suppliers[2]._id,
        gradeOrQuality: 'Premium Ground',
        origin: 'Matara District',
        harvestDate: new Date('2024-01-25'),
        certifications: ['ISO Certified'],
        shippingInfo: 'Ships within 4-6 business days',
        isActive: true
      },
      {
        name: 'Turmeric Powder',
        description: 'Pure turmeric powder, vibrant color and flavor',
        price: 1200,
        category: 'Powders',
        subcategory: 'Powder',
        unit: 'kg',
        stock: 120,
        minOrderQuantity: 10,
        image: 'turmeric-powder.jpg',
        userId: suppliers[2]._id,
        gradeOrQuality: 'Premium',
        origin: 'Matara District',
        harvestDate: new Date('2024-01-30'),
        certifications: ['Organic'],
        shippingInfo: 'Ships within 3-5 business days',
        isActive: true
      },
      {
        name: 'Ginger Powder',
        description: 'Premium ginger powder, strong and aromatic',
        price: 1500,
        category: 'Powders',
        subcategory: 'Powder',
        unit: 'kg',
        stock: 90,
        minOrderQuantity: 5,
        image: 'ginger-powder.jpg',
        userId: suppliers[2]._id,
        gradeOrQuality: 'Grade A',
        origin: 'Matara District',
        harvestDate: new Date('2024-02-10'),
        certifications: ['Fair Trade'],
        shippingInfo: 'Ships within 4-5 business days',
        isActive: true
      }
    ];

    const products = await Product.create(productData);
    console.log(`✅ Created ${products.length} products`);

    // Create Orders
    const orders = await Order.create([
      // Pending order
      {
        orderNumber: 'ORD-2024-001',
        buyer: buyers[0]._id,
        supplier: suppliers[0]._id,
        items: [
          {
            product: products[0]._id,
            quantity: 10,
            priceAtTime: products[0].price,
            subtotal: products[0].price * 10
          },
          {
            product: products[2]._id,
            quantity: 5,
            priceAtTime: products[2].price,
            subtotal: products[2].price * 5
          }
        ],
        totalAmount: (products[0].price * 10) + (products[2].price * 5),
        shippingAddress: {
          street: buyers[0].address,
          city: buyers[0].city,
          state: buyers[0].state,
          zipCode: buyers[0].zipCode,
          country: buyers[0].country
        },
        status: 'pending',
        payment: {
          method: 'stripe',
          status: 'pending'
        },
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: 'Please ensure proper packaging for international shipping'
      },
      // Confirmed order
      {
        orderNumber: 'ORD-2024-002',
        buyer: buyers[1]._id,
        supplier: suppliers[1]._id,
        items: [
          {
            product: products[3]._id,
            quantity: 2,
            priceAtTime: products[3].price,
            subtotal: products[3].price * 2
          },
          {
            product: products[4]._id,
            quantity: 3,
            priceAtTime: products[4].price,
            subtotal: products[4].price * 3
          }
        ],
        totalAmount: (products[3].price * 2) + (products[4].price * 3),
        shippingAddress: {
          street: buyers[1].address,
          city: buyers[1].city,
          state: buyers[1].state,
          zipCode: buyers[1].zipCode,
          country: buyers[1].country
        },
        status: 'confirmed',
        payment: {
          method: 'bank_transfer',
          status: 'completed',
          paidAmount: (products[3].price * 2) + (products[4].price * 3),
          paymentDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        notes: 'Priority shipping requested'
      },
      // Processing order
      {
        orderNumber: 'ORD-2024-003',
        buyer: buyers[2]._id,
        supplier: suppliers[0]._id,
        items: [
          {
            product: products[1]._id,
            quantity: 20,
            priceAtTime: products[1].price,
            subtotal: products[1].price * 20
          }
        ],
        totalAmount: products[1].price * 20,
        shippingAddress: {
          street: buyers[2].address,
          city: buyers[2].city,
          state: buyers[2].state,
          zipCode: buyers[2].zipCode,
          country: buyers[2].country
        },
        status: 'processing',
        payment: {
          method: 'stripe',
          status: 'completed',
          paidAmount: products[1].price * 20,
          paymentDate: new Date(Date.now() - 48 * 60 * 60 * 1000)
        },
        expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      // Shipped order
      {
        orderNumber: 'ORD-2024-004',
        buyer: buyers[0]._id,
        supplier: suppliers[2]._id,
        items: [
          {
            product: products[6]._id,
            quantity: 15,
            priceAtTime: products[6].price,
            subtotal: products[6].price * 15
          },
          {
            product: products[7]._id,
            quantity: 10,
            priceAtTime: products[7].price,
            subtotal: products[7].price * 10
          }
        ],
        totalAmount: (products[6].price * 15) + (products[7].price * 10),
        shippingAddress: {
          street: buyers[0].address,
          city: buyers[0].city,
          state: buyers[0].state,
          zipCode: buyers[0].zipCode,
          country: buyers[0].country
        },
        status: 'shipped',
        trackingNumber: 'TRK123456789LK',
        payment: {
          method: 'bank_transfer',
          status: 'completed',
          paidAmount: (products[6].price * 15) + (products[7].price * 10),
          paymentDate: new Date(Date.now() - 72 * 60 * 60 * 1000)
        },
        expectedDelivery: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
      },
      // Delivered order (ready for rating)
      {
        orderNumber: 'ORD-2024-005',
        buyer: buyers[1]._id,
        supplier: suppliers[0]._id,
        items: [
          {
            product: products[0]._id,
            quantity: 25,
            priceAtTime: products[0].price,
            subtotal: products[0].price * 25
          }
        ],
        totalAmount: products[0].price * 25,
        shippingAddress: {
          street: buyers[1].address,
          city: buyers[1].city,
          state: buyers[1].state,
          zipCode: buyers[1].zipCode,
          country: buyers[1].country
        },
        status: 'delivered',
        payment: {
          method: 'stripe',
          status: 'completed',
          paidAmount: products[0].price * 25,
          paymentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        actualDelivery: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ]);

    console.log(`✅ Created ${orders.length} orders`);

    // Create Notifications
    const notifications = await Notification.create([
      // For Supplier 1
      {
        recipient: suppliers[0]._id,
        recipientModel: 'Supplier',
        sender: buyers[0]._id,
        senderModel: 'Buyer',
        type: 'order_created',
        title: 'New Order Received',
        message: `New order ${orders[0].orderNumber} received for LKR ${orders[0].totalAmount.toLocaleString()}`,
        relatedOrder: orders[0]._id,
        priority: 'high',
        read: false
      },
      {
        recipient: suppliers[0]._id,
        recipientModel: 'Supplier',
        sender: buyers[2]._id,
        senderModel: 'Buyer',
        type: 'payment_successful',
        title: 'Payment Received',
        message: `Payment of LKR ${orders[2].totalAmount.toLocaleString()} received for order ${orders[2].orderNumber}`,
        relatedOrder: orders[2]._id,
        priority: 'high',
        read: true,
        readAt: new Date(Date.now() - 36 * 60 * 60 * 1000)
      },
      // For Buyer 1
      {
        recipient: buyers[0]._id,
        recipientModel: 'Buyer',
        sender: suppliers[2]._id,
        senderModel: 'Supplier',
        type: 'order_shipped',
        title: 'Order Shipped',
        message: `Your order ${orders[3].orderNumber} has been shipped. Tracking: ${orders[3].trackingNumber}`,
        relatedOrder: orders[3]._id,
        priority: 'high',
        read: false
      },
      // For Buyer 2
      {
        recipient: buyers[1]._id,
        recipientModel: 'Buyer',
        sender: suppliers[1]._id,
        senderModel: 'Supplier',
        type: 'order_confirmed',
        title: 'Order Confirmed',
        message: `Your order ${orders[1].orderNumber} has been confirmed and is being prepared`,
        relatedOrder: orders[1]._id,
        priority: 'medium',
        read: true,
        readAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        recipient: buyers[1]._id,
        recipientModel: 'Buyer',
        sender: suppliers[0]._id,
        senderModel: 'Supplier',
        type: 'order_delivered',
        title: 'Order Delivered',
        message: `Your order ${orders[4].orderNumber} has been delivered. Please rate your experience`,
        relatedOrder: orders[4]._id,
        priority: 'medium',
        read: false
      }
    ]);

    console.log(`✅ Created ${notifications.length} notifications`);

    // Create Ratings for delivered orders
    const ratings = await Rating.create([
      {
        rater: buyers[1]._id,
        raterModel: 'Buyer',
        ratee: suppliers[0]._id,
        rateeModel: 'Supplier',
        order: orders[4]._id,
        rating: 4.5,
        comment: 'Excellent quality Ceylon cinnamon! Fast delivery and great packaging.',
        categories: {
          quality: 5,
          delivery: 4,
          communication: 4,
          packaging: 5,
          value: 4
        },
        verified: true
      }
    ]);

    console.log(`✅ Created ${ratings.length} ratings`);

    // Update supplier average ratings
    for (const supplier of suppliers) {
      const supplierRatings = await Rating.find({ 
        ratee: supplier._id, 
        rateeModel: 'Supplier' 
      });
      
      if (supplierRatings.length > 0) {
        const avgRating = supplierRatings.reduce((sum, r) => sum + r.rating, 0) / supplierRatings.length;
        await Supplier.findByIdAndUpdate(supplier._id, { 
          averageRating: avgRating,
          totalRatings: supplierRatings.length 
        });
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('─────────────────────');
    console.log('Suppliers:');
    suppliers.forEach(s => {
      console.log(`  Email: ${s.email} | Password: supplier123`);
    });
    console.log('\nBuyers:');
    buyers.forEach(b => {
      console.log(`  Email: ${b.email} | Password: buyer123`);
    });
    console.log('─────────────────────\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  
  console.log('🌱 Starting database seeding...\n');
  
  // Ask for confirmation before clearing
  if (process.argv[2] === '--force' || process.argv[2] === '-f') {
    await clearDatabase();
    await seedDatabase();
  } else {
    console.log('⚠️  This will clear all existing data!');
    console.log('Use --force or -f flag to confirm');
    console.log('Example: npm run seed -- --force');
  }
  
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
};

main();