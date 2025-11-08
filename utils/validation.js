const Joi = require('joi');

// Schema validation cho đăng nhập
const loginSchema = Joi.object({
  identifier: Joi.string()
    .required()
    .messages({
      'string.empty': 'Vui lòng nhập tên đăng nhập hoặc email',
      'any.required': 'Vui lòng nhập tên đăng nhập hoặc email'
    }),
  password: Joi.string()
    .required()
    .min(1)
    .messages({
      'string.empty': 'Vui lòng nhập mật khẩu',
      'any.required': 'Vui lòng nhập mật khẩu'
    })
});

// Schema validation cho đăng ký
const registerSchema = Joi.object({
  username: Joi.string()
    .alphanum()
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.alphanum': 'Tên đăng nhập chỉ được chứa chữ cái và số',
      'string.min': 'Tên đăng nhập phải có ít nhất 3 ký tự',
      'string.max': 'Tên đăng nhập không được quá 50 ký tự',
      'any.required': 'Vui lòng nhập tên đăng nhập'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Email không hợp lệ',
      'any.required': 'Vui lòng nhập email'
    }),
  
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Mật khẩu phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu không được quá 128 ký tự',
      'any.required': 'Vui lòng nhập mật khẩu'
    }),
  
  fullName: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Họ tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ tên không được quá 100 ký tự',
      'any.required': 'Vui lòng nhập họ tên'
    }),
  
  phone: Joi.string()
    .pattern(/^[0-9]{10,11}$/)
    .required()
    .messages({
      'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số',
      'any.required': 'Vui lòng nhập số điện thoại'
    }),
  
  address: Joi.object({
    street: Joi.string()
      .min(5)
      .max(200)
      .required()
      .messages({
        'string.min': 'Địa chỉ đường phải có ít nhất 5 ký tự',
        'string.max': 'Địa chỉ đường không được quá 200 ký tự',
        'any.required': 'Vui lòng nhập địa chỉ đường'
      }),
    
    ward: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Phường/xã phải có ít nhất 2 ký tự',
        'string.max': 'Phường/xã không được quá 50 ký tự',
        'any.required': 'Vui lòng nhập phường/xã'
      }),
    
    district: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Quận/huyện phải có ít nhất 2 ký tự',
        'string.max': 'Quận/huyện không được quá 50 ký tự',
        'any.required': 'Vui lòng nhập quận/huyện'
      }),
    
    city: Joi.string()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.min': 'Thành phố phải có ít nhất 2 ký tự',
        'string.max': 'Thành phố không được quá 50 ký tự',
        'any.required': 'Vui lòng nhập thành phố'
      })
  }).required(),
  
  role: Joi.string()
    .valid('admin', 'manufacturer', 'distributor', 'hospital', 'patient')
    .required()
    .messages({
      'any.only': 'Vai trò không hợp lệ',
      'any.required': 'Vui lòng chọn vai trò'
    }),
  
  organizationId: Joi.string()
    .min(3)
    .max(50)
    .when('role', {
      is: Joi.string().valid('manufacturer', 'distributor', 'hospital'),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.min': 'Mã tổ chức phải có ít nhất 3 ký tự',
      'string.max': 'Mã tổ chức không được quá 50 ký tự',
      'any.required': 'Mã tổ chức là bắt buộc cho vai trò này'
    }),
  
  patientId: Joi.string()
    .min(3)
    .max(50)
    .when('role', {
      is: 'patient',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.min': 'Mã bệnh nhân phải có ít nhất 3 ký tự',
      'string.max': 'Mã bệnh nhân không được quá 50 ký tự',
      'any.required': 'Mã bệnh nhân là bắt buộc cho bệnh nhân'
    }),
  
  organizationInfo: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .messages({
        'string.min': 'Tên tổ chức phải có ít nhất 2 ký tự',
        'string.max': 'Tên tổ chức không được quá 200 ký tự'
      }),
    
    license: Joi.string()
      .min(3)
      .max(50)
      .messages({
        'string.min': 'Số giấy phép phải có ít nhất 3 ký tự',
        'string.max': 'Số giấy phép không được quá 50 ký tự'
      }),
    
    type: Joi.string()
      .valid('pharmaceutical_company', 'distribution_company', 'hospital')
      .messages({
        'any.only': 'Loại tổ chức không hợp lệ'
      }),
    
    description: Joi.string()
      .max(500)
      .messages({
        'string.max': 'Mô tả không được quá 500 ký tự'
      })
  }).optional()
});

