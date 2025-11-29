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
  // Thông tin đăng nhập
  username: {
    type: String,
    required: function() {
      // Username không bắt buộc nếu đăng nhập bằng Google
      return !this.googleId;
    },
    unique: true,
    sparse: true,
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
    sparse: true
  },
  
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  
  // Thông tin cá nhân
  fullName: {
    type: String,
    required: [true, 'Vui lòng nhập họ tên'],
    trim: true,
    maxlength: [100, 'Họ tên không được quá 100 ký tự']
  },
  
  phone: {
    type: String,
    match: [/^[0-9]{10,11}$/, 'Số điện thoại không hợp lệ']
  },
  
  address: {
    type: String,
    trim: true
  },
  
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
  
  avatar: {
    type: String,
    default: null
  },
  
  // Thông tin tổ chức
  organizationInfo: {
    name: { type: String, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true }
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
      if (this.googleId || this.authProvider === 'google') return false;
      return ['manufacturer', 'distributor', 'hospital'].includes(this.role);
    },
    unique: true,
    sparse: true
  },
  
  patientId: {
    type: String,
    required: function() {
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
  
  mustChangePassword: {
    type: Boolean,
    default: function() {
      return !this.googleId;
    }
  },
  
  lastLogin: {
    type: Date
  },
  
  // Cài đặt thông báo
  notificationPreferences: {
    emailEnabled: {
      type: Boolean,
      default: true
    }
  },
  
  // Quản lý đăng nhập (cho bảo mật)
  loginAttempts: {
    type: Number,
    default: 0
  },
  
  lockUntil: {
    type: Date
  },
  
  // Metadata
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
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
userSchema.index({ 'location.coordinates': '2dsphere' }); // Index cho GeoJSON

// Middleware trước khi save - mã hóa mật khẩu
userSchema.pre('save', async function(next) {
  // Chỉ mã hóa nếu mật khẩu được thay đổi và có password
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
  
  // Tăng thời gian hết hạn token lên 30 ngày cho development, 7 ngày cho production
  const expireTime = process.env.JWT_EXPIRE || (process.env.NODE_ENV === 'production' ? '7d' : '30d');
  
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expireTime
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
  
  // Kiểm tra tài khoản bị khóa (chỉ áp dụng nghiêm ngặt ở môi trường production)
  if (user.isLocked) {
    // Ở môi trường development, tự động mở khóa để tránh kẹt tài khoản khi demo
    if (process.env.NODE_ENV === 'development') {
      await user.resetLoginAttempts();
    } else {
      throw new Error('Tài khoản đã bị khóa do đăng nhập sai quá nhiều lần');
    }
  }
  
  if (!user.isActive) {
    throw new Error('Tài khoản đã bị vô hiệu hóa');
  }
  
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await user.incLoginAttempts();

    // Trong môi trường development, cho phép bỏ qua kiểm tra mật khẩu
    // để tránh kẹt tài khoản khi seed/test dữ liệu demo
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('Mật khẩu không chính xác');
    }
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
    address: '123 Đường ABC, Phường 1, Quận 1, TP.HCM',
    role: role,
    mustChangePassword: true,
    notificationPreferences: {
      emailEnabled: true
    }
  };
  
  // Thêm thông tin cụ thể theo vai trò
  switch (role) {
    case USER_ROLES.MANUFACTURER:
      defaultData.organizationId = `MFG_${identifier}`;
      defaultData.organizationInfo = {
        name: `Công ty Dược phẩm ${identifier}`,
        address: '123 Đường ABC, Phường 1, Quận 1, TP.HCM',
        phone: '0123456789',
        email: `info@${identifier}.com`
      };
      break;
    case USER_ROLES.DISTRIBUTOR:
      defaultData.organizationId = `DIST_${identifier}`;
      defaultData.organizationInfo = {
        name: `Công ty Phân phối ${identifier}`,
        address: '123 Đường ABC, Phường 1, Quận 1, TP.HCM',
        phone: '0123456789',
        email: `info@${identifier}.com`
      };
      break;
    case USER_ROLES.HOSPITAL:
      defaultData.organizationId = `HOSP_${identifier}`;
      defaultData.organizationInfo = {
        name: `Bệnh viện ${identifier}`,
        address: '123 Đường ABC, Phường 1, Quận 1, TP.HCM',
        phone: '0123456789',
        email: `info@${identifier}.com`
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
