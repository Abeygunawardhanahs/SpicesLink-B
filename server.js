require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:8082',
    'http://127.0.0.1:8081',
    'http://localhost:19006',
    // Allow any IP in 192.168.x.x range for development
    /^http:\/\/192\.168\.\d+\.\d+:(3000|8081|8082|19006)$/,
    // Specific IPs if needed
    'http://192.168.0.100:8081',
    'http://192.168.1.91:8081',
    'exp://192.168.0.100:8081',
    'exp://192.168.1.91:8081'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Parse JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`=== SERVER REQUEST ===`);
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Origin:', req.headers.origin);
  if (req.body && Object.keys(req.body).length > 0) {
    // Don't log passwords for security
    const logBody = { ...req.body };
    if (logBody.password) logBody.password = '[HIDDEN]';
    console.log('Body:', logBody);
  }
  next();
});

// Routes
const buyerRoutes = require('./routes/buyerRoutes');
const supplierRoutes = require('./routes/supplierRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

// API Routes
app.use('/api/buyers', buyerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/ratings', ratingRoutes);

// Legacy route support (if you want to keep backward compatibility)
//const userRoutes = require('./routes/userRoutes');
//app.use('/api/users', userRoutes);

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working!', 
    timestamp: new Date().toISOString(),
    availableRoutes: {
      buyers: '/api/buyers',
      suppliers: '/api/suppliers',
      products: '/api/products',
      legacy_users: '/api/users'
    }
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// API info route
app.get('/api', (req, res) => {
  res.json({
    message: 'Fresh Food Supply Chain API',
    version: '2.0',
    endpoints: {
      buyers: {
        register: 'POST /api/buyers/register',
        login: 'POST /api/buyers/login',
        profile: 'GET /api/buyers/profile (auth required)',
        updateProfile: 'PUT /api/buyers/profile (auth required)'
      },
      suppliers: {
        register: 'POST /api/suppliers/register',
        login: 'POST /api/suppliers/login',
        profile: 'GET /api/suppliers/profile (auth required)',
        updateProfile: 'PUT /api/suppliers/profile (auth required)',
        search: 'GET /api/suppliers/search (buyer auth required)'
      },
      products: {
        list: 'GET /api/products',
        create: 'POST /api/products (supplier auth required)',
        update: 'PUT /api/products/:id (supplier auth required)',
        delete: 'DELETE /api/products/:id (supplier auth required)'
      }
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('=== SERVER ERROR ===');
  console.error(err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const validationErrors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors
    });
  }
  
  // JWT error
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false,
    message: 'Route not found',
    availableRoutes: [
      '/api/buyers',
      '/api/suppliers', 
      '/api/products',
      '/test',
      '/health',
      '/api'
    ]
  });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  //useNewUrlParser: true,
  //useUnifiedTopology: true
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log(`📊 Database: ${mongoose.connection.name}`);
  
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log('🔗 Available endpoints:');
    console.log(`   • Buyers: http://localhost:${PORT}/api/buyers`);
    console.log(`   • Suppliers: http://localhost:${PORT}/api/suppliers`);
    console.log(`   • Products: http://localhost:${PORT}/api/products`);
    console.log(`   • API Info: http://localhost:${PORT}/api`);
    console.log(`   • Health Check: http://localhost:${PORT}/health`);
  });
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});