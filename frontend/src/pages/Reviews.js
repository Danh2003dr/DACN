import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Flag,
  Shield,
  Clock,
  User,
  Search,
  Filter,
  Plus,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Award,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { reviewAPI, drugAPI, userAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Reviews = () => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [selectedReview, setSelectedReview] = useState(null);
  const [selectedReportsReview, setSelectedReportsReview] = useState(null);
  const [reportingReview, setReportingReview] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    targetType: '',
    minRating: '',
    maxRating: '',
    status: '',
    hasReports: '' // 'true' để chỉ lọc review có báo cáo
  });
  const [activeTab, setActiveTab] = useState('public'); // public, my, admin

  const { register, handleSubmit, reset, setValue, trigger, control, formState: { errors } } = useForm();

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value
    }));
    setPagination((prev) => ({
      ...prev,
      current: 1
    }));
  };

  // Helper function để normalize ID (giống như trong Users.js và Drugs.js)
  const normalizeId = (id, fallback = '') => {
    if (!id) return fallback;
    if (typeof id === 'string' && id.trim() !== '' && id !== '[object Object]') return id;
    if (typeof id === 'object' && id !== null) {
      // Handle MongoDB ObjectId serialized as { '0': '6', '1': '9', ... }
      if (Object.keys(id).every(key => /^\d+$/.test(key))) {
        const normalized = Object.keys(id)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => id[key])
          .join('');
        if (normalized.length === 24 && /^[0-9a-fA-F]{24}$/.test(normalized)) {
          return normalized;
        }
      }
      if (id._id) {
        const nestedId = id._id;
        if (typeof nestedId === 'string' && nestedId.trim() !== '' && nestedId !== '[object Object]') {
          return nestedId;
        }
      }
      if (id.id) {
        const idValue = id.id;
        if (typeof idValue === 'string' && idValue.trim() !== '' && idValue !== '[object Object]') {
          return idValue;
        }
      }
      if (id.toString && typeof id.toString === 'function') {
        try {
          const str = id.toString();
          if (str !== '[object Object]' && str.trim() !== '') {
            return str;
          }
        } catch (e) {
          console.error("Error in toString for ID:", id, e);
        }
      }
    }
    try {
      const str = String(id);
      if (str !== '[object Object]' && str.trim() !== '') {
        return str;
      }
    } catch (e) {
      console.error("Error in String(id) for ID:", id, e);
    }
    return fallback;
  };

  // Helper function để tạo unique key cho reviews
  const getUniqueKey = (review, idx) => {
    let idPart = '';
    if (review._id) {
      const normalizedId = normalizeId(review._id);
      if (normalizedId && normalizedId !== '[object Object]') {
        idPart = normalizedId;
      }
    }
    if (!idPart || idPart === '[object Object]') {
      const targetId = String(review.targetId || '');
      const targetType = String(review.targetType || '');
      const createdAt = review.createdAt ? String(new Date(review.createdAt).getTime()) : String(Date.now());
      const title = String(review.title || '');
      idPart = `${targetId}-${targetType}-${createdAt}-${title}`;
    }
    return `review-${idx}-${idPart}`;
  };

  // Load reviews
  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 20,
        ...filters
      });

      let response;
      if (activeTab === 'public') {
        // Hiển thị danh sách đánh giá đã được duyệt (approved)
        response = await reviewAPI.getPublicReviews(params.toString());
        if (response.success) {
          setReviews(response.data.reviews);
          setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
        } else {
          setReviews([]);
          setPagination({ current: 1, pages: 1, total: 0 });
        }
      } else if (activeTab === 'my') {
        // Tab "Đánh giá của tôi" - filter theo user hiện tại
        // Dùng endpoint riêng cho "của tôi" (không cần quyền admin)
        response = await reviewAPI.getMyReviews(params.toString());
        if (response.success) {
          setReviews(response.data.reviews || []);
          setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
        } else {
          setReviews([]);
          setPagination({ current: 1, pages: 1, total: 0 });
        }
      } else {
        // Tab "Quản lý đánh giá" (admin)
        response = await reviewAPI.getReviewsForAdmin(params.toString());
        if (response.success) {
          setReviews(response.data.reviews || []);
          setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
        } else {
          setReviews([]);
          setPagination({ current: 1, pages: 1, total: 0 });
        }
      }
    } catch (error) {
      toast.error('Lỗi khi tải danh sách đánh giá');
      console.error('Load reviews error:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, filters, activeTab, hasRole, user]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  // Create review
  const onCreateReview = async (data) => {
    try {
      setLoading(true);
      
      console.log('📝 Form data before validation:', data);
      
      // Validate trước khi gửi
      if (!data.targetType) {
        toast.error('Vui lòng chọn loại đối tượng');
        setLoading(false);
        return;
      }
      
      if (!data.targetId || data.targetId.trim() === '') {
        toast.error('Vui lòng chọn đối tượng để đánh giá');
        console.error('❌ targetId is missing or empty:', data.targetId);
        setLoading(false);
        return;
      }
      
      if (!data.targetName || data.targetName.trim() === '') {
        toast.error('Tên đối tượng là bắt buộc');
        console.error('❌ targetName is missing or empty:', data.targetName);
        setLoading(false);
        return;
      }
      
      if (!data.overallRating) {
        toast.error('Vui lòng chọn điểm đánh giá');
        setLoading(false);
        return;
      }
      
      const payload = {
        ...data,
        targetId: data.targetId.trim(),
        targetName: data.targetName.trim(),
        overallRating: Number(data.overallRating),
        isAnonymous: data.isAnonymous ?? true,
        reviewType: data.reviewType || 'usage'
      };
      
      console.log('📤 Sending payload:', payload);
      
      const response = await reviewAPI.createReview(payload);
      
      if (response.success) {
        toast.success('Tạo đánh giá thành công');
        setShowCreateModal(false);
        reset();
        // Nếu đang ở tab "Đánh giá của tôi" thì reload ngay; nếu không thì chuyển tab để user thấy review vừa tạo
        if (activeTab === 'my') {
          loadReviews();
        } else {
          setPagination((prev) => ({ ...prev, current: 1 }));
          setActiveTab('my');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tạo đánh giá');
    } finally {
      setLoading(false);
    }
  };

  // Vote helpful
  const voteHelpful = async (id) => {
    try {
      const normalizedId = normalizeId(id);
      if (!normalizedId || normalizedId === '[object Object]') {
        toast.error('ID đánh giá không hợp lệ');
        return;
      }
      const response = await reviewAPI.voteHelpful(normalizedId);
      
      if (response.success) {
        toast.success('Đã vote hữu ích');
        loadReviews();
      }
    } catch (error) {
      toast.error('Lỗi khi vote');
      console.error('Vote error:', error);
    }
  };

  // Report review
  const reportReview = async (id, payloadOrReason) => {
    try {
      const payload =
        typeof payloadOrReason === 'string'
          ? { reason: payloadOrReason }
          : (payloadOrReason || { reason: 'other' });
      const response = await reviewAPI.reportReview(id, payload);
      
      if (response.success) {
        toast.success('Báo cáo thành công');
      }
    } catch (error) {
      toast.error('Lỗi khi báo cáo');
    }
  };

  const getTargetTypeLabel = (type) => {
    const map = {
      drug: 'Thuốc',
      distributor: 'Nhà phân phối',
      hospital: 'Bệnh viện',
      manufacturer: 'Nhà sản xuất'
    };
    return map[type] || type || 'Không rõ';
  };

  const getStatusMeta = (status) => {
    const map = {
      pending: { label: 'Chờ duyệt', cls: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
      approved: { label: 'Đã duyệt', cls: 'bg-green-50 text-green-800 border-green-200' },
      rejected: { label: 'Từ chối', cls: 'bg-red-50 text-red-800 border-red-200' },
      flagged: { label: 'Bị báo cáo', cls: 'bg-orange-50 text-orange-800 border-orange-200' }
    };
    return map[status] || { label: status || 'N/A', cls: 'bg-gray-50 text-gray-700 border-gray-200' };
  };

  const renderTabButton = (id, label) => {
    const active = activeTab === id;
    return (
      <button
        key={id}
        onClick={() => setActiveTab(id)}
        className={`px-3 py-2 rounded-full text-sm font-medium transition ${
          active
            ? 'bg-white text-gray-900 shadow-sm ring-1 ring-gray-200'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        {label}
      </button>
    );
  };

  // Get rating stars
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đánh giá và Góp ý</h1>
          <p className="text-gray-600">Đánh giá ẩn danh và quản lý đánh giá hệ thống</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
        >
          <Plus className="h-5 w-5" />
          <span className="ml-2">Tạo đánh giá</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow">
        <div className="px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="inline-flex items-center gap-2">
              <div className="inline-flex items-center rounded-full bg-gray-100 p-1">
                {renderTabButton('public', 'Công khai')}
                {user && renderTabButton('my', 'Của tôi')}
                {hasRole('admin') && renderTabButton('admin', 'Quản lý')}
              </div>
              <span className="text-sm text-gray-500">
                {loading ? 'Đang tải…' : `${pagination.total || reviews.length || 0} mục`}
              </span>
            </div>

            {activeTab === 'admin' && hasRole('admin') && (
              <div className="text-xs text-gray-500">
                Mẹo: chọn <span className="font-medium text-gray-700">“Có báo cáo”</span> để xem nhanh các đánh giá bị report.
              </div>
            )}
          </div>
        </div>

        {/* Bộ lọc chỉ dành cho tab quản trị */}
        {activeTab === 'admin' && hasRole('admin') && (
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-3 items-center">
            <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tiêu đề, nội dung, tên đối tượng..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Trạng thái:</span>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="pending">Chờ duyệt</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
                <option value="flagged">Đánh dấu</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Loại:</span>
              <select
                value={filters.targetType}
                onChange={(e) => handleFilterChange('targetType', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="drug">Thuốc</option>
                <option value="distributor">Nhà phân phối</option>
                <option value="hospital">Bệnh viện</option>
                <option value="manufacturer">Nhà sản xuất</option>
              </select>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Báo cáo:</span>
              <select
                value={filters.hasReports}
                onChange={(e) => handleFilterChange('hasReports', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tất cả</option>
                <option value="true">Có báo cáo</option>
              </select>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="p-6">
          {loading ? (
            <div className="grid gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
                      <div className="mt-3 h-3 w-2/3 bg-gray-100 rounded animate-pulse" />
                      <div className="mt-2 h-3 w-1/3 bg-gray-100 rounded animate-pulse" />
                    </div>
                    <div className="h-9 w-9 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white border border-gray-200">
                <MessageCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="mt-4 text-sm font-medium text-gray-900">Chưa có đánh giá nào</div>
              <div className="mt-1 text-sm text-gray-600">
                Hãy tạo đánh giá mới hoặc thử thay đổi bộ lọc.
              </div>
              <div className="mt-5">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 active:bg-blue-800 transition"
                >
                  <Plus className="h-4 w-4" />
                  <span className="ml-2">Tạo đánh giá</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {reviews.map((review, idx) => {
                const statusMeta = getStatusMeta(review.status);
                const hasReports = Array.isArray(review.reports) && review.reports.length > 0;
                const titleText = review.title || review.targetName || 'Đánh giá';
                const authorText = review.isAnonymous ? 'Ẩn danh' : (review.reviewer?.fullName || 'Không rõ');
                const dateText = review.createdAt ? new Date(review.createdAt).toLocaleDateString('vi-VN') : '';
                const targetType = getTargetTypeLabel(review.targetType);

                return (
                  <div key={getUniqueKey(review, idx)} className="rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-gray-900 truncate">
                            {titleText}
                          </h3>

                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
                            {targetType}
                          </span>

                          {(activeTab === 'admin' || activeTab === 'my') && (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${statusMeta.cls}`}>
                              {statusMeta.label}
                            </span>
                          )}

                          {activeTab === 'admin' && hasReports && (
                            <button
                              onClick={() => {
                                setSelectedReportsReview(review);
                                setShowReportsModal(true);
                              }}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-800 border border-red-200 hover:bg-red-100"
                              title="Xem báo cáo"
                            >
                              <Flag className="h-3 w-3 mr-1" />
                              <span>{review.reports.length} báo cáo</span>
                            </button>
                          )}
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex items-center">
                            {renderStars(Number(review.overallRating || 0))}
                          </div>
                          <span className="text-sm text-gray-600">
                            {Number(review.overallRating || 0)}/5
                          </span>
                        </div>

                        {review.content && (
                          <p className="mt-3 text-sm text-gray-700 line-clamp-2">
                            {review.content}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                          <div className="inline-flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span className="truncate max-w-[240px]">{authorText}</span>
                          </div>
                          <div className="inline-flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            <span>{dateText}</span>
                          </div>
                          {review.isVerified && (
                            <div className="inline-flex items-center text-green-700">
                              <Shield className="h-4 w-4 mr-1" />
                              <span>Đã xác minh</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => voteHelpful(normalizeId(review._id))}
                            className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                          >
                            <ThumbsUp className="h-4 w-4 text-green-600" />
                            <span className="ml-2 text-sm">{review.helpfulVotes || 0}</span>
                          </button>

                          <button
                            onClick={() => {
                              setReportingReview(review);
                              setShowReportModal(true);
                            }}
                            className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                          >
                            <Flag className="h-4 w-4 text-red-600" />
                            <span className="ml-2 text-sm">Báo cáo</span>
                          </button>

                          {activeTab === 'admin' && hasRole('admin') && (
                            <div className="flex items-center gap-2 ml-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const normalizedId = normalizeId(review._id);
                                    if (!normalizedId) {
                                      toast.error('ID đánh giá không hợp lệ');
                                      return;
                                    }
                                    const response = await reviewAPI.updateReviewStatus(normalizedId, { status: 'approved' });
                                    if (response.success) {
                                      toast.success('Đã duyệt đánh giá');
                                      loadReviews();
                                    }
                                  } catch (error) {
                                    toast.error('Lỗi khi duyệt đánh giá');
                                  }
                                }}
                                className="inline-flex items-center px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span className="ml-2 text-sm">Duyệt</span>
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const normalizedId = normalizeId(review._id);
                                    if (!normalizedId) {
                                      toast.error('ID đánh giá không hợp lệ');
                                      return;
                                    }
                                    const response = await reviewAPI.updateReviewStatus(normalizedId, { status: 'rejected' });
                                    if (response.success) {
                                      toast.success('Đã từ chối đánh giá');
                                      loadReviews();
                                    }
                                  } catch (error) {
                                    toast.error('Lỗi khi từ chối đánh giá');
                                  }
                                }}
                                className="inline-flex items-center px-3 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200"
                              >
                                <AlertTriangle className="h-4 w-4 text-yellow-700" />
                                <span className="ml-2 text-sm">Từ chối</span>
                              </button>
                              <button
                                onClick={async () => {
                                  if (!window.confirm('Bạn chắc chắn muốn xóa đánh giá này?')) return;
                                  try {
                                    const normalizedId = normalizeId(review._id);
                                    if (!normalizedId) {
                                      toast.error('ID đánh giá không hợp lệ');
                                      return;
                                    }
                                    const response = await reviewAPI.deleteReview(normalizedId);
                                    if (response.success) {
                                      toast.success('Đã xóa đánh giá');
                                      loadReviews();
                                    }
                                  } catch (error) {
                                    toast.error('Lỗi khi xóa đánh giá');
                                  }
                                }}
                                className="inline-flex items-center px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="ml-2 text-sm">Xóa</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedReview(review);
                          setShowDetailModal(true);
                        }}
                        className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                        title="Xem chi tiết"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Review Modal */}
      {showCreateModal && (
        <CreateReviewModal
          onSubmit={onCreateReview}
          onClose={() => setShowCreateModal(false)}
          loading={loading}
        />
      )}

      {/* Review Detail Modal */}
      {showDetailModal && selectedReview && (
        <ReviewDetailModal
          review={selectedReview}
          onClose={() => setShowDetailModal(false)}
          onVoteHelpful={voteHelpful}
          onReport={reportReview}
        />
      )}

      {/* Report Modal */}
      {showReportModal && reportingReview && (
        <ReportReviewModal
          review={reportingReview}
          onClose={() => setShowReportModal(false)}
          onSubmit={async ({ reason, description }) => {
            const normalizedId = normalizeId(reportingReview._id);
            if (!normalizedId || normalizedId === '[object Object]') {
              toast.error('ID đánh giá không hợp lệ');
              return;
            }
            await reportReview(normalizedId, { reason, description });
            setShowReportModal(false);
          }}
        />
      )}

      {/* Reports Modal (Admin) */}
      {showReportsModal && selectedReportsReview && (
        <ReviewReportsModal
          review={selectedReportsReview}
          onClose={() => setShowReportsModal(false)}
          onUpdateReportStatus={async (reportId, status) => {
            try {
              const reviewId = normalizeId(selectedReportsReview._id);
              const normalizedReportId = normalizeId(reportId);
              if (!reviewId || !normalizedReportId) {
                toast.error('ID báo cáo không hợp lệ');
                return;
              }
              const resp = await reviewAPI.updateReviewReportStatus(reviewId, normalizedReportId, { status });
              if (resp.success) {
                toast.success('Đã cập nhật báo cáo');
                setSelectedReportsReview((prev) => {
                  if (!prev) return prev;
                  const reports = Array.isArray(prev.reports) ? prev.reports : [];
                  return {
                    ...prev,
                    reports: reports.map((r) =>
                      String(normalizeId(r._id)) === String(normalizedReportId)
                        ? { ...r, status }
                        : r
                    )
                  };
                });
                // Reload list để đồng bộ
                loadReviews();
              }
            } catch (e) {
              toast.error('Lỗi khi cập nhật báo cáo');
            }
          }}
        />
      )}
    </div>
  );
};

