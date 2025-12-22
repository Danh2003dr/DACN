const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
require('dotenv').config();
console.log('🚀 [DEV] Khởi động dev-server...');

// Import logging
const logger = require('./utils/logger');

// Initialize Passport
require('./config/passport');
console.log('✅ [DEV] Passport config đã được load');

// Import routes
console.log('⏳ [DEV] Đang load routes...');
const authRoutes = require('./routes/auth');
console.log('✅ [DEV] routes/auth loaded');
const profileRoutes = require('./routes/profileRoutes');
console.log('✅ [DEV] routes/profileRoutes loaded');
const userRoutes = require('./routes/users');
console.log('✅ [DEV] routes/users loaded');
const settingsRoutes = require('./routes/settings');
console.log('✅ [DEV] routes/settings loaded');
const blockchainRoutes = require('./routes/blockchain');
console.log('✅ [DEV] routes/blockchain loaded');
const trustScoreRoutes = require('./routes/trustScores');
console.log('✅ [DEV] routes/trustScores loaded');
const metricsRoutes = require('./routes/metrics');
console.log('✅ [DEV] routes/metrics loaded');

// Bids routes (Marketplace/Bidding)
let bidsRoutes;
try {
  bidsRoutes = require('./routes/bids');
  console.log('✅ [DEV] routes/bids loaded');
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dev-server.js:36',message:'Bids routes required successfully',data:{hasRouter:!!bidsRoutes,routerType:typeof bidsRoutes,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2'})}).catch(()=>{});
  // #endregion
} catch (error) {
  console.error('❌ [DEV] routes/bids failed to load:', error.message);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dev-server.js:39',message:'Bids routes failed to load',data:{error:error.message,stack:error.stack,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  // Không throw để dev server vẫn chạy (tránh crash khi route file bị lỗi)
  bidsRoutes = null;
}

// Import blockchain service
console.log('⏳ [DEV] Đang load blockchainService...');
const blockchainService = require('./services/blockchainService');
console.log('✅ [DEV] blockchainService loaded');

const app = express();

// Security middleware
// Security middleware (dev-friendly)
// Lưu ý: frontend chạy khác origin (localhost:3000) nên cần tắt/relax CORP/CSP trong dev
const helmetConfig = process.env.NODE_ENV === 'production'
  ? {
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false
    }
  : {
      crossOriginResourcePolicy: false,
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: false
    };
app.use(helmet(helmetConfig));
app.use(compression());

// CORS configuration - cho phép tất cả trong dev
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// BigInt serializer middleware - Tự động xử lý BigInt trong tất cả JSON responses
const { bigIntSerializerMiddleware } = require('./utils/jsonHelper');
app.use(bigIntSerializerMiddleware);

// Serve static files
app.use('/uploads', express.static('uploads'));

// Database connection
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability';
    const conn = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('MongoDB Connected', {
      host: conn.connection.host,
      database: conn.connection.name
    });
    console.log(`✅ [DEV] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error('Database connection error', {
      error: error.message,
      stack: error.stack
    });
    console.error('❌ [DEV] Database connection error:', error);
    process.exit(1);
  }
};

// Connect to database
console.log('⏳ [DEV] Đang kết nối MongoDB...');
connectDB();

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

initializeBlockchain();

// Routes - Include TẤT CẢ routes
try {
  app.use('/api/auth', authRoutes);
  app.use('/api/auth', profileRoutes);
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
  app.use('/api/role-upgrade', require('./routes/roleUpgrade'));
  console.log('✅ [DEV] Tất cả routes đã được load');
} catch (error) {
  console.error('❌ [DEV] Lỗi khi load routes:', error);
  throw error;
}
if (bidsRoutes) {
  app.use('/api/bids', bidsRoutes);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dev-server.js:145',message:'Bids routes mounted to /api/bids',data:{mounted:true,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
} else {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dev-server.js:149',message:'Bids routes NOT mounted (bidsRoutes is null)',data:{mounted:false,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dev server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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
      orders: '/api/orders',
      inventory: '/api/inventory',
      reports: '/api/reports',
      blockchain: '/api/blockchain',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  // #region agent log
  const isBidsRoute = req.originalUrl?.includes('/bids') || req.path?.includes('/bids');
  if (isBidsRoute) {
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'dev-server.js:180',message:'404 handler triggered for bids route',data:{method:req.method,path:req.path,originalUrl:req.originalUrl,matchedRoutes:app._router?.stack?.filter(layer=>layer.regexp?.test(req.path))?.length||0,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1,H2,H4,H5'})}).catch(()=>{});
  }
  // #endregion
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// Khởi động server ngay sau khi routes được load
try {
  app.listen(PORT, HOST, () => {
    console.log('===========================================');
    console.log('🚀 DEV Express server started');
    console.log(`Port: ${PORT}`);
    console.log(`Health: http://localhost:${PORT}/api/health`);
    console.log('===========================================');
  });
} catch (error) {
  console.error('❌ [DEV] Lỗi khi khởi động server:', error);
  process.exit(1);
}


