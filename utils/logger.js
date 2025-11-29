const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Tạo thư mục logs nếu chưa có
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Định nghĩa log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Định nghĩa màu sắc cho từng level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

winston.addColors(colors);

// Định nghĩa format cho console (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, correlationId, ...meta } = info;
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (correlationId) {
      log = `${timestamp} [${level}] [${correlationId}]: ${message}`;
    }
    
    if (Object.keys(meta).length > 0 && meta.constructor === Object) {
      log += ` ${JSON.stringify(meta)}`;
    }
    
    return log;
  })
);

// Định nghĩa format cho file (production) - JSON format
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Định nghĩa transports
const transports = [
  // Console transport (cho development)
  new winston.transports.Console({
    format: consoleFormat,
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  }),
  
  // Error log file
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // Combined log file
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Thêm daily rotate file cho production
if (process.env.NODE_ENV === 'production') {
  const DailyRotateFile = require('winston-daily-rotate-file');
  
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      format: fileFormat
    }),
    
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: fileFormat
    })
  );
}

// Tạo logger instance
const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  format: fileFormat,
  transports,
  // Không exit on error
  exitOnError: false,
  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log')
    })
  ],
  // Handle rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log')
    })
  ]
});

// Helper methods với correlation ID
logger.withCorrelation = (correlationId) => {
  return {
    error: (message, meta = {}) => logger.error(message, { correlationId, ...meta }),
    warn: (message, meta = {}) => logger.warn(message, { correlationId, ...meta }),
    info: (message, meta = {}) => logger.info(message, { correlationId, ...meta }),
    http: (message, meta = {}) => logger.http(message, { correlationId, ...meta }),
    debug: (message, meta = {}) => logger.debug(message, { correlationId, ...meta })
  };
};

// Helper để log authentication events
logger.auth = {
  login: (username, success, correlationId, meta = {}) => {
    const level = success ? 'info' : 'warn';
    logger[level](`Authentication: Login ${success ? 'successful' : 'failed'}`, {
      correlationId,
      username,
      event: 'login',
      success,
      ...meta
    });
  },
  
  logout: (username, correlationId, meta = {}) => {
    logger.info('Authentication: Logout', {
      correlationId,
      username,
      event: 'logout',
      ...meta
    });
  },
  
  passwordChange: (username, correlationId, meta = {}) => {
    logger.info('Authentication: Password changed', {
      correlationId,
      username,
      event: 'password_change',
      ...meta
    });
  }
};

// Helper để log blockchain operations
logger.blockchain = {
  record: (operation, success, correlationId, meta = {}) => {
    const level = success ? 'info' : 'error';
    logger[level](`Blockchain: ${operation}`, {
      correlationId,
      event: 'blockchain_operation',
      operation,
      success,
      ...meta
    });
  },
  
  transaction: (txHash, blockNumber, correlationId, meta = {}) => {
    logger.info('Blockchain: Transaction recorded', {
      correlationId,
      event: 'blockchain_transaction',
      txHash,
      blockNumber,
      ...meta
    });
  }
};

// Helper để log digital signature operations
logger.signature = {
  create: (targetType, targetId, correlationId, meta = {}) => {
    logger.info('Digital Signature: Created', {
      correlationId,
      event: 'signature_create',
      targetType,
      targetId,
      ...meta
    });
  },
  
  verify: (signatureId, valid, correlationId, meta = {}) => {
    const level = valid ? 'info' : 'warn';
    logger[level](`Digital Signature: Verification ${valid ? 'successful' : 'failed'}`, {
      correlationId,
      event: 'signature_verify',
      signatureId,
      valid,
      ...meta
    });
  },
  
  revoke: (signatureId, correlationId, meta = {}) => {
    logger.warn('Digital Signature: Revoked', {
      correlationId,
      event: 'signature_revoke',
      signatureId,
      ...meta
    });
  }
};

// Helper để log business operations
logger.business = {
  drugCreate: (drugId, batchNumber, correlationId, meta = {}) => {
    logger.info('Business: Drug created', {
      correlationId,
      event: 'drug_create',
      drugId,
      batchNumber,
      ...meta
    });
  },
  
  drugRecall: (drugId, batchNumber, correlationId, meta = {}) => {
    logger.warn('Business: Drug recalled', {
      correlationId,
      event: 'drug_recall',
      drugId,
      batchNumber,
      ...meta
    });
  },
  
  supplyChainUpdate: (supplyChainId, step, correlationId, meta = {}) => {
    logger.info('Business: Supply chain updated', {
      correlationId,
      event: 'supply_chain_update',
      supplyChainId,
      step,
      ...meta
    });
  }
};

// Helper để log performance metrics
logger.performance = {
  api: (method, path, duration, statusCode, correlationId, meta = {}) => {
    const level = duration > 1000 ? 'warn' : 'info';
    logger[level]('Performance: API request', {
      correlationId,
      event: 'api_request',
      method,
      path,
      duration,
      statusCode,
      ...meta
    });
  },
  
  database: (operation, duration, correlationId, meta = {}) => {
    const level = duration > 500 ? 'warn' : 'debug';
    logger[level]('Performance: Database operation', {
      correlationId,
      event: 'database_operation',
      operation,
      duration,
      ...meta
    });
  }
};

module.exports = logger;

