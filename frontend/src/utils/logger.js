/**
 * Frontend Logging Utility
 * Log user actions, errors, và performance metrics
 */

class FrontendLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100; // Giữ tối đa 100 logs trong memory
    this.apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  }

  /**
   * Log với level
   */
  log(level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    // Thêm vào memory
    this.logs.push(logEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Console log trong development
    if (process.env.NODE_ENV === 'development') {
      const consoleMethod = level === 'error' ? 'error' : 
                           level === 'warn' ? 'warn' : 
                           level === 'info' ? 'info' : 'log';
      console[consoleMethod](`[${level.toUpperCase()}] ${message}`, data);
    }

    // Send to backend trong production (optional)
    if (process.env.NODE_ENV === 'production' && level === 'error') {
      this.sendToBackend(logEntry);
    }
  }

  /**
   * Send log to backend
   */
  async sendToBackend(logEntry) {
    try {
      // Chỉ gửi errors trong production để không spam
      await fetch(`${this.apiUrl}/api/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      // Silent fail - không làm fail app
      console.error('Failed to send log to backend:', error);
    }
  }

  /**
   * Log error
   */
  error(message, error, data = {}) {
    this.log('error', message, {
      ...data,
      error: {
        message: error?.message,
        stack: error?.stack,
        name: error?.name
      }
    });
  }

  /**
   * Log warning
   */
  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  /**
   * Log info
   */
  info(message, data = {}) {
    this.log('info', message, data);
  }

  /**
   * Log debug
   */
  debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.log('debug', message, data);
    }
  }

  /**
   * Log user action
   */
  userAction(action, data = {}) {
    this.log('info', `User action: ${action}`, {
      action,
      ...data
    });
  }

  /**
   * Log page view
   */
  pageView(path) {
    this.log('info', 'Page view', {
      path,
      timestamp: Date.now()
    });
  }

  /**
   * Log API call
   */
  apiCall(method, url, duration, statusCode, error = null) {
    const level = error || statusCode >= 400 ? 'error' : 'info';
    this.log(level, 'API call', {
      method,
      url,
      duration,
      statusCode,
      error: error?.message
    });
  }

  /**
   * Log performance metric
   */
  performance(metric, value, unit = 'ms') {
    this.log('info', `Performance: ${metric}`, {
      metric,
      value,
      unit
    });
  }

  /**
   * Get logs
   */
  getLogs(level = null, limit = 50) {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
  }
}

// Singleton instance
const logger = new FrontendLogger();

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Unhandled error', event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled promise rejection', event.reason, {
    promise: event.promise
  });
});

export default logger;

