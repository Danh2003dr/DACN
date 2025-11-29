/**
 * Metrics collection system
 * Thu thập các metrics về performance, errors, và business operations
 */

class MetricsCollector {
  constructor() {
    this.metrics = {
      // API metrics
      apiRequests: {
        total: 0,
        byMethod: {},
        byStatus: {},
        byPath: {},
        responseTime: {
          sum: 0,
          count: 0,
          min: Infinity,
          max: 0,
          p50: [],
          p95: [],
          p99: []
        }
      },
      
      // Error metrics
      errors: {
        total: 0,
        byType: {},
        byPath: {},
        recent: []
      },
      
      // Business metrics
      business: {
        drugsCreated: 0,
        drugsRecalled: 0,
        qrScans: 0,
        digitalSignatures: 0,
        supplyChainUpdates: 0
      },
      
      // System metrics
      system: {
        uptime: Date.now(),
        memoryUsage: [],
        cpuUsage: []
      },
      
      // Database metrics
      database: {
        queries: 0,
        slowQueries: 0,
        errors: 0,
        averageQueryTime: 0
      },
      
      // Blockchain metrics
      blockchain: {
        transactions: 0,
        failedTransactions: 0,
        averageGasUsed: 0,
        averageBlockTime: 0
      }
    };
    
    // Reset metrics mỗi giờ
    this.resetInterval = setInterval(() => {
      this.resetHourlyMetrics();
    }, 3600000); // 1 hour
  }
  
  /**
   * Cleanup intervals
   */
  cleanup() {
    if (this.resetInterval) {
      clearInterval(this.resetInterval);
    }
  }
  
  /**
   * Record API request metric
   */
  recordApiRequest(method, path, statusCode, responseTime, correlationId) {
    this.metrics.apiRequests.total++;
    
    // By method
    this.metrics.apiRequests.byMethod[method] = 
      (this.metrics.apiRequests.byMethod[method] || 0) + 1;
    
    // By status
    const statusGroup = `${Math.floor(statusCode / 100)}xx`;
    this.metrics.apiRequests.byStatus[statusGroup] = 
      (this.metrics.apiRequests.byStatus[statusGroup] || 0) + 1;
    
    // By path (normalize path)
    const normalizedPath = this.normalizePath(path);
    this.metrics.apiRequests.byPath[normalizedPath] = 
      (this.metrics.apiRequests.byPath[normalizedPath] || 0) + 1;
    
    // Response time statistics
    const rt = this.metrics.apiRequests.responseTime;
    rt.sum += responseTime;
    rt.count++;
    rt.min = Math.min(rt.min, responseTime);
    rt.max = Math.max(rt.max, responseTime);
    
    // Percentiles (keep last 1000 for calculation)
    rt.p50.push(responseTime);
    rt.p95.push(responseTime);
    rt.p99.push(responseTime);
    
    if (rt.p50.length > 1000) {
      rt.p50.shift();
      rt.p95.shift();
      rt.p99.shift();
    }
  }
  
  /**
   * Record error metric
   */
  recordError(errorType, path, error, correlationId) {
    this.metrics.errors.total++;
    
    this.metrics.errors.byType[errorType] = 
      (this.metrics.errors.byType[errorType] || 0) + 1;
    
    const normalizedPath = this.normalizePath(path);
    this.metrics.errors.byPath[normalizedPath] = 
      (this.metrics.errors.byPath[normalizedPath] || 0) + 1;
    
    // Keep recent errors (last 100)
    this.metrics.errors.recent.push({
      timestamp: new Date(),
      type: errorType,
      path: normalizedPath,
      message: error.message,
      correlationId
    });
    
    if (this.metrics.errors.recent.length > 100) {
      this.metrics.errors.recent.shift();
    }
  }
  
  /**
   * Record business metric
   */
  recordBusinessEvent(event, data = {}) {
    if (this.metrics.business.hasOwnProperty(event)) {
      this.metrics.business[event]++;
    }
  }
  
  /**
   * Record database metric
   */
  recordDatabaseQuery(operation, duration, success = true) {
    this.metrics.database.queries++;
    
    if (!success) {
      this.metrics.database.errors++;
    }
    
    if (duration > 500) { // Slow query threshold
      this.metrics.database.slowQueries++;
    }
    
    // Update average query time
    const currentAvg = this.metrics.database.averageQueryTime;
    const totalQueries = this.metrics.database.queries;
    this.metrics.database.averageQueryTime = 
      ((currentAvg * (totalQueries - 1)) + duration) / totalQueries;
  }
  
