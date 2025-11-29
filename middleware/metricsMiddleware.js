const metricsCollector = require('../utils/metrics');

/**
 * Middleware để thu thập metrics cho mỗi request
 */
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Override res.end để capture response time
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const responseTime = Date.now() - startTime;
    
    // Record metrics
    metricsCollector.recordApiRequest(
      req.method,
      req.path,
      res.statusCode,
      responseTime,
      req.correlationId
    );
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

module.exports = metricsMiddleware;

