const multer = require('multer');

/**
 * Global error handler middleware
 * Xử lý tất cả các loại lỗi và trả về JSON format chuẩn
 */
const errorHandler = (err, req, res, next) => {
  // Log error để debug
  console.error('Error:', err);
  
  // 1. Xử lý lỗi Validation (Mongoose ValidationError)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(error => error.message);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ.',
      errors: messages
    });
  }
  
  // 2. Xử lý lỗi Validation (Joi)
  if (err.isJoi) {
    const messages = err.details.map(detail => detail.message);
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ.',
      errors: messages
    });
  }
  
  // 3. Xử lý lỗi Multer (Upload)
  if (err instanceof multer.MulterError) {
    let message = 'Lỗi khi upload file.';
    
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        message = 'File quá lớn. Kích thước tối đa là 5MB.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Số lượng file vượt quá giới hạn.';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'File không được mong đợi.';
        break;
      case 'LIMIT_PART_COUNT':
        message = 'Số lượng phần vượt quá giới hạn.';
        break;
      default:
        message = `Lỗi upload: ${err.message}`;
    }
    
    return res.status(400).json({
      success: false,
      message: message
    });
  }
  
  // 4. Xử lý lỗi Multer (File filter reject)
  if (err.message && err.message.includes('upload')) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }
  
  // 5. Xử lý lỗi duplicate key (MongoDB)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} đã tồn tại trong hệ thống.`
    });
  }
  
  // 6. Xử lý lỗi JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ.'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token đã hết hạn. Vui lòng đăng nhập lại.'
    });
  }
  
  // 7. Xử lý lỗi CastError (MongoDB ObjectId không hợp lệ)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'ID không hợp lệ.'
    });
  }
  
  // 8. Xử lý lỗi có statusCode (từ các controller)
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Đã xảy ra lỗi.',
      ...(err.errors && { errors: err.errors })
    });
  }
  
  // 9. Xử lý lỗi 500 (Server Error)
  res.status(500).json({
    success: false,
    message: err.message || 'Lỗi server nội bộ.',
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      error: err.toString()
    })
  });
};

module.exports = errorHandler;

