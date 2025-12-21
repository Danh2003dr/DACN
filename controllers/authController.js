const User = require('../models/User');
const { USER_ROLES } = require('../models/User');
const auditService = require('../services/auditService');

// @desc    Đăng nhập người dùng
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Validation
    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin đăng nhập.'
      });
    }
    
    // Tìm user và xác thực
    const user = await User.findByCredentials(identifier, password);
    
    // Tạo JWT token
    const token = user.generateAuthToken();
    
    // Ghi audit log
    await auditService.logAuth.login(user, req, 'success');
    
    // Thông tin user để trả về (không bao gồm password)
    const userInfo = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      patientId: user.patientId,
      organizationInfo: user.organizationInfo,
      mustChangePassword: user.mustChangePassword,
      lastLogin: user.lastLogin
    };
    
    res.status(200).json({
      success: true,
      message: 'Đăng nhập thành công.',
      data: {
        user: userInfo,
        token: token
      }
    });
    
  } catch (error) {
    // Log lỗi chi tiết để debug
    console.error('Login error:', error);

    // Ghi audit log cho login failed (không làm fail request nếu log lỗi)
    try {
      await auditService.logAuth.login(
        { username: req.body.identifier || 'unknown' },
        req,
        'failure',
        error.message
      );
    } catch (logError) {
      // Bỏ qua lỗi khi ghi audit log
      console.error('Audit log (login failed) error:', logError);
    }
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Đăng ký tài khoản mới (chỉ Admin)
// @route   POST /api/auth/register
// @access  Private (Admin only)
const register = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      phone,
      address,
      role,
      organizationId,
      patientId,
      organizationInfo
    } = req.body;
    
    // Kiểm tra user đã tồn tại chưa
    const orConditions = [
      { username: username },
      { email: email }
    ];
    
    // Chỉ thêm organizationId và patientId vào điều kiện nếu có giá trị
    if (organizationId) {
      orConditions.push({ organizationId: organizationId });
    }
    if (patientId) {
      orConditions.push({ patientId: patientId });
    }
    
    const existingUser = await User.findOne({
      $or: orConditions
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Người dùng đã tồn tại với thông tin này.'
      });
    }
    
    // Xử lý address: nếu là object thì convert thành string
    let addressString = address;
    if (typeof address === 'object' && address !== null) {
      // Convert address object thành string format
      const parts = [];
      if (address.street) parts.push(address.street);
      if (address.ward) parts.push(address.ward);
      if (address.district) parts.push(address.district);
      if (address.city) parts.push(address.city);
      addressString = parts.join(', ');
    }
    
    // Tạo user mới
    const userData = {
      username,
      email,
      password,
      fullName,
      phone,
      address: addressString,
      role,
      organizationId,
      patientId,
      organizationInfo,
      mustChangePassword: true,
      createdBy: req.user._id
    };
    
    const user = await User.create(userData);
    
    // Ghi audit log
    await auditService.logCRUD.create(
      req.user,
      'User',
      user._id,
      { username: user.username, email: user.email, role: user.role },
      'user',
      req,
      `Admin ${req.user.username} tạo tài khoản mới: ${user.username} (${user.role})`
    );
    
    // Tạo token cho user mới
    const token = user.generateAuthToken();
    
    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản thành công.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          organizationId: user.organizationId,
          patientId: user.patientId
        },
        token: token
      }
    });
    
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo tài khoản.',
      error: error.message
    });
  }
};

// @desc    Đổi mật khẩu
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin.'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp.'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
      });
    }
    
    // Lấy user với password
    const user = await User.findById(req.user._id).select('+password');
    
    // Kiểm tra mật khẩu hiện tại
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu hiện tại không chính xác.'
      });
    }
    
    // Cập nhật mật khẩu mới
    user.password = newPassword;
    user.mustChangePassword = false; // Không cần đổi mật khẩu nữa
    await user.save();
    
    // Ghi audit log
    await auditService.logAuth.passwordChange(user, req);
    
    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu thành công.'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu.',
      error: error.message
    });
  }
};

// @desc    Đổi mật khẩu lần đầu (sau khi đăng nhập với mật khẩu mặc định)
// @route   PUT /api/auth/first-change-password
// @access  Private
const firstChangePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body;
    
    // Validation
    if (!newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ thông tin.'
      });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới và xác nhận mật khẩu không khớp.'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.'
      });
    }
    
    // Kiểm tra user có phải đổi mật khẩu lần đầu không
    if (!req.user.mustChangePassword) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã đổi mật khẩu rồi.'
      });
    }
    
    // Cập nhật mật khẩu mới
    const user = await User.findById(req.user._id);
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'Đổi mật khẩu lần đầu thành công.'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đổi mật khẩu.',
      error: error.message
    });
  }
};

// @desc    Lấy thông tin user hiện tại
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          fullAddress: user.fullAddress,
          role: user.role,
          avatar: user.avatar,
          location: user.location,
          organizationId: user.organizationId,
          patientId: user.patientId,
          organizationInfo: user.organizationInfo,
          isActive: user.isActive,
          isEmailVerified: user.isEmailVerified,
          mustChangePassword: user.mustChangePassword,
          lastLogin: user.lastLogin,
          createdAt: user.createdAt
        }
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin user.',
      error: error.message
    });
  }
};

