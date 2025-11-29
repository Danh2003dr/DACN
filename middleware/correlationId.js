const { v4: uuidv4 } = require('uuid');

/**
 * Middleware để tạo và gắn correlation ID cho mỗi request
 * Correlation ID giúp trace request qua các services và logs
 */
const correlationIdMiddleware = (req, res, next) => {
  // Lấy correlation ID từ header hoặc tạo mới
  const correlationId = req.headers['x-correlation-id'] || uuidv4();
  
  // Gắn vào request object
  req.correlationId = correlationId;
  
  // Gắn vào response header để client có thể sử dụng
  res.setHeader('X-Correlation-ID', correlationId);
  
  next();
};

module.exports = correlationIdMiddleware;