  /**
   * Record blockchain metric
   */
  recordBlockchainTransaction(success, gasUsed, blockTime) {
    if (success) {
      this.metrics.blockchain.transactions++;
      
      if (gasUsed) {
        const currentAvg = this.metrics.blockchain.averageGasUsed;
        const total = this.metrics.blockchain.transactions;
        this.metrics.blockchain.averageGasUsed = 
          ((currentAvg * (total - 1)) + gasUsed) / total;
      }
      
      if (blockTime) {
        const currentAvg = this.metrics.blockchain.averageBlockTime;
        const total = this.metrics.blockchain.transactions;
        this.metrics.blockchain.averageBlockTime = 
          ((currentAvg * (total - 1)) + blockTime) / total;
      }
    } else {
      this.metrics.blockchain.failedTransactions++;
    }
  }
  
  /**
   * Get current metrics
   */
  getMetrics() {
    const rt = this.metrics.apiRequests.responseTime;
    
    return {
      ...this.metrics,
      apiRequests: {
        ...this.metrics.apiRequests,
        responseTime: {
          ...rt,
          average: rt.count > 0 ? rt.sum / rt.count : 0,
          p50: this.calculatePercentile(rt.p50, 50),
          p95: this.calculatePercentile(rt.p95, 95),
          p99: this.calculatePercentile(rt.p99, 99)
        }
      },
      system: {
        ...this.metrics.system,
        uptime: Date.now() - this.metrics.system.uptime,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };
  }
  
  /**
   * Get metrics summary for dashboard
   */
  getSummary() {
    const rt = this.metrics.apiRequests.responseTime;
    const uptime = Date.now() - this.metrics.system.uptime;
    
    return {
      api: {
        totalRequests: this.metrics.apiRequests.total,
        averageResponseTime: rt.count > 0 ? rt.sum / rt.count : 0,
        errorRate: this.metrics.errors.total / Math.max(this.metrics.apiRequests.total, 1) * 100,
        requestsPerMinute: this.metrics.apiRequests.total / (uptime / 60000)
      },
      errors: {
        total: this.metrics.errors.total,
        recent: this.metrics.errors.recent.slice(-10)
      },
      business: this.metrics.business,
      system: {
        uptime: Math.floor(uptime / 1000), // seconds
        memoryUsage: process.memoryUsage()
      },
      database: {
        totalQueries: this.metrics.database.queries,
        slowQueries: this.metrics.database.slowQueries,
        averageQueryTime: this.metrics.database.averageQueryTime,
        errorRate: this.metrics.database.errors / Math.max(this.metrics.database.queries, 1) * 100
      },
      blockchain: {
        totalTransactions: this.metrics.blockchain.transactions,
        failedTransactions: this.metrics.blockchain.failedTransactions,
        successRate: this.metrics.blockchain.transactions / 
          Math.max(this.metrics.blockchain.transactions + this.metrics.blockchain.failedTransactions, 1) * 100,
        averageGasUsed: this.metrics.blockchain.averageGasUsed
      }
    };
  }
  
  /**
   * Normalize path (remove IDs, etc.)
   */
  normalizePath(path) {
    return path
      .replace(/\/[a-f0-9]{24}/g, '/:id') // MongoDB ObjectId
      .replace(/\/[a-f0-9-]{36}/g, '/:id') // UUID
      .replace(/\/\d+/g, '/:id'); // Numeric IDs
  }
  
  /**
   * Calculate percentile
   */
  calculatePercentile(array, percentile) {
    if (array.length === 0) return 0;
    
    const sorted = [...array].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index] || 0;
  }
  
  /**
   * Reset hourly metrics
   */
  resetHourlyMetrics() {
    // Reset API request counters (keep totals)
    this.metrics.apiRequests.byMethod = {};
    this.metrics.apiRequests.byStatus = {};
    this.metrics.apiRequests.byPath = {};
    this.metrics.apiRequests.responseTime = {
      sum: 0,
      count: 0,
      min: Infinity,
      max: 0,
      p50: [],
      p95: [],
      p99: []
    };
    
    // Reset error counters (keep totals and recent)
    this.metrics.errors.byType = {};
    this.metrics.errors.byPath = {};
  }
}

// Singleton instance
const metricsCollector = new MetricsCollector();

module.exports = metricsCollector;

