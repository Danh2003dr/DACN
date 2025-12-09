import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Lock,
  Unlock,
  RefreshCw,
  Eye,
  UserPlus
} from 'lucide-react';
import { userAPI, authAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

// Component form để tạo/chỉnh sửa user
const CreateEditUserForm = ({ user, onSubmit, isLoading, onCancel, isEdit }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    defaultValues: user ? {
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      role: user.role || '',
      organizationId: user.organizationId || '',
      patientId: user.patientId || '',
      address: (() => {
        // Parse address string thành object nếu cần
        if (typeof user.address === 'string' && user.address.trim()) {
          // Thử parse từ string (format có thể là "street, ward, district, city")
          const parts = user.address.split(',').map(p => p.trim());
          return {
            street: parts[0] || '',
            ward: parts[1] || '',
            district: parts[2] || '',
            city: parts[3] || ''
          };
        } else if (typeof user.address === 'object' && user.address) {
          return {
            street: user.address.street || '',
            ward: user.address.ward || '',
            district: user.address.district || '',
            city: user.address.city || ''
          };
        }
        return { street: '', ward: '', district: '', city: '' };
      })(),
      organizationInfo: {
        name: user.organizationInfo?.name || '',
        address: user.organizationInfo?.address || '',
        phone: user.organizationInfo?.phone || '',
        email: user.organizationInfo?.email || ''
      },
      isActive: user.isActive !== undefined ? user.isActive : true
    } : {
      fullName: '',
      username: '',
      email: '',
      password: '',
      phone: '',
      role: '',
      organizationId: '',
      patientId: '',
      address: {
        street: '',
        ward: '',
        district: '',
        city: ''
      },
      organizationInfo: {
        name: '',
        address: '',
        phone: '',
        email: ''
      }
    }
  });

  const selectedRole = watch('role');
  
  // Kiểm tra xem user có đăng nhập bằng Firebase/Google không (không cần patientId)
  const isOAuthUser = user && (user.firebaseUid || user.googleId || user.authProvider === 'firebase' || user.authProvider === 'google');

  const onFormSubmit = (data) => {
    if (isEdit) {
      // Chỉ gửi các trường có thể cập nhật
      const updateData = {
        fullName: data.fullName,
        phone: data.phone || null
      };
      
      // Chuyển đổi address object thành string
      if (data.address) {
        const addressParts = [
          data.address.street,
          data.address.ward,
          data.address.district,
          data.address.city
        ].filter(Boolean);
        updateData.address = addressParts.length > 0 ? addressParts.join(', ') : null;
      }
      
      // Chỉ gửi organizationInfo nếu có giá trị và user có role cần organizationInfo
      // Backend mong đợi: {name, address, phone, email} - không có license và type
      if (data.organizationInfo && (selectedRole === 'manufacturer' || selectedRole === 'distributor' || selectedRole === 'hospital')) {
        const orgInfo = {};
        if (data.organizationInfo.name && data.organizationInfo.name.trim()) orgInfo.name = data.organizationInfo.name.trim();
        if (data.organizationInfo.address && data.organizationInfo.address.trim()) orgInfo.address = data.organizationInfo.address.trim();
        if (data.organizationInfo.phone && data.organizationInfo.phone.trim()) orgInfo.phone = data.organizationInfo.phone.trim();
        if (data.organizationInfo.email && data.organizationInfo.email.trim()) orgInfo.email = data.organizationInfo.email.trim().toLowerCase();
        
        // Chỉ gửi nếu có ít nhất một field có giá trị
        if (Object.keys(orgInfo).length > 0) {
          updateData.organizationInfo = orgInfo;
        }
      }
      
      // Chỉ gửi isActive nếu user hiện tại là admin
      // Backend sẽ kiểm tra lại, nhưng tốt nhất là không gửi nếu không phải admin
      // (Chúng ta sẽ kiểm tra ở component cha vì form component không có access đến currentUser)
      
      onSubmit(updateData);
    } else {
      // Gửi toàn bộ dữ liệu để tạo mới
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Thông tin cơ bản */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Họ và tên <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('fullName', { required: 'Vui lòng nhập họ và tên' })}
            className={`form-input ${errors.fullName ? 'border-red-500' : ''}`}
            placeholder="Nhập họ và tên"
          />
          {errors.fullName && (
            <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
          )}
        </div>

        {!isEdit && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register('username', { 
                  required: 'Vui lòng nhập tên đăng nhập',
                  pattern: {
                    value: /^[a-zA-Z0-9]+$/,
                    message: 'Tên đăng nhập chỉ được chứa chữ cái và số'
                  },
                  minLength: {
                    value: 3,
                    message: 'Tên đăng nhập phải có ít nhất 3 ký tự'
                  }
                })}
                className={`form-input ${errors.username ? 'border-red-500' : ''}`}
                placeholder="Nhập tên đăng nhập"
              />
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register('email', { 
                  required: 'Vui lòng nhập email',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Email không hợp lệ'
                  }
                })}
                className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Nhập email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                {...register('password', { 
                  required: 'Vui lòng nhập mật khẩu',
                  minLength: {
                    value: 6,
                    message: 'Mật khẩu phải có ít nhất 6 ký tự'
                  }
                })}
                className={`form-input ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Nhập mật khẩu"
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Số điện thoại <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            {...register('phone', { 
              required: 'Vui lòng nhập số điện thoại',
              pattern: {
                value: /^[0-9]{10,11}$/,
                message: 'Số điện thoại phải có 10-11 chữ số'
              }
            })}
            className={`form-input ${errors.phone ? 'border-red-500' : ''}`}
            placeholder="Nhập số điện thoại"
          />
          {errors.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vai trò <span className="text-red-500">*</span>
          </label>
          <select
            {...register('role', { required: 'Vui lòng chọn vai trò' })}
            className={`form-input ${errors.role ? 'border-red-500' : ''}`}
            disabled={isEdit}
          >
            <option value="">Chọn vai trò</option>
            <option value="admin">Quản trị viên</option>
            <option value="manufacturer">Nhà sản xuất</option>
            <option value="distributor">Nhà phân phối</option>
            <option value="hospital">Bệnh viện</option>
            <option value="patient">Bệnh nhân</option>
          </select>
          {errors.role && (
            <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
          )}
        </div>
      </div>

      {/* Mã tổ chức/Bệnh nhân */}
      {(selectedRole === 'manufacturer' || selectedRole === 'distributor' || selectedRole === 'hospital') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mã tổ chức <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            {...register('organizationId', { 
              required: selectedRole && ['manufacturer', 'distributor', 'hospital'].includes(selectedRole) ? 'Vui lòng nhập mã tổ chức' : false
            })}
            className={`form-input ${errors.organizationId ? 'border-red-500' : ''}`}
            placeholder="Nhập mã tổ chức"
            disabled={isEdit}
          />
          {errors.organizationId && (
            <p className="text-red-500 text-xs mt-1">{errors.organizationId.message}</p>
          )}
        </div>
      )}

      {selectedRole === 'patient' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Mã bệnh nhân {!isOAuthUser && <span className="text-red-500">*</span>}
          </label>
          <input
            type="text"
            {...register('patientId', { 
              required: selectedRole === 'patient' && !isOAuthUser ? 'Vui lòng nhập mã bệnh nhân' : false
            })}
            className={`form-input ${errors.patientId ? 'border-red-500' : ''}`}
            placeholder={isOAuthUser ? "Mã bệnh nhân (tùy chọn cho tài khoản OAuth)" : "Nhập mã bệnh nhân"}
            disabled={isEdit}
          />
          {isOAuthUser && (
            <p className="text-xs text-gray-500 mt-1">
              Tài khoản đăng nhập bằng Firebase/Google không bắt buộc mã bệnh nhân
            </p>
          )}
          {errors.patientId && (
            <p className="text-red-500 text-xs mt-1">{errors.patientId.message}</p>
          )}
        </div>
      )}

      {/* Địa chỉ */}
      <div className="border-t pt-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Đường/Phố <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('address.street', { required: 'Vui lòng nhập đường/phố' })}
              className={`form-input ${errors.address?.street ? 'border-red-500' : ''}`}
              placeholder="Nhập đường/phố"
            />
            {errors.address?.street && (
              <p className="text-red-500 text-xs mt-1">{errors.address.street.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phường/Xã <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('address.ward', { required: 'Vui lòng nhập phường/xã' })}
              className={`form-input ${errors.address?.ward ? 'border-red-500' : ''}`}
              placeholder="Nhập phường/xã"
            />
            {errors.address?.ward && (
              <p className="text-red-500 text-xs mt-1">{errors.address.ward.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quận/Huyện <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('address.district', { required: 'Vui lòng nhập quận/huyện' })}
              className={`form-input ${errors.address?.district ? 'border-red-500' : ''}`}
              placeholder="Nhập quận/huyện"
            />
            {errors.address?.district && (
              <p className="text-red-500 text-xs mt-1">{errors.address.district.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thành phố <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('address.city', { required: 'Vui lòng nhập thành phố' })}
              className={`form-input ${errors.address?.city ? 'border-red-500' : ''}`}
              placeholder="Nhập thành phố"
            />
            {errors.address?.city && (
              <p className="text-red-500 text-xs mt-1">{errors.address.city.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Thông tin tổ chức */}
      {(selectedRole === 'manufacturer' || selectedRole === 'distributor' || selectedRole === 'hospital') && (
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Thông tin tổ chức</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên tổ chức
              </label>
              <input
                type="text"
                {...register('organizationInfo.name')}
                className="form-input"
                placeholder="Nhập tên tổ chức"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Địa chỉ tổ chức
              </label>
              <input
                type="text"
                {...register('organizationInfo.address')}
                className="form-input"
                placeholder="Nhập địa chỉ tổ chức"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại tổ chức
              </label>
              <input
                type="text"
                {...register('organizationInfo.phone')}
                className="form-input"
                placeholder="Nhập số điện thoại tổ chức"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email tổ chức
              </label>
              <input
                type="email"
                {...register('organizationInfo.email')}
                className="form-input"
                placeholder="Nhập email tổ chức"
              />
            </div>
          </div>
        </div>
      )}

      {/* Trạng thái (chỉ khi edit) */}
      {isEdit && (
        <div className="border-t pt-6">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              {...register('isActive')}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Tài khoản hoạt động
            </label>
          </div>
        </div>
      )}

      {/* Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="flex items-center">
              <div className="spinner w-4 h-4 mr-2"></div>
              Đang {isEdit ? 'cập nhật' : 'tạo'}...
            </div>
          ) : (
            isEdit ? 'Cập nhật' : 'Tạo mới'
          )}
        </button>
      </div>
    </form>
  );
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const queryClient = useQueryClient();

  // Helper function để chuẩn hóa ID - đảm bảo luôn trả về string
  // Xử lý các trường hợp MongoDB ObjectId được serialize thành object
  const normalizeId = (id, fallback = '') => {
    if (!id) return fallback;
    
    // Nếu đã là string hợp lệ
    if (typeof id === 'string') {
      const trimmed = id.trim();
      if (trimmed !== '' && trimmed !== '[object Object]') {
        return trimmed;
      }
    }
    
    // Nếu là object (có thể là MongoDB ObjectId được serialize)
    if (typeof id === 'object' && id !== null) {
      // Trường hợp object có các keys như '0', '1', '2'... (char array - MongoDB ObjectId được serialize)
      if (Object.keys(id).every(key => /^\d+$/.test(key))) {
        const normalized = Object.keys(id)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => id[key])
          .join('');
        if (normalized && normalized.trim() !== '' && normalized !== '[object Object]') {
          return normalized;
        }
      }
      
      // Thử lấy nested _id hoặc id
      if (id._id) {
        const nestedResult = normalizeId(id._id, '');
        if (nestedResult) return nestedResult;
      }
      if (id.id) {
        const idResult = normalizeId(id.id, '');
        if (idResult) return idResult;
      }
      
      // Thử toString() nếu có
      if (id.toString && typeof id.toString === 'function') {
        try {
          const str = id.toString();
          if (str && str.trim() !== '' && str !== '[object Object]') {
            return str;
          }
        } catch (e) {
          // Ignore toString errors
        }
      }
    }
    
    // Cuối cùng, thử convert sang string
    try {
      const str = String(id);
      if (str && str.trim() !== '' && str !== '[object Object]') {
        return str;
      }
    } catch (e) {
      // Ignore conversion errors
    }
    
    return fallback;
  };

  // Helper function để kiểm tra ID có hợp lệ không
  const isValidId = (id) => {
    if (!id) return false;
    const normalized = normalizeId(id);
    return Boolean(normalized && normalized.trim() !== '' && normalized !== '[object Object]');
  };

  // Helper function để tạo unique key - luôn đảm bảo trả về string và unique
  const getUniqueKey = (item, idx) => {
    // Luôn bắt đầu với index để đảm bảo uniqueness ngay từ đầu
    let idPart = '';
    
    // Thử lấy ID từ nhiều nguồn
    if (item._id) {
      if (typeof item._id === 'string' && item._id.trim() !== '' && item._id !== '[object Object]') {
        idPart = item._id;
      } else if (typeof item._id === 'object' && item._id !== null) {
        // Nếu _id là object, lấy nested _id hoặc id
        const nestedId = item._id._id || item._id.id;
        if (nestedId && typeof nestedId === 'string' && nestedId !== '[object Object]') {
          idPart = nestedId;
        }
      }
    }
    
    // Nếu không có ID hợp lệ, tạo từ các giá trị khác
    if (!idPart || idPart === '[object Object]') {
      const email = String(item.email || '');
      const fullName = String(item.fullName || '');
      const createdAt = item.createdAt ? String(new Date(item.createdAt).getTime()) : String(Date.now());
      idPart = `${email}-${fullName}-${createdAt}`;
    }
    
    // Luôn kết hợp index làm phần chính để đảm bảo unique tuyệt đối
    return `user-${idx}-${idPart}`;
  };

  // Fetch users
  const { data: usersData, isLoading, error } = useQuery(
    ['users', { page: currentPage, limit: 10, search: searchTerm, role: selectedRole }],
    () => {
      const params = {
        page: currentPage,
        limit: 10
      };
      
      if (searchTerm && searchTerm.trim() !== '') {
        params.search = searchTerm.trim();
      }
      
      if (selectedRole && selectedRole.trim() !== '') {
        params.role = selectedRole.trim();
      }
      
      return userAPI.getUsers(params);
    },
    {
      keepPreviousData: true,
    }
  );

  // Fetch user stats
  const { data: statsData } = useQuery('userStats', userAPI.getUserStats);

  // Fetch user details when viewing - đảm bảo enabled luôn là boolean
  const isUserDetailsQueryEnabled = Boolean(
    showDetailsModal && selectedUser && isValidId(selectedUser._id)
  );
  
  const { data: userDetails, isLoading: isLoadingDetails } = useQuery(
    ['userDetails', selectedUser?._id],
    async () => {
      if (!selectedUser) {
        return Promise.reject(new Error('User không được chọn'));
      }
      
      // Chuẩn hóa ID trước khi gọi API
      const normalizedId = normalizeId(selectedUser._id);
      
      // Debug log để kiểm tra
      if (!normalizedId || normalizedId.trim() === '' || normalizedId === '[object Object]') {
        console.error('User ID không hợp lệ:', {
          originalId: selectedUser._id,
          type: typeof selectedUser._id,
          normalizedId: normalizedId,
          selectedUser: selectedUser
        });
        return Promise.reject(new Error('User ID không hợp lệ'));
      }
      
      try {
        const result = await userAPI.getUserById(normalizedId);
        return result;
      } catch (error) {
        console.error('API Error loading user details:', {
          normalizedId,
          error: error.response?.data || error.message,
          status: error.response?.status
        });
        throw error;
      }
    },
    {
      enabled: isUserDetailsQueryEnabled,
      retry: false,
      onError: (error) => {
        // Chỉ log lỗi, không hiển thị toast nếu là lỗi validation ID
        if (error.message === 'User ID không hợp lệ' || error.message === 'User không được chọn') {
          console.warn('Bỏ qua query do ID không hợp lệ:', {
            selectedUser,
            error: error.message
          });
          return;
        }
        console.error('Error loading user details:', error);
        const errorMessage = error.response?.data?.message || error.message || 'Không thể tải thông tin user';
        toast.error(errorMessage);
      }
    }
  );

  // Mutations
  const toggleLockMutation = useMutation(userAPI.toggleUserLock, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('Thay đổi trạng thái user thành công!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const deleteUserMutation = useMutation(userAPI.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      setShowDeleteModal(false);
      toast.success('Xóa user thành công!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const createUserMutation = useMutation(authAPI.register, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      queryClient.invalidateQueries('userStats');
      setShowCreateModal(false);
      toast.success('Tạo user thành công!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    }
  });

  const updateUserMutation = useMutation(
    ({ id, userData }) => userAPI.updateUser(id, userData),
    {
      onSuccess: async (response, variables) => {
        // Invalidate các queries để refetch dữ liệu mới
        await Promise.all([
          queryClient.invalidateQueries('users'),
          queryClient.invalidateQueries('userStats'),
          queryClient.invalidateQueries('userDetails')
        ]);
        
        // Cập nhật selectedUser với dữ liệu mới từ response
        if (response?.data?.user && selectedUser) {
          const updatedUser = response.data.user;
          const normalizedId = normalizeId(selectedUser._id);
          const responseId = normalizeId(updatedUser._id || updatedUser.id);
          
          if (normalizedId === responseId) {
            setSelectedUser({
              ...selectedUser,
              ...updatedUser
            });
          }
        }
        
        setShowEditModal(false);
        
        // Refetch userDetails nếu modal chi tiết đang mở
        if (showDetailsModal && selectedUser) {
          const userId = normalizeId(selectedUser._id);
          if (userId) {
            await queryClient.refetchQueries(['userDetails', userId]);
          }
        }
        
        toast.success('Cập nhật user thành công!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
      }
    }
  );

  const handleToggleLock = (userId) => {
    const normalizedId = normalizeId(userId);
    if (!normalizedId || normalizedId.trim() === '' || normalizedId === '[object Object]') {
      toast.error('User ID không hợp lệ');
      return;
    }
    toggleLockMutation.mutate(normalizedId);
  };

  const handleDeleteUser = () => {
    if (selectedUser) {
      const userId = normalizeId(selectedUser.id || selectedUser._id);
      if (userId) {
        deleteUserMutation.mutate(userId);
      } else {
        toast.error('User ID không hợp lệ');
      }
    }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Quản trị viên',
      manufacturer: 'Nhà sản xuất',
      distributor: 'Nhà phân phối',
      hospital: 'Bệnh viện',
      patient: 'Bệnh nhân'
    };
    return roleNames[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'badge-danger',
      manufacturer: 'badge-primary',
      distributor: 'badge-secondary',
      hospital: 'badge-warning',
      patient: 'badge-gray'
    };
    return colors[role] || 'badge-gray';
  };

  // Normalize users data để đảm bảo tất cả _id đều là string hợp lệ
  const normalizeUsersList = (usersList) => {
    if (!Array.isArray(usersList)) return [];
    return usersList.map(user => {
      if (!user || typeof user !== 'object') return user;
      const normalizedId = normalizeId(user._id);
      return {
        ...user,
        _id: normalizedId || user._id
      };
    });
  };

  const rawUsers = usersData?.data?.users || [];
  const users = normalizeUsersList(rawUsers);
  const pagination = usersData?.data?.pagination || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quản lý Users</h1>
            <p className="text-gray-600 mt-1">
              Quản lý tài khoản người dùng trong hệ thống
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Thêm User
          </button>
        </div>
      </div>

      {/* Stats */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">T</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Tổng Users
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsData.data.total}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 font-semibold">A</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Hoạt động
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsData.data.active}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <span className="text-red-600 font-semibold">L</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Bị khóa
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsData.data.locked}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-soft p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">R</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Theo vai trò
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {statsData.data.byRole?.length || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input pl-10"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="form-input"
            >
              <option value="">Tất cả vai trò</option>
              <option value="admin">Quản trị viên</option>
              <option value="manufacturer">Nhà sản xuất</option>
              <option value="distributor">Nhà phân phối</option>
              <option value="hospital">Bệnh viện</option>
              <option value="patient">Bệnh nhân</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">User</th>
                <th className="table-header-cell">Vai trò</th>
                <th className="table-header-cell">Tổ chức</th>
                <th className="table-header-cell">Trạng thái</th>
                <th className="table-header-cell">Ngày tạo</th>
                <th className="table-header-cell">Thao tác</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="table-cell text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="spinner w-6 h-6 mr-2"></div>
                      Đang tải...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="table-cell text-center py-8 text-gray-500">
                    Không có user nào
                  </td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr key={getUniqueKey(user, idx)} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-600 font-medium">
                            {user.fullName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.username} • {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${getRoleBadgeColor(user.role)}`}>
                        {getRoleDisplayName(user.role)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {user.organizationInfo?.name || user.organizationId || user.patientId || '-'}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`status-indicator ${user.isActive ? 'status-active' : 'status-inactive'}`}>
                        {user.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="text-sm text-gray-900">
                        {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            // Đảm bảo user object có _id hợp lệ trước khi set
                            const normalizedUserId = normalizeId(user._id);
                            if (normalizedUserId) {
                              // Tạo một bản copy của user với _id đã được normalize
                              const userWithNormalizedId = {
                                ...user,
                                _id: normalizedUserId
                              };
                              setSelectedUser(userWithNormalizedId);
                              setShowDetailsModal(true);
                            } else {
                              console.error('Không thể normalize user ID:', user._id, user);
                              toast.error('Không thể tải thông tin user: ID không hợp lệ');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditModal(true);
                          }}
                          className="text-primary-600 hover:text-primary-900"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleLock(user._id)}
                          className={`${user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                          title={user.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                        >
                          {user.isActive ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                disabled={currentPage === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Hiển thị{' '}
                  <span className="font-medium">{(currentPage - 1) * pagination.limit + 1}</span>
                  {' '}đến{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * pagination.limit, pagination.total)}
                  </span>
                  {' '}trong tổng số{' '}
                  <span className="font-medium">{pagination.total}</span> kết quả
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === page
                            ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
                    disabled={currentPage === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Chi tiết User
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {isLoadingDetails ? (
                <div className="flex items-center justify-center py-12">
                  <div className="spinner w-8 h-8 mr-3"></div>
                  <span className="text-gray-600">Đang tải thông tin...</span>
                </div>
              ) : userDetails?.data?.user ? (
                <div className="space-y-6">
                  {/* Show user details from API */}
                  {/* Avatar & Basic Info */}
                  <div className="flex items-start space-x-6">
                    <div className="h-24 w-24 rounded-full bg-primary-100 flex items-center justify-center">
                      {userDetails.data.user.avatar ? (
                        <img
                          src={userDetails.data.user.avatar}
                          alt={userDetails.data.user.fullName}
                          className="h-24 w-24 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-primary-600 text-3xl font-bold">
                          {userDetails.data.user.fullName.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-xl font-bold text-gray-900 mb-1">
                        {userDetails.data.user.fullName}
                      </h4>
                      <p className="text-sm text-gray-500 mb-2">
                        {userDetails.data.user.username} • {userDetails.data.user.email}
                      </p>
                      <div className="flex items-center space-x-4">
                        <span className={`badge ${getRoleBadgeColor(userDetails.data.user.role)}`}>
                          {getRoleDisplayName(userDetails.data.user.role)}
                        </span>
                        <span className={`status-indicator ${userDetails.data.user.isActive ? 'status-active' : 'status-inactive'}`}>
                          {userDetails.data.user.isActive ? 'Hoạt động' : 'Bị khóa'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* User Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tên đăng nhập
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {userDetails.data.user.username}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {userDetails.data.user.email}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {userDetails.data.user.phone || '-'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vai trò
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {getRoleDisplayName(userDetails.data.user.role)}
                      </p>
                    </div>
                    {(userDetails.data.user.organizationId || userDetails.data.user.patientId) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          {userDetails.data.user.role === 'patient' ? 'Mã bệnh nhân' : 'Mã tổ chức'}
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {userDetails.data.user.organizationId || userDetails.data.user.patientId}
                        </p>
                      </div>
                    )}
                    {userDetails.data.user.organizationInfo?.name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tên tổ chức
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {userDetails.data.user.organizationInfo.name}
                        </p>
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Địa chỉ
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {(() => {
                          const address = userDetails.data.user.address;
                          if (!address) return '-';
                          if (typeof address === 'string') return address;
                          if (typeof address === 'object') {
                            const parts = [
                              address.street,
                              address.ward,
                              address.district,
                              address.city
                            ].filter(Boolean);
                            return parts.length > 0 ? parts.join(', ') : '-';
                          }
                          return '-';
                        })()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Ngày tạo
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {new Date(userDetails.data.user.createdAt).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Cập nhật lần cuối
                      </label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                        {userDetails.data.user.updatedAt ? new Date(userDetails.data.user.updatedAt).toLocaleString('vi-VN') : '-'}
                      </p>
                    </div>
                    {userDetails.data.user.lastLogin && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Đăng nhập lần cuối
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {new Date(userDetails.data.user.lastLogin).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    )}
                    {userDetails.data.user.organizationInfo?.license && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Số giấy phép
                        </label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                          {userDetails.data.user.organizationInfo.license}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        setShowEditModal(true);
                      }}
                      className="btn btn-primary"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="btn btn-secondary"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : selectedUser ? (
                // Fallback: Hiển thị thông tin từ selectedUser nếu không tải được từ API
                <div className="space-y-6">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-yellow-800">
                      ⚠️ Không thể tải thông tin chi tiết từ server. Đang hiển thị thông tin cơ bản từ danh sách.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Họ và tên</label>
                      <p className="text-gray-900">{selectedUser.fullName || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedUser.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Vai trò</label>
                      <p className="text-gray-900">{getRoleDisplayName(selectedUser.role) || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                      <p className="text-gray-900">{selectedUser.isActive ? 'Hoạt động' : 'Không hoạt động'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Không thể tải thông tin user</p>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Tạo User Mới</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <CreateEditUserForm
                onSubmit={(data) => createUserMutation.mutate(data)}
                isLoading={createUserMutation.isLoading}
                onCancel={() => setShowCreateModal(false)}
                isEdit={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Chỉnh sửa User</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <CreateEditUserForm
                user={selectedUser}
                onSubmit={(data) => {
                  const userId = normalizeId(selectedUser._id || selectedUser.id);
                  if (userId) {
                    // Chỉ gửi isActive nếu user hiện tại là admin
                    const userDataToSend = { ...data };
                    if (currentUser?.role !== 'admin' && 'isActive' in userDataToSend) {
                      delete userDataToSend.isActive;
                    }
                    updateUserMutation.mutate({ id: userId, userData: userDataToSend });
                  } else {
                    toast.error('User ID không hợp lệ');
                  }
                }}
                isLoading={updateUserMutation.isLoading}
                onCancel={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                isEdit={true}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Xác nhận xóa user
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Bạn có chắc chắn muốn xóa user "{selectedUser.fullName}"? 
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={deleteUserMutation.isLoading}
                  className="btn btn-danger"
                >
                  {deleteUserMutation.isLoading ? (
                    <div className="flex items-center">
                      <div className="spinner w-4 h-4 mr-2"></div>
                      Đang xóa...
                    </div>
                  ) : (
                    'Xóa'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
