import React, { useState, useEffect } from 'react';
import {
  Gavel,
  CheckCircle,
  XCircle,
  Clock,
  Package,
  Building2,
  DollarSign,
  Filter,
  Search,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { bidAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Bids = () => {
  const { user } = useAuth();
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewType, setViewType] = useState('my'); // 'my' or 'received'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [selectedBid, setSelectedBid] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterNotes, setCounterNotes] = useState('');

  const isManufacturer = user?.role === 'manufacturer';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadBids();
  }, [statusFilter, viewType, page]);

  const loadBids = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20
      };

      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }

      console.log('🔍 loadBids - viewType:', viewType, 'isManufacturer:', isManufacturer, 'isAdmin:', isAdmin);
      console.log('🔍 loadBids - params:', params);

      let response;
      if (viewType === 'received' && (isManufacturer || isAdmin)) {
        console.log('🔍 Calling getManufacturerBids');
        response = await bidAPI.getManufacturerBids(params);
      } else {
        console.log('🔍 Calling getMyBids');
        response = await bidAPI.getMyBids(params);
      }

      console.log('🔍 API Response:', response);
      console.log('🔍 Response success:', response?.success);
      console.log('🔍 Response data:', response?.data);
      console.log('🔍 Bids count:', response?.data?.bids?.length || 0);

      if (response.success) {
        setBids(response.data.bids || []);
        setTotalPages(response.data.pagination?.pages || 0);
      } else {
        console.error('🔍 Response not successful:', response);
        setBids([]);
        setTotalPages(0);
      }
    } catch (error) {
      console.error('Error loading bids:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Không thể tải danh sách đấu thầu');
      setBids([]);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // Helper function để extract ID từ bid object hoặc string
  const extractBidId = (bidOrId) => {
    if (!bidOrId) return null;
    
    // Nếu là string, trả về luôn
    if (typeof bidOrId === 'string') {
      return bidOrId.trim() || null;
    }
    
    // Nếu là object
    if (typeof bidOrId === 'object') {
      // Trường hợp 1: Object có property _id (bid object)
      if (bidOrId._id) {
        const idValue = bidOrId._id;
        if (typeof idValue === 'string') return idValue.trim();
        if (idValue && typeof idValue.toString === 'function') {
          const str = idValue.toString();
          if (str && str !== '[object Object]') return str.trim();
        }
      }
      
      // Trường hợp 2: Object có property id
      if (bidOrId.id) {
        const idValue = bidOrId.id;
        if (typeof idValue === 'string') return idValue.trim();
        if (idValue && typeof idValue.toString === 'function') {
          const str = idValue.toString();
          if (str && str !== '[object Object]') return str.trim();
        }
      }
      
      // Trường hợp 3: String đã bị convert thành array-like object
      // (có các key là số: {0: '6', 1: '9', ...})
      const keys = Object.keys(bidOrId);
      if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
        // Đây là string đã bị convert thành object
        // Reconstruct string từ các ký tự
        const sortedKeys = keys.map(k => parseInt(k)).sort((a, b) => a - b);
        const reconstructed = sortedKeys.map(k => bidOrId[k]).join('');
        if (reconstructed && reconstructed.length > 0) {
          return reconstructed;
        }
      }
      
      // Trường hợp 4: Thử toString() nếu có
      if (typeof bidOrId.toString === 'function') {
        const str = bidOrId.toString();
        if (str && str !== '[object Object]') {
          return str.trim();
        }
      }
    }
    
    return null;
  };

  const handleAccept = async (bidId) => {
    try {
      const bidIdString = extractBidId(bidId);
      
      console.log('🔍 handleAccept - Original bidId:', bidId);
      console.log('🔍 handleAccept - Converted bidIdString:', bidIdString);
      
      if (!bidIdString || bidIdString === 'undefined' || bidIdString === 'null' || bidIdString === '[object Object]') {
        console.error('❌ Invalid bidId:', bidIdString);
        toast.error('ID đấu thầu không hợp lệ');
        return;
      }
      
      const response = await bidAPI.acceptBid(bidIdString);
      if (response.success) {
        toast.success('Đã chấp nhận đấu thầu');
        loadBids();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Chấp nhận đấu thầu thất bại';
      toast.error(errorMessage);
    }
  };

  const handleReject = async (bidId) => {
    if (!window.confirm('Bạn có chắc chắn muốn từ chối đấu thầu này?')) {
      return;
    }

    try {
      const bidIdString = extractBidId(bidId);
      if (!bidIdString || bidIdString === 'undefined' || bidIdString === 'null' || bidIdString === '[object Object]') {
        toast.error('ID đấu thầu không hợp lệ');
        return;
      }
      const response = await bidAPI.rejectBid(bidIdString);
      if (response.success) {
        toast.success('Đã từ chối đấu thầu');
        loadBids();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Từ chối đấu thầu thất bại';
      toast.error(errorMessage);
    }
  };

  const handleCounterOffer = async () => {
    if (!counterPrice || parseFloat(counterPrice) <= 0) {
      toast.error('Vui lòng nhập giá counter offer hợp lệ');
      return;
    }

    try {
      const bidIdString = extractBidId(selectedBid._id || selectedBid);
      if (!bidIdString || bidIdString === 'undefined' || bidIdString === 'null' || bidIdString === '[object Object]') {
        toast.error('ID đấu thầu không hợp lệ');
        return;
      }
      const response = await bidAPI.counterOffer(
        bidIdString,
        parseFloat(counterPrice),
        counterNotes
      );
      if (response.success) {
        toast.success('Đã gửi counter offer thành công');
        setShowCounterOfferModal(false);
        setSelectedBid(null);
        setCounterPrice('');
        setCounterNotes('');
        loadBids();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Gửi counter offer thất bại';
      toast.error(errorMessage);
    }
  };

  const handleCancel = async (bidId) => {
    if (!window.confirm('Bạn có chắc chắn muốn hủy đấu thầu này?')) {
      return;
    }

    try {
      const bidIdString = extractBidId(bidId);
      if (!bidIdString || bidIdString === 'undefined' || bidIdString === 'null' || bidIdString === '[object Object]') {
        toast.error('ID đấu thầu không hợp lệ');
        return;
      }
      const response = await bidAPI.cancelBid(bidIdString);
      if (response.success) {
        toast.success('Đã hủy đấu thầu');
        loadBids();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Hủy đấu thầu thất bại';
      toast.error(errorMessage);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Chờ xử lý', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      countered: { label: 'Đã gửi counter offer', className: 'bg-blue-100 text-blue-800', icon: AlertCircle },
      accepted: { label: 'Đã chấp nhận', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      rejected: { label: 'Đã từ chối', className: 'bg-red-100 text-red-800', icon: XCircle },
      expired: { label: 'Hết hạn', className: 'bg-gray-100 text-gray-800', icon: AlertCircle },
      cancelled: { label: 'Đã hủy', className: 'bg-gray-100 text-gray-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Gavel className="w-8 h-8 text-purple-600" />
                Quản lý Đấu thầu
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {viewType === 'received' 
                  ? 'Đấu thầu nhận được cho sản phẩm của bạn - Có thể Chấp nhận/Từ chối/Gửi Counter Offer' 
                  : 'Đấu thầu của bạn - Có thể Hủy đấu thầu'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* View Type Toggle (nếu là manufacturer hoặc admin) */}
            {(isManufacturer || isAdmin) && (
              <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                <button
                  onClick={() => {
                    setViewType('my');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    viewType === 'my'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Đấu thầu của tôi
                </button>
                <button
                  onClick={() => {
                    setViewType('received');
                    setPage(1);
                  }}
                  className={`px-4 py-2 rounded-md font-medium transition-colors ${
                    viewType === 'received'
                      ? 'bg-white text-purple-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Đấu thầu nhận được
                </button>
              </div>
            )}

            {/* Status Filter */}
            <div className="flex-1 flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="pending">Chờ xử lý</option>
                <option value="countered">Đã gửi counter offer</option>
                <option value="accepted">Đã chấp nhận</option>
                <option value="rejected">Đã từ chối</option>
                <option value="expired">Hết hạn</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="spinner w-12 h-12 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          </div>
        ) : bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Gavel className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Chưa có đấu thầu</p>
            <p className="text-gray-400 text-sm">
              {viewType === 'received' 
                ? 'Bạn chưa nhận được đấu thầu nào'
                : 'Bạn chưa có đấu thầu nào'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {bids.map((bid) => {
                // Convert _id to string để tránh lỗi key trùng
                const bidKey = extractBidId(bid) || extractBidId(bid._id) || JSON.stringify(bid._id) || Math.random();
                return (
                <div
                  key={bidKey}
                  className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Left: Product Info */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4">
                        {/* Product Image */}
                        <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          {bid.drugId?.imageUrl ? (
                            <img
                              src={bid.drugId.imageUrl}
                              alt={bid.drugName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {bid.drugName}
                          </h3>
                          <div className="space-y-1 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4" />
                              <span>
                                {viewType === 'received' ? (
                                  <>
                                    Người đấu thầu: <span className="font-medium">{bid.bidderName}</span>
                                    {bid.bidderOrganization && ` - ${bid.bidderOrganization}`}
                                  </>
                                ) : (
                                  <>
                                    Nhà sản xuất: <span className="font-medium">{bid.manufacturerName}</span>
                                  </>
                                )}
                              </span>
                            </div>
                            {bid.drugBatchNumber && (
                              <div>
                                Số lô: <span className="font-medium">{bid.drugBatchNumber}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Bid Info & Actions */}
                    <div className="md:w-80 space-y-4">
                      {/* Bid Details */}
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {/* Show counter offer if exists */}
                        {bid.status === 'countered' && bid.counterPrice && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-2">
                            <div className="text-xs font-semibold text-blue-700 mb-1">💰 Counter Offer:</div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">Giá đề xuất:</span>
                              <span className="text-lg font-bold text-blue-600">
                                {new Intl.NumberFormat('vi-VN', {
                                  style: 'currency',
                                  currency: 'VND'
                                }).format(bid.counterPrice)}
                              </span>
                            </div>
                            {bid.counterNotes && (
                              <div className="mt-2 text-xs text-gray-600">
                                <span className="font-medium">Ghi chú:</span> {bid.counterNotes}
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            {bid.status === 'countered' ? 'Giá đấu thầu gốc:' : 'Giá đấu thầu:'}
                          </span>
                          <span className={`text-lg font-bold ${bid.status === 'countered' ? 'text-gray-500 line-through' : 'text-purple-600'}`}>
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(bid.bidPrice)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Số lượng:</span>
                          <span className="font-semibold text-gray-900">{bid.quantity}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                          <span className="text-sm text-gray-600">Tổng giá trị:</span>
                          <span className="text-xl font-bold text-blue-600">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND'
                            }).format(bid.status === 'countered' && bid.counterPrice ? bid.counterPrice * bid.quantity : bid.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Trạng thái:</span>
                        {getStatusBadge(bid.status)}
                      </div>

                      {/* Actions - Manufacturer/Admin có thể accept/reject/counter offer */}
                      {viewType === 'received' && bid.status === 'pending' && (isManufacturer || isAdmin) && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAccept(bid._id || bid.id || bid)}
                              className="flex-1 px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <CheckCircle className="w-4 h-4" />
                              Chấp nhận
                            </button>
                            <button
                              onClick={() => handleReject(bid._id || bid.id || bid)}
                              className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                              <XCircle className="w-4 h-4" />
                              Từ chối
                            </button>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedBid(bid);
                              setCounterPrice(bid.bidPrice.toString());
                              setShowCounterOfferModal(true);
                            }}
                            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            💬 Gửi Counter Offer
                          </button>
                        </div>
                      )}

                      {/* Hint cho user ở tab "Đấu thầu của tôi" với bid pending - hướng dẫn chuyển sang tab "Đấu thầu nhận được" */}
                      {viewType === 'my' && bid.status === 'pending' && (isManufacturer || isAdmin) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <div className="font-medium mb-1">Để xử lý đấu thầu này:</div>
                              <button
                                onClick={() => {
                                  setViewType('received');
                                  setPage(1);
                                  setStatusFilter('pending');
                                }}
                                className="text-blue-600 hover:text-blue-800 font-medium underline"
                              >
                                Chuyển sang tab "Đấu thầu nhận được" →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Bidder actions for countered bid */}
                      {viewType === 'my' && bid.status === 'countered' && (
                        <div className="space-y-2">
                          <button
                            onClick={() => handleAccept(bid._id || bid.id || bid)}
                            className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Chấp nhận Counter Offer
                          </button>
                          <button
                            onClick={() => handleReject(bid._id || bid.id || bid)}
                            className="w-full px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Từ chối Counter Offer
                          </button>
                        </div>
                      )}

                      {/* Bidder có thể hủy bid pending của mình */}
                      {viewType === 'my' && bid.status === 'pending' && (
                        <div className="space-y-2">
                        <button
                            onClick={() => handleCancel(bid._id || bid.id || bid)}
                          className="w-full px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                        >
                          Hủy đấu thầu
                        </button>
                          {/* Thông báo chỉ hiển thị cho manufacturer/admin, không hiển thị cho bidder thường */}
                          {(isManufacturer || isAdmin) && (
                            <p className="text-xs text-gray-500 text-center">
                              Chuyển sang tab "Đấu thầu nhận được" để xử lý đấu thầu
                            </p>
                          )}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div className="text-xs text-gray-500">
                        Tạo: {new Date(bid.createdAt).toLocaleString('vi-VN')}
                        {bid.respondedAt && (
                          <>
                            <br />
                            Xử lý: {new Date(bid.respondedAt).toLocaleString('vi-VN')}
                          </>
                        )}
                      </div>

                      {/* Notes */}
                      {bid.notes && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Ghi chú:</span> {bid.notes}
                        </div>
                      )}

                      {bid.manufacturerNotes && (
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Ghi chú NSX:</span> {bid.manufacturerNotes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Trang {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Counter Offer Modal */}
      {showCounterOfferModal && selectedBid && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
            onClick={() => {
              setShowCounterOfferModal(false);
              setSelectedBid(null);
              setCounterPrice('');
              setCounterNotes('');
            }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Gửi Counter Offer</h2>
              
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600 mb-1">Sản phẩm:</div>
                  <div className="font-semibold text-gray-900">{selectedBid.drugName}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    Giá đấu thầu hiện tại:{' '}
                    <span className="font-medium">
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND',
                      }).format(selectedBid.bidPrice)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giá counter offer (VND) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={counterPrice}
                      onChange={(e) => setCounterPrice(e.target.value)}
                      placeholder="Nhập giá counter offer"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="1000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ghi chú (tùy chọn)
                  </label>
                  <textarea
                    value={counterNotes}
                    onChange={(e) => setCounterNotes(e.target.value)}
                    placeholder="Nhập ghi chú cho counter offer..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowCounterOfferModal(false);
                      setSelectedBid(null);
                      setCounterPrice('');
                      setCounterNotes('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCounterOffer}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Gửi Counter Offer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Bids;

