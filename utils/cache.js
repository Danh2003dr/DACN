/**
 * Redis Cache Utility
 * Hỗ trợ caching cho các API đọc nhiều
 */

const redis = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.getAsync = null;
    this.setAsync = null;
    this.delAsync = null;
    this.existsAsync = null;
    this.isEnabled = false;
  }

  /**
   * Khởi tạo Redis client
   */
  async initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const redisPassword = process.env.REDIS_PASSWORD;

      this.client = redis.createClient({
        url: redisUrl,
        password: redisPassword,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis: Quá nhiều lần reconnect, dừng kết nối');
              return new Error('Too many retries');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.isEnabled = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Redis đã kết nối');
        this.isEnabled = true;
      });

      await this.client.connect();

      // Redis v4 đã là async, không cần promisify
      this.isEnabled = true;
      return true;
    } catch (error) {
      console.warn('⚠️  Redis không khả dụng, hệ thống sẽ chạy không có cache:', error.message);
      this.isEnabled = false;
      return false;
    }
  }

  /**
   * Lấy giá trị từ cache
   */
  async get(key) {
    if (!this.isEnabled || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Lưu giá trị vào cache
   */
  async set(key, value, ttl = 3600) {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client.setEx(key, ttl, serialized);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Xóa key khỏi cache
   */
  async del(key) {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      await this.client.del([key]);
      return true;
    } catch (error) {
      console.error(`Cache del error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Xóa nhiều keys theo pattern
   */
  async delPattern(pattern) {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache delPattern error for pattern ${pattern}:`, error);
      return false;
    }
  }

  /**
   * Kiểm tra key có tồn tại không
   */
  async exists(key) {
    if (!this.isEnabled || !this.client) {
      return false;
    }

    try {
      const result = await this.client.exists([key]);
      return result === 1;
    } catch (error) {
      console.error(`Cache exists error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Invalidate cache cho một pattern
   */
  async invalidate(pattern) {
    return await this.delPattern(pattern);
  }

  /**
   * Đóng kết nối Redis
   */
  async close() {
    if (this.client) {
      await this.client.quit();
      this.isEnabled = false;
    }
  }
}

// Singleton instance
const cacheService = new CacheService();

module.exports = cacheService;

