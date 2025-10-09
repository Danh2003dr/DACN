import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Building,
  Shield,
  Key,
  Save,
  Edit3,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Clock,
  Camera,
  Upload
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../utils/api';
import toast from 'react-hot-toast';
import AvatarCropper from '../components/AvatarCropper';
import AddressMap from '../components/AddressMap';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState(null);
  const [showAddressMap, setShowAddressMap] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { errors }, watch } = useForm();
  const newPassword = watch('newPassword');

  useEffect(() => {
    if (user) {
      setValue('fullName', user.fullName || '');
      setValue('email', user.email || '');
      setValue('phone', user.phone || '');
      setValue('address', user.address || '');
      setValue('organizationInfo.name', user.organizationInfo?.name || '');
      setValue('organizationInfo.address', user.organizationInfo?.address || '');
      setValue('organizationInfo.phone', user.organizationInfo?.phone || '');
      setValue('organizationInfo.email', user.organizationInfo?.email || '');
      
      // Set avatar preview if user has avatar
      if (user.avatar) {
        setAvatarPreview(`http://localhost:5000${user.avatar}`);
      }
    }
  }, [user, setValue]);

  // Handle avatar file change
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file ảnh!');
        return;
      }
      
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB!');
        return;
      }
      
      // Show cropper
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropperImageSrc(e.target.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle cropped image save
  const handleCroppedImageSave = async (croppedImageBlob) => {
    try {
      setLoading(true);
      console.log('Uploading avatar blob:', croppedImageBlob);
      
      const response = await authAPI.uploadAvatar(croppedImageBlob);
      console.log('Upload response:', response);
      
      if (response.success) {
        updateUser(response.data.user);
        setAvatarPreview(URL.createObjectURL(croppedImageBlob));
        toast.success('Cập nhật ảnh đại diện thành công!');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật ảnh đại diện');
    } finally {
      setLoading(false);
    }
  };

  // Update profile
  const onSubmitProfile = async (data) => {
    try {
      setLoading(true);
      
      const updateData = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || '',
        address: data.address || '',
        organizationInfo: data.organizationInfo ? {
          name: data.organizationInfo.name || '',
          address: data.organizationInfo.address || '',
          phone: data.organizationInfo.phone || '',
          email: data.organizationInfo.email || ''
        } : null
      };

      // Thêm location data nếu có
      if (data.location) {
        try {
          updateData.location = data.location;
        } catch (e) {
          console.error('Error parsing location data:', e);
        }
      }

      const response = await authAPI.updateProfile(updateData);
      
      if (response.success) {
        updateUser(response.data.user);
        toast.success('Cập nhật hồ sơ thành công!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const onSubmitPassword = async (data) => {
    try {
      setLoading(true);
      const response = await authAPI.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      if (response.success) {
        toast.success('Đổi mật khẩu thành công!');
        setShowPasswordForm(false);
        reset({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Quản trị viên hệ thống',
      manufacturer: 'Nhà sản xuất',
      distributor: 'Nhà phân phối',
      hospital: 'Bệnh viện',
      patient: 'Bệnh nhân'
    };
    return roleNames[role] || role;
  };

  const getRoleIcon = (role) => {
    const roleIcons = {
      admin: Shield,
      manufacturer: Building,
      distributor: Building,
      hospital: Building,
      patient: User
    };
    return roleIcons[role] || User;
  };

  const RoleIcon = getRoleIcon(user?.role);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-blue-100 flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <RoleIcon className="h-12 w-12 text-blue-600" />
              )}
            </div>
            <label
              htmlFor="avatar-upload"
              className="absolute bottom-0 right-0 h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors"
            >
              <Camera className="h-3 w-3 text-white" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{user?.fullName}</h1>
            <p className="text-gray-600">{getRoleDisplayName(user?.role)}</p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Tham gia: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
              </div>
              <div className="flex items-center">
                <Clock className="h-4 w-4 mr-1" />
                Cập nhật: {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('vi-VN') : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Thông tin cá nhân</h2>
              <Edit3 className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <form onSubmit={handleSubmit(onSubmitProfile)} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  {...register('fullName', { required: 'Họ và tên là bắt buộc' })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="email"
                  {...register('email', { 
                    required: 'Email là bắt buộc',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Email không hợp lệ'
                    }
                  })}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="tel"
                  {...register('phone')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <textarea
                  {...register('address')}
                  rows={3}
                  className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => setShowAddressMap(true)}
                  className="absolute right-3 top-3 p-1 text-gray-400 hover:text-blue-600"
                  title="Xem vị trí trên bản đồ"
                >
                  <MapPin className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Hidden field for location data */}
            <input type="hidden" {...register('location')} />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>Cập nhật hồ sơ</span>
            </button>
          </form>
        </div>

        {/* Organization Information */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Thông tin tổ chức</h2>
              <Building className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên tổ chức
              </label>
              <input
                type="text"
                {...register('organizationInfo.name')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tên công ty/tổ chức"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ tổ chức
              </label>
              <textarea
                {...register('organizationInfo.address')}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Địa chỉ công ty/tổ chức"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điện thoại tổ chức
                </label>
                <input
                  type="tel"
                  {...register('organizationInfo.phone')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Số điện thoại"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email tổ chức
                </label>
                <input
                  type="email"
                  {...register('organizationInfo.email')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Email công ty"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Bảo mật</h2>
              <p className="text-sm text-gray-600">Quản lý mật khẩu và bảo mật tài khoản</p>
            </div>
            <Key className="h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <div className="p-6">
          {!showPasswordForm ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Mật khẩu</h3>
                <p className="text-sm text-gray-600">Cập nhật mật khẩu của bạn</p>
              </div>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Key className="h-4 w-4" />
                <span>Đổi mật khẩu</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmitPassword)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu hiện tại *
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    {...register('currentPassword', { required: 'Mật khẩu hiện tại là bắt buộc' })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    {...register('newPassword', { 
                      required: 'Mật khẩu mới là bắt buộc',
                      minLength: {
                        value: 6,
                        message: 'Mật khẩu phải có ít nhất 6 ký tự'
                      }
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Xác nhận mật khẩu mới *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword', { 
                      required: 'Xác nhận mật khẩu là bắt buộc',
                      validate: value => value === newPassword || 'Mật khẩu xác nhận không khớp'
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Cập nhật mật khẩu</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordForm(false);
                    reset({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Account Status */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Trạng thái tài khoản</h2>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Trạng thái</p>
                <p className="text-sm text-green-600">Hoạt động</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Vai trò</p>
                <p className="text-sm text-blue-600">{getRoleDisplayName(user?.role)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Cập nhật cuối</p>
                <p className="text-sm text-yellow-600">
                  {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString('vi-VN') : 'Chưa có'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Avatar Cropper Modal */}
      {showCropper && (
        <AvatarCropper
          src={cropperImageSrc}
          onSave={handleCroppedImageSave}
          onClose={() => {
            setShowCropper(false);
            setCropperImageSrc(null);
          }}
        />
      )}

      {/* Address Map Modal */}
      {showAddressMap && (
        <AddressMap
          address={watch('address')}
          onClose={() => setShowAddressMap(false)}
          onAddressSelect={(coordinates) => {
            // Cập nhật địa chỉ và lưu tọa độ
            setValue('address', coordinates.address);
            setValue('location', JSON.stringify(coordinates));
            setShowAddressMap(false);
            toast.success('Đã cập nhật địa chỉ từ bản đồ!');
          }}
        />
      )}
    </div>
  );
};

export default Profile;
