import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Award,
  TrendingUp,
  TrendingDown,
  Star,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Gift,
  XCircle,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { trustScoreAPI } from '../utils/api';
import toast from 'react-hot-toast';

const TrustScores = () => {
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState([]);
  const [stats, setStats] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState(null); // Lưu ID đã normalize
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filters, setFilters] = useState({
    role: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  // Helper function để normalize ID (giống như trong Reviews.js và Users.js)
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
        // Nếu nestedId là object, đệ quy normalize
        if (typeof nestedId === 'object') {
          return normalizeId(nestedId, fallback);
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

  // Helper function để tạo unique key
  const getUniqueKey = (supplier, idx) => {
    if (!supplier) return `supplier-${idx}-${Date.now()}`;
    
    // Normalize ID từ nhiều định dạng
    let id = null;
    if (supplier._id) {
      if (typeof supplier._id === 'object' && supplier._id.toString) {
        id = supplier._id.toString();
      } else if (typeof supplier._id === 'string') {
        id = supplier._id;
      } else {
        id = String(supplier._id);
      }
    }
    
    // Tạo unique key với nhiều fallback
    const parts = [];
    if (id) parts.push(id);
    parts.push(`idx-${idx}`);
    if (supplier.supplierName) parts.push(supplier.supplierName);
    if (supplier.supplier?._id) {
      const supplierId = typeof supplier.supplier._id === 'object' 
        ? supplier.supplier._id.toString() 
        : String(supplier.supplier._id);
      parts.push(`supp-${supplierId}`);
    }
    if (supplier.trustScore !== undefined) parts.push(`score-${supplier.trustScore}`);
    
    return parts.join('-') || `supplier-${idx}-${Date.now()}`;
  };

  // Load ranking
  const loadRanking = React.useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: 20,
        ...filters
      };
      
      const response = await trustScoreAPI.getRanking(params);
      if (response.success) {
        setRanking(response.data.suppliers || []);
        setPagination(response.data.pagination || { current: 1, pages: 1, total: 0 });
      } else {
        setRanking([]);
        setPagination({ current: 1, pages: 1, total: 0 });
      }
    } catch (error) {
      toast.error('Lỗi khi tải bảng xếp hạng');
      console.error('Load ranking error:', error);
      setRanking([]);
      setPagination({ current: 1, pages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  }, [pagination.current, filters.role, filters.search]);

  // Load stats
  const loadStats = React.useCallback(async () => {
    try {
      const response = await trustScoreAPI.getStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Load stats error:', error);
    }
  }, []);

  useEffect(() => {
    loadRanking();
  }, [loadRanking]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Get trust level color
  const getTrustLevelColor = (level) => {
    const colors = {
      A: 'text-green-600 bg-green-100',
      B: 'text-blue-600 bg-blue-100',
      C: 'text-yellow-600 bg-yellow-100',
      D: 'text-red-600 bg-red-100'
    };
    return colors[level] || colors.C;
  };

  // Get trust level badge
  const getTrustLevelBadge = (level) => {
    const badges = {
      A: { icon: Trophy, text: 'Xuất sắc', color: 'text-green-600' },
      B: { icon: Award, text: 'Tốt', color: 'text-blue-600' },
      C: { icon: Star, text: 'Trung bình', color: 'text-yellow-600' },
      D: { icon: AlertTriangle, text: 'Cần cải thiện', color: 'text-red-600' }
    };
    return badges[level] || badges.C;
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 600) return 'text-blue-600';
    if (score >= 400) return 'text-yellow-600';
    return 'text-red-600';
  };

  // View supplier detail
  const viewSupplierDetail = async (supplierId) => {
    try {
      // Normalize ID từ nhiều định dạng khác nhau
      const id = normalizeId(supplierId);
      
      if (!id || id === '') {
        toast.error('Không thể xác định ID nhà cung ứng');
        console.error('Invalid supplier ID:', supplierId);
        return;
      }
      
      console.log('Viewing supplier detail with ID:', id, 'from:', supplierId);
      
      const response = await trustScoreAPI.getTrustScore(id);
      if (response.success) {
        setSelectedSupplier(response.data.trustScore);
        setSelectedSupplierId(id); // Lưu ID đã normalize
        setShowDetailModal(true);
      }
    } catch (error) {
      console.error('View supplier detail error:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi tải thông tin nhà cung ứng');
    }
  };

  // Recalculate all scores (Admin only)
  const handleRecalculateAll = async () => {
    if (!window.confirm('Bạn có chắc muốn tính toán lại điểm tín nhiệm cho tất cả nhà cung ứng?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await trustScoreAPI.recalculateAll();
      if (response.success) {
        toast.success(`Đã tính toán lại điểm cho ${response.data.success} nhà cung ứng`);
        loadRanking();
        loadStats();
      }
    } catch (error) {
      toast.error('Lỗi khi tính toán lại điểm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Điểm Tín Nhiệm Nhà Cung Ứng</h1>
          <p className="text-gray-600">Hệ thống gamification đánh giá và xếp hạng nhà cung ứng</p>
        </div>
        
        {hasRole('admin') && (
          <button
            onClick={handleRecalculateAll}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            <span>Tính toán lại tất cả</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Tổng số nhà cung ứng</div>
            <div className="text-2xl font-bold text-gray-900">{stats.overall.totalSuppliers}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600 mb-1">Điểm trung bình</div>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(stats.overall.averageScore)}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg shadow p-4 border border-green-200">
            <div className="text-sm text-green-600 mb-1">Cấp A (Xuất sắc)</div>
            <div className="text-2xl font-bold text-green-600">{stats.overall.levelA}</div>
          </div>
          <div className="bg-blue-50 rounded-lg shadow p-4 border border-blue-200">
            <div className="text-sm text-blue-600 mb-1">Cấp B (Tốt)</div>
            <div className="text-2xl font-bold text-blue-600">{stats.overall.levelB}</div>
          </div>
          <div className="bg-yellow-50 rounded-lg shadow p-4 border border-yellow-200">
            <div className="text-sm text-yellow-600 mb-1">Cấp C (Trung bình)</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.overall.levelC}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm nhà cung ứng..."
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPagination({ ...pagination, current: 1 });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={filters.role}
              onChange={(e) => {
                setFilters({ ...filters, role: e.target.value });
                setPagination({ ...pagination, current: 1 });
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả vai trò</option>
              <option value="manufacturer">Nhà sản xuất</option>
              <option value="distributor">Nhà phân phối</option>
              <option value="hospital">Bệnh viện</option>
              <option value="pharmacy">Nhà thuốc</option>
              <option value="dealer">Đại lý</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ranking Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Bảng Xếp Hạng</h2>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Đang tải...</span>
            </div>
          </div>
        ) : ranking.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Không có dữ liệu
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Xếp hạng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhà cung ứng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Điểm tín nhiệm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cấp độ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ranking.map((supplier, index) => {
                  const rank = (pagination.current - 1) * 20 + index + 1;
                  const badge = getTrustLevelBadge(supplier.trustLevel);
                  const BadgeIcon = badge.icon;
                  
                  return (
                    <tr key={getUniqueKey(supplier, index)} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {rank <= 3 && (
                            <Trophy className={`h-5 w-5 mr-2 ${
                              rank === 1 ? 'text-yellow-500' :
                              rank === 2 ? 'text-gray-400' :
                              'text-orange-500'
                            }`} />
                          )}
                          <span className="text-sm font-medium text-gray-900">#{rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {supplier.supplierName || supplier.supplier?.fullName || 'N/A'}
                        </div>
                        {supplier.organizationId && (
                          <div className="text-sm text-gray-500">{supplier.organizationId}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                          {supplier.supplierRole === 'manufacturer' ? 'Nhà sản xuất' :
                           supplier.supplierRole === 'distributor' ? 'Nhà phân phối' :
                           supplier.supplierRole === 'hospital' ? 'Bệnh viện' :
                           supplier.supplierRole === 'pharmacy' ? 'Nhà thuốc' :
                           'Đại lý'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-lg font-bold ${getScoreColor(supplier.trustScore)}`}>
                          {supplier.trustScore}
                        </div>
                        <div className="text-xs text-gray-500">/ 1000</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${getTrustLevelColor(supplier.trustLevel)}`}>
                          <BadgeIcon className="h-4 w-4" />
                          <span className="text-sm font-medium">{supplier.trustLevel} - {badge.text}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => viewSupplierDetail(supplier.supplier)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Chi tiết</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Trang {pagination.current} / {pagination.pages} ({pagination.total} nhà cung ứng)
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                disabled={pagination.current === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                disabled={pagination.current === pagination.pages}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedSupplier && (
        <SupplierDetailModal
          supplier={selectedSupplier}
          supplierId={selectedSupplierId}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedSupplier(null);
            setSelectedSupplierId(null);
          }}
          hasRole={hasRole}
        />
      )}
    </div>
  );
};

// Supplier Detail Modal
const SupplierDetailModal = ({ supplier, supplierId, onClose, hasRole }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper function để normalize ID (giống như trong component chính)
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
        // Nếu nestedId là object, đệ quy normalize
        if (typeof nestedId === 'object') {
          return normalizeId(nestedId, fallback);
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

  useEffect(() => {
    loadHistory();
  }, [supplier, supplierId]);

  const loadHistory = async () => {
    if (!supplier || !supplierId) return;
    
    try {
      setLoading(true);
      
      // Sử dụng supplierId đã được normalize từ component cha
      // Đảm bảo supplierId là string hợp lệ
      const validSupplierId = typeof supplierId === 'string' && supplierId !== '[object Object]' 
        ? supplierId 
        : normalizeId(supplierId);
      
      if (!validSupplierId || validSupplierId === '' || validSupplierId === '[object Object]' || typeof validSupplierId !== 'string') {
        console.error('Invalid supplier ID:', validSupplierId, 'from:', supplierId);
        toast.error('Không thể xác định ID nhà cung ứng');
        return;
      }
      
      console.log('Loading history for supplier ID:', validSupplierId);
      
      const response = await trustScoreAPI.getScoreHistory(validSupplierId);
      if (response.success) {
        setHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Load history error:', error);
      // Chỉ hiển thị toast nếu có lỗi thực sự (không phải 404)
      if (error.response?.status !== 404) {
        toast.error('Lỗi khi tải lịch sử điểm');
      }
    } finally {
      setLoading(false);
    }
  };

  const getTrustLevelColor = (level) => {
    const colors = {
      A: 'text-green-600 bg-green-100',
      B: 'text-blue-600 bg-blue-100',
      C: 'text-yellow-600 bg-yellow-100',
      D: 'text-red-600 bg-red-100'
    };
    return colors[level] || colors.C;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Chi tiết Điểm Tín Nhiệm</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Overview */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Điểm tổng thể</div>
            <div className="text-3xl font-bold text-gray-900">{supplier.trustScore || 0}</div>
            <div className="text-sm text-gray-500">/ 1000</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-1">Cấp độ</div>
            <div className={`text-2xl font-bold px-3 py-2 rounded-full inline-block ${getTrustLevelColor(supplier.trustLevel || 'C')}`}>
              {supplier.trustLevel || 'C'}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="mb-6">
          <h4 className="text-md font-semibold mb-3">Điểm chi tiết</h4>
          <div className="space-y-2">
            <ScoreBar label="Đánh giá" score={supplier.scoreBreakdown?.reviewScore || 0} max={300} />
            <ScoreBar label="Tuân thủ" score={supplier.scoreBreakdown?.complianceScore || 0} max={250} />
            <ScoreBar label="Chất lượng" score={supplier.scoreBreakdown?.qualityScore || 0} max={200} />
            <ScoreBar label="Hiệu quả" score={supplier.scoreBreakdown?.efficiencyScore || 0} max={150} />
            <ScoreBar label="Thời gian" score={supplier.scoreBreakdown?.timelinessScore || 0} max={100} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="text-md font-semibold mb-2">Thống kê đánh giá</h4>
            <div className="text-sm space-y-1">
              <div>Tổng đánh giá: {supplier.reviewStats?.totalReviews || 0}</div>
              <div>Điểm trung bình: {(supplier.reviewStats?.averageRating || 0).toFixed(1)}/5</div>
              <div>Đánh giá tích cực: {supplier.reviewStats?.positiveReviews || 0}</div>
            </div>
          </div>
          <div>
            <h4 className="text-md font-semibold mb-2">Thống kê tuân thủ</h4>
            <div className="text-sm space-y-1">
              <div>Chữ ký hợp lệ: {(supplier.complianceStats?.validSignatureRate || 0).toFixed(1)}%</div>
              <div>Nhiệm vụ đúng hạn: {(supplier.complianceStats?.onTimeTaskRate || 0).toFixed(1)}%</div>
              <div>Thuốc hợp lệ: {(supplier.complianceStats?.validDrugRate || 0).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* History */}
        <div>
          <h4 className="text-md font-semibold mb-3">Lịch sử thay đổi điểm</h4>
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Chưa có lịch sử</div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {history.slice(0, 10).map((item, index) => {
                // Tạo unique key từ timestamp và index
                const uniqueKey = item.changedAt 
                  ? `history-${new Date(item.changedAt).getTime()}-${index}`
                  : `history-${index}-${item.reason || 'unknown'}`;
                
                return (
                  <div key={uniqueKey} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.reason}</div>
                      <div className="text-xs text-gray-500">{new Date(item.changedAt).toLocaleString('vi-VN')}</div>
                    </div>
                    <div className={`text-sm font-bold ${item.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.change >= 0 ? '+' : ''}{item.change}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// Score Bar Component
const ScoreBar = ({ label, score, max }) => {
  const percentage = (score / max) * 100;
  const color = percentage >= 80 ? 'bg-green-500' :
                percentage >= 60 ? 'bg-blue-500' :
                percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-gray-600">{score} / {max}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default TrustScores;

