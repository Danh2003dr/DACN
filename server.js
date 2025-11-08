const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// Initialize Passport (chỉ cần require, không cần sử dụng session nếu dùng JWT)
require('./config/passport');

// Import getServerUrl để hiển thị network URL
const getServerUrl = require('./utils/getServerUrl');

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const blockchainRoutes = require('./routes/blockchain');

// Import blockchain service
const blockchainService = require('./services/blockchainService');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Database connection
const connectDB = async () => {
  try {
    // Sử dụng MongoDB local hoặc Atlas
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability';
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Initialize blockchain service
const initializeBlockchain = async () => {
  try {
    const blockchainInitialized = await blockchainService.initialize();
    if (blockchainInitialized) {
      console.log('Blockchain service initialized successfully');
    } else {
      console.log('Blockchain service initialized in mock mode');
    }
  } catch (error) {
    console.error('Blockchain initialization error:', error);
    console.log('Continuing with mock blockchain mode');
  }
};

// Initialize blockchain service
initializeBlockchain();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/drugs', require('./routes/drugs'));
app.use('/api/supply-chain', require('./routes/supplyChain'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', settingsRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Drug Traceability Blockchain API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      drugs: '/api/drugs',
      blockchain: '/api/blockchain',
      health: '/api/health'
    },
    documentation: {
      login: 'POST /api/auth/login',
      register: 'POST /api/auth/register (Admin only)',
      profile: 'GET /api/auth/me',
      changePassword: 'PUT /api/auth/change-password',
      users: 'GET /api/users (Admin only)',
      userStats: 'GET /api/users/stats (Admin only)',
      drugs: 'GET /api/drugs',
      createDrug: 'POST /api/drugs (Admin/Manufacturer)',
      scanQR: 'POST /api/drugs/scan-qr',
      drugStats: 'GET /api/drugs/stats',
      blockchainStats: 'GET /api/blockchain/stats',
      blockchainDrugs: 'GET /api/blockchain/drugs',
      verifyDrug: 'POST /api/blockchain/verify/:drugId',
      blockchainStatus: 'GET /api/blockchain/status'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint không tồn tại'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: messages
    });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} đã tồn tại`
    });
  }
  
  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn'
    });
  }
  
  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Lỗi server nội bộ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces để accessible từ network

app.listen(PORT, HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Local: http://localhost:${PORT}`);
  
  // Hiển thị network URL nếu bind trên 0.0.0.0
  if (HOST === '0.0.0.0') {
    try {
      const os = require('os');
      const networkInterfaces = os.networkInterfaces();
      let networkIP = null;
      
      // Tìm IP address không phải loopback
      for (const interfaceName in networkInterfaces) {
        const addresses = networkInterfaces[interfaceName];
        for (const address of addresses) {
          if (address.family === 'IPv4' && !address.internal) {
            networkIP = address.address;
            break;
          }
        }
        if (networkIP) break;
      }
      
      if (networkIP && networkIP !== '127.0.0.1') {
        console.log(`Network: http://${networkIP}:${PORT}`);
      }
    } catch (error) {
      // Ignore error
    }
  }
  
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`API docs: http://localhost:${PORT}/api`);
});

module.exports = app;
