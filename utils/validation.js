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
      .allow('', null)
      .optional()
      .custom((value, helpers) => {
        if (!value || value.trim() === '') return value; // Allow empty
        if (value.length < 2) {
          return helpers.message('Tên tổ chức phải có ít nhất 2 ký tự');
        }
        if (value.length > 200) {
          return helpers.message('Tên tổ chức không được quá 200 ký tự');
        }
        return value;
      }),
    
    address: Joi.string()
      .max(500)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Địa chỉ tổ chức không được quá 500 ký tự'
      }),
    
    phone: Joi.string()
      .allow('', null)
      .optional()
      .pattern(/^$|^[0-9]{10,11}$/)
      .messages({
        'string.pattern.base': 'Số điện thoại tổ chức phải có 10-11 chữ số hoặc rỗng'
      }),
    
    email: Joi.string()
      .email()
      .allow('')
      .optional()
      .messages({
        'string.email': 'Email tổ chức không hợp lệ'
      })
  }).optional(),
  
  isActive: Joi.boolean()
    .optional()
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

// Schema validation cho đăng ký công khai (Public Registration)
const publicRegisterSchema = Joi.object({
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
    .allow('')
    .optional()
    .messages({
      'string.pattern.base': 'Số điện thoại phải có 10-11 chữ số'
    }),
  
  address: Joi.string()
    .max(500)
    .allow('')
    .optional()
    .messages({
      'string.max': 'Địa chỉ không được quá 500 ký tự'
    })
});

// Middleware validation
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      allowUnknown: false, // Không cho phép các field không định nghĩa
      stripUnknown: false  // Không xóa các field không định nghĩa, để có thể báo lỗi rõ ràng
    });
    
    if (error) {
      const messages = error.details.map(detail => detail.message);
      console.error('❌ Validation error:', {
        url: req.originalUrl,
        method: req.method,
        errors: messages,
        receivedBody: req.body
      });
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: messages
      });
    }
    
    // Gán giá trị đã validated vào req.body để controller sử dụng
    req.body = value;
    next();
  };
};

// Validation cho query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    const isBidsRoute = req.originalUrl?.includes('/bids');
    
    // Log để debug
    if (isBidsRoute) {
      console.log('🔍 validateQuery - URL:', req.originalUrl);
      console.log('🔍 validateQuery - Query params:', req.query);
      console.log('🔍 validateQuery - Schema keys:', Object.keys(schema.describe().keys || {}));
    }
    
    const { error, value } = schema.validate(req.query, { 
      abortEarly: false,
      allowUnknown: true, // Cho phép các field không định nghĩa trong schema
      stripUnknown: true  // Xóa các field không định nghĩa (chỉ giữ lại các field hợp lệ)
    });

    if (error) {
      console.error('❌ validateQuery ERROR:', error.details);
      if (isBidsRoute) {
        console.error('❌ Failed query params:', req.query);
        console.error('❌ Error messages:', error.details.map(d => d.message));
      }
      const messages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Tham số truy vấn không hợp lệ.',
        errors: messages
      });
    }

    if (isBidsRoute) {
      console.log('✅ validateQuery PASSED - Validated value:', value);
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
    }),
  
  status: Joi.string()
    .valid('pending', 'accepted', 'rejected', 'expired', 'cancelled', 'countered', '')
    .optional()
    .messages({
      'any.only': 'Trạng thái không hợp lệ'
    })
});

// Schema validation cho tạo supply chain
const createSupplyChainSchema = Joi.object({
  drugId: Joi.string()
    .required()
    .messages({
      'string.empty': 'ID thuốc là bắt buộc',
      'any.required': 'Vui lòng chọn thuốc'
    }),
  
  drugBatchNumber: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      'string.min': 'Số lô phải có ít nhất 3 ký tự',
      'string.max': 'Số lô không được quá 100 ký tự',
      'string.empty': 'Số lô là bắt buộc',
      'any.required': 'Vui lòng nhập số lô'
    }),
  
  metadata: Joi.object({
    quantity: Joi.number()
      .min(1)
      .optional()
      .messages({
        'number.base': 'Số lượng phải là số',
        'number.min': 'Số lượng phải lớn hơn 0'
      }),
    
    unit: Joi.string()
      .valid('unit', 'box', 'bottle', 'tablet', 'vial', 'pack')
      .optional()
      .messages({
        'any.only': 'Đơn vị không hợp lệ'
      }),
    
    notes: Joi.string()
      .max(500)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Ghi chú không được quá 500 ký tự'
      })
  }).optional(),
  
  participants: Joi.array()
    .items(Joi.object({
      actorId: Joi.string().required(),
      role: Joi.string().valid('manufacturer', 'distributor', 'hospital', 'patient').required()
    }))
    .optional()
});

