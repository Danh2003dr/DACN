import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SimpleAddressMap from '../components/SimpleAddressMap';
import AvatarCropper from '../components/AvatarCropper';
import api from '../utils/api';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const Profile = () => {
  const { user, updateUser, changePassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState(null);
  const fileInputRef = useRef(null);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState('');
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    organizationInfo: {
      name: '',
      address: '',
      phone: '',
      email: ''
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address ? 
          (typeof user.address === 'string' ? user.address : 
           `${user.address.street || ''}, ${user.address.ward || ''}, ${user.address.district || ''}, ${user.address.city || ''}`.replace(/^,\s*|,\s*$/g, '')) : '',
        organizationInfo: {
          name: user.organizationInfo?.name || '',
          address: user.organizationInfo?.address || '',
          phone: user.organizationInfo?.phone || '',
          email: user.organizationInfo?.email || ''
        }
      });
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOrganizationChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      organizationInfo: {
        ...prev.organizationInfo,
        [name]: value
      }
    }));
  };

  const onAvatarButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const onAvatarFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const src = URL.createObjectURL(file);
    setAvatarSrc(src);
    setAvatarModalOpen(true);
    // reset input so the same file can be picked again later
    e.target.value = '';
  };

  const onSaveCroppedAvatar = async (croppedBlob) => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('avatar', croppedBlob, 'avatar.jpg');
      const response = await api.post('/auth/upload-avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data?.success) {
        updateUser(response.data.data.user);
        setMessage('Cập nhật ảnh đại diện thành công!');
        setAvatarModalOpen(false);
        setAvatarSrc(null);
      } else {
        const errorMsg = response.data?.message || 'Không thể cập nhật ảnh đại diện';
        setMessage(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Không thể cập nhật ảnh đại diện';
      setMessage(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleAddressChange = (address) => {
    // Parse address string thành object format
    const addressParts = address.split(', ');
    const addressObj = {
      street: addressParts[0] || '',
      ward: addressParts[1] || '',
      district: addressParts[2] || '',
      city: addressParts[3] || ''
    };
    
    setFormData(prev => ({
      ...prev,
      address: addressObj
    }));
  };

  const handleOrganizationAddressChange = (address) => {
    setFormData(prev => ({
      ...prev,
      organizationInfo: {
        ...prev.organizationInfo,
        address: address
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await api.put('/auth/update-profile', formData);
      
      if (response.data.success) {
        setMessage('Cập nhật hồ sơ thành công!');
        updateUser(response.data.data.user);
      } else {
        setMessage('Có lỗi xảy ra khi cập nhật hồ sơ');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handlePwdChange = async (e) => {
    e.preventDefault();
    setPwdMessage('');
    setPwdLoading(true);
    try {
      const res = await changePassword(pwdForm);
      if (res?.success) {
        setPwdMessage('Đổi mật khẩu thành công!');
        setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else if (res?.error) {
        setPwdMessage(res.error);
      }
    } finally {
      setPwdLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <>
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <PageHeader
            title="Hồ sơ cá nhân"
            subtitle="Cập nhật thông tin cá nhân, thông tin tổ chức và bảo mật tài khoản"
          />
        </div>
        {/* Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-4">
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="avatar"
                    className="w-20 h-20 rounded-full object-cover border"
                  />
                ) : (
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {user?.fullName?.charAt(0) || 'A'}
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={onAvatarButtonClick}
                  className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                  title="Cập nhật ảnh đại diện"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                  </svg>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={onAvatarFileSelected}
                  className="hidden"
                />
              </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user?.fullName || 'Chưa có tên'}</h1>
              <p className="text-gray-600">{user?.role === 'admin' ? 'Quản trị viên hệ thống' : 
                user?.role === 'manufacturer' ? 'Nhà sản xuất' :
                user?.role === 'distributor' ? 'Nhà phân phối' :
                user?.role === 'hospital' ? 'Bệnh viện' :
                user?.role === 'patient' ? 'Bệnh nhân' : 'Người dùng'}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Tham gia: {formatDate(user?.createdAt)}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                  Cập nhật: {formatDate(user?.updatedAt)}
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Thông tin cá nhân */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin cá nhân</h2>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Họ và tên *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số điện thoại
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ
                </label>
                <SimpleAddressMap
                  value={typeof formData.address === 'string' ? formData.address : 
                    `${formData.address.street || ''}, ${formData.address.ward || ''}, ${formData.address.district || ''}, ${formData.address.city || ''}`.replace(/^,\s*|,\s*$/g, '')}
                  onChange={handleAddressChange}
                  placeholder="Nhập địa chỉ hoặc click trên bản đồ để chọn vị trí"
                  height="250px"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Đang cập nhật...' : 'Cập nhật hồ sơ'}
              </Button>
            </form>
          </Card>

          {/* Thông tin tổ chức */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Thông tin tổ chức</h2>
              <div className="flex items-center text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên tổ chức
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.organizationInfo.name}
                  onChange={handleOrganizationChange}
                  placeholder="Tên công ty/tổ chức"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Địa chỉ tổ chức
                </label>
                <SimpleAddressMap
                  value={formData.organizationInfo.address}
                  onChange={handleOrganizationAddressChange}
                  placeholder="Nhập địa chỉ tổ chức hoặc click trên bản đồ để chọn vị trí"
                  height="200px"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Điện thoại tổ chức
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.organizationInfo.phone}
                    onChange={handleOrganizationChange}
                    placeholder="Số điện thoại"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email tổ chức
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.organizationInfo.email}
                    onChange={handleOrganizationChange}
                    placeholder="Email công ty"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mt-4 p-4 rounded-md ${
            message.includes('thành công') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Change Password */}
        <Card className="p-6 mt-6 max-w-3xl">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Đổi mật khẩu</h2>
          <form onSubmit={handlePwdChange} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="password"
              placeholder="Mật khẩu hiện tại"
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              value={pwdForm.newPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              value={pwdForm.confirmPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
            <div className="md:col-span-3 flex items-center gap-3">
              <Button type="submit" disabled={pwdLoading} variant="secondary">
                {pwdLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
              </Button>
              {pwdMessage && (
                <span className="text-sm text-gray-600">{pwdMessage}</span>
              )}
            </div>
          </form>
        </Card>
      </div>
    </div>

    {/* Avatar Cropper Modal */}
    {avatarModalOpen && avatarSrc && (
      <AvatarCropper
        src={avatarSrc}
        onClose={() => { setAvatarModalOpen(false); setAvatarSrc(null); }}
        onSave={onSaveCroppedAvatar}
      />
    )}
    </>
  );
};

export default Profile;