// @desc    Cập nhật thông tin cá nhân
// @route   PUT /api/auth/update-profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, email, phone, address, organizationInfo } = req.body;
    
    const updateData = {};
    
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    
    // Xử lý organizationInfo
    if (organizationInfo) {
      updateData.organizationInfo = organizationInfo;
    }
    
    // Xử lý avatar nếu có
    if (req.file) {
      updateData.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // Xử lý tọa độ địa chỉ nếu có
    if (req.body.location) {
      try {
        const locationData = typeof req.body.location === 'string' 
          ? JSON.parse(req.body.location) 
          : req.body.location;
        
        if (locationData.coordinates && locationData.address) {
          updateData.location = {
            type: 'Point',
            coordinates: [locationData.lng, locationData.lat], // MongoDB GeoJSON format: [lng, lat]
            address: locationData.address
          };
        }
      } catch (e) {
        console.error('Error parsing location data:', e);
      }
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin thành công.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          fullAddress: user.fullAddress,
          role: user.role,
          avatar: user.avatar,
          location: user.location,
          organizationId: user.organizationId,
          patientId: user.patientId,
          organizationInfo: user.organizationInfo
        }
      }
    });
    
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông tin.',
      error: error.message
    });
  }
};

// @desc    Đăng xuất
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    // Trong thực tế, có thể blacklist token hoặc lưu vào database
    // Ở đây chỉ trả về response thành công
    res.status(200).json({
      success: true,
      message: 'Đăng xuất thành công.'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng xuất.',
      error: error.message
    });
  }
};

// @desc    Tạo tài khoản mặc định cho demo
// @route   POST /api/auth/create-default-accounts
// @access  Private (Admin only)
const createDefaultAccounts = async (req, res) => {
  try {
    const defaultAccounts = [
      { role: USER_ROLES.ADMIN, identifier: 'admin' },
      { role: USER_ROLES.MANUFACTURER, identifier: 'manufacturer1' },
      { role: USER_ROLES.DISTRIBUTOR, identifier: 'distributor1' },
      { role: USER_ROLES.HOSPITAL, identifier: 'hospital1' },
      { role: USER_ROLES.PATIENT, identifier: 'patient1' }
    ];
    
    const createdAccounts = [];
    
    for (const account of defaultAccounts) {
      try {
        const user = await User.createDefaultAccount(account.role, account.identifier);
        createdAccounts.push({
          username: user.username,
          role: user.role,
          organizationId: user.organizationId,
          patientId: user.patientId
        });
      } catch (error) {
        // Tài khoản đã tồn tại
        console.log(`Account ${account.identifier} already exists`);
      }
    }
    
    res.status(201).json({
      success: true,
      message: 'Tạo tài khoản mặc định thành công.',
      data: {
        accounts: createdAccounts
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo tài khoản mặc định.',
      error: error.message
    });
  }
};

// Upload avatar only
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ảnh đại diện.'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: `/uploads/avatars/${req.file.filename}` },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Cập nhật ảnh đại diện thành công.',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          address: user.address,
          fullAddress: user.fullAddress,
          role: user.role,
          avatar: user.avatar,
          location: user.location,
          organizationId: user.organizationId,
          patientId: user.patientId,
          organizationInfo: user.organizationInfo
        }
      }
    });

  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra khi cập nhật ảnh đại diện.'
    });
  }
};

