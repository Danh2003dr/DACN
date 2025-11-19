const Joi = require('joi');

/**
 * Schema validation cho cập nhật hồ sơ cá nhân
 * Chỉ validate các field thuộc module hồ sơ cá nhân
 * Không cho phép sửa: role, isActive, mustChangePassword
 */
const updateProfileSchema = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .trim()
    .optional()
    .messages({
      'string.min': 'Họ tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ tên không được quá 100 ký tự',
      'string.empty': 'Họ tên không được để trống'
    }),
  
  email: Joi.string()
    .email()
    .lowercase()
    .trim()
    .optional()
    .messages({
      'string.email': 'Email không hợp lệ',
      'string.empty': 'Email không được để trống'
    }),
  
  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .allow('', null)
    .optional()
    .messages({
      'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số'
    }),
  
  address: Joi.string()
    .max(500)
    .trim()
    .allow('', null)
    .optional()
    .messages({
      'string.max': 'Địa chỉ không được quá 500 ký tự'
    }),
  
  location: Joi.object({
    type: Joi.string()
      .valid('Point')
      .default('Point'),
    coordinates: Joi.array()
      .items(Joi.number())
      .length(2)
      .optional()
      .messages({
        'array.length': 'Tọa độ phải có 2 giá trị [longitude, latitude]',
        'array.items': 'Tọa độ phải là số'
      }),
    address: Joi.string()
      .max(500)
      .trim()
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'Địa chỉ không được quá 500 ký tự'
      })
  }).optional(),
  
  organizationInfo: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .trim()
      .allow('', null)
      .optional()
      .messages({
        'string.min': 'Tên tổ chức phải có ít nhất 2 ký tự',
        'string.max': 'Tên tổ chức không được quá 200 ký tự'
      }),
    
    address: Joi.string()
      .max(500)
      .trim()
      .allow('', null)
      .optional()
      .messages({
        'string.max': 'Địa chỉ tổ chức không được quá 500 ký tự'
      }),
    
    phone: Joi.string()
      .pattern(/^[0-9]{10,11}$/)
      .allow('', null)
      .optional()
      .messages({
        'string.pattern.base': 'Số điện thoại tổ chức phải có 10-11 chữ số'
      }),
    
    email: Joi.string()
      .email()
      .lowercase()
      .trim()
      .allow('', null)
      .optional()
      .messages({
        'string.email': 'Email tổ chức không hợp lệ'
      })
  }).optional()
}).unknown(false); // Không cho phép các field không được định nghĩa

/**
 * Schema validation cho đổi mật khẩu
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập mật khẩu hiện tại',
      'any.required': 'Vui lòng nhập mật khẩu hiện tại'
    }),
  
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu mới không được quá 128 ký tự',
      'string.empty': 'Vui lòng nhập mật khẩu mới',
      'any.required': 'Vui lòng nhập mật khẩu mới'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Mật khẩu xác nhận không khớp',
      'any.required': 'Vui lòng xác nhận mật khẩu mới'
    })
}).unknown(false);

/**
 * Schema validation cho cập nhật cài đặt thông báo
 * Thuộc module Thông báo/Cấu hình
 */
const updateNotificationPreferencesSchema = Joi.object({
  emailEnabled: Joi.boolean()
    .required()
    .messages({
      'boolean.base': 'emailEnabled phải là true hoặc false',
      'any.required': 'Vui lòng chọn trạng thái nhận thông báo qua email'
    })
}).unknown(false);

/**
 * Middleware validation
 * @param {Joi.Schema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true // Loại bỏ các field không được định nghĩa
    });
    
    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: messages
      });
    }
    
    next();
  };
};

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  updateNotificationPreferencesSchema,
  validate
};

