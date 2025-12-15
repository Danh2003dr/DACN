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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
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
    status: ''
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
        // Ưu tiên top-rated; chỉ fallback sang danh sách admin nếu user là admin
        response = await reviewAPI.getTopRatedTargets('drug', '10');
        if (response.success && (response.data?.topRated?.length || 0) > 0) {
          setReviews(response.data.topRated);
          setPagination({ current: 1, pages: 1, total: response.data.topRated.length });
        } else if (hasRole && hasRole('admin')) {
          // Chỉ admin mới gọi API danh sách quản trị
          const adminList = await reviewAPI.getReviewsForAdmin(`status=approved&${params.toString()}`);
          if (adminList.success) {
            setReviews(adminList.data.reviews);
            setPagination(adminList.data.pagination || { current: 1, pages: 1, total: 0 });
          }
        } else {
          // Người dùng thường: không có dữ liệu, tránh gọi API admin
          setReviews([]);
          setPagination({ current: 1, pages: 1, total: 0 });
        }
      } else if (activeTab === 'my') {
        // Tab "Đánh giá của tôi" - filter theo user hiện tại
        if (user && user._id) {
          const normalizedUserId = normalizeId(user._id);
          if (normalizedUserId && normalizedUserId !== '[object Object]') {
            params.append('reviewer', normalizedUserId);
            response = await reviewAPI.getReviewsForAdmin(params.toString());
            if (response.success) {
              setReviews(response.data.reviews);
              setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
            }
          } else {
            setReviews([]);
            setPagination({ current: 1, pages: 1, total: 0 });
          }
        } else {
          setReviews([]);
          setPagination({ current: 1, pages: 1, total: 0 });
        }
      } else {
        // Tab "Quản lý đánh giá" (admin)
        response = await reviewAPI.getReviewsForAdmin(params.toString());
        if (response.success) {
          setReviews(response.data.reviews);
          setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
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
      const payload = {
        ...data,
        overallRating: Number(data.overallRating),
        isAnonymous: data.isAnonymous ?? true,
        reviewType: data.reviewType || 'usage'
      };
      const response = await reviewAPI.createReview(payload);
      
      if (response.success) {
        toast.success('Tạo đánh giá thành công');
        setShowCreateModal(false);
        reset();
        loadReviews();
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
  const reportReview = async (id, reason) => {
    try {
      const response = await reviewAPI.reportReview(id, { reason });
      
      if (response.success) {
        toast.success('Báo cáo thành công');
      }
    } catch (error) {
      toast.error('Lỗi khi báo cáo');
    }
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đánh giá và Góp ý</h1>
          <p className="text-gray-600">Đánh giá ẩn danh và quản lý đánh giá hệ thống</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Tạo đánh giá</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('public')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'public'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Đánh giá công khai
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('my')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Đánh giá của tôi
              </button>
            )}
            {hasRole('admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Quản lý đánh giá
              </button>
            )}
          </nav>
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
          </div>
        )}

        {/* Reviews List */}
        <div className="divide-y divide-gray-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Đang tải...</span>
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Không có đánh giá nào
            </div>
          ) : (
            reviews.map((review, idx) => (
              <div key={getUniqueKey(review, idx)} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {review.title || review.targetName}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {renderStars(review.overallRating)}
                        <span className="text-sm text-gray-500">
                          ({review.overallRating}/5)
                        </span>
                      </div>
                    </div>
                    
                    {review.content && (
                      <p className="text-gray-600 mb-3 line-clamp-2">
                        {review.content}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        <span>
                          {review.isAnonymous ? 'Ẩn danh' : review.reviewer?.fullName}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {review.isVerified && (
                        <div className="flex items-center text-green-600">
                          <Shield className="h-4 w-4 mr-1" />
                          <span>Đã xác minh</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mt-3">
                      <button
                        onClick={() => voteHelpful(normalizeId(review._id))}
                        className="flex items-center space-x-1 text-green-600 hover:text-green-800"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{review.helpfulVotes || 0}</span>
                      </button>
                      
                      <button
                        onClick={() => reportReview(normalizeId(review._id), 'other')}
                        className="flex items-center space-x-1 text-red-600 hover:text-red-800"
                      >
                        <Flag className="h-4 w-4" />
                        <span>Báo cáo</span>
                      </button>

                      {/* Hành động quản trị */}
                      {activeTab === 'admin' && hasRole('admin') && (
                        <div className="flex items-center space-x-2 ml-4">
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
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>Duyệt</span>
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
                            className="flex items-center space-x-1 text-yellow-600 hover:text-yellow-800 text-sm"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            <span>Từ chối</span>
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
                            className="flex items-center space-x-1 text-red-600 hover:text-red-800 text-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                            <span>Xóa</span>
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
                    className="text-blue-600 hover:text-blue-900"
                    title="Xem chi tiết"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
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
    </div>
  );
};

// Create Review Modal Component
const CreateReviewModal = ({ onSubmit, onClose, loading }) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger, control } = useForm({
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
          // Load danh sách tổ chức theo role
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
          const response = await userAPI.getUsers(params);
          if (response.success && response.data?.users) {
            setOrganizations(response.data.users);
          }
        }
      } catch (error) {
        console.error('Error loading options:', error);
        toast.error('Lỗi khi tải danh sách');
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
  const handleTargetSelect = (value) => {
    setSelectedOptionValue(value); // Update dropdown value first
    
    if (!value || value === '' || value.startsWith('drug-fallback') || value.startsWith('org-fallback')) {
      setValue('targetId', '', { shouldValidate: false, shouldTouch: true });
      setValue('targetName', '', { shouldValidate: false, shouldTouch: true });
      setDisplayTargetId('');
      setDisplayTargetName('');
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
        // Ưu tiên name trước, sau đó mới đến drugId
        const drugName = selectedDrug.name || selectedDrug.drugId || normalizedId || '';
        // Ưu tiên drugId (mã lô) làm targetId, nếu không có thì dùng normalizedId
        const finalTargetId = selectedDrug.drugId || normalizedId || '';
        
        console.log('🔍 Selected drug found:', {
          value,
          normalizedId,
          drugId: selectedDrug.drugId,
          drugName,
          finalTargetId,
          selectedDrug: {
            _id: selectedDrug._id,
            name: selectedDrug.name,
            drugId: selectedDrug.drugId
          }
        });
        
        // Đảm bảo giá trị là string và không rỗng
        const targetIdStr = String(finalTargetId || '').trim();
        const targetNameStr = String(drugName || '').trim();
        
        // Cập nhật display states TRƯỚC để UI phản hồi ngay lập tức
        setDisplayTargetId(targetIdStr);
        setDisplayTargetName(targetNameStr);
        
        // Sau đó cập nhật form values với trigger validation
        setValue('targetId', targetIdStr, { 
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
        
        console.log('✅ Updated form - targetId:', targetIdStr, 'targetName:', targetNameStr);
      } else {
        console.warn('Drug not found for value:', value);
        console.warn('Available drugs:', drugs.map((d, idx) => {
          const drugId = normalizeId(d._id);
          const safeId = drugId && drugId !== '[object Object]' && drugId.trim() !== '' 
            ? drugId 
            : `drug-fallback-${idx}`;
          return { safeId, name: d.name, drugId: d.drugId };
        }));
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
        
        // Đảm bảo giá trị là string và không rỗng
        const orgIdStr = String(normalizedId || '').trim();
        const orgNameStr = String(orgName || '').trim();
        
        console.log('🔍 Selected organization found:', {
          value,
          normalizedId: orgIdStr,
          orgName: orgNameStr,
          selectedOrg
        });
        
        // Cập nhật display states TRƯỚC
        setDisplayTargetId(orgIdStr);
        setDisplayTargetName(orgNameStr);
        
        // Sau đó cập nhật form values
        setValue('targetId', orgIdStr, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        setValue('targetName', orgNameStr, { shouldValidate: true, shouldDirty: true, shouldTouch: true });
        
        // Force trigger validation
        trigger('targetId');
        trigger('targetName');
        
        console.log('✅ Updated form - targetId:', orgIdStr, 'targetName:', orgNameStr);
      } else {
        console.warn('Organization not found for value:', value);
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
                      handleTargetSelect(selectedValue);
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
                      return (
                        <option key={uniqueKey} value={safeId}>
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
                      return (
                        <option key={uniqueKey} value={safeId}>
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
              onClick={onClose}
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

export default Reviews;
