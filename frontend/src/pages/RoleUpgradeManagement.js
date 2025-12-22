import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Users,
  Heart,
  FileText,
  Download,
  Eye,
  User,
  Mail,
  Phone,
  MapPin,
  FileCheck,
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { roleUpgradeAPI } from '../utils/api';
import toast from 'react-hot-toast';
import api from '../utils/api';

const RoleUpgradeManagement = () => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processingRequestId, setProcessingRequestId] = useState(null);

  useEffect(() => {
    if (!hasRole('admin')) {
      toast.error('Chỉ admin mới có quyền truy cập');
    }
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await roleUpgradeAPI.getAllRequests(statusFilter || undefined);
      if (response.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách yêu cầu');
      console.error('Load requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (request) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  const handleApprove = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setShowApproveModal(true);
  };

  const handleReject = (request) => {
    setSelectedRequest(request);
    setAdminNotes('');
    setShowRejectModal(true);
  };

  const onApprove = async () => {
    if (!selectedRequest) return;

    // Đảm bảo ID là string hợp lệ - xử lý cả trường hợp _id là object (ObjectId)
    let requestId = selectedRequest._id || selectedRequest.id;
    if (!requestId) {
      toast.error('ID yêu cầu không hợp lệ');
      console.error('Invalid request ID:', selectedRequest);
      return;
    }
    
    // Chuyển đổi object thành string nếu cần
    if (typeof requestId === 'object' && requestId !== null) {
      console.log('Request ID is object, attempting conversion:', requestId);
      console.log('Object keys:', Object.keys(requestId));
      
      // Kiểm tra xem có phải là char array không (object với keys là số: { '0': '6', '1': '7', ... })
      const keys = Object.keys(requestId);
      if (keys.length > 0 && keys.every(key => /^\d+$/.test(key))) {
        // Object có dạng { '0': '6', '1': '9', ... } - char array
        const normalized = keys
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => requestId[key])
          .join('');
        if (normalized && normalized.length === 24) { // MongoDB ObjectId có 24 ký tự
          requestId = normalized;
          console.log('Converted from char array to string:', requestId);
        }
      } else {
        // Thử các cách khác nhau để lấy string ID
        if (typeof requestId.toString === 'function') {
          const stringId = requestId.toString();
          // Kiểm tra xem toString có trả về [object Object] không
          if (stringId && stringId !== '[object Object]' && stringId !== 'null' && stringId !== 'undefined') {
            requestId = stringId;
            console.log('Converted using toString():', requestId);
          } else {
            // Thử valueOf
            if (typeof requestId.valueOf === 'function') {
              const valueId = requestId.valueOf();
              if (valueId && typeof valueId === 'string') {
                requestId = valueId;
                console.log('Converted using valueOf():', requestId);
              } else if (valueId && typeof valueId === 'object' && valueId.toString) {
                requestId = valueId.toString();
                console.log('Converted using valueOf().toString():', requestId);
              }
            }
            
            // Thử các thuộc tính phổ biến
            if (requestId.$oid) {
              requestId = requestId.$oid;
              console.log('Converted using $oid:', requestId);
            } else if (requestId.id) {
              requestId = requestId.id;
              console.log('Converted using .id:', requestId);
            } else if (requestId._id) {
              requestId = requestId._id;
              console.log('Converted using ._id:', requestId);
            } else if (requestId.str) {
              requestId = requestId.str;
              console.log('Converted using .str:', requestId);
            } else {
              toast.error('ID yêu cầu không hợp lệ - không thể chuyển đổi object thành string');
              console.error('Invalid request ID object structure:', requestId);
              return;
            }
          }
        } else if (requestId.$oid) {
          // MongoDB extended JSON format
          requestId = requestId.$oid;
          console.log('Converted using $oid:', requestId);
        } else {
          toast.error('ID yêu cầu không hợp lệ');
          console.error('Invalid request ID object:', requestId);
          return;
        }
      }
    }
    
    // Đảm bảo cuối cùng là string
    requestId = String(requestId);
    if (!requestId || requestId === 'undefined' || requestId === 'null' || requestId === '[object Object]') {
      toast.error('ID yêu cầu không hợp lệ');
      console.error('Invalid request ID after conversion:', requestId);
      console.error('Original selectedRequest:', selectedRequest);
      return;
    }
    
    console.log('Final request ID:', requestId);

    try {
      setProcessingRequestId(requestId);
      const response = await roleUpgradeAPI.approveRequest(
        requestId,
        adminNotes || undefined
      );

      if (response.success) {
        toast.success('Yêu cầu đã được duyệt thành công!');
        setShowApproveModal(false);
        setSelectedRequest(null);
        setAdminNotes('');
        loadRequests();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi duyệt yêu cầu');
    } finally {
      setProcessingRequestId(null);
    }
  };

  const onReject = async () => {
    if (!selectedRequest) return;

    if (!adminNotes || adminNotes.trim().length === 0) {
      toast.error('Vui lòng nhập lý do từ chối');
      return;
    }

    // Đảm bảo ID là string hợp lệ - xử lý cả trường hợp _id là object (ObjectId)
    let requestId = selectedRequest._id || selectedRequest.id;
    if (!requestId) {
      toast.error('ID yêu cầu không hợp lệ');
      console.error('Invalid request ID:', selectedRequest);
      return;
    }
    
    // Chuyển đổi object thành string nếu cần
    if (typeof requestId === 'object' && requestId !== null) {
      console.log('Request ID is object, attempting conversion:', requestId);
      console.log('Object keys:', Object.keys(requestId));
      
      // Kiểm tra xem có phải là char array không (object với keys là số: { '0': '6', '1': '7', ... })
      const keys = Object.keys(requestId);
      if (keys.length > 0 && keys.every(key => /^\d+$/.test(key))) {
        // Object có dạng { '0': '6', '1': '9', ... } - char array
        const normalized = keys
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => requestId[key])
          .join('');
        if (normalized && normalized.length === 24) { // MongoDB ObjectId có 24 ký tự
          requestId = normalized;
          console.log('Converted from char array to string:', requestId);
        }
      } else {
        // Thử các cách khác nhau để lấy string ID
        if (typeof requestId.toString === 'function') {
          const stringId = requestId.toString();
          // Kiểm tra xem toString có trả về [object Object] không
          if (stringId && stringId !== '[object Object]' && stringId !== 'null' && stringId !== 'undefined') {
            requestId = stringId;
            console.log('Converted using toString():', requestId);
          } else {
            // Thử valueOf
            if (typeof requestId.valueOf === 'function') {
              const valueId = requestId.valueOf();
              if (valueId && typeof valueId === 'string') {
                requestId = valueId;
                console.log('Converted using valueOf():', requestId);
              } else if (valueId && typeof valueId === 'object' && valueId.toString) {
                requestId = valueId.toString();
                console.log('Converted using valueOf().toString():', requestId);
              }
            }
            
            // Thử các thuộc tính phổ biến
            if (requestId.$oid) {
              requestId = requestId.$oid;
              console.log('Converted using $oid:', requestId);
            } else if (requestId.id) {
              requestId = requestId.id;
              console.log('Converted using .id:', requestId);
            } else if (requestId._id) {
              requestId = requestId._id;
              console.log('Converted using ._id:', requestId);
            } else if (requestId.str) {
              requestId = requestId.str;
              console.log('Converted using .str:', requestId);
            } else {
              toast.error('ID yêu cầu không hợp lệ - không thể chuyển đổi object thành string');
              console.error('Invalid request ID object structure:', requestId);
              return;
            }
          }
        } else if (requestId.$oid) {
          // MongoDB extended JSON format
          requestId = requestId.$oid;
          console.log('Converted using $oid:', requestId);
        } else {
          toast.error('ID yêu cầu không hợp lệ');
          console.error('Invalid request ID object:', requestId);
          return;
        }
      }
    }
    
    // Đảm bảo cuối cùng là string
    requestId = String(requestId);
    if (!requestId || requestId === 'undefined' || requestId === 'null' || requestId === '[object Object]') {
      toast.error('ID yêu cầu không hợp lệ');
      console.error('Invalid request ID after conversion:', requestId);
      console.error('Original selectedRequest:', selectedRequest);
      return;
    }
    
    console.log('Final request ID:', requestId);

    try {
      setProcessingRequestId(requestId);
      const response = await roleUpgradeAPI.rejectRequest(
        requestId,
        adminNotes
      );

      if (response.success) {
        toast.success('Yêu cầu đã bị từ chối');
        setShowRejectModal(false);
        setSelectedRequest(null);
        setAdminNotes('');
        loadRequests();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi từ chối yêu cầu');
    } finally {
      setProcessingRequestId(null);
    }
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
      hospital: 'Bệnh viện',
      patient: 'Bệnh nhân'
    };
    return names[role] || role;
  };

  const getRoleIcon = (role) => {
    const icons = {
      manufacturer: Building2,
      distributor: Users,
      hospital: Heart,
      patient: User
    };
    return icons[role] || Building2;
  };

  if (!hasRole('admin')) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-12">
          <Shield className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không có quyền truy cập
          </h3>
          <p className="text-gray-500">
            Chỉ admin mới có quyền quản lý yêu cầu nâng cấp role.
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Quản lý yêu cầu nâng cấp role
            </h1>
            <p className="text-gray-500 mt-1">
              Xem và xử lý các yêu cầu nâng cấp role từ bệnh nhân
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
              <Clock className="w-5 h-5" />
              <span className="font-medium">{pendingCount} yêu cầu đang chờ</span>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Đang chờ</option>
            <option value="approved">Đã duyệt</option>
            <option value="rejected">Đã từ chối</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-500">Đang tải...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500">Chưa có yêu cầu nào</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {requests.map((request) => {
              const RoleIcon = getRoleIcon(request.requestedRole);
              const UserIcon = getRoleIcon(request.currentRole);
              return (
                <div
                  key={request._id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-600">→</span>
                          <RoleIcon className="w-5 h-5 text-indigo-600" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {request.requestedBy?.fullName || request.requestedBy?.username || 'N/A'}
                        </h3>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                        <div>
                          <span className="font-medium">Email:</span>{' '}
                          {request.requestedBy?.email || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Yêu cầu nâng cấp:</span>{' '}
                          {getRoleDisplayName(request.currentRole)} → {getRoleDisplayName(request.requestedRole)}
                        </div>
                        <div>
                          <span className="font-medium">Ngày gửi:</span>{' '}
                          {new Date(request.createdAt).toLocaleString('vi-VN')}
                        </div>
                        {request.reviewedAt && (
                          <div>
                            <span className="font-medium">Ngày xử lý:</span>{' '}
                            {new Date(request.reviewedAt).toLocaleString('vi-VN')}
                          </div>
                        )}
                      </div>

                      {request.reason && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">Lý do:</p>
                          <p className="text-sm text-gray-600">{request.reason}</p>
                        </div>
                      )}

                      {request.documents && request.documents.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Tài liệu đính kèm ({request.documents.length}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {request.documents.map((doc, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-md text-sm"
                              >
                                <FileText className="w-4 h-4 text-gray-500" />
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

                      {request.status === 'pending' && (
                        <div className="flex items-center gap-3 mt-4">
                          <button
                            onClick={() => handleViewDetail(request)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleApprove(request)}
                            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Duyệt
                          </button>
                          <button
                            onClick={() => handleReject(request)}
                            className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Từ chối
                          </button>
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

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Chi tiết yêu cầu</h2>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedRequest(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Info */}
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Thông tin người yêu cầu</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Tên:</span>{' '}
                      <span className="text-gray-900">{selectedRequest.requestedBy?.fullName || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email:</span>{' '}
                      <span className="text-gray-900">{selectedRequest.requestedBy?.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Vai trò hiện tại:</span>{' '}
                      <span className="text-gray-900">{getRoleDisplayName(selectedRequest.currentRole)}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Vai trò yêu cầu:</span>{' '}
                      <span className="text-gray-900">{getRoleDisplayName(selectedRequest.requestedRole)}</span>
                    </div>
                  </div>
                </div>

                {/* Additional Info */}
                {selectedRequest.additionalInfo && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Thông tin tổ chức</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {selectedRequest.additionalInfo.organizationName && (
                        <div>
                          <span className="font-medium text-gray-700">Tên tổ chức:</span>{' '}
                          <span className="text-gray-900">{selectedRequest.additionalInfo.organizationName}</span>
                        </div>
                      )}
                      {selectedRequest.additionalInfo.organizationAddress && (
                        <div>
                          <span className="font-medium text-gray-700">Địa chỉ:</span>{' '}
                          <span className="text-gray-900">{selectedRequest.additionalInfo.organizationAddress}</span>
                        </div>
                      )}
                      {selectedRequest.additionalInfo.organizationPhone && (
                        <div>
                          <span className="font-medium text-gray-700">Số điện thoại:</span>{' '}
                          <span className="text-gray-900">{selectedRequest.additionalInfo.organizationPhone}</span>
                        </div>
                      )}
                      {selectedRequest.additionalInfo.organizationEmail && (
                        <div>
                          <span className="font-medium text-gray-700">Email:</span>{' '}
                          <span className="text-gray-900">{selectedRequest.additionalInfo.organizationEmail}</span>
                        </div>
                      )}
                      {selectedRequest.additionalInfo.businessLicense && (
                        <div>
                          <span className="font-medium text-gray-700">Giấy phép kinh doanh:</span>{' '}
                          <span className="text-gray-900">{selectedRequest.additionalInfo.businessLicense}</span>
                        </div>
                      )}
                      {selectedRequest.additionalInfo.taxCode && (
                        <div>
                          <span className="font-medium text-gray-700">Mã số thuế:</span>{' '}
                          <span className="text-gray-900">{selectedRequest.additionalInfo.taxCode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reason */}
                {selectedRequest.reason && (
                  <div className="border-b pb-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Lý do yêu cầu</h3>
                    <p className="text-gray-700">{selectedRequest.reason}</p>
                  </div>
                )}

                {/* Documents */}
                {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">Tài liệu đính kèm</h3>
                    <div className="space-y-2">
                      {selectedRequest.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.originalName}</p>
                              <p className="text-xs text-gray-500">
                                {(doc.size / 1024 / 1024).toFixed(2)} MB • {doc.mimeType}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => viewDocument(doc, selectedRequest._id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                              title="Xem"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => downloadDocument(doc, selectedRequest._id)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-md"
                              title="Tải xuống"
                            >
                              <Download className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Duyệt yêu cầu</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ghi chú (tùy chọn)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nhập ghi chú nếu có..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowApproveModal(false);
                    setAdminNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={onApprove}
                  disabled={processingRequestId === selectedRequest._id}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {processingRequestId === selectedRequest._id ? 'Đang xử lý...' : 'Xác nhận duyệt'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Từ chối yêu cầu</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nhập lý do từ chối..."
                  required
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setAdminNotes('');
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={onReject}
                  disabled={processingRequestId === selectedRequest._id}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {processingRequestId === selectedRequest._id ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleUpgradeManagement;