// Schema validation cho đổi mật khẩu
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
      'any.required': 'Vui lòng nhập mật khẩu mới'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Xác nhận mật khẩu không khớp với mật khẩu mới',
      'any.required': 'Vui lòng xác nhận mật khẩu mới'
    })
});

// Schema validation cho đổi mật khẩu lần đầu
const firstChangePasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu mới không được quá 128 ký tự',
      'any.required': 'Vui lòng nhập mật khẩu mới'
    }),
  
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Xác nhận mật khẩu không khớp với mật khẩu mới',
      'any.required': 'Vui lòng xác nhận mật khẩu mới'
    })
});

// Schema validation cho cập nhật profile
const updateProfileSchema = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Họ tên phải có ít nhất 2 ký tự',
      'string.max': 'Họ tên không được quá 100 ký tự'
    }),
  
  email: Joi.string()
    .email()
    .optional()
    .messages({
      'string.email': 'Email không hợp lệ'
    }),
  
  phone: Joi.string()
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Số điện thoại không hợp lệ'
    }),
  
  address: Joi.string()
    .allow('')
    .optional(),
  
  organizationInfo: Joi.object({
    name: Joi.string()
      .min(2)
      .max(200)
      .messages({
        'string.min': 'Tên tổ chức phải có ít nhất 2 ký tự',
        'string.max': 'Tên tổ chức không được quá 200 ký tự'
      }),
    
    license: Joi.string()
      .min(3)
      .max(50)
      .messages({
        'string.min': 'Số giấy phép phải có ít nhất 3 ký tự',
        'string.max': 'Số giấy phép không được quá 50 ký tự'
      }),
    
    type: Joi.string()
      .valid('pharmaceutical_company', 'distribution_company', 'hospital')
      .messages({
        'any.only': 'Loại tổ chức không hợp lệ'
      }),
    
    description: Joi.string()
      .max(500)
      .messages({
        'string.max': 'Mô tả không được quá 500 ký tự'
      })
  })
});

// Schema validation cho reset password (Admin)
const resetPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.min': 'Mật khẩu mới phải có ít nhất 6 ký tự',
      'string.max': 'Mật khẩu mới không được quá 128 ký tự',
      'any.required': 'Vui lòng nhập mật khẩu mới'
    })
});

// Middleware validation
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
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

// Validation cho query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query, { abortEarly: false });
    
    if (error) {
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Tham số truy vấn không hợp lệ.',
        errors: messages
      });
    }
    
    next();
  };
};

// Schema validation cho query parameters
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'Số trang phải là số nguyên',
      'number.min': 'Số trang phải lớn hơn 0'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(10)
    .messages({
      'number.base': 'Giới hạn phải là số nguyên',
      'number.min': 'Giới hạn phải lớn hơn 0',
      'number.max': 'Giới hạn không được quá 100'
    }),
  
  search: Joi.string()
    .allow('')
    .max(100)
    .optional()
    .messages({
      'string.max': 'Từ khóa tìm kiếm không được quá 100 ký tự'
    }),
  
  role: Joi.string()
    .allow('')
    .valid('admin', 'manufacturer', 'distributor', 'hospital', 'patient', '')
    .optional()
    .messages({
      'any.only': 'Vai trò không hợp lệ'
    })
});

module.exports = {
  // Schemas
  loginSchema,
  registerSchema,
  changePasswordSchema,
  firstChangePasswordSchema,
  updateProfileSchema,
  resetPasswordSchema,
  paginationSchema,
  
  // Middleware
  validate,
  validateQuery
};
