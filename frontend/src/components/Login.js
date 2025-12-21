import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Shield, Users, Building2, User, Heart, Pill, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, getRedirectResult } from 'firebase/auth';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  
  const { login, isAuthenticated, user, setToken } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    setValue,
  } = useForm();

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Handle Firebase redirect result (nếu dùng signInWithRedirect)
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        
        if (result) {
          console.log('Firebase redirect result detected');
          setIsLoading(true);
          
          try {
            const user = result.user;
            const idToken = await user.getIdToken();
            
            const response = await authAPI.loginWithFirebase(idToken);
            
            if (response && response.success) {
              setToken(response.data.token);
              const redirectPath = location.state?.from?.pathname || '/dashboard';
              navigate(redirectPath, { replace: true });
            } else {
              setError('root', {
                type: 'manual',
                message: response?.message || 'Đăng nhập với Google thất bại'
              });
            }
          } catch (error) {
            console.error('Error processing redirect result:', error);
            setError('root', {
              type: 'manual',
              message: 'Lỗi khi xử lý kết quả đăng nhập. Vui lòng thử lại.'
            });
          } finally {
            setIsLoading(false);
          }
        }
      } catch (error) {
        // Không có redirect result hoặc đã xử lý, bỏ qua
        if (error.code !== 'auth/operation-not-supported-in-this-environment') {
          console.log('No redirect result or error:', error.message);
        }
      }
    };

    // Chỉ check redirect result một lần khi component mount
    if (!isAuthenticated) {
      handleRedirectResult();
    }
  }, []); // Empty dependency array - chỉ chạy một lần

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await login(data);
      
      if (result.success) {
        const redirectPath = location.state?.from?.pathname || '/dashboard';
        navigate(redirectPath, { replace: true });
      } else {
        setError('root', {
          type: 'manual',
          message: result.error || 'Đăng nhập thất bại'
        });
      }
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: 'Có lỗi xảy ra. Vui lòng thử lại.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('root', null); // Clear previous errors
    
    try {
      console.log('Starting Google login...');
      
      // Sign in with Google using Firebase
      const result = await signInWithPopup(auth, googleProvider);
      
      const user = result.user;
      console.log('Firebase auth success, user:', user.email);
      
      // Get ID token from Firebase
      const idToken = await user.getIdToken();
      console.log('Got ID token, length:', idToken.length);
      
      // Send ID token to backend to verify and get JWT token
      console.log('Sending token to backend...');
      const response = await authAPI.loginWithFirebase(idToken);
      console.log('Backend response:', response);
      
      if (response && response.success) {
        // Set token in AuthContext
        setToken(response.data.token);
        
        // Redirect to dashboard
        const redirectPath = location.state?.from?.pathname || '/dashboard';
        console.log('Redirecting to:', redirectPath);
        navigate(redirectPath, { replace: true });
      } else {
        const errorMsg = response?.message || 'Đăng nhập với Google thất bại';
        console.error('Backend returned error:', errorMsg);
        setError('root', {
          type: 'manual',
          message: errorMsg
        });
      }
    } catch (error) {
      console.error('Google login error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      let errorMessage = 'Đăng nhập với Google thất bại';
      
      // Firebase auth errors
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Bạn đã đóng cửa sổ đăng nhập. Vui lòng thử lại.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Cửa sổ popup bị chặn. Vui lòng cho phép popup cho trang web này và thử lại.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.';
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = 'Yêu cầu đăng nhập đã bị hủy. Vui lòng thử lại.';
      } else if (error.code === 'auth/unauthorized-domain') {
        errorMessage = 'Domain chưa được authorize trong Firebase. Vui lòng thêm localhost vào authorized domains.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google Sign-in chưa được bật trong Firebase Console.';
      } 
      // API errors
      else if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Backend chưa sẵn sàng. Vui lòng đảm bảo backend đang chạy tại http://localhost:5000';
        } else if (error.response.status === 503) {
          errorMessage = error.response.data?.message || 'Firebase Admin SDK chưa được cấu hình. Vui lòng kiểm tra file .env';
        } else if (error.response.status === 401) {
          errorMessage = error.response.data?.message || 'Token không hợp lệ. Vui lòng thử lại.';
        } else if (error.response.status >= 500) {
          errorMessage = error.response.data?.message || 'Lỗi server. Vui lòng thử lại sau.';
        } else {
          errorMessage = error.response.data?.message || 'Lỗi khi đăng nhập. Vui lòng thử lại.';
        }
      } 
      // Network errors
      else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error') || error.message?.includes('Failed to fetch')) {
        errorMessage = 'Không thể kết nối đến backend. Vui lòng kiểm tra:\n1. Backend có đang chạy tại http://localhost:5000?\n2. Mở Browser Console (F12) để xem lỗi chi tiết';
        console.error('Network error details:', {
          code: error.code,
          message: error.message,
          config: error.config
        });
      }
      // Timeout errors
      else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        errorMessage = 'Request timeout. Backend có thể đang quá tải. Vui lòng thử lại.';
      } 
      // Other errors
      else if (error.message) {
        errorMessage = error.message;
      }
      
      setError('root', {
        type: 'manual',
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  const roleExamples = [
    {
      role: 'Admin',
      icon: Shield,
      username: 'admin',
      description: 'Quản trị toàn hệ thống',
      color: 'from-violet-500 to-purple-600'
    },
    {
      role: 'Nhà sản xuất',
      icon: Building2,
      username: 'manufacturer1',
      description: 'Quản lý lô thuốc',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      role: 'Nhà phân phối',
      icon: Users,
      username: 'distributor1',
      description: 'Phân phối thuốc',
      color: 'from-emerald-500 to-teal-500'
    },
    {
      role: 'Bệnh viện',
      icon: Heart,
      username: 'hospital1',
      description: 'Quản lý kho thuốc',
      color: 'from-rose-500 to-pink-500'
    },
    {
      role: 'Bệnh nhân',
      icon: User,
      username: 'patient1',
      description: 'Tra cứu nguồn gốc',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  const handleRoleClick = (example) => {
    setSelectedRole(example.username);
    setValue('identifier', example.username);
    setValue('password', 'default123');
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

      <div className="relative z-10 min-h-screen flex">
        {/* Left Panel - Login Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo & Title */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-2xl shadow-indigo-500/30 mb-6">
                <Pill className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Drug Traceability
              </h1>
              <p className="text-slate-400">
                Hệ thống truy xuất nguồn gốc thuốc bằng Blockchain
              </p>
            </div>

            {/* Login Card */}
            <div className="backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Username/Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Tên đăng nhập hoặc Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type="text"
                      autoComplete="username"
                      className={`w-full pl-12 pr-4 py-4 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.identifier 
                          ? 'border-red-500/50 focus:ring-red-500/50' 
                          : 'border-slate-700 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                      }`}
                      placeholder="Nhập tên đăng nhập"
                      {...register('identifier', {
                        required: 'Vui lòng nhập tên đăng nhập',
                        minLength: { value: 3, message: 'Tối thiểu 3 ký tự' }
                      })}
                    />
                  </div>
                  {errors.identifier && (
                    <p className="text-red-400 text-sm">{errors.identifier.message}</p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={`w-full pl-12 pr-12 py-4 bg-slate-800/50 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 transition-all duration-300 ${
                        errors.password 
                          ? 'border-red-500/50 focus:ring-red-500/50' 
                          : 'border-slate-700 focus:ring-indigo-500/50 focus:border-indigo-500/50'
                      }`}
                      placeholder="Nhập mật khẩu"
                      {...register('password', {
                        required: 'Vui lòng nhập mật khẩu',
                        minLength: { value: 6, message: 'Tối thiểu 6 ký tự' }
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
                      Đang đăng nhập...
                    </>
                  ) : (
                    <>
                      Đăng nhập
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-transparent text-slate-500 text-sm">hoặc</span>
                  </div>
                </div>

                {/* Google Login */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 border border-slate-700 hover:border-slate-600 text-white font-medium rounded-xl transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Đăng nhập với Google
                    </>
                  )}
                </button>
              </form>

              {/* Register Link */}
              <div className="mt-4 text-center">
                <p className="text-slate-400 text-sm">
                  Chưa có tài khoản?{' '}
                  <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                    Đăng ký ngay
                  </Link>
                </p>
              </div>

              {/* Default Password Hint */}
              <div className="mt-6 text-center">
                <p className="text-slate-500 text-sm">
                  Mật khẩu mặc định: <code className="px-2 py-1 bg-slate-800 rounded text-indigo-400">default123</code>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Demo Accounts */}
        <div className="hidden lg:flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-sm mb-4">
                <Sparkles className="w-4 h-4" />
                Tài khoản Demo
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Chọn vai trò để trải nghiệm
              </h2>
              <p className="text-slate-400">
                Click vào thẻ để tự động điền thông tin đăng nhập
              </p>
            </div>

            <div className="space-y-3">
              {roleExamples.map((example, index) => {
                const Icon = example.icon;
                const isSelected = selectedRole === example.username;
                
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleRoleClick(example)}
                    className={`w-full p-4 rounded-2xl border transition-all duration-300 text-left group ${
                      isSelected 
                        ? 'bg-gradient-to-r ' + example.color + ' border-transparent shadow-lg' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                        isSelected 
                          ? 'bg-white/20' 
                          : 'bg-gradient-to-br ' + example.color
                      }`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{example.role}</h3>
                        <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                          {example.description}
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-mono ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {example.username}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h4 className="font-medium text-amber-400 mb-1">Môi trường Demo</h4>
                  <p className="text-sm text-amber-200/70">
                    Đây là môi trường thử nghiệm. Dữ liệu có thể được reset định kỳ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
