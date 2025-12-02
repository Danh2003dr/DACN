const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

// Import logging and monitoring
const logger = require('./utils/logger');
const correlationIdMiddleware = require('./middleware/correlationId');
const requestLogger = require('./middleware/requestLogger');
const metricsMiddleware = require('./middleware/metricsMiddleware');

// Initialize Passport (chỉ cần require, không cần sử dụng session nếu dùng JWT)
require('./config/passport');

// Import getServerUrl để hiển thị network URL
const getServerUrl = require('./utils/getServerUrl');

// Import cache service (tạm tắt Redis trong môi trường dev nếu không có Redis)
// Để bật lại, bỏ comment dòng dưới và đảm bảo Redis đang chạy
// const cacheService = require('./utils/cache');

// Import routes
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profileRoutes');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const blockchainRoutes = require('./routes/blockchain');
const trustScoreRoutes = require('./routes/trustScores');

// Import blockchain service
const blockchainService = require('./services/blockchainService');

// Import metrics routes
const metricsRoutes = require('./routes/metrics');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// CORS configuration
const allowedOriginsEnv = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [];

// Default allowed origins for development
const defaultDevOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001'
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV === 'production') {
      // Production: chỉ cho phép origins được cấu hình
      const isAllowed = allowedOriginsEnv.includes(origin);
      if (isAllowed) {
        return callback(null, true);
      }
      console.warn(`CORS blocked origin in production: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    }

    // Development: cho phép localhost và các origins mặc định
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isDefaultDev = defaultDevOrigins.includes(origin);
    
    if (isLocalhost || isDefaultDev) {
      return callback(null, true);
    }

    // Cho phép mọi origin trong development để dễ debug
    console.log(`CORS allowing origin in development: ${origin}`);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// BigInt serializer middleware - Tự động xử lý BigInt trong tất cả JSON responses
const { bigIntSerializerMiddleware } = require('./utils/jsonHelper');
app.use(bigIntSerializerMiddleware);

// Serve static files
app.use('/uploads', express.static('uploads'));

// Logging and monitoring middleware (phải đặt trước routes)
app.use(correlationIdMiddleware); // Tạo correlation ID
app.use(requestLogger); // Log HTTP requests với correlation ID
app.use(metricsMiddleware); // Thu thập metrics

// Legacy morgan logging (chỉ dùng trong development nếu cần)
if (process.env.NODE_ENV === 'development' && process.env.USE_MORGAN === 'true') {
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

    logger.info('MongoDB Connected', {
      host: conn.connection.host,
      database: conn.connection.name
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Database connection error', {
      error: error.message,
      stack: error.stack
    });
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Connect to database
connectDB();

// Tạm thời không khởi tạo Redis cache nếu không có Redis
// const initializeCache = async () => {
//   try {
//     await cacheService.initialize();
//   } catch (error) {
//     logger.warn('Cache service initialization failed, continuing without cache', {
//       error: error.message
//     });
//   }
// };
//
// initializeCache();

// Initialize blockchain service
const initializeBlockchain = async () => {
  try {
    const blockchainInitialized = await blockchainService.initialize();
    if (blockchainInitialized) {
      logger.info('Blockchain service initialized successfully');
    } else {
      logger.info('Blockchain service initialized in mock mode');
    }
  } catch (error) {
    logger.error('Blockchain initialization error', {
      error: error.message,
      stack: error.stack
    });
    logger.info('Continuing with mock blockchain mode');
  }
};

// Initialize blockchain service
initializeBlockchain();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', profileRoutes); // Profile routes (overrides some auth routes)
app.use('/api/users', userRoutes);
app.use('/api/drugs', require('./routes/drugs'));
app.use('/api/supply-chain', require('./routes/supplyChain'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/digital-signatures', require('./routes/digitalSignatures'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/settings', settingsRoutes);
app.use('/api/blockchain', blockchainRoutes);
app.use('/api/trust-scores', trustScoreRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/backups', require('./routes/backups'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/import-export', require('./routes/importExport'));

// Metrics endpoints (trước health check)
app.get('/api/metrics', (req, res) => {
  const metricsCollector = require('./utils/metrics');
  const summary = metricsCollector.getSummary();
  
  res.json({
    success: true,
    data: summary,
    timestamp: new Date()
  });
});

app.get('/api/alerts', (req, res) => {
  const alertingSystem = require('./utils/alerting');
  const limit = parseInt(req.query.limit) || 10;
  const level = req.query.level;
  
  let alerts = alertingSystem.getRecentAlerts(limit);
  if (level) {
    alerts = alertingSystem.getAlertsByLevel(level);
  }
  
  res.json({
    success: true,
    data: {
      alerts,
      total: alerts.length
    }
  });
});

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
    message: 'Endpoint không tồn tại',
    code: 'NOT_FOUND',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Helper chuẩn hóa cấu trúc lỗi
const buildErrorResponse = (req, {
  statusCode,
  code,
  message,
  details
}) => ({
  success: false,
  message: message || 'Đã xảy ra lỗi',
  code: code || 'INTERNAL_SERVER_ERROR',
  details: details || undefined,
  path: req.originalUrl,
  timestamp: new Date().toISOString()
});

// Global error handler
app.use((err, req, res, next) => {
  const logger = require('./utils/logger');
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    correlationId: req.correlationId
  });
  console.error('Error:', err);

  const isDevelopment = process.env.NODE_ENV === 'development';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(error => error.message);
    return res.status(400).json(
      buildErrorResponse(req, {
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ',
        details: messages
      })
    );
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json(
      buildErrorResponse(req, {
        statusCode: 400,
        code: 'DUPLICATE_KEY',
        message: `${field} đã tồn tại`,
        details: {
          field,
          value: err.keyValue[field]
        }
      })
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      buildErrorResponse(req, {
        statusCode: 401,
        code: 'AUTH_INVALID_TOKEN',
        message: 'Token không hợp lệ'
      })
    );
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      buildErrorResponse(req, {
        statusCode: 401,
        code: 'AUTH_TOKEN_EXPIRED',
        message: 'Token đã hết hạn'
      })
    );
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const response = buildErrorResponse(req, {
    statusCode,
    code: err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST'),
    message: err.message || 'Lỗi server nội bộ',
    details: isDevelopment ? { stack: err.stack } : undefined
  });

  res.status(statusCode).json(response);
});

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  console.log('Shutting down gracefully...');

  // Đóng MongoDB, không cần đóng Redis khi Redis bị tắt
  mongoose.connection.close(() => {
    logger.info('MongoDB connection closed');
    console.log('MongoDB connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  console.log('SIGTERM received.');
  gracefulShutdown();
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  console.log('SIGINT received.');
  gracefulShutdown();
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces để accessible từ network

// Debug log để chắc chắn đoạn listen này được chạy
console.log('Starting Express server...');
console.log('Configured HOST:', HOST);
console.log('Configured PORT:', PORT);

const server = app.listen(PORT, HOST, () => {
  console.log('===========================================');
  console.log('🚀 Express server started');
  console.log(`Host: ${HOST}`);
  console.log(`Port: ${PORT}`);
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
  console.log('===========================================');
});

// Xử lý lỗi khi port đã được sử dụng
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} đã được sử dụng`, {
      port: PORT,
      error: 'EADDRINUSE'
    });
    
    console.error(`\n❌ Lỗi: Port ${PORT} đã được sử dụng!`);
    console.error(`\nĐể giải quyết, bạn có thể:`);
    console.error(`1. Tìm và dừng process đang sử dụng port ${PORT}:`);
    console.error(`   netstat -ano | findstr :${PORT}`);
    console.error(`   taskkill /PID <PID> /F`);
    console.error(`2. Hoặc thay đổi PORT trong file .env`);
    console.error(`3. Hoặc đợi vài giây để port được giải phóng\n`);
    process.exit(1);
  } else {
    logger.error('Lỗi khi khởi động server', {
      error: error.message,
      stack: error.stack
    });
    logger.error('Lỗi khi khởi động server', {
      error: error.message,
      stack: error.stack
    });
    console.error('Lỗi khi khởi động server:', error);
    process.exit(1);
  }
});

module.exports = app;