// Create Review Modal Component
const CreateReviewModal = ({ onSubmit, onClose, loading }) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger, control, reset } = useForm({
    defaultValues: {
      targetType: '',
      overallRating: '',
      targetId: '',
      targetName: '',
      reviewType: 'usage',
      isAnonymous: true
    }
  });

  const selectedTargetType = watch('targetType');
  const selectedTargetId = watch('targetId'); // Watch để theo dõi ID đã chọn
  const selectedTargetName = watch('targetName'); // Watch để theo dõi tên đã chọn
  const [drugs, setDrugs] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOptionValue, setSelectedOptionValue] = useState(''); // State để control dropdown value
  const [displayTargetId, setDisplayTargetId] = useState(''); // State để hiển thị ID
  const [displayTargetName, setDisplayTargetName] = useState(''); // State để hiển thị tên

  // Load drugs và organizations khi targetType thay đổi
  useEffect(() => {
    const loadOptions = async () => {
      if (!selectedTargetType) {
        setDrugs([]);
        setOrganizations([]);
        return;
      }

      setLoadingOptions(true);
      try {
        if (selectedTargetType === 'drug') {
          // Load danh sách thuốc với search nếu có
          const params = { limit: 100 }; // Giới hạn tối đa của API
          if (searchTerm && searchTerm.trim()) {
            params.search = searchTerm.trim();
          }
          const response = await drugAPI.getDrugs(params);
          if (response.success && response.data?.drugs) {
            setDrugs(response.data.drugs);
          }
        } else if (['manufacturer', 'distributor', 'hospital'].includes(selectedTargetType)) {
          // Load danh sách tổ chức theo role - sử dụng endpoint mới cho phép patient truy cập
          const roleMap = {
            manufacturer: 'manufacturer',
            distributor: 'distributor',
            hospital: 'hospital'
          };
          const role = roleMap[selectedTargetType];
          const params = { role, limit: 100 }; // Giới hạn tối đa của API
          if (searchTerm && searchTerm.trim()) {
            params.search = searchTerm.trim();
          }
          // Sử dụng endpoint mới getOrganizations - cho phép tất cả user đã đăng nhập
          const response = await userAPI.getOrganizations(params);
          if (response.success && response.data?.users) {
            setOrganizations(response.data.users);
          }
        }
      } catch (error) {
        console.error('Error loading options:', error);
        // Xử lý lỗi 403 (Forbidden) một cách thân thiện - không hiển thị toast
        // vì đây là hành vi dự kiến khi patient không có quyền truy cập
        if (error.response?.status === 403) {
          console.warn('User không có quyền truy cập danh sách tổ chức. Để trống danh sách.');
          // Không hiển thị toast lỗi, chỉ để dropdown trống
          setOrganizations([]);
        } else {
          // Chỉ hiển thị toast cho các lỗi khác (network, server, etc.)
          toast.error('Lỗi khi tải danh sách');
        }
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [selectedTargetType, searchTerm]);

  // Helper để normalize ID
  const normalizeId = (id) => {
    if (!id) return '';
    if (typeof id === 'string' && id.trim() !== '' && id !== '[object Object]') return id;
    if (typeof id === 'object' && id !== null) {
      // Handle MongoDB ObjectId serialized as { '0': '6', '1': '9', ... }
      if (Object.keys(id).every(key => /^\d+$/.test(key))) {
        const normalized = Object.keys(id)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => id[key])
          .join('');
        if (normalized.length === 24 && /^[0-9a-fA-F]{24}$/.test(normalized)) {
          return normalized;
        }
      }
      if (id._id) {
        const nestedId = id._id;
        if (typeof nestedId === 'string' && nestedId.trim() !== '' && nestedId !== '[object Object]') {
          return nestedId;
        }
      }
      if (id.id) {
        const idValue = id.id;
        if (typeof idValue === 'string' && idValue.trim() !== '' && idValue !== '[object Object]') {
          return idValue;
        }
      }
      if (id.toString && typeof id.toString === 'function') {
        try {
          const str = id.toString();
          if (str !== '[object Object]' && str.trim() !== '') {
            return str;
          }
        } catch (e) {
          console.error("Error in toString for ID:", id, e);
        }
      }
    }
    try {
      const str = String(id);
      if (str !== '[object Object]' && str.trim() !== '') {
        return str;
      }
    } catch (e) {
      console.error("Error in String(id) for ID:", id, e);
    }
    return '';
  };

  // Xử lý khi chọn thuốc/tổ chức từ dropdown
  // meta (nếu có) lấy trực tiếp từ <option data-*> để tránh lỗi find() không match
  const handleTargetSelect = (value, meta = null) => {
    setSelectedOptionValue(value); // Update dropdown value first
    
    if (!value || value === '') {
      setValue('targetId', '', { shouldValidate: false, shouldTouch: true });
      setValue('targetName', '', { shouldValidate: false, shouldTouch: true });
      setDisplayTargetId('');
      setDisplayTargetName('');
      return;
    }

    // Ưu tiên meta lấy từ option (ổn định nhất)
    if (meta && (meta.submitId || meta.displayId || meta.name)) {
      const submitTargetIdStr = String(meta.submitId || '').trim();
      const displayTargetIdStr = String(meta.displayId || '').trim();
      const targetNameStr = String(meta.name || '').trim();

      console.log('✅ Using meta data:', { submitTargetIdStr, displayTargetIdStr, targetNameStr, meta });

      setDisplayTargetId(displayTargetIdStr);
      setDisplayTargetName(targetNameStr);

      if (!submitTargetIdStr) {
        console.error('❌ submitTargetIdStr is empty!', { meta, value });
        toast.error('Không lấy được ID hợp lệ để lưu đánh giá');
        return;
      }

      setValue('targetId', submitTargetIdStr, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });
      setValue('targetName', targetNameStr, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true
      });

      trigger('targetId');
      trigger('targetName');
      return;
    }

    if (selectedTargetType === 'drug') {
      // Tìm drug theo value - value là safeId được dùng trong option
      const selectedDrug = drugs.find((d, idx) => {
        const drugId = normalizeId(d._id);
        const safeId = drugId && drugId !== '[object Object]' && drugId.trim() !== '' 
          ? drugId 
          : `drug-fallback-${idx}`;
        // So sánh chính xác với safeId (giống như trong option value)
        return safeId === value;
      });
      
      if (selectedDrug) {
        const normalizedId = normalizeId(selectedDrug._id);
        // targetId (submit) phải là ObjectId; display có thể ưu tiên mã lô cho dễ nhìn
        const displayId = selectedDrug.drugId || normalizedId || '';
        const drugName = selectedDrug.name || selectedDrug.drugId || normalizedId || '';
        
        console.log('🔍 Selected drug found:', {
          value,
          normalizedId,
          drugId: selectedDrug.drugId,
          drugName,
          displayId,
          selectedDrug: {
            _id: selectedDrug._id,
            name: selectedDrug.name,
            drugId: selectedDrug.drugId
          }
        });
        
        // Đảm bảo giá trị là string và không rỗng
        const submitTargetIdStr = String(normalizedId || '').trim();
        const displayTargetIdStr = String(displayId || '').trim();
        const targetNameStr = String(drugName || '').trim();
        
        // Cập nhật display states TRƯỚC để UI phản hồi ngay lập tức
        setDisplayTargetId(displayTargetIdStr);
        setDisplayTargetName(targetNameStr);
        
        // Sau đó cập nhật form values với trigger validation
        if (!submitTargetIdStr) {
          toast.error('Không lấy được ID thuốc hợp lệ để lưu đánh giá');
        }
        setValue('targetId', submitTargetIdStr, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
        setValue('targetName', targetNameStr, { 
          shouldValidate: true, 
          shouldDirty: true, 
          shouldTouch: true 
        });
        
        // Force trigger validation và update form state
        trigger('targetId');
        trigger('targetName');
        
        console.log('✅ Updated form - targetId:', submitTargetIdStr, 'targetName:', targetNameStr);
      } else {
        console.warn('❌ Drug not found for value:', value);
        console.warn('Available drugs:', drugs.map((d, idx) => {
          const drugId = normalizeId(d._id);
          const safeId = drugId && drugId !== '[object Object]' && drugId.trim() !== '' 
            ? drugId 
            : `drug-fallback-${idx}`;
          return { safeId, name: d.name, drugId: d.drugId };
        }));
        toast.error('Không tìm thấy thuốc được chọn. Vui lòng chọn lại.');
      }
    } else if (['manufacturer', 'distributor', 'hospital'].includes(selectedTargetType)) {
      const selectedOrg = organizations.find(org => {
        const orgId = normalizeId(org._id);
        const safeId = orgId && orgId !== '[object Object]' && orgId.trim() !== ''
          ? orgId
          : `org-fallback-${organizations.indexOf(org)}`;
        return orgId === value || safeId === value;
      });
      if (selectedOrg) {
        const normalizedId = normalizeId(selectedOrg._id);
        const orgName = selectedOrg.organizationInfo?.name || selectedOrg.fullName || '';
        // Hiển thị ưu tiên mã tổ chức; submit vẫn dùng ObjectId
        const displayId = selectedOrg.organizationId || normalizedId || '';
        
        // Đảm bảo giá trị là string và không rỗng
        const submitTargetIdStr = String(normalizedId || '').trim();
        const displayTargetIdStr = String(displayId || '').trim();
        const orgNameStr = String(orgName || '').trim();
        
        // Kiểm tra ObjectId hợp lệ
        if (!submitTargetIdStr || !/^[0-9a-fA-F]{24}$/.test(submitTargetIdStr)) {
          console.error('❌ Invalid ObjectId for organization:', { normalizedId, submitTargetIdStr, selectedOrg });
          toast.error('ID tổ chức không hợp lệ. Vui lòng chọn lại.');
          return;
        }
        
        console.log('🔍 Selected organization found:', {
          value,
          normalizedId: submitTargetIdStr,
          orgName: orgNameStr,
          selectedOrg
        });
        
        // Cập nhật display states TRƯỚC
        setDisplayTargetId(displayTargetIdStr);
        setDisplayTargetName(orgNameStr);
        
        // Sau đó cập nhật form values
        setValue('targetId', submitTargetIdStr, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue('targetName', orgNameStr, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        
        // Force trigger validation
        trigger('targetId');
        trigger('targetName');
        
        console.log('✅ Updated form - targetId:', submitTargetIdStr, 'targetName:', orgNameStr);
      } else {
        console.warn('❌ Organization not found for value:', value);
        console.warn('Available organizations:', organizations.map((org, idx) => {
          const orgId = normalizeId(org._id);
          const safeId = orgId && orgId !== '[object Object]' && orgId.trim() !== ''
            ? orgId
            : `org-fallback-${idx}`;
          return { safeId, name: org.organizationInfo?.name || org.fullName, orgId };
        }));
        toast.error('Không tìm thấy tổ chức được chọn. Vui lòng chọn lại.');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Tạo đánh giá mới</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loại đối tượng *
              </label>
              <select
                {...register('targetType', { 
                  required: 'Loại đối tượng là bắt buộc',
                  onChange: (e) => {
                    // Reset các field khi thay đổi loại đối tượng
                    setValue('targetId', '');
                    setValue('targetName', '');
                    setDisplayTargetId('');
                    setDisplayTargetName('');
                    setDrugs([]);
                    setOrganizations([]);
                    setSearchTerm(''); // Reset search term
                    setSelectedOptionValue(''); // Reset dropdown selection
                  }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn loại</option>
                <option value="drug">Thuốc</option>
                <option value="distributor">Nhà phân phối</option>
                <option value="hospital">Bệnh viện</option>
                <option value="manufacturer">Nhà sản xuất</option>
              </select>
              {errors.targetType && (
                <p className="text-red-500 text-sm mt-1">{errors.targetType.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Điểm đánh giá *
              </label>
              <select
                {...register('overallRating', { required: 'Điểm đánh giá là bắt buộc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn điểm</option>
                <option value="1">1 sao - Rất tệ</option>
                <option value="2">2 sao - Tệ</option>
                <option value="3">3 sao - Trung bình</option>
                <option value="4">4 sao - Tốt</option>
                <option value="5">5 sao - Rất tốt</option>
              </select>
              {errors.overallRating && (
                <p className="text-red-500 text-sm mt-1">{errors.overallRating.message}</p>
              )}
            </div>
          </div>

          {/* Search và Dropdown chọn thuốc/tổ chức */}
          {selectedTargetType && (
            <div className="space-y-2">
              {/* Search box */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tìm kiếm {selectedTargetType === 'drug' ? 'thuốc' : 'tổ chức'} (tùy chọn)
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Nhập tên ${selectedTargetType === 'drug' ? 'thuốc' : 'tổ chức'} để tìm kiếm...`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedTargetType === 'drug' ? 'Chọn thuốc *' : 'Chọn tổ chức *'}
                </label>
                {loadingOptions ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                    <span className="text-sm text-gray-500">Đang tải danh sách...</span>
                  </div>
                ) : (
                  <select
                    value={selectedOptionValue}
                    onChange={(e) => {
                      const selectedValue = e.target.value;
                      const opt = e.target.selectedOptions?.[0];
                      // Lấy data attributes - sử dụng cả dataset và getAttribute để đảm bảo
                      const meta = opt
                        ? {
                            submitId: opt.dataset.submitId || opt.getAttribute('data-submit-id') || '',
                            displayId: opt.dataset.displayId || opt.getAttribute('data-display-id') || '',
                            name: opt.dataset.name || opt.getAttribute('data-name') || ''
                          }
                        : null;
                      console.log('🔍 Select onChange:', { selectedValue, meta, opt });
                      handleTargetSelect(selectedValue, meta);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {!(selectedTargetType === 'drug' && drugs.length === 0 && !loadingOptions) && 
                     !(['manufacturer', 'distributor', 'hospital'].includes(selectedTargetType) && organizations.length === 0 && !loadingOptions) && (
                      <option value="" key={`select-placeholder-${selectedTargetType}`}>
                        -- Chọn {selectedTargetType === 'drug' ? 'thuốc' : 'tổ chức'} --
                      </option>
                    )}
                    {selectedTargetType === 'drug' && drugs.length === 0 && !loadingOptions && (
                      <option value="" disabled key={`drug-empty-${selectedTargetType}-${searchTerm || 'no-search'}`}>
                        {searchTerm ? `Không tìm thấy thuốc nào với từ khóa "${searchTerm}"` : 'Không có thuốc nào trong hệ thống'}
                      </option>
                    )}
                    {selectedTargetType === 'drug' && drugs.map((drug, idx) => {
                      const drugId = normalizeId(drug._id);
                      const safeId = drugId && drugId !== '[object Object]' && drugId.trim() !== '' 
                        ? drugId 
                        : `drug-fallback-${idx}`;
                      const uniqueKey = `drug-opt-${idx}-${safeId}-${drug.name || 'unknown'}`;
                      const submitId = normalizeId(drug._id);
                      const displayId = drug.drugId || submitId || '';
                      const targetName = drug.name || drug.drugId || submitId || '';
                      
                      // Đảm bảo submitId là ObjectId hợp lệ (24 ký tự hex)
                      const validSubmitId = submitId && submitId.length === 24 && /^[0-9a-fA-F]{24}$/.test(submitId) 
                        ? submitId 
                        : '';
                      
                      if (!validSubmitId && submitId) {
                        console.warn('⚠️ Invalid submitId for drug:', { drugId, submitId, drugName: drug.name });
                      }
                      
                      return (
                        <option
                          key={uniqueKey}
                          value={safeId}
                          data-submit-id={validSubmitId}
                          data-display-id={displayId}
                          data-name={targetName}
                        >
                          {drug.name} {drug.drugId ? `(Mã lô: ${drug.drugId})` : (safeId && !safeId.startsWith('drug-fallback') ? `(ID: ${safeId.substring(0, 8)}...)` : '')}
                        </option>
                      );
                    })}
                    {['manufacturer', 'distributor', 'hospital'].includes(selectedTargetType) && organizations.length === 0 && !loadingOptions && (
                      <option value="" disabled key={`org-empty-${selectedTargetType}-${searchTerm || 'no-search'}`}>
                        {searchTerm ? `Không tìm thấy ${selectedTargetType === 'manufacturer' ? 'nhà sản xuất' : selectedTargetType === 'distributor' ? 'nhà phân phối' : 'bệnh viện'} nào với từ khóa "${searchTerm}"` : `Không có ${selectedTargetType === 'manufacturer' ? 'nhà sản xuất' : selectedTargetType === 'distributor' ? 'nhà phân phối' : 'bệnh viện'} nào trong hệ thống`}
                      </option>
                    )}
                    {['manufacturer', 'distributor', 'hospital'].includes(selectedTargetType) && organizations.map((org, idx) => {
                      const orgId = normalizeId(org._id);
                      const orgName = org.organizationInfo?.name || org.fullName || 'Không có tên';
                      const safeId = orgId && orgId !== '[object Object]' && orgId.trim() !== ''
                        ? orgId
                        : `org-fallback-${idx}`;
                      const uniqueKey = `org-opt-${idx}-${safeId}-${orgName}`;
                      const submitId = normalizeId(org._id);
                      const displayId = org.organizationId || submitId || '';
                      
                      // Đảm bảo submitId là ObjectId hợp lệ (24 ký tự hex)
                      const validSubmitId = submitId && submitId.length === 24 && /^[0-9a-fA-F]{24}$/.test(submitId) 
                        ? submitId 
                        : '';
                      
                      if (!validSubmitId && submitId) {
                        console.warn('⚠️ Invalid submitId for organization:', { orgId, submitId, orgName });
                      }
                      
                      return (
                        <option
                          key={uniqueKey}
                          value={safeId}
                          data-submit-id={validSubmitId}
                          data-display-id={displayId}
                          data-name={orgName}
                        >
                          {orgName} {org.organizationId ? `(Mã tổ chức: ${org.organizationId})` : (safeId && !safeId.startsWith('org-fallback') ? `(User ID: ${safeId.substring(0, 8)}...)` : '')}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã đối tượng (ID) *
              </label>
              <Controller
                name="targetId"
                control={control}
                rules={{ required: 'Mã đối tượng là bắt buộc' }}
                render={({ field }) => {
                  // Ưu tiên displayTargetId, sau đó đến field.value từ form
                  // Đảm bảo luôn là string, không bao giờ undefined
                  const displayValue = String(displayTargetId || field.value || '');
                  
                  return (
                    <input
                      type="text"
                      value={displayValue}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        field.onChange(newValue);
                        setDisplayTargetId(newValue);
                      }}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      placeholder="Sẽ tự động điền khi chọn ở trên"
                    />
                  );
                }}
              />
              {errors.targetId && (
                <p className="text-red-500 text-sm mt-1">{errors.targetId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên đối tượng *
              </label>
              <Controller
                name="targetName"
                control={control}
                rules={{ required: 'Tên đối tượng là bắt buộc' }}
                render={({ field }) => {
                  // Ưu tiên displayTargetName, sau đó đến field.value từ form
                  // Đảm bảo luôn là string, không bao giờ undefined
                  const displayValue = String(displayTargetName || field.value || '');
                  
                  return (
                    <input
                      type="text"
                      value={displayValue}
                      onChange={(e) => {
                        const newValue = e.target.value;
                        field.onChange(newValue);
                        setDisplayTargetName(newValue);
                      }}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                      placeholder="Sẽ tự động điền khi chọn ở trên"
                    />
                  );
                }}
              />
              {errors.targetName && (
                <p className="text-red-500 text-sm mt-1">{errors.targetName.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tiêu đề
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập tiêu đề đánh giá"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nội dung đánh giá
            </label>
            <textarea
              rows={4}
              {...register('content')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Chia sẻ trải nghiệm của bạn..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại đánh giá
            </label>
            <select
              {...register('reviewType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="usage">Trải nghiệm sử dụng</option>
              <option value="service">Dịch vụ</option>
              <option value="quality_check">Kiểm định / chất lượng</option>
              <option value="complaint">Phản ánh / khiếu nại</option>
              <option value="recommendation">Đề xuất cải tiến</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              {...register('isAnonymous')}
              defaultChecked
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm text-gray-700">
              Đánh giá ẩn danh (bảo vệ danh tính)
            </label>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                reset();
                setDisplayTargetId('');
                setDisplayTargetName('');
                setSelectedOptionValue('');
                setSearchTerm('');
                setDrugs([]);
                setOrganizations([]);
                onClose();
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : 'Tạo đánh giá'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Review Detail Modal Component
const ReviewDetailModal = ({ review, onClose, onVoteHelpful, onReport }) => {
  // Helper function để normalize ID (giống như trong Reviews component)
  const normalizeId = (id, fallback = '') => {
    if (!id) return fallback;
    if (typeof id === 'string' && id.trim() !== '' && id !== '[object Object]') return id;
    if (typeof id === 'object' && id !== null) {
      // Handle MongoDB ObjectId serialized as { '0': '6', '1': '9', ... }
      if (Object.keys(id).every(key => /^\d+$/.test(key))) {
        const normalized = Object.keys(id)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => id[key])
          .join('');
        if (normalized.length === 24 && /^[0-9a-fA-F]{24}$/.test(normalized)) {
          return normalized;
        }
      }
      if (id._id) {
        const nestedId = id._id;
        if (typeof nestedId === 'string' && nestedId.trim() !== '' && nestedId !== '[object Object]') {
          return nestedId;
        }
      }
      if (id.id) {
        const idValue = id.id;
        if (typeof idValue === 'string' && idValue.trim() !== '' && idValue !== '[object Object]') {
          return idValue;
        }
      }
      if (id.toString && typeof id.toString === 'function') {
        try {
          const str = id.toString();
          if (str !== '[object Object]' && str.trim() !== '') {
            return str;
          }
        } catch (e) {
          console.error("Error in toString for ID:", id, e);
        }
      }
    }
    try {
      const str = String(id);
      if (str !== '[object Object]' && str.trim() !== '') {
        return str;
      }
    } catch (e) {
      console.error("Error in String(id) for ID:", id, e);
    }
    return fallback;
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-5 w-5 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Chi tiết đánh giá</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{review.title || review.targetName}</h4>
            <div className="flex items-center space-x-2 mb-3">
              {renderStars(review.overallRating)}
              <span className="text-lg font-semibold">{review.overallRating}/5</span>
            </div>
          </div>
          
          {review.content && (
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Nội dung</h5>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                {review.content}
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-900">Người đánh giá:</span>
              <p className="text-gray-600">
                {review.isAnonymous ? 'Ẩn danh' : review.reviewer?.fullName}
              </p>
            </div>
            <div>
              <span className="font-medium text-gray-900">Thời gian:</span>
              <p className="text-gray-600">{new Date(review.createdAt).toLocaleString('vi-VN')}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">Vote hữu ích:</span>
              <p className="text-gray-600">{review.helpfulVotes || 0}</p>
            </div>
            <div>
              <span className="font-medium text-gray-900">Trạng thái:</span>
              <p className="text-gray-600">{review.status}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => {
              // Normalize ID trước khi gọi
              const normalizedId = normalizeId(review._id);
              if (normalizedId && normalizedId !== '[object Object]') {
                onVoteHelpful(normalizedId);
                onClose();
              } else {
                toast.error('ID đánh giá không hợp lệ');
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Vote hữu ích
          </button>
          
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Report Review Modal (User)
const ReportReviewModal = ({ review, onClose, onSubmit }) => {
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');

  const reasonOptions = [
    { value: 'spam', label: 'Spam / quảng cáo' },
    { value: 'inappropriate', label: 'Không phù hợp' },
    { value: 'fake', label: 'Giả mạo / sai sự thật' },
    { value: 'offensive', label: 'Xúc phạm' },
    { value: 'irrelevant', label: 'Không liên quan' },
    { value: 'other', label: 'Khác' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Báo cáo đánh giá</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="text-sm text-gray-700 mb-4">
          <span className="font-medium">Đánh giá:</span> {review?.title || review?.targetName || 'Đánh giá'}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lý do</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {reasonOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả thêm (tùy chọn)
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bạn có thể mô tả thêm để admin dễ xử lý…"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            onClick={() => onSubmit({ reason, description: description?.trim() || null })}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Gửi báo cáo
          </button>
        </div>
      </div>
    </div>
  );
};

// Review Reports Modal (Admin)
const ReviewReportsModal = ({ review, onClose, onUpdateReportStatus }) => {
  const reasonLabel = (reason) => {
    const map = {
      spam: 'Spam',
      inappropriate: 'Không phù hợp',
      fake: 'Giả mạo',
      offensive: 'Xúc phạm',
      irrelevant: 'Không liên quan',
      other: 'Khác'
    };
    return map[reason] || reason || 'Không rõ';
  };

  const statusLabel = (status) => {
    const map = {
      pending: 'Chờ xử lý',
      resolved: 'Đã xử lý',
      dismissed: 'Bỏ qua'
    };
    return map[status] || status || 'Không rõ';
  };

  const reports = Array.isArray(review?.reports) ? review.reports : [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Báo cáo đánh giá</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-700">
            <span className="font-medium">Đánh giá:</span> {review.title || review.targetName}
          </div>
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Trạng thái review:</span> {review.status}
          </div>
        </div>

        {reports.length === 0 ? (
          <div className="p-6 text-center text-gray-500">Không có báo cáo nào.</div>
        ) : (
          <div className="space-y-3">
            {reports
              .slice()
              .sort((a, b) => new Date(b.reportedAt || 0) - new Date(a.reportedAt || 0))
              .map((r) => {
                const reporterName =
                  r?.reporter?.fullName ||
                  r?.reporter?.email ||
                  (typeof r?.reporter === 'string' ? r.reporter : '') ||
                  'Không rõ';
                const isPending = r?.status === 'pending';
                return (
                  <div key={String(r._id)} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {reasonLabel(r.reason)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            r.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : r.status === 'resolved'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {statusLabel(r.status)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {r.reportedAt ? new Date(r.reportedAt).toLocaleString('vi-VN') : ''}
                          </span>
                        </div>

                        <div className="mt-2 text-sm text-gray-700">
                          <span className="font-medium">Người báo cáo:</span> {reporterName}
                        </div>

                        {r.description && (
                          <div className="mt-2 text-sm text-gray-700 bg-gray-50 rounded p-2">
                            {r.description}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button
                          disabled={!isPending}
                          onClick={() => onUpdateReportStatus(r._id, 'resolved')}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            isPending
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Đã xử lý
                        </button>
                        <button
                          disabled={!isPending}
                          onClick={() => onUpdateReportStatus(r._id, 'dismissed')}
                          className={`px-3 py-2 rounded-lg text-sm ${
                            isPending
                              ? 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          Bỏ qua
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
