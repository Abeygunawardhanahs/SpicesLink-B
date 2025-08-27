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

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

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

const seedDatabase = async () => {
  try {
    // Create Suppliers first
    const supplierData = [
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
        isVerified: true
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
        isVerified: true
      }
    ];

    const suppliers = await Supplier.create(supplierData);
    console.log(`✅ Created ${suppliers.length} suppliers`);

    // Create Buyers
    const buyerData = [
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
        isActive: true
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
        isActive: true
      }
    ];

    const buyers = await Buyer.create(buyerData);
    console.log(`✅ Created ${buyers.length} buyers`);

    // Create Products for each supplier
    const productData = [
      // Ceylon Spice Gardens products
      {
        name: 'Ceylon Cinnamon (Alba)',
        description: 'Premium quality Ceylon cinnamon sticks, Alba grade - the finest quality',
        price: '2500',
        category: 'Spices',
        userId: suppliers[0]._id
      },
      {
        name: 'Black Pepper (Premium)',
        description: 'Premium grade black pepper, bold and aromatic',
        price: '3500',
        category: 'Spices',
        userId: suppliers[0]._id
      },
      {
        name: 'Cardamom Pods (Green)',
        description: 'Fresh green cardamom pods, intense aroma and flavor',
        price: '8500',
        category: 'Whole Spices',
        userId: suppliers[0]._id
      },
      // Mountain Fresh Spices products
      {
        name: 'Cloves (Whole)',
        description: 'Premium whole cloves, hand-picked and sun-dried',
        price: '5500',
        category: 'Whole Spices',
        userId: suppliers[1]._id
      },
      {
        name: 'Nutmeg (Whole)',
        description: 'High quality whole nutmeg with shells',
        price: '4500',
        category: 'Whole Spices',
        userId: suppliers[1]._id
      },
      {
        name: 'Turmeric Powder',
        description: 'Pure turmeric powder, vibrant color and flavor',
        price: '1200',
        category: 'Powders',
        userId: suppliers[1]._id
      }
    ];

    const products = await Product.create(productData);
    console.log(`✅ Created ${products.length} products`);

    // Create some Orders
    const orderData = [
      {
        orderNumber: 'ORD-2024-001',
        buyer: buyers[0]._id,
        supplier: suppliers[0]._id,
        items: [
          {
            product: products[0]._id,
            quantity: 10,
            priceAtTime: 2500,
            subtotal: 25000
          },
          {
            product: products[1]._id,
            quantity: 5,
            priceAtTime: 3500,
            subtotal: 17500
          }
        ],
        totalAmount: 42500,
        shippingAddress: {
          street: '100 Trade Center, Colombo',
          city: 'Colombo',
          state: 'Western Province',
          zipCode: '00100',
          country: 'Sri Lanka'
        },
        status: 'pending',
        payment: {
          method: 'stripe',
          status: 'pending'
        },
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: 'Please ensure proper packaging for international shipping'
      },
      {
        orderNumber: 'ORD-2024-002',
        buyer: buyers[1]._id,
        supplier: suppliers[1]._id,
        items: [
          {
            product: products[3]._id,
            quantity: 2,
            priceAtTime: 5500,
            subtotal: 11000
          },
          {
            product: products[4]._id,
            quantity: 3,
            priceAtTime: 4500,
            subtotal: 13500
          }
        ],
        totalAmount: 24500,
        shippingAddress: {
          street: '200 Export Zone, Negombo',
          city: 'Negombo',
          state: 'Western Province',
          zipCode: '11500',
          country: 'Sri Lanka'
        },
        status: 'confirmed',
        payment: {
          method: 'bank_transfer',
          status: 'completed',
          paidAmount: 24500,
          paymentDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
        },
        expectedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        notes: 'Priority shipping requested'
      },
      {
        orderNumber: 'ORD-2024-003',
        buyer: buyers[0]._id,
        supplier: suppliers[0]._id,
        items: [
          {
            product: products[2]._id,
            quantity: 5,
            priceAtTime: 8500,
            subtotal: 42500
          }
        ],
        totalAmount: 42500,
        shippingAddress: {
          street: '100 Trade Center, Colombo',
          city: 'Colombo',
          state: 'Western Province',
          zipCode: '00100',
          country: 'Sri Lanka'
        },
        status: 'processing',
        payment: {
          method: 'stripe',
          status: 'completed',
          paidAmount: 42500,
          paymentDate: new Date(Date.now() - 48 * 60 * 60 * 1000)
        },
        expectedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      },
      {
        orderNumber: 'ORD-2024-004',
        buyer: buyers[1]._id,
        supplier: suppliers[0]._id,
        items: [
          {
            product: products[0]._id,
            quantity: 25,
            priceAtTime: 2500,
            subtotal: 62500
          }
        ],
        totalAmount: 62500,
        shippingAddress: {
          street: '200 Export Zone, Negombo',
          city: 'Negombo',
          state: 'Western Province',
          zipCode: '11500',
          country: 'Sri Lanka'
        },
        status: 'delivered',
        payment: {
          method: 'stripe',
          status: 'completed',
          paidAmount: 62500,
          paymentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        },
        actualDelivery: new Date(Date.now() - 24 * 60 * 60 * 1000),
        expectedDelivery: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    ];

    const orders = await Order.create(orderData);
    console.log(`✅ Created ${orders.length} orders`);

    // Create Notifications
    const notificationData = [
      {
        recipient: suppliers[0]._id,
        recipientModel: 'Supplier',
        sender: buyers[0]._id,
        senderModel: 'Buyer',
        type: 'order_created',
        title: 'New Order Received',
        message: `New order ORD-2024-001 received for LKR 42,500`,
        relatedOrder: orders[0]._id,
        priority: 'high',
        read: false
      },
      {
        recipient: suppliers[1]._id,
        recipientModel: 'Supplier',
        sender: buyers[1]._id,
        senderModel: 'Buyer',
        type: 'payment_successful',
        title: 'Payment Received',
        message: `Payment of LKR 24,500 received for order ORD-2024-002`,
        relatedOrder: orders[1]._id,
        priority: 'high',
        read: true,
        readAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
      },
      {
        recipient: buyers[0]._id,
        recipientModel: 'Buyer',
        sender: suppliers[0]._id,
        senderModel: 'Supplier',
        type: 'order_processing',
        title: 'Order Being Processed',
        message: `Your order ORD-2024-003 is now being processed`,
        relatedOrder: orders[2]._id,
        priority: 'medium',
        read: false
      },
      {
        recipient: buyers[1]._id,
        recipientModel: 'Buyer',
        sender: suppliers[0]._id,
        senderModel: 'Supplier',
        type: 'order_delivered',
        title: 'Order Delivered',
        message: `Your order ORD-2024-004 has been delivered. Please rate your experience`,
        relatedOrder: orders[3]._id,
        priority: 'medium',
        read: false
      }
    ];

    const notifications = await Notification.create(notificationData);
    console.log(`✅ Created ${notifications.length} notifications`);

    // Create a Rating for delivered order
    const ratingData = {
      rater: buyers[1]._id,
      raterModel: 'Buyer',
      ratee: suppliers[0]._id,
      rateeModel: 'Supplier',
      order: orders[3]._id,
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
    };

    const rating = await Rating.create(ratingData);
    console.log(`✅ Created 1 rating`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('─────────────────────');
    console.log('Suppliers:');
    supplierData.forEach(s => {
      console.log(`  Email: ${s.email} | Password: supplier123`);
    });
    console.log('\nBuyers:');
    buyerData.forEach(b => {
      console.log(`  Email: ${b.email} | Password: buyer123`);
    });
    console.log('─────────────────────\n');

  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
};

const main = async () => {
  await connectDB();
  console.log('🌱 Starting database seeding...\n');
  
  await clearDatabase();
  await seedDatabase();
  
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
};

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});