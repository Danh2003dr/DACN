import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Pill, Lock, Mail, User as UserIcon, Phone, MapPin, ArrowRight, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { isAuthenticated, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const response = await authAPI.publicRegister({
        username: data.username,
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phone: data.phone || undefined,
        address: data.address || undefined
      });
      
      if (response.success) {
        // Tự động đăng nhập sau khi đăng ký thành công
        const { token, user } = response.data;
        
        // Set token - setToken sẽ tự động fetch user và update AuthContext
        setToken(token);
        
        // Redirect to dashboard
        const redirectPath = location.state?.from?.pathname || '/dashboard';
        navigate(redirectPath, { replace: true });
      } else {
        setError('root', {
          type: 'manual',
          message: response.message || 'Đăng ký thất bại'
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.';
      const errorDetails = error.response?.data?.errors;
      
      if (Array.isArray(errorDetails) && errorDetails.length > 0) {
        // Hiển thị lỗi đầu tiên
        setError('root', {
          type: 'manual',
          message: errorDetails[0]
        });
      } else {
        setError('root', {
          type: 'manual',
          message: errorMessage
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />
        
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo & Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-6">
              <Pill className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Đăng ký tài khoản
            </h1>
            <p className="text-slate-400">
              Tạo tài khoản mới để truy cập hệ thống
            </p>
          </div>

          {/* Register Card */}
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Tên đăng nhập <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    autoComplete="username"
                    className={`w-full pl-12 pr-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.username 
                        ? 'border-red-500/50 focus:ring-red-500/50' 
                        : 'border-slate-700 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                    }`}
                    placeholder="Chỉ chứa chữ cái và số (3-50 ký tự)"
                    {...registerField('username', {
                      required: 'Vui lòng nhập tên đăng nhập',
                      minLength: { value: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự' },
                      maxLength: { value: 50, message: 'Tên đăng nhập không được quá 50 ký tự' },
                      pattern: {
                        value: /^[a-zA-Z0-9]+$/,
                        message: 'Tên đăng nhập chỉ được chứa chữ cái và số'
                      }
                    })}
                  />
                </div>
                {errors.username && (
                  <p className="text-red-400 text-sm">{errors.username.message}</p>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Email <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    autoComplete="email"
                    className={`w-full pl-12 pr-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.email 
                        ? 'border-red-500/50 focus:ring-red-500/50' 
                        : 'border-slate-700 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                    }`}
                    placeholder="your.email@example.com"
                    {...registerField('email', {
                      required: 'Vui lòng nhập email',
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: 'Email không hợp lệ'
                      }
                    })}
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-sm">{errors.email.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Mật khẩu <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`w-full pl-12 pr-12 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.password 
                        ? 'border-red-500/50 focus:ring-red-500/50' 
                        : 'border-slate-700 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                    }`}
                    placeholder="Tối thiểu 6 ký tự"
                    {...registerField('password', {
                      required: 'Vui lòng nhập mật khẩu',
                      minLength: { value: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' }
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-400 text-sm">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Xác nhận mật khẩu <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`w-full pl-12 pr-12 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.confirmPassword 
                        ? 'border-red-500/50 focus:ring-red-500/50' 
                        : 'border-slate-700 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                    }`}
                    placeholder="Nhập lại mật khẩu"
                    {...registerField('confirmPassword', {
                      required: 'Vui lòng xác nhận mật khẩu',
                      validate: value => value === password || 'Mật khẩu xác nhận không khớp'
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-400 text-sm">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Full Name Field */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Họ và tên <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    autoComplete="name"
                    className={`w-full pl-12 pr-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.fullName 
                        ? 'border-red-500/50 focus:ring-red-500/50' 
                        : 'border-slate-700 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                    }`}
                    placeholder="Nhập họ và tên đầy đủ"
                    {...registerField('fullName', {
                      required: 'Vui lòng nhập họ và tên',
                      minLength: { value: 2, message: 'Họ và tên phải có ít nhất 2 ký tự' },
                      maxLength: { value: 100, message: 'Họ và tên không được quá 100 ký tự' }
                    })}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-400 text-sm">{errors.fullName.message}</p>
                )}
              </div>

              {/* Phone Field (Optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Số điện thoại <span className="text-slate-500 text-xs">(tùy chọn)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    autoComplete="tel"
                    className={`w-full pl-12 pr-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.phone 
                        ? 'border-red-500/50 focus:ring-red-500/50' 
                        : 'border-slate-700 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                    }`}
                    placeholder="10-11 chữ số"
                    {...registerField('phone', {
                      pattern: {
                        value: /^[0-9]{10,11}$/,
                        message: 'Số điện thoại phải có 10-11 chữ số'
                      }
                    })}
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-400 text-sm">{errors.phone.message}</p>
                )}
              </div>

              {/* Address Field (Optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">
                  Địa chỉ <span className="text-slate-500 text-xs">(tùy chọn)</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    autoComplete="street-address"
                    className={`w-full pl-12 pr-4 py-3 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                      errors.address 
                        ? 'border-red-500/50 focus:ring-red-500/50' 
                        : 'border-slate-700 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                    }`}
                    placeholder="Nhập địa chỉ của bạn"
                    {...registerField('address', {
                      maxLength: { value: 500, message: 'Địa chỉ không được quá 500 ký tự' }
                    })}
                  />
                </div>
                {errors.address && (
                  <p className="text-red-400 text-sm">{errors.address.message}</p>
                )}
              </div>

              {/* Error Message */}
              {errors.root && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                  <p className="text-red-400 text-sm">{errors.root.message}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Đang đăng ký...
                  </>
                ) : (
                  <>
                    Đăng ký
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {/* Link to Login */}
              <div className="text-center pt-4">
                <p className="text-slate-400 text-sm">
                  Đã có tài khoản?{' '}
                  <Link 
                    to="/login" 
                    className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Đăng nhập
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;

