const logger = require('./logger');
const metricsCollector = require('./metrics');

/**
 * Alerting system
 * Cảnh báo khi có vấn đề về performance, errors, hoặc system health
 */

class AlertingSystem {
  constructor() {
    // Tăng threshold cho memory trong development để tránh cảnh báo liên tục
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    this.alertThresholds = {
      errorRate: 5, // 5%
      apiResponseTime: 1000, // 1 second
      databaseSlowQueries: 10, // 10 slow queries per minute
      blockchainFailureRate: 10, // 10%
      memoryUsage: isDevelopment ? 95 : 90, // 95% trong dev, 90% trong production
      cpuUsage: 90 // 90%
    };
    
    this.alertHistory = [];
    this.alertCooldown = isDevelopment ? 300000 : 60000; // 5 phút trong dev, 1 phút trong production
    this.lastAlerts = {};
    this.isDevelopment = isDevelopment;
    
    // Check metrics mỗi 30 giây (hoặc tắt trong dev nếu không cần)
    if (!isDevelopment || process.env.ENABLE_ALERTING === 'true') {
      this.metricsInterval = setInterval(() => {
        this.checkMetrics();
      }, 30000);
    }
  }
  
  /**
   * Check metrics và trigger alerts nếu cần
   */
  checkMetrics() {
    const summary = metricsCollector.getSummary();
    const now = Date.now();
    
    // Check error rate
    if (summary.api.errorRate > this.alertThresholds.errorRate) {
      this.triggerAlert('error_rate_high', {
        level: 'high',
        message: `Error rate cao: ${summary.api.errorRate.toFixed(2)}%`,
        value: summary.api.errorRate,
        threshold: this.alertThresholds.errorRate
      });
    }
    
    // Check API response time
    if (summary.api.averageResponseTime > this.alertThresholds.apiResponseTime) {
      this.triggerAlert('api_slow', {
        level: 'medium',
        message: `API response time cao: ${summary.api.averageResponseTime.toFixed(2)}ms`,
        value: summary.api.averageResponseTime,
        threshold: this.alertThresholds.apiResponseTime
      });
    }
    
    // Check database slow queries
    if (summary.database.slowQueries > this.alertThresholds.databaseSlowQueries) {
      this.triggerAlert('database_slow_queries', {
        level: 'medium',
        message: `Nhiều slow queries: ${summary.database.slowQueries}`,
        value: summary.database.slowQueries,
        threshold: this.alertThresholds.databaseSlowQueries
      });
    }
    
    // Check blockchain failure rate
    if (summary.blockchain.failedTransactions > 0) {
      const failureRate = (summary.blockchain.failedTransactions / 
        (summary.blockchain.totalTransactions + summary.blockchain.failedTransactions)) * 100;
      
      if (failureRate > this.alertThresholds.blockchainFailureRate) {
        this.triggerAlert('blockchain_failures', {
          level: 'high',
          message: `Blockchain failure rate cao: ${failureRate.toFixed(2)}%`,
          value: failureRate,
          threshold: this.alertThresholds.blockchainFailureRate
        });
      }
    }
    
    // Check memory usage
    const memoryUsage = summary.system.memoryUsage;
    const memoryPercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    
    // Trong development, chỉ cảnh báo nếu memory > 95% và có thể force GC
    if (memoryPercent > this.alertThresholds.memoryUsage) {
      // Trong development, thử force garbage collection nếu có
      if (this.isDevelopment && global.gc && memoryPercent > 95) {
        try {
          global.gc();
          logger.info('Forced garbage collection due to high memory usage');
        } catch (e) {
          // Ignore if GC fails
        }
      }
      
      this.triggerAlert('memory_high', {
        level: 'high',
        message: `Memory usage cao: ${memoryPercent.toFixed(2)}%`,
        value: memoryPercent,
        threshold: this.alertThresholds.memoryUsage
      });
    }
  }
  
  /**
   * Trigger alert
   */
  triggerAlert(alertType, alertData) {
    const now = Date.now();
    const lastAlert = this.lastAlerts[alertType];
    
    // Check cooldown
    if (lastAlert && (now - lastAlert) < this.alertCooldown) {
      return; // Still in cooldown
    }
    
    // Update last alert time
    this.lastAlerts[alertType] = now;
    
    // Create alert object
    const alert = {
      id: require('uuid').v4(),
      type: alertType,
      timestamp: new Date(),
      ...alertData
    };
    
    // Log alert
    const logLevel = alertData.level === 'high' ? 'error' : 'warn';
    logger[logLevel](`ALERT: ${alertData.message}`, {
      alertType,
      ...alertData
    });
    
    // Add to history
    this.alertHistory.push(alert);
    
    // Keep only last 100 alerts
    if (this.alertHistory.length > 100) {
      this.alertHistory.shift();
    }
    
    // Emit alert event (có thể hook vào notification system)
    if (typeof process.emit === 'function') {
      process.emit('alert', alert);
    }
    
    return alert;
  }
  
  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 10) {
    return this.alertHistory.slice(-limit);
  }
  
  /**
   * Get alerts by level
   */
  getAlertsByLevel(level) {
    return this.alertHistory.filter(alert => alert.level === level);
  }
  
  /**
   * Clear alerts
   */
  clearAlerts() {
    this.alertHistory = [];
    this.lastAlerts = {};
  }
}

// Singleton instance
const alertingSystem = new AlertingSystem();

// Cleanup on process exit
process.on('SIGTERM', () => {
  if (alertingSystem.metricsInterval) {
    clearInterval(alertingSystem.metricsInterval);
  }
});

process.on('SIGINT', () => {
  if (alertingSystem.metricsInterval) {
    clearInterval(alertingSystem.metricsInterval);
  }
});

module.exports = alertingSystem;

