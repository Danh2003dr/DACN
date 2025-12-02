/**
 * JSON Helper Utilities
 * Xử lý BigInt và các loại dữ liệu không thể serialize trực tiếp bằng JSON.stringify
 */

/**
 * Chuyển đổi BigInt và Date về các dạng có thể serialize
 * @param {any} data - Dữ liệu cần xử lý
 * @returns {any} - Dữ liệu đã được xử lý an toàn
 */
const toJSONSafe = (data) => {
  if (data === null || data === undefined) {
    return data;
  }

  // Recursive function để xử lý tất cả BigInt
  const processValue = (value) => {
    if (value === null || value === undefined) {
      return value;
    }
    
    // Xử lý BigInt
    if (typeof value === 'bigint') {
      return value.toString();
    }
    
    // Xử lý Date
    if (value instanceof Date) {
      return value.toISOString();
    }
    
    // Xử lý Array
    if (Array.isArray(value)) {
      return value.map(item => processValue(item));
    }
    
    // Xử lý Object
    if (typeof value === 'object') {
      // Nếu là Mongoose document, convert sang plain object trước
      if (value.toJSON && typeof value.toJSON === 'function') {
        try {
          value = value.toJSON();
        } catch (e) {
          // Ignore nếu toJSON() fail
        }
      }
      
      // Xử lý các loại object đặc biệt
      if (value.constructor && value.constructor.name === 'BigNumber') {
        return value.toString();
      }
      
      const result = {};
      for (const [key, val] of Object.entries(value)) {
        try {
          result[key] = processValue(val);
        } catch (e) {
          // Bỏ qua các property không thể serialize
          console.warn(`[toJSONSafe] Cannot serialize property ${key}:`, e.message);
        }
      }
      return result;
    }
    
    return value;
  };

  try {
    return processValue(data);
  } catch (error) {
    console.error('[toJSONSafe] Error converting data:', error);
    // Trả về object rỗng thay vì data gốc để tránh BigInt
    return {};
  }
};

/**
 * Safe JSON replacer function cho JSON.stringify
 * @param {string} key 
 * @param {any} value 
 * @returns {any}
 */
const jsonReplacer = (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  // Xử lý BigNumber từ web3
  if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'BigNumber') {
    return value.toString();
  }
  return value;
};

/**
 * Safe JSON response helper
 * Đảm bảo response không có BigInt hoặc các type không thể serialize
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {any} data - Data cần gửi
 */
const safeJsonResponse = (res, statusCode, data) => {
  try {
    // Xử lý BigInt trước - đảm bảo xử lý nhiều lần để chắc chắn
    let safeData = toJSONSafe(data);
    // Xử lý lại lần nữa để đảm bảo không còn BigInt
    safeData = toJSONSafe(safeData);
    
    // Serialize với replacer để chắc chắn - double check
    const jsonString = JSON.stringify(safeData, jsonReplacer);
    
    // Kiểm tra lại xem có BigInt không (bằng cách parse lại)
    try {
      JSON.parse(jsonString);
    } catch (parseError) {
      console.error('[safeJsonResponse] JSON string is invalid after serialization');
      throw new Error('Invalid JSON after serialization: ' + parseError.message);
    }
    
    res.setHeader('Content-Type', 'application/json');
    res.status(statusCode).send(jsonString);
  } catch (error) {
    console.error('[safeJsonResponse] Error:', error);
    console.error('[safeJsonResponse] Error message:', error.message);
    console.error('[safeJsonResponse] Error stack:', error.stack);
    
    // Fallback: trả về error message đơn giản
    try {
      const fallbackData = {
        success: false,
        message: 'Lỗi khi xử lý response.',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      };
      const fallbackJson = JSON.stringify(fallbackData, jsonReplacer);
      res.setHeader('Content-Type', 'application/json');
      res.status(500).send(fallbackJson);
    } catch (fallbackError) {
      // Nếu cả fallback cũng fail, gửi text plain
      console.error('[safeJsonResponse] Fallback also failed:', fallbackError);
      res.status(500).send('Internal server error: Unable to serialize response');
    }
  }
};

/**
 * Express middleware để tự động xử lý BigInt trong tất cả JSON responses
 * Override res.json() để tự động xử lý BigInt
 */
const bigIntSerializerMiddleware = (req, res, next) => {
  // Lưu lại hàm json() gốc
  const originalJson = res.json.bind(res);
  
  // Override res.json()
  res.json = function(data) {
    try {
      // Xử lý data trước khi gửi - xử lý nhiều lần để chắc chắn
      let safeData = toJSONSafe(data);
      safeData = toJSONSafe(safeData); // Double check
      
      // Serialize với replacer để chắc chắn
      const jsonString = JSON.stringify(safeData, jsonReplacer);
      
      // Parse lại để đảm bảo không có lỗi
      JSON.parse(jsonString);
      
      // Gửi bằng res.send() thay vì res.json() để tránh double processing
      res.setHeader('Content-Type', 'application/json');
      return res.send(jsonString);
    } catch (error) {
      console.error('[bigIntSerializerMiddleware] Error serializing response:', error);
      console.error('[bigIntSerializerMiddleware] Error message:', error.message);
      console.error('[bigIntSerializerMiddleware] Error stack:', error.stack);
      
      // Fallback: gửi error response đơn giản
      try {
        const errorData = {
          success: false,
          message: 'Lỗi khi xử lý response.',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        };
        const errorJson = JSON.stringify(errorData, jsonReplacer);
        res.setHeader('Content-Type', 'application/json');
        return res.status(500).send(errorJson);
      } catch (fallbackError) {
        // Nếu cả fallback cũng fail
        return res.status(500).send('Internal server error: Unable to serialize response');
      }
    }
  };
  
  next();
};

module.exports = {
  toJSONSafe,
  jsonReplacer,
  safeJsonResponse,
  bigIntSerializerMiddleware
};

