const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Google OAuth Strategy - chỉ khởi tạo nếu có credentials
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/auth/google/callback`
  }, async (accessToken, refreshToken, profile, done) => {
  try {
    // Tìm user đã tồn tại với googleId
    let user = await User.findOne({ googleId: profile.id });
    
    if (user) {
      // User đã tồn tại, cập nhật thông tin nếu cần
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }
    
    // Tìm user với email từ Google
    user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // User đã tồn tại với email này, liên kết với Google account
      user.googleId = profile.id;
      user.authProvider = 'google';
      user.isEmailVerified = true;
      
      // Cập nhật avatar nếu có
      if (profile.photos && profile.photos[0]) {
        user.avatar = profile.photos[0].value;
      }
      
      // Cập nhật fullName nếu chưa có
      if (!user.fullName && profile.displayName) {
        user.fullName = profile.displayName;
      }
      
      user.lastLogin = new Date();
      await user.save();
      return done(null, user);
    }
    
    // Tạo user mới
    // Tạo username từ email (trước @) hoặc từ displayName
    const emailPrefix = profile.emails[0].value.split('@')[0];
    const baseUsername = emailPrefix || profile.displayName.toLowerCase().replace(/\s+/g, '');
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
      email: profile.emails[0].value,
      googleId: profile.id,
      authProvider: 'google',
      fullName: profile.displayName || profile.name?.givenName || 'Người dùng Google',
      avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
      role: 'patient', // Mặc định là patient, có thể cập nhật sau
      isEmailVerified: true,
      mustChangePassword: false, // Không cần đổi mật khẩu cho OAuth
      lastLogin: new Date()
    });
    
    return done(null, user);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
  }));
  
  console.log('✅ Google OAuth đã được khởi tạo');
} else {
  console.log('⚠️  Google OAuth chưa được cấu hình. Bỏ qua khởi tạo Google OAuth.');
  console.log('   Để sử dụng Google OAuth, thêm GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET vào file .env');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;

