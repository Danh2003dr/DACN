/**
 * Cache Middleware
 * Tự động cache response cho các GET requests
 */

const cacheService = require('../utils/cache');

/**
 * Tạo cache key từ request
 */
function getCacheKey(req) {
  const baseUrl = req.originalUrl || req.url;
  const query = JSON.stringify(req.query);
  const user = req.user ? req.user.id : 'anonymous';
  return `cache:${baseUrl}:${query}:${user}`;
}

/**
 * Cache middleware cho GET requests
 * @param {number} ttl - Time to live (seconds), default 300 (5 phút)
 * @param {function} keyGenerator - Custom function để generate cache key
 */
function cacheMiddleware(ttl = 300, keyGenerator = null) {
  return async (req, res, next) => {
    // Chỉ cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Nếu cache không enabled, skip
    if (!cacheService.isEnabled) {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator ? keyGenerator(req) : getCacheKey(req);

      // Kiểm tra cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        // Set cache hit header
        res.set('X-Cache', 'HIT');
        return res.json(cached);
      }

      // Cache miss - override res.json để cache response
      const originalJson = res.json.bind(res);
      res.json = function(data) {
        // Chỉ cache success responses
        if (data.success !== false) {
          cacheService.set(cacheKey, data, ttl).catch(err => {
            console.error('Cache set error:', err);
          });
        }
        res.set('X-Cache', 'MISS');
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
}

/**
 * Invalidate cache cho một pattern
 */
async function invalidateCache(pattern) {
  return await cacheService.invalidate(pattern);
}

/**
 * Invalidate cache cho một route cụ thể
 */
async function invalidateRouteCache(route, userId = null) {
  const pattern = userId 
    ? `cache:${route}:*:${userId}`
    : `cache:${route}:*`;
  return await cacheService.invalidate(pattern);
}

module.exports = {
  cacheMiddleware,
  invalidateCache,
  invalidateRouteCache
};

