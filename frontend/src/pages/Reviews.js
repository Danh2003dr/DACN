import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
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
import { reviewAPI } from '../utils/api';
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
  const [activeTab, setActiveTab] = useState('public'); // public, admin

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

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
      } else {
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
  }, [pagination.current, filters, activeTab, hasRole]);

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
      const response = await reviewAPI.voteHelpful(id);
      
      if (response.success) {
        toast.success('Đã vote hữu ích');
        loadReviews();
      }
    } catch (error) {
      toast.error('Lỗi khi vote');
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
            reviews.map((review) => (
              <div key={review._id} className="p-6 hover:bg-gray-50">
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
                        onClick={() => voteHelpful(review._id)}
                        className="flex items-center space-x-1 text-green-600 hover:text-green-800"
                      >
                        <ThumbsUp className="h-4 w-4" />
                        <span>{review.helpfulVotes || 0}</span>
                      </button>
                      
                      <button
                        onClick={() => reportReview(review._id, 'other')}
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
                                const response = await reviewAPI.updateReviewStatus(review._id, { status: 'approved' });
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
                                const response = await reviewAPI.updateReviewStatus(review._id, { status: 'rejected' });
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
                                const response = await reviewAPI.deleteReview(review._id);
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
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      targetType: '',
      overallRating: '',
      targetId: '',
      targetName: '',
      reviewType: 'usage',
      isAnonymous: true
    }
  });

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
                {...register('targetType', { required: 'Loại đối tượng là bắt buộc' })}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã đối tượng (ID) *
              </label>
              <input
                type="text"
                {...register('targetId', { required: 'Mã đối tượng là bắt buộc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Ví dụ: ID thuốc hoặc tổ chức"
              />
              {errors.targetId && (
                <p className="text-red-500 text-sm mt-1">{errors.targetId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên đối tượng *
              </label>
              <input
                type="text"
                {...register('targetName', { required: 'Tên đối tượng là bắt buộc' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Tên thuốc / tổ chức"
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
              onVoteHelpful(review._id);
              onClose();
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
