import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Package, Building2, Filter, Home, ArrowLeft } from 'lucide-react';
import { drugAPI, bidAPI } from '../utils/api';
import { useCart } from '../contexts/CartContext';
import ProductDetailModal from '../components/ProductDetailModal';
import toast from 'react-hot-toast';

const Marketplace = () => {
  const navigate = useNavigate();
  const { openCart, getTotalItems } = useCart();
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [filterManufacturer, setFilterManufacturer] = useState('');
  const [manufacturers, setManufacturers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [displayMode, setDisplayMode] = useState('auto'); // 'auto' | 'all' | 'accepted'
  const [displayModeTouched, setDisplayModeTouched] = useState(false);

  // Load drugs
  const loadDrugs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (filterManufacturer) params.append('manufacturerId', filterManufacturer);

      const response = await drugAPI.getDrugs(params);

      if (response.success) {
        // Load accepted bids để lấy giá đã được accept
        let acceptedBidsMap = {}; // Map: drug._id (ObjectId string) -> bid
        try {
          const bidsResponse = await bidAPI.getBids({ status: 'accepted', limit: 100 });
          if (bidsResponse.success && bidsResponse.data?.bids) {
            // Tạo map: drug._id -> bid accepted (lấy bid mới nhất nếu có nhiều)
            bidsResponse.data.bids.forEach((bid) => {
              // Extract drug._id từ bid.drugId (bid.drugId là reference đến Drug._id)
              let drugObjectId = null;
              if (bid.drugId) {
                // bid.drugId có thể là populated object {_id: ..., name: ...} hoặc ObjectId
                if (typeof bid.drugId === 'object' && bid.drugId._id) {
                  // Populated object - _id có thể là ObjectId hoặc string
                  let idValue = bid.drugId._id;
                  // Xử lý trường hợp _id là char array
                  if (typeof idValue === 'object' && idValue !== null) {
                    const keys = Object.keys(idValue);
                    if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
                      drugObjectId = keys.sort((a, b) => parseInt(a) - parseInt(b)).map(k => idValue[k]).join('');
                    } else if (typeof idValue.toString === 'function') {
                      const strId = idValue.toString();
                      if (strId && strId !== '[object Object]') {
                        drugObjectId = strId;
                      }
                    }
                  } else {
                    drugObjectId = String(idValue);
                  }
                } else if (typeof bid.drugId === 'object') {
                  // ObjectId object - xử lý char array
                  const keys = Object.keys(bid.drugId);
                  if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
                    drugObjectId = keys.sort((a, b) => parseInt(a) - parseInt(b)).map(k => bid.drugId[k]).join('');
                  } else if (typeof bid.drugId.toString === 'function') {
                    const strId = bid.drugId.toString();
                    if (strId && strId !== '[object Object]') {
                      drugObjectId = strId;
                    }
                  } else {
                    drugObjectId = String(bid.drugId);
                  }
                } else if (typeof bid.drugId === 'string') {
                  // String ObjectId
                  drugObjectId = bid.drugId;
                }
              }
              
              // Normalize drugObjectId để đảm bảo format nhất quán
              if (drugObjectId && drugObjectId !== '[object Object]') {
                // Đảm bảo drugObjectId là string và trim
                drugObjectId = String(drugObjectId).trim();
                
                // Lấy bid mới nhất (theo respondedAt hoặc createdAt)
                const bidDate = bid.respondedAt ? new Date(bid.respondedAt) : new Date(bid.createdAt || 0);
                const existingBid = acceptedBidsMap[drugObjectId];
                if (!existingBid || bidDate > new Date(existingBid.respondedAt || existingBid.createdAt || 0)) {
                  acceptedBidsMap[drugObjectId] = bid;
                  console.log('✅ Mapped accepted bid:', {
                    bidId: bid._id,
                    drugId: drugObjectId,
                    drugIdLength: drugObjectId.length,
                    drugName: bid.drugId?.name || 'N/A'
                  });
                }
              } else {
                console.warn('⚠️ Could not extract drugId from bid:', bid._id, 'bid.drugId:', bid.drugId, 'type:', typeof bid.drugId);
              }
            });
            console.log('🔍 Accepted bids loaded:', Object.keys(acceptedBidsMap).length, 'bids');
            console.log('🔍 Accepted bids drugIds:', Object.keys(acceptedBidsMap));
            // Log chi tiết từng entry trong map
            Object.entries(acceptedBidsMap).forEach(([key, bid]) => {
              console.log('🔍 Map entry:', {
                key: key,
                keyType: typeof key,
                keyLength: key.length,
                bidId: bid._id,
                drugName: bid.drugId?.name || 'N/A',
                drugIdInBid: bid.drugId?._id || bid.drugId
              });
            });
          }
        } catch (bidsError) {
          console.warn('Không thể load accepted bids:', bidsError);
          // Không block nếu không load được bids, chỉ dùng giá gốc
        }
        
        const acceptedCount = Object.keys(acceptedBidsMap).length;
        // Auto chọn chế độ hiển thị: nếu có accepted bids thì ưu tiên chỉ hiển thị thuốc đã chốt giá
        if (!displayModeTouched && displayMode === 'auto') {
          setDisplayMode(acceptedCount > 0 ? 'accepted' : 'all');
        }

        // Transform drugs to marketplace format
        const marketplaceDrugs = response.data.drugs.map((drug) => {
          // Lấy drug._id (ObjectId) để match với bids
          // bid.drugId trỏ đến Drug._id, không phải Drug.drugId (string)
          let drugObjectId = null;
          if (drug._id) {
            // drug._id là MongoDB ObjectId - normalize để match (giống logic extract từ bid)
            if (typeof drug._id === 'object' && drug._id !== null) {
              // Xử lý ObjectId object hoặc char array
              const keys = Object.keys(drug._id);
              if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
                // Char array
                drugObjectId = keys.sort((a, b) => parseInt(a) - parseInt(b)).map(k => drug._id[k]).join('');
              } else if (typeof drug._id.toString === 'function') {
                const strId = drug._id.toString();
                if (strId && strId !== '[object Object]') {
                  drugObjectId = strId.trim();
                } else {
                  drugObjectId = String(drug._id).trim();
                }
              } else {
                drugObjectId = String(drug._id).trim();
              }
            } else {
              drugObjectId = String(drug._id).trim();
            }
          }
          
          // Normalize để đảm bảo format nhất quán
          if (drugObjectId) {
            drugObjectId = drugObjectId.trim();
          }
          
          // Kiểm tra xem có bid accepted không (match theo _id - chỉ cho lô thuốc cụ thể này)
          const acceptedBid = drugObjectId ? acceptedBidsMap[drugObjectId] : null;
          
          // Debug logging - log tất cả để tìm vấn đề
          if (drugObjectId && Object.keys(acceptedBidsMap).length > 0) {
            const mapKeys = Object.keys(acceptedBidsMap);
            const foundInMap = mapKeys.includes(drugObjectId);
            if (foundInMap) {
              console.log('✅ Found accepted bid for drug:', drug.name, 'drugId:', drugObjectId);
            } else {
              // Log để debug tại sao không match
              console.log('🔍 Drug not matched:', {
                drugName: drug.name,
                drugId: drugObjectId,
                drugIdType: typeof drugObjectId,
                mapKeys: mapKeys.slice(0, 3), // Show first 3 keys
                mapKeysCount: mapKeys.length
              });
            }
          }
          
          // Lấy giá đấu giá nếu có bid accepted cho lô thuốc này
          const acceptedBidPrice = acceptedBid ? (acceptedBid.counterPrice || acceptedBid.bidPrice) : null;
          
          // Nếu có bid accepted cho lô thuốc này, dùng giá đấu giá
          // Nếu không có bid accepted, giá đấu thầu là 0
          let wholesalePrice;
          if (acceptedBidPrice) {
            // Có bid accepted cho lô thuốc này -> hiển thị giá đấu giá
            wholesalePrice = acceptedBidPrice;
          } else {
            // Không có bid accepted -> giá đấu thầu là 0
            wholesalePrice = 0;
          }
          
          return {
            ...drug,
            wholesalePrice: wholesalePrice, // Giá đấu giá nếu có bid accepted, nếu không thì giá gốc
            acceptedBidPrice: acceptedBidPrice, // Lưu giá bid để tham khảo
            hasAcceptedBid: !!acceptedBid,
            minOrderQuantity: drug.minOrderQuantity || drug.moq || 1,
            manufacturerName:
              drug.manufacturerId?.organizationInfo?.name ||
              drug.manufacturerId?.fullName ||
              drug.manufacturerName ||
              'Chưa có thông tin',
          };
        });
        
        // Lọc theo displayMode
        const effectiveMode = displayMode === 'auto' ? (acceptedCount > 0 ? 'accepted' : 'all') : displayMode;
        const filteredDrugs =
          effectiveMode === 'accepted'
            ? marketplaceDrugs.filter((d) => {
                const hasBid = d.hasAcceptedBid;
                if (!hasBid) {
                  console.log('❌ Drug filtered out (no accepted bid):', d.name, 'drugId:', d._id);
                }
                return hasBid;
              })
            : marketplaceDrugs;
        
        console.log('🔍 Filter mode:', effectiveMode, 'Total drugs:', marketplaceDrugs.length, 'Filtered:', filteredDrugs.length);
        console.log('🔍 Drugs with accepted bids:', marketplaceDrugs.filter(d => d.hasAcceptedBid).map(d => ({ name: d.name, id: d._id })));
        
        setDrugs(filteredDrugs);
        // Nếu chỉ hiển thị accepted thì pagination từ API drugs không còn chính xác -> đặt về 1 trang để tránh hiểu nhầm
        setTotalPages(effectiveMode === 'accepted' ? 1 : (response.data.pagination?.pages || 1));
      }
    } catch (error) {
      console.error('Error loading drugs:', error);
      toast.error('Không thể tải danh sách sản phẩm');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterManufacturer, displayMode, displayModeTouched]);

  // Load manufacturers for filter
  useEffect(() => {
    const loadManufacturers = async () => {
      try {
        // Get unique manufacturers from drugs - sử dụng limit 100 (giới hạn của backend)
        const response = await drugAPI.getDrugs({ limit: 100 });
        if (response.success && response.data.drugs) {
          const uniqueManufacturers = [
            ...new Map(
              response.data.drugs
                .filter((drug) => drug.manufacturerId)
                .map((drug) => {
                  const manufacturerId = drug.manufacturerId?._id || drug.manufacturerId;
                  const idStr = typeof manufacturerId === 'object' && manufacturerId?.toString 
                    ? manufacturerId.toString() 
                    : String(manufacturerId || '');
                  
                  return [
                    idStr,
                    {
                      id: idStr,
                      name:
                        drug.manufacturerId?.organizationInfo?.name ||
                        drug.manufacturerId?.fullName ||
                        'Chưa có thông tin',
                    },
                  ];
                })
            ).values(),
          ];
          setManufacturers(uniqueManufacturers);
        }
      } catch (error) {
        console.error('Error loading manufacturers:', error);
      }
    };
    loadManufacturers();
  }, []);

  useEffect(() => {
    loadDrugs();
  }, [loadDrugs]);

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleAddToCart = (product, quantity = 1) => {
    const minOrderQuantity = product.minOrderQuantity || product.moq || 1;
    if (quantity < minOrderQuantity) {
      toast.error(`Số lượng tối thiểu là ${minOrderQuantity}`);
      return;
    }

    // This will be handled by ProductDetailModal, but we can also add quick add here
    toast.success('Mở modal để thêm vào giỏ hàng');
    handleProductClick(product);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                title="Quay lại"
              >
                <ArrowLeft className="w-6 h-6 text-gray-700" />
              </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">B2B Marketplace</h1>
              <p className="text-sm text-gray-600 mt-1">
                Mua sỉ trực tiếp từ nhà sản xuất
              </p>
              </div>
            </div>
            <button
              onClick={openCart}
              className="relative px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>Giỏ hàng</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white border-b border-gray-200 sticky top-[88px] z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Manufacturer Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={filterManufacturer}
                onChange={(e) => {
                  setFilterManufacturer(e.target.value);
                  setPage(1);
                }}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
              >
                <option value="">Tất cả nhà sản xuất</option>
                {manufacturers.map((mfg) => (
                  <option key={mfg.id} value={mfg.id}>
                    {mfg.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Display Mode */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                value={displayMode}
                onChange={(e) => {
                  setDisplayModeTouched(true);
                  setDisplayMode(e.target.value);
                  setPage(1);
                }}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
                title="Chọn chế độ hiển thị"
              >
                <option value="auto">Tự động</option>
                <option value="accepted">Chỉ thuốc đã chốt giá (accepted)</option>
                <option value="all">Tất cả sản phẩm</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="spinner w-12 h-12 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải sản phẩm...</p>
            </div>
          </div>
        ) : drugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Package className="w-16 h-16 text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-2">Không tìm thấy sản phẩm</p>
            <p className="text-gray-400 text-sm">
              Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {drugs.map((drug, index) => {
                // Đảm bảo key luôn là string unique
                // Chỉ dùng ID nếu nó là string hợp lệ, còn không thì dùng index
                const drugId = drug._id || drug.drugId || drug.id;
                let uniqueKey = `drug-${index}`; // Fallback: luôn dùng index để đảm bảo unique
                
                if (drugId) {
                  if (typeof drugId === 'string' && drugId.trim() && drugId !== '[object Object]') {
                    uniqueKey = drugId;
                  } else if (typeof drugId === 'object' && drugId !== null) {
                    // Nếu là object, thử lấy _id nếu là string
                    if (drugId._id && typeof drugId._id === 'string' && drugId._id.trim()) {
                      uniqueKey = drugId._id;
                    }
                    // Nếu không thể extract ID hợp lệ, dùng index (đã set ở trên)
                  }
                }
                
                return (
                <div
                  key={uniqueKey}
                  className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200 overflow-hidden cursor-pointer flex flex-col h-full"
                  onClick={() => handleProductClick(drug)}
                >
                  {/* Product Image */}
                  <div className="w-full aspect-square bg-gray-100 overflow-hidden flex-shrink-0">
                    {drug.imageUrl || drug.qrCode?.imageUrl ? (
                      <img
                        src={drug.imageUrl || drug.qrCode?.imageUrl}
                        alt={drug.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Package className="w-16 h-16" />
                      </div>
                    )}
                  </div>

                  {/* Product Info - flex-1 để chiếm không gian còn lại */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1 min-h-[3rem]">
                          {drug.name}
                        </h3>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{drug.manufacturerName}</span>
                        </div>
                      </div>

                      {/* Price and MOQ */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Giá bán buôn:</span>
                          <span className="text-lg font-bold text-blue-600">
                            {new Intl.NumberFormat('vi-VN', {
                              style: 'currency',
                              currency: 'VND',
                            }).format(drug.wholesalePrice || drug.basePrice || 0)}
                          </span>
                        </div>
                        
                        {/* Bulk Pricing (Tiered Pricing) */}
                        {drug.priceTiers && drug.priceTiers.length > 0 && (
                          <div className="relative group">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Tooltip sẽ hiển thị khi hover
                              }}
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 underline cursor-pointer"
                            >
                              <span>💡 Giá theo khối lượng</span>
                            </button>
                            <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-10 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
                              <div className="text-xs font-semibold text-gray-700 mb-2">Bảng giá ưu đãi:</div>
                              <div className="space-y-1">
                                {[...drug.priceTiers].sort((a, b) => a.minQty - b.minQty).map((tier, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-xs">
                                    <span className="text-gray-600">
                                      {tier.minQty}+ đơn vị:
                                    </span>
                                    <span className="font-semibold text-green-600">
                                      {new Intl.NumberFormat('vi-VN', {
                                        style: 'currency',
                                        currency: 'VND',
                                      }).format(tier.price)}
                                    </span>
                                    {tier.discount > 0 && (
                                      <span className="text-xs text-green-600 ml-1">
                                        (-{tier.discount}%)
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">MOQ:</span>
                          <span className="font-medium text-gray-700">
                            {drug.minOrderQuantity} {drug.packaging?.unit || 'đơn vị'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Add to Cart Button - luôn ở dưới cùng */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(drug);
                      }}
                      className="w-full mt-4 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Thêm vào giỏ
                    </button>
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

      {/* Product Detail Modal */}
      {showProductModal && selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={showProductModal}
          onClose={() => {
            setShowProductModal(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
};

export default Marketplace;
