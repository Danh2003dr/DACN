const logger = require('../utils/logger');
const morgan = require('morgan');

/**
 * Custom morgan token để log correlation ID
 */
morgan.token('correlation-id', (req) => {
  return req.correlationId || 'N/A';
});

/**
 * Custom morgan format với correlation ID
 */
const morganFormat = ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" [correlation-id: :correlation-id] :response-time ms';

/**
 * Request logging middleware
 * Log tất cả HTTP requests với correlation ID
 */
const requestLogger = morgan(morganFormat, {
  stream: {
    write: (message) => {
      // Parse message để extract thông tin
      const parts = message.trim().split(' ');
      const method = parts[5]?.replace('"', '') || 'UNKNOWN';
      const url = parts[6] || 'UNKNOWN';
      const statusCode = parseInt(parts[8]) || 0;
      const responseTime = parseFloat(parts[parts.length - 2]) || 0;
      
      // Extract correlation ID
      const correlationMatch = message.match(/\[correlation-id: ([^\]]+)\]/);
      const correlationId = correlationMatch ? correlationMatch[1] : 'N/A';
      
      // Log với level phù hợp
      if (statusCode >= 500) {
        logger.error('HTTP Request Error', {
          correlationId,
          method,
          url,
          statusCode,
          responseTime
        });
      } else if (statusCode >= 400) {
        logger.warn('HTTP Request Warning', {
          correlationId,
          method,
          url,
          statusCode,
          responseTime
        });
      } else {
        logger.http('HTTP Request', {
          correlationId,
          method,
          url,
          statusCode,
          responseTime
        });
      }
    }
  },
  // Skip logging cho health check và static files
  skip: (req, res) => {
    return req.path === '/api/health' || req.path.startsWith('/static');
  }
});

module.exports = requestLogger;

