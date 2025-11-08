const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Định nghĩa các vai trò trong hệ thống
const USER_ROLES = {
  ADMIN: 'admin',
  MANUFACTURER: 'manufacturer', 
  DISTRIBUTOR: 'distributor',
  HOSPITAL: 'hospital',
  PATIENT: 'patient'
};

// Schema cho User
const userSchema = new mongoose.Schema({
  // Thông tin cơ bản
  username: {
    type: String,
    required: function() {
      // Username không bắt buộc nếu đăng nhập bằng Google (sẽ tự động tạo)
      return !this.googleId;
    },
    unique: true,
    sparse: true, // Cho phép null nhưng unique khi có giá trị
    trim: true,
    minlength: [3, 'Tên đăng nhập phải có ít nhất 3 ký tự'],
    maxlength: [50, 'Tên đăng nhập không được quá 50 ký tự']
  },
  
  email: {
    type: String,
    required: [true, 'Vui lòng nhập email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },
  
  password: {
    type: String,
    required: function() {
      // Password không bắt buộc nếu đăng nhập bằng OAuth
      return !this.googleId;
    },
    minlength: [6, 'Mật khẩu phải có ít nhất 6 ký tự'],
    select: false // Không trả về password khi query
  },
  
  // Google OAuth
  googleId: {
    type: String,
    unique: true,
    sparse: true // Cho phép null nhưng unique khi có giá trị
  },
  
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  
  // Thông tin cá nhân
  fullName: {
    type: String,
    required: function() {
      // FullName không bắt buộc nếu đăng nhập bằng Google (sẽ lấy từ Google profile)
      return !this.googleId;
    },
    trim: true,
    maxlength: [100, 'Họ tên không được quá 100 ký tự']
  },
  
  avatar: {
    type: String,
    default: null
  },

  // Tọa độ địa chỉ
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: null
    },
    address: {
      type: String,
      default: null
    }
  },
  
  phone: {
    type: String,
    required: function() {
      // Phone không bắt buộc nếu đăng nhập bằng OAuth
      return !this.googleId;
    },
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  
  address: {
    street: { type: String, required: false },
    ward: { type: String, required: false },
    district: { type: String, required: false },
    city: { type: String, required: false }
  },
  
  // Phân quyền và vai trò
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: [true, 'Vui lòng chọn vai trò'],
    default: USER_ROLES.PATIENT
  },
  
  // Mã định danh theo vai trò
  organizationId: {
    type: String,
    required: function() {
      // Không bắt buộc nếu đăng nhập bằng OAuth (sẽ được set sau)
      if (this.googleId || this.authProvider === 'google') return false;
      return ['manufacturer', 'distributor', 'hospital'].includes(this.role);
    },
    unique: true,
    sparse: true // Cho phép null nhưng unique khi có giá trị
  },
  
  patientId: {
    type: String,
    required: function() {
      // Không bắt buộc nếu đăng nhập bằng OAuth (sẽ được set sau)
      if (this.googleId || this.authProvider === 'google') return false;
      return this.role === 'patient';
    },
    unique: true,
    sparse: true
  },
  
  // Trạng thái tài khoản
  isActive: {
    type: Boolean,
    default: true
  },
  
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  
  // Quản lý đăng nhập
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date
  },
  
  lastLogin: {
    type: Date
  },
  
  // Bắt buộc đổi mật khẩu lần đầu (không áp dụng cho OAuth)
  mustChangePassword: {
    type: Boolean,
    default: function() {
      // Không cần đổi mật khẩu nếu đăng nhập bằng Google
      return !this.googleId;
    }
  },
  
  // Thông tin bổ sung theo vai trò
  organizationInfo: {
    name: String,
    license: String,
    type: String, // 'pharmaceutical_company', 'distribution_company', 'hospital'
    description: String
  },
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual cho địa chỉ đầy đủ
userSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.ward}, ${this.address.district}, ${this.address.city}`;
});

// Virtual để kiểm tra tài khoản có bị khóa không
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Index cho tìm kiếm
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ organizationId: 1 });
userSchema.index({ patientId: 1 });
userSchema.index({ googleId: 1 });

// Middleware trước khi save - mã hóa mật khẩu
userSchema.pre('save', async function(next) {
  // Chỉ mã hóa nếu mật khẩu được thay đổi và có password (không phải OAuth user)
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    // Mã hóa mật khẩu với salt rounds = 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Middleware trước khi save - cập nhật updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method để so sánh mật khẩu
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method để tạo JWT token
userSchema.methods.generateAuthToken = function() {
  const payload = {
    id: this._id,
    username: this.username,
    role: this.role,
    organizationId: this.organizationId,
    patientId: this.patientId
  };
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Method để tăng số lần đăng nhập sai
userSchema.methods.incLoginAttempts = function() {
  // Nếu có lockUntil và đã hết hạn
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Khóa tài khoản sau 5 lần đăng nhập sai trong 2 giờ
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 giờ
  }
  
  return this.updateOne(updates);
};

// Method để reset login attempts
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 },
    $set: { lastLogin: Date.now() }
  });
};

// Method để kiểm tra quyền truy cập
userSchema.methods.hasPermission = function(permission) {
  const rolePermissions = {
    admin: ['read', 'write', 'delete', 'manage_users', 'manage_drugs', 'view_reports'],
    manufacturer: ['read', 'write_drugs', 'manage_own_drugs', 'view_own_reports'],
    distributor: ['read', 'update_shipment', 'manage_inventory', 'view_shipments'],
    hospital: ['read', 'update_inventory', 'manage_patients', 'view_reports'],
    patient: ['read_own', 'scan_qr', 'view_notifications']
  };
  
  return rolePermissions[this.role] && rolePermissions[this.role].includes(permission);
};

// Static method để tìm user theo username hoặc email
userSchema.statics.findByCredentials = async function(identifier, password) {
  const user = await this.findOne({
    $or: [
      { username: identifier },
      { email: identifier }
    ]
  }).select('+password');
  
  if (!user) {
    throw new Error('Tài khoản không tồn tại');
  }
  
  if (user.isLocked) {
    throw new Error('Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần');
  }
  
  if (!user.isActive) {
    throw new Error('Tài khoản đã bị vô hiệu hóa');
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();
    throw new Error('Mật khẩu không chính xác');
  }
  
  // Reset login attempts nếu đăng nhập thành công
  if (user.loginAttempts || user.lockUntil) {
    await user.resetLoginAttempts();
  }
  
  return user;
};

// Static method để tạo tài khoản mặc định
userSchema.statics.createDefaultAccount = async function(role, identifier, password = 'default123') {
  const defaultData = {
    username: identifier,
    email: `${identifier}@example.com`,
    password: password,
    fullName: `Default ${role}`,
    phone: '0123456789',
    address: {
      street: '123 Đường ABC',
      ward: 'Phường 1',
      district: 'Quận 1',
      city: 'TP.HCM'
    },
    role: role,
    mustChangePassword: true
  };
  
  // Thêm thông tin cụ thể theo vai trò
  switch (role) {
    case USER_ROLES.MANUFACTURER:
      defaultData.organizationId = `MFG_${identifier}`;
      defaultData.organizationInfo = {
        name: `Công ty Dược phẩm ${identifier}`,
        license: `LIC_${identifier}`,
        type: 'pharmaceutical_company'
      };
      break;
    case USER_ROLES.DISTRIBUTOR:
      defaultData.organizationId = `DIST_${identifier}`;
      defaultData.organizationInfo = {
        name: `Công ty Phân phối ${identifier}`,
        license: `LIC_${identifier}`,
        type: 'distribution_company'
      };
      break;
    case USER_ROLES.HOSPITAL:
      defaultData.organizationId = `HOSP_${identifier}`;
      defaultData.organizationInfo = {
        name: `Bệnh viện ${identifier}`,
        license: `LIC_${identifier}`,
        type: 'hospital'
      };
      break;
    case USER_ROLES.PATIENT:
      defaultData.patientId = `PAT_${identifier}`;
      break;
  }
  
  return await this.create(defaultData);
};

module.exports = mongoose.model('User', userSchema);
module.exports.USER_ROLES = USER_ROLES;
