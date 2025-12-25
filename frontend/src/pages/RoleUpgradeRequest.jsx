import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import {
  ArrowUp,
  Upload,
  File,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  Users,
  Heart,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { roleUpgradeAPI } from '../utils/api';
import toast from 'react-hot-toast';
import api from '../utils/api';

const RoleUpgradeRequest = () => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();

  const requestedRole = watch('requestedRole');

  useEffect(() => {
    if (user && user.role !== 'patient') {
      toast.error('Chỉ bệnh nhân mới có thể yêu cầu nâng cấp role');
    }
    loadMyRequests();
  }, [user]);

  const loadMyRequests = async () => {
    try {
      const response = await roleUpgradeAPI.getMyRequests();
      if (response.success) {
        setMyRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate files
    const validFiles = [];
    const errors = [];
    
    files.forEach(file => {
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        errors.push(`${file.name}: Chỉ cho phép file PDF, JPG, JPEG hoặc PNG`);
        return;
      }
      
      // Check file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File quá lớn (tối đa 10MB)`);
        return;
      }
      
      validFiles.push(file);
    });
    
    // Check max files (5)
    if (selectedFiles.length + validFiles.length > 5) {
      toast.error('Chỉ được upload tối đa 5 file');
      return;
    }
    
    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
    }
    
    setSelectedFiles([...selectedFiles, ...validFiles]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: {
        icon: Clock,
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Đang chờ'
      },
      approved: {
        icon: CheckCircle,
        color: 'bg-green-100 text-green-800',
        text: 'Đã duyệt'
      },
      rejected: {
        icon: XCircle,
        color: 'bg-red-100 text-red-800',
        text: 'Đã từ chối'
      },
      cancelled: {
        icon: XCircle,
        color: 'bg-gray-100 text-gray-800',
        text: 'Đã hủy'
      }
    };
    
    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getRoleDisplayName = (role) => {
    const names = {
      manufacturer: 'Nhà sản xuất',
      distributor: 'Nhà phân phối',
      hospital: 'Bệnh viện'
    };
    return names[role] || role;
  };

  const getRoleIcon = (role) => {
    const icons = {
      manufacturer: Building2,
      distributor: Users,
      hospital: Heart
    };
    return icons[role] || Building2;
  };

  const downloadDocument = async (document, requestId) => {
    try {
      const response = await api.get(`/role-upgrade/documents/${requestId}/${document.filename}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Lỗi khi tải tài liệu');
    }
  };

  const viewDocument = (document, requestId) => {
    const url = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/role-upgrade/documents/${requestId}/${document.filename}`;
    window.open(url, '_blank');
  };

  const onSubmit = async (data) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error('Vui lòng upload ít nhất 1 tài liệu');
      return;
    }

    try {
      setLoading(true);
      
      const formData = new FormData();
      formData.append('requestedRole', data.requestedRole);
      if (data.reason) {
        formData.append('reason', data.reason);
      }
      
      // Thêm additionalInfo
      const additionalInfo = {
        organizationName: data.organizationName || '',
        organizationAddress: data.organizationAddress || '',
        organizationPhone: data.organizationPhone || '',
        organizationEmail: data.organizationEmail || '',
        businessLicense: data.businessLicense || '',
        taxCode: data.taxCode || ''
      };
      formData.append('additionalInfo', JSON.stringify(additionalInfo));
      
      // Thêm files
      selectedFiles.forEach((file) => {
        formData.append('documents', file);
      });
      
      const response = await roleUpgradeAPI.createRequest(formData);
      
      if (response.success) {
        toast.success('Yêu cầu nâng cấp role đã được gửi thành công!');
        reset();
        setSelectedFiles([]);
        loadMyRequests();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi gửi yêu cầu');
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.role !== 'patient') {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không có quyền truy cập
          </h3>
          <p className="text-gray-500">
            Chỉ bệnh nhân mới có thể yêu cầu nâng cấp role.
          </p>
        </div>
      </div>
    );
  }

  // Kiểm tra có yêu cầu pending không
  const hasPendingRequest = myRequests.some(req => req.status === 'pending');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Yêu cầu nâng cấp role
            </h1>
            <p className="text-gray-500 mt-1">
              Gửi yêu cầu nâng cấp role để trở thành nhà sản xuất, nhà phân phối hoặc bệnh viện
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      {!hasPendingRequest ? (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Tạo yêu cầu mới
          </h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Requested Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vai trò yêu cầu <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['manufacturer', 'distributor', 'hospital'].map((role) => {
                  const Icon = getRoleIcon(role);
                  const isSelected = requestedRole === role;
                  return (
                    <label
                      key={role}
                      className={`relative flex flex-col items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        value={role}
                        {...register('requestedRole', {
                          required: 'Vui lòng chọn vai trò yêu cầu'
                        })}
                        className="sr-only"
                      />
                      <Icon className={`w-8 h-8 mb-2 ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`} />
                      <span className={`font-medium ${isSelected ? 'text-indigo-900' : 'text-gray-700'}`}>
                        {getRoleDisplayName(role)}
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.requestedRole && (
                <p className="mt-1 text-sm text-red-600">{errors.requestedRole.message}</p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lý do yêu cầu <span className="text-gray-500 text-xs">(tùy chọn)</span>
              </label>
              <textarea
                {...register('reason', {
                  maxLength: {
                    value: 500,
                    message: 'Lý do không được quá 500 ký tự'
                  }
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nhập lý do bạn muốn nâng cấp role..."
              />
              {errors.reason && (
                <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
              )}
            </div>

            {/* Additional Info - chỉ hiển thị khi đã chọn role */}
            {requestedRole && (
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Thông tin tổ chức
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên tổ chức
                    </label>
                    <input
                      type="text"
                      {...register('organizationName')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Nhập tên tổ chức"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Địa chỉ tổ chức
                    </label>
                    <input
                      type="text"
                      {...register('organizationAddress')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Nhập địa chỉ tổ chức"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Số điện thoại
                    </label>
                    <input
                      type="tel"
                      {...register('organizationPhone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Nhập số điện thoại"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email tổ chức
                    </label>
                    <input
                      type="email"
                      {...register('organizationEmail')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Nhập email tổ chức"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Giấy phép kinh doanh
                    </label>
                    <input
                      type="text"
                      {...register('businessLicense')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Nhập số giấy phép kinh doanh"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mã số thuế
                    </label>
                    <input
                      type="text"
                      {...register('taxCode')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Nhập mã số thuế"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Documents Upload */}
            <div className="border-t pt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tài liệu đính kèm <span className="text-red-500">*</span>
                <span className="text-gray-500 text-xs font-normal ml-2">
                  (PDF, JPG, PNG - Tối đa 5 file, mỗi file 10MB)
                </span>
              </label>
              
              <div className="mt-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Chọn tài liệu
                </button>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || selectedFiles.length === 0}
                className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <ArrowUp className="w-4 h-4 mr-2" />
                    Gửi yêu cầu
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-yellow-600 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Bạn đã có yêu cầu đang chờ xử lý
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Vui lòng chờ kết quả xử lý yêu cầu hiện tại trước khi tạo yêu cầu mới.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* My Requests History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Lịch sử yêu cầu
        </h2>
        
        {myRequests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Chưa có yêu cầu nào</p>
          </div>
        ) : (
          <div className="space-y-4">
            {myRequests.map((request) => {
              const RoleIcon = getRoleIcon(request.requestedRole);
              return (
                <div
                  key={request._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <RoleIcon className="w-5 h-5 text-indigo-600" />
                        <h3 className="text-lg font-medium text-gray-900">
                          Yêu cầu nâng cấp lên {getRoleDisplayName(request.requestedRole)}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Từ:</span> {request.currentRole}
                        </p>
                        <p>
                          <span className="font-medium">Ngày gửi:</span>{' '}
                          {new Date(request.createdAt).toLocaleString('vi-VN')}
                        </p>
                        {request.reason && (
                          <p>
                            <span className="font-medium">Lý do:</span> {request.reason}
                          </p>
                        )}
                        {request.adminNotes && (
                          <p>
                            <span className="font-medium">Ghi chú từ admin:</span>{' '}
                            {request.adminNotes}
                          </p>
                        )}
                        {request.reviewedAt && (
                          <p>
                            <span className="font-medium">Ngày xử lý:</span>{' '}
                            {new Date(request.reviewedAt).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </div>

                      {request.documents && request.documents.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Tài liệu đính kèm:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {request.documents.map((doc, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md text-sm"
                              >
                                <File className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-700">{doc.originalName}</span>
                                <button
                                  onClick={() => viewDocument(doc, request._id)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                  title="Xem"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => downloadDocument(doc, request._id)}
                                  className="text-indigo-600 hover:text-indigo-800"
                                  title="Tải xuống"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoleUpgradeRequest;

