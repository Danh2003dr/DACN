import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Shield, Users, Building2, User, Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      const result = await login(data);
      
      if (result.success) {
        // Navigate based on user role
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

  const roleExamples = [
    {
      role: 'Admin',
      icon: <Shield className="w-5 h-5" />,
      username: 'admin',
      description: 'Quản trị toàn hệ thống'
    },
    {
      role: 'Nhà sản xuất',
      icon: <Building2 className="w-5 h-5" />,
      username: 'manufacturer1',
      description: 'Quản lý lô thuốc và blockchain'
    },
    {
      role: 'Nhà phân phối',
      icon: <Users className="w-5 h-5" />,
      username: 'distributor1',
      description: 'Vận chuyển và phân phối thuốc'
    },
    {
      role: 'Bệnh viện',
      icon: <Heart className="w-5 h-5" />,
      username: 'hospital1',
      description: 'Quản lý kho và cấp phát thuốc'
    },
    {
      role: 'Bệnh nhân',
      icon: <User className="w-5 h-5" />,
      username: 'patient1',
      description: 'Tra cứu nguồn gốc thuốc'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Đăng nhập hệ thống
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Quản lý nguồn gốc xuất xứ thuốc bằng Blockchain
            </p>
          </div>

          <div className="mt-8">
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="identifier" className="form-label">
                  Tên đăng nhập hoặc Email
                </label>
                <div className="mt-1">
                  <input
                    id="identifier"
                    type="text"
                    autoComplete="username"
                    className={`form-input ${errors.identifier ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="Nhập tên đăng nhập hoặc email"
                    {...register('identifier', {
                      required: 'Vui lòng nhập tên đăng nhập hoặc email',
                      minLength: {
                        value: 3,
                        message: 'Tên đăng nhập phải có ít nhất 3 ký tự'
                      }
                    })}
                  />
                  {errors.identifier && (
                    <p className="form-error">{errors.identifier.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Mật khẩu
                </label>
                <div className="mt-1 relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`form-input pr-10 ${errors.password ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                    placeholder="Nhập mật khẩu"
                    {...register('password', {
                      required: 'Vui lòng nhập mật khẩu',
                      minLength: {
                        value: 6,
                        message: 'Mật khẩu phải có ít nhất 6 ký tự'
                      }
                    })}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

              {errors.root && (
                <div className="rounded-md bg-danger-50 p-4">
                  <div className="text-sm text-danger-700">
                    {errors.root.message}
                  </div>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary w-full btn-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="spinner w-5 h-5 mr-2"></div>
                      Đang đăng nhập...
                    </div>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Hoặc</span>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => authAPI.loginWithGoogle()}
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Đăng nhập bằng Google
                </button>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Mật khẩu mặc định: <span className="font-mono bg-gray-100 px-2 py-1 rounded">default123</span>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Right side - Role Examples */}
      <div className="hidden lg:block relative w-0 flex-1">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 to-secondary-600">
          <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        </div>
        
        <div className="relative h-full flex flex-col justify-center px-8 py-12">
          <div className="max-w-md">
            <h3 className="text-2xl font-bold text-white mb-8">
              Tài khoản Demo
            </h3>
            
            <div className="space-y-4">
              {roleExamples.map((example, index) => (
                <div
                  key={index}
                  className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-4 border border-white border-opacity-20"
                >
                  <div className="flex items-start">
                    <div className="flex-shrink-0 text-white">
                      {example.icon}
                    </div>
                    <div className="ml-3 flex-1">
                      <h4 className="text-sm font-medium text-white">
                        {example.role}
                      </h4>
                      <p className="text-sm text-white text-opacity-90 mt-1">
                        {example.description}
                      </p>
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
                          Username: {example.username}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 p-4 bg-yellow-500 bg-opacity-20 rounded-lg border border-yellow-400 border-opacity-30">
              <p className="text-sm text-yellow-100">
                <strong>Lưu ý:</strong> Đây là môi trường demo. Sau khi đăng nhập lần đầu, 
                bạn sẽ được yêu cầu đổi mật khẩu để bảo mật.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