// Schema validation cho thêm step vào supply chain
const addSupplyChainStepSchema = Joi.object({
  action: Joi.string()
    .valid('created', 'shipped', 'received', 'stored', 'dispensed', 'recalled', 'quality_check', 'handover', 'reported', 'consumed')
    .required()
    .messages({
      'any.only': 'Hành động không hợp lệ',
      'any.required': 'Vui lòng chọn hành động'
    }),
  
  location: Joi.object({
    type: Joi.string().valid('Point').default('Point'),
    coordinates: Joi.array()
      .items(Joi.number())
      .length(2)
      .optional()
      .messages({
        'array.length': 'Tọa độ phải có 2 giá trị [longitude, latitude]'
      }),
    address: Joi.string()
      .max(500)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Địa chỉ không được quá 500 ký tự'
      })
  }).optional(),
  
  conditions: Joi.object({
    temperature: Joi.number()
      .min(-50)
      .max(100)
      .optional()
      .messages({
        'number.base': 'Nhiệt độ phải là số',
        'number.min': 'Nhiệt độ không được nhỏ hơn -50°C',
        'number.max': 'Nhiệt độ không được lớn hơn 100°C'
      }),
    
    humidity: Joi.number()
      .min(0)
      .max(100)
      .optional()
      .messages({
        'number.base': 'Độ ẩm phải là số',
        'number.min': 'Độ ẩm không được nhỏ hơn 0%',
        'number.max': 'Độ ẩm không được lớn hơn 100%'
      }),
    
    light: Joi.string()
      .valid('dark', 'low', 'normal', 'bright')
      .optional(),
    
    notes: Joi.string()
      .max(500)
      .allow('')
      .optional()
  }).optional(),
  
  metadata: Joi.object({
    batchNumber: Joi.string().optional(),
    serialNumber: Joi.string().optional(),
    quantity: Joi.number().min(0).optional(),
    unit: Joi.string()
      .valid('unit', 'box', 'bottle', 'tablet', 'vial', 'pack')
      .optional()
      .messages({
        'any.only': 'Đơn vị không hợp lệ'
      }),
    expiryDate: Joi.date().optional(),
    transportation: Joi.string().max(200).allow('').optional(),
    receiver: Joi.string().max(200).allow('').optional(),
    notes: Joi.string().max(1000).allow('').optional()
  }).optional(),
  
  qualityChecks: Joi.array()
    .items(Joi.object({
      checkType: Joi.string().valid('temperature', 'humidity', 'integrity', 'expiry', 'custom').required(),
      result: Joi.string().valid('pass', 'fail', 'warning').required(),
      value: Joi.string().optional(),
      notes: Joi.string().max(500).allow('').optional()
    }))
    .optional(),
  
  handover: Joi.object({
    fromRole: Joi.string().optional(),
    toRole: Joi.string().required(),
    toActorId: Joi.string().optional(),
    token: Joi.string().optional()
  }).optional()
});

// Schema validation cho recall supply chain
const recallSupplyChainSchema = Joi.object({
  reason: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Lý do thu hồi phải có ít nhất 10 ký tự',
      'string.max': 'Lý do thu hồi không được quá 1000 ký tự',
      'any.required': 'Vui lòng nhập lý do thu hồi'
    }),
  
  action: Joi.string()
    .valid('return', 'destroy', 'quarantine', 'investigate')
    .optional(),
  
  affectedUnits: Joi.array()
    .items(Joi.string())
    .optional()
});

module.exports = {
  // Schemas
  loginSchema,
  registerSchema,
  publicRegisterSchema,
  changePasswordSchema,
  firstChangePasswordSchema,
  updateProfileSchema,
  resetPasswordSchema,
  paginationSchema,
  createSupplyChainSchema,
  addSupplyChainStepSchema,
  recallSupplyChainSchema,
  
  // Middleware
  validate,
  validateQuery
};