// @desc    Đăng nhập bằng Firebase (Google)
// @route   POST /api/auth/firebase
// @access  Public
const loginWithFirebase = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    // Validation
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'Thiếu ID token từ Firebase.'
      });
    }
    
    // Verify Firebase ID token
    const admin = require('../config/firebaseAdmin');
    
    if (!admin) {
      return res.status(503).json({
        success: false,
        message: 'Firebase Admin SDK chưa được cấu hình. Vui lòng thêm FIREBASE_SERVICE_ACCOUNT_KEY hoặc FIREBASE_PROJECT_ID vào file .env'
      });
    }
    
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (error) {
      console.error('Firebase token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token không hợp lệ hoặc đã hết hạn.'
      });
    }
    
    const { uid, email, name, picture } = decodedToken;
    
    // Tìm user đã tồn tại với firebaseUid
    let user = await User.findOne({ firebaseUid: uid });
    
    if (user) {
      // User đã tồn tại, cập nhật thông tin nếu cần
      user.lastLogin = new Date();
      
      // Cập nhật avatar nếu có
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      
      // Cập nhật fullName nếu chưa có
      if (!user.fullName && name) {
        user.fullName = name;
      }
      
      await user.save();
    } else {
      // Tìm user với email từ Firebase
      if (email) {
        user = await User.findOne({ email });
        
        if (user) {
          // User đã tồn tại với email này, liên kết với Firebase
          user.firebaseUid = uid;
          user.authProvider = 'firebase';
          user.isEmailVerified = true;
          
          if (picture && !user.avatar) {
            user.avatar = picture;
          }
          
          if (!user.fullName && name) {
            user.fullName = name;
          }
          
          user.lastLogin = new Date();
          await user.save();
        }
      }
      
      // Nếu vẫn chưa có user, tạo user mới
      if (!user) {
        // Tạo username từ email (trước @) hoặc từ name
        const emailPrefix = email ? email.split('@')[0] : null;
        const baseUsername = emailPrefix || (name ? name.toLowerCase().replace(/\s+/g, '') : `user${uid.substring(0, 8)}`);
        let username = baseUsername;
        let counter = 1;
        
        // Đảm bảo username là duy nhất
        while (await User.findOne({ username })) {
          username = `${baseUsername}${counter}`;
          counter++;
        }
        
        // Tạo user mới với role mặc định là patient
        user = await User.create({
          username: username,
          email: email || `${uid}@firebase.local`,
          firebaseUid: uid,
          authProvider: 'firebase',
          fullName: name || 'Người dùng Firebase',
          avatar: picture || null,
          role: 'patient', // Mặc định là patient, có thể cập nhật sau
          isEmailVerified: !!email,
          mustChangePassword: false, // Không cần đổi mật khẩu cho OAuth
          lastLogin: new Date()
        });
      }
    }
    
    // Tạo JWT token
    const token = user.generateAuthToken();
    
    // Ghi audit log
    await auditService.logAuth.login(user, req, 'success');
    
    // Thông tin user để trả về (không bao gồm password)
    const userInfo = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      organizationId: user.organizationId,
      patientId: user.patientId,
      organizationInfo: user.organizationInfo,
      mustChangePassword: user.mustChangePassword,
      lastLogin: user.lastLogin,
      authProvider: user.authProvider,
      avatar: user.avatar
    };
    
    res.status(200).json({
      success: true,
      message: 'Đăng nhập bằng Firebase thành công.',
      data: {
        user: userInfo,
        token: token
      }
    });
    
    // Log success
    console.log(`✅ Firebase login success: ${user.email} (${user.role})`);
    
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xử lý đăng nhập Firebase.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Đăng ký tài khoản công khai (Public Registration)
// @route   POST /api/auth/register/public
// @access  Public
const publicRegister = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      phone,
      address
    } = req.body;
    
    // Kiểm tra user đã tồn tại chưa (chỉ kiểm tra username và email)
    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { email: email }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Tên đăng nhập hoặc email đã được sử dụng.'
      });
    }
    
    // Tạo patientId unique: PAT_{timestamp}_{randomString}
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9).toUpperCase();
    let patientId = `PAT_${timestamp}_${randomString}`;
    
    // Đảm bảo patientId là unique (kiểm tra và tạo lại nếu cần)
    let attempts = 0;
    while (await User.findOne({ patientId }) && attempts < 10) {
      const newRandomString = Math.random().toString(36).substring(2, 9).toUpperCase();
      patientId = `PAT_${timestamp}_${newRandomString}`;
      attempts++;
    }
    
    if (attempts >= 10) {
      // Nếu vẫn không tìm được unique, thêm timestamp vào cuối
      patientId = `PAT_${timestamp}_${randomString}_${Date.now()}`;
    }
    
    // Tạo user mới với role mặc định là 'patient'
    const userData = {
      username,
      email,
      password,
      fullName,
      phone: phone || undefined,
      address: address || undefined,
      role: 'patient',
      patientId: patientId,
      mustChangePassword: false, // Không bắt buộc đổi mật khẩu lần đầu cho public registration
      authProvider: 'local'
    };
    
    const user = await User.create(userData);
    
    // Ghi audit log (không có req.user vì là public registration)
    try {
      await auditService.logCRUD.create(
        null, // Không có user thực hiện (public registration)
        'User',
        user._id,
        { username: user.username, email: user.email, role: user.role },
        'user',
        req,
        `Đăng ký tài khoản công khai: ${user.username} (${user.role})`
      );
    } catch (auditError) {
      // Không làm fail request nếu audit log lỗi
      console.error('Audit log error:', auditError);
    }
    
    // Tự động đăng nhập: Tạo JWT token
    const token = user.generateAuthToken();
    
    // Thông tin user để trả về (không bao gồm password)
    const userInfo = {
      id: user._id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      patientId: user.patientId,
      organizationId: user.organizationId,
      organizationInfo: user.organizationInfo,
      mustChangePassword: user.mustChangePassword,
      lastLogin: user.lastLogin
    };
    
    res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công. Bạn đã được đăng nhập tự động.',
      data: {
        user: userInfo,
        token: token
      }
    });
    
  } catch (error) {
    console.error('Public registration error:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: messages
      });
    }
    
    // Kiểm tra duplicate key error (MongoDB)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `Thông tin ${field === 'username' ? 'tên đăng nhập' : field === 'email' ? 'email' : field} đã được sử dụng.`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đăng ký tài khoản.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  login,
  register,
  publicRegister,
  changePassword,
  firstChangePassword,
  getMe,
  updateProfile,
  uploadAvatar,
  logout,
  createDefaultAccounts,
  loginWithFirebase
};
