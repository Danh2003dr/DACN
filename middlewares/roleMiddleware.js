/**
 * Middleware kiểm tra quyền truy cập hồ sơ
 * - Cho phép user truy cập hồ sơ của chính mình
 * - Cho phép admin truy cập bất kỳ hồ sơ nào
 * - Không cho phép chỉnh userId / role qua API
 */

/**
 * Middleware kiểm tra quyền truy cập profile theo userId
 * Sử dụng khi route có :userId hoặc userId trong body/query
 */
const checkProfileAccess = (req, res, next) => {
  try {
    // Lấy userId từ params, body hoặc query
    const targetUserId = req.params.userId || req.body.userId || req.query.userId;
    const currentUserId = req.user._id.toString();
    
    // Nếu không có targetUserId, cho phép truy cập (sẽ là hồ sơ của chính mình)
    if (!targetUserId) {
      return next();
    }
    
    const targetUserIdStr = targetUserId.toString();
    
    // Admin có quyền truy cập bất kỳ hồ sơ nào
    if (req.user.role === 'admin') {
      return next();
    }
    
    // User chỉ được truy cập hồ sơ của chính mình
    if (currentUserId === targetUserIdStr) {
      return next();
    }
    
    // Không có quyền truy cập
    return res.status(403).json({
      success: false,
      message: 'Bạn không có quyền truy cập hồ sơ này.'
    });
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra quyền truy cập.',
      error: error.message
    });
  }
};

/**
 * Middleware bảo vệ các field không được phép sửa
 * Loại bỏ userId, role, isActive, mustChangePassword khỏi req.body
 */
const protectRestrictedFields = (req, res, next) => {
  try {
    // Danh sách các field không được phép sửa
    const restrictedFields = ['userId', '_id', 'id', 'role', 'isActive', 'mustChangePassword'];
    
    // Loại bỏ các field bị cấm khỏi req.body
    restrictedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        delete req.body[field];
      }
    });
    
    // Nếu là admin, có thể cho phép một số field (tùy chọn)
    // Nhưng theo yêu cầu, không cho phép chỉnh userId/role qua API
    // Nên vẫn loại bỏ
    
    next();
    
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý dữ liệu.',
      error: error.message
    });
  }
};

/**
 * Middleware kết hợp: Kiểm tra quyền truy cập và bảo vệ restricted fields
 * Sử dụng cho các route profile
 */
const profileAccessControl = (req, res, next) => {
  // Bước 1: Bảo vệ restricted fields
  protectRestrictedFields(req, res, () => {
    // Bước 2: Kiểm tra quyền truy cập
    checkProfileAccess(req, res, next);
  });
};

module.exports = {
  checkProfileAccess,
  protectRestrictedFields,
  profileAccessControl
};

