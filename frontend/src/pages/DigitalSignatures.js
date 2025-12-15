import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  FileSignature,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  X,
  Shield,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { digitalSignatureAPI, drugAPI } from '../utils/api';
import toast from 'react-hot-toast';

const DigitalSignatures = () => {
  const { user } = useAuth();
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [revokeReason, setRevokeReason] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [signing, setSigning] = useState(false);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTargetType, setFilterTargetType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [drugs, setDrugs] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Helper function để chuẩn hóa ID - đảm bảo luôn trả về string ObjectId hợp lệ
  const normalizeId = (id, fallback = null) => {
    if (!id) return fallback;
    
    // Nếu đã là string, kiểm tra xem có phải ObjectId hợp lệ không
    if (typeof id === 'string') {
      // ObjectId MongoDB có 24 ký tự hex
      if (/^[0-9a-fA-F]{24}$/.test(id)) {
        return id;
      }
      // Nếu không phải ObjectId hợp lệ, trả về null thay vì fallback
      return null;
    }
    
    // Nếu là object, thử lấy _id hoặc id
    if (typeof id === 'object' && id !== null) {
      // Nếu có _id, đệ quy normalize nó
      if (id._id) {
        const normalized = normalizeId(id._id);
        if (normalized) return normalized;
      }
      // Nếu có id
      if (id.id) {
        const normalized = normalizeId(id.id);
        if (normalized) return normalized;
      }
      
      // Thử toString() nếu có
      if (id.toString && typeof id.toString === 'function') {
        const str = id.toString();
        if (str !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(str)) {
          return str;
        }
      }
      
      // Nếu là object với các keys như '0', '1', '2'... (char array)
      const keys = Object.keys(id);
      if (keys.length > 0 && keys.every(key => /^\d+$/.test(key))) {
        const normalized = keys
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => id[key])
          .join('');
        if (/^[0-9a-fA-F]{24}$/.test(normalized)) {
          return normalized;
        }
      }
    }
    
    // Cuối cùng, thử convert sang string
    const str = String(id);
    if (/^[0-9a-fA-F]{24}$/.test(str)) {
      return str;
    }
    
    return null;
  };

  // Helper function để tạo Etherscan URL từ network và transaction hash
  const getEtherscanUrl = (network, transactionHash) => {
    if (!transactionHash || !network || network === 'mock' || network === 'development') {
      return null;
    }
    
    const hash = transactionHash.startsWith('0x') ? transactionHash : `0x${transactionHash}`;
    
    const networkUrls = {
      'mainnet': 'https://etherscan.io',
      'sepolia': 'https://sepolia.etherscan.io',
      'bsc_mainnet': 'https://bscscan.com',
      'bsc_testnet': 'https://testnet.bscscan.com',
      'polygon_mainnet': 'https://polygonscan.com',
      'polygon_mumbai': 'https://mumbai.polygonscan.com',
      'arbitrum_one': 'https://arbiscan.io',
      'arbitrum_sepolia': 'https://sepolia.arbiscan.io',
      'optimism_mainnet': 'https://optimistic.etherscan.io',
      'optimism_sepolia': 'https://sepolia-optimism.etherscan.io'
    };
    
    const baseUrl = networkUrls[network];
    if (!baseUrl) {
      return null;
    }
    
    return `${baseUrl}/tx/${hash}`;
  };

  useEffect(() => {
    loadSignatures();
    loadStats();
    if (user?.role === 'manufacturer' || user?.role === 'admin') {
      loadDrugs();
    }
  }, [user, page, filterStatus, filterTargetType, searchTerm]);

  // Reset page về 1 khi filter thay đổi
  useEffect(() => {
    setPage(1);
  }, [filterStatus, filterTargetType, searchTerm]);

  const loadSignatures = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(filterStatus && filterStatus !== 'all' && { status: filterStatus }),
        ...(filterTargetType && filterTargetType !== 'all' && { targetType: filterTargetType }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await digitalSignatureAPI.getSignatures(params);
      // Kiểm tra response structure
      if (response && response.success) {
        // response.data có thể là array hoặc object với data property
        const data = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.data || response.data || []);
        setSignatures(Array.isArray(data) ? data : []);
        setTotalPages(response.pagination?.pages || response.data?.pagination?.pages || 1);
      } else {
        setSignatures([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading signatures:', error);
      toast.error('Không thể tải danh sách chữ ký số');
      setSignatures([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await digitalSignatureAPI.getStats();
      if (response.success && response.data) {
        setStats({
          total: response.data.total || 0,
          active: response.data.active || 0,
          expired: response.data.expired || 0,
          revoked: response.data.revoked || 0
        });
      } else {
        setStats({
          total: 0,
          active: 0,
          expired: 0,
          revoked: 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        total: 0,
        active: 0,
        expired: 0,
        revoked: 0
      });
    }
  };

  const loadDrugs = async () => {
    try {
      const response = await drugAPI.getDrugs({ limit: 100 });
      if (response.success) {
        // response.data có thể là object với drugs array hoặc trực tiếp là array
        const drugsData = response.data?.drugs || response.data || [];
        console.log('Loaded drugs data:', drugsData.length, 'items');
        
        // Normalize _id thành string để tránh lỗi [object Object]
        const normalizedDrugs = (Array.isArray(drugsData) ? drugsData : []).map(drug => {
          const validId = drug.id && drug.id !== '[object Object]' && typeof drug.id === 'string' && drug.id.length >= 20
            ? drug.id
            : normalizeId(drug._id || drug.id);
          
          if (!validId || validId === '[object Object]' || validId.length < 20) {
            console.warn('Invalid drug ID after normalization:', {
              originalId: drug._id,
              originalIdType: typeof drug._id,
              normalizedId: validId,
              drug: drug
            });
          }
          
          return {
            ...drug,
            _id: validId || drug._id,
            id: validId || drug.id
          };
        }).filter(drug => drug._id && drug._id !== '[object Object]' && drug._id.length >= 20);
        
        console.log('Normalized drugs:', normalizedDrugs.length, 'valid items');
        setDrugs(normalizedDrugs);
      } else {
        console.warn('Failed to load drugs:', response);
        setDrugs([]);
      }
    } catch (error) {
      console.error('Error loading drugs:', error);
      toast.error('Không thể tải danh sách thuốc: ' + (error.response?.data?.message || error.message));
      setDrugs([]);
    }
  };

  const handleSign = async (data) => {
    try {
      setSigning(true);
      
      console.log('Signing document with data:', data);
      
      // Normalize targetId để đảm bảo là string ObjectId hợp lệ
      const normalizedTargetId = normalizeId(data.targetId);
      if (!normalizedTargetId) {
        console.error('Invalid targetId:', data.targetId, 'Type:', typeof data.targetId);
        toast.error('ID đối tượng không hợp lệ. Vui lòng chọn lại đối tượng.');
        setSigning(false);
        return;
      }
      
      console.log('Normalized targetId:', normalizedTargetId, 'Original:', data.targetId);
      
      const signData = {
        targetType: data.targetType,
        targetId: normalizedTargetId,
        options: {
          caProvider: data.caProvider || 'vnca',
          requireTimestamp: data.requireTimestamp !== false,
          purpose: data.purpose
        }
      };
      
      console.log('Sending sign request:', signData);
      
      const response = await digitalSignatureAPI.signDocument(signData);
      console.log('Sign response:', response);

      if (response && response.success) {
        toast.success('Ký số thành công!');
        setShowSignModal(false);
        reset();
        loadSignatures();
        loadStats();
      } else {
        console.error('Sign failed:', response);
        toast.error(response?.message || 'Không thể ký số');
      }
    } catch (error) {
      console.error('Error signing document:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        targetId: data?.targetId
      });
      toast.error(error.response?.data?.message || error.message || 'Không thể ký số');
    } finally {
      setSigning(false);
    }
  };

  const handleVerify = async (signatureId) => {
    try {
      setVerifying(true);
      
      // Chuẩn hóa signatureId - đảm bảo là ObjectId hợp lệ
      const normalizedId = normalizeId(signatureId);
      
      if (!normalizedId) {
        console.error('Invalid signatureId:', signatureId);
        toast.error('signatureId không hợp lệ');
        return;
      }
      
      console.log('Verifying signature with ID:', normalizedId);
      
      const response = await digitalSignatureAPI.verifySignature({
        signatureId: normalizedId
      });

      if (response.success && response.data?.valid) {
        toast.success('Chữ ký số hợp lệ!');
      } else {
        toast.error(response.data?.message || response.message || 'Chữ ký số không hợp lệ');
      }
    } catch (error) {
      console.error('Error verifying signature:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Không thể xác thực chữ ký số';
      toast.error(errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleRevoke = (id) => {
    // Chuẩn hóa ID trước khi tìm signature
    const normalizedId = normalizeId(id);
    if (!normalizedId) {
      console.error('Invalid ID for revoke:', id);
      toast.error('ID chữ ký số không hợp lệ');
      return;
    }
    
    const signature = signatures.find(sig => {
      const sigId = normalizeId(sig._id);
      return sigId === normalizedId;
    });
    
    if (!signature) {
      toast.error('Không tìm thấy chữ ký số');
      return;
    }
    
    setSelectedSignature(signature);
    setRevokeReason('');
    setShowRevokeModal(true);
  };

  const confirmRevoke = async () => {
    if (!revokeReason.trim()) {
      toast.error('Vui lòng nhập lý do thu hồi');
      return;
    }

    if (!selectedSignature) return;

    try {
      setRevoking(true);
      const response = await digitalSignatureAPI.revokeSignature(selectedSignature._id, revokeReason);
      if (response.success) {
        toast.success('Thu hồi chữ ký số thành công');
        setShowRevokeModal(false);
        setRevokeReason('');
        setSelectedSignature(null);
        loadSignatures();
        loadStats();
      }
    } catch (error) {
      console.error('Error revoking signature:', error);
      toast.error(error.response?.data?.message || 'Không thể thu hồi chữ ký số');
    } finally {
      setRevoking(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Hoạt động' },
      revoked: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Đã thu hồi' },
      expired: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Hết hạn' },
      invalid: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Không hợp lệ' }
    };
    const badge = badges[status] || badges.invalid;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getTargetTypeLabel = (type) => {
    const labels = {
      drug: 'Lô thuốc',
      supplyChain: 'Chuỗi cung ứng',
      qualityTest: 'Kiểm định chất lượng',
      recall: 'Thu hồi',
      distribution: 'Phân phối',
      other: 'Khác'
    };
    return labels[type] || type;
  };

  // Helper function để lấy tên/ID của đối tượng được ký
  const getTargetDisplayName = (signature) => {
    if (!signature.targetId) return 'N/A';
    
    // Nếu targetId là string (ObjectId), trả về nó
    if (typeof signature.targetId === 'string') {
      return signature.targetId;
    }
    
    // Nếu targetId là object (đã populate)
    if (typeof signature.targetId === 'object') {
      switch (signature.targetType) {
        case 'drug':
          return signature.targetId.name || signature.targetId.drugId || signature.targetId.batchNumber || signature.targetId._id || 'N/A';
        case 'supplyChain':
          return signature.targetId.drugId || signature.targetId._id || 'N/A';
        case 'qualityTest':
          return signature.targetId.testResult || signature.targetId._id || 'N/A';
        default:
          return signature.targetId._id || String(signature.targetId);
      }
    }
    
    return 'N/A';
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FileSignature className="w-8 h-8" />
          Quản lý Chữ ký số
        </h1>
        <p className="text-gray-600">
          Ký số và xác thực tài liệu theo chuẩn Việt Nam (CA quốc gia) với Timestamp Authority
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Tổng số chữ ký</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Đang hoạt động</div>
          <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Đã hết hạn</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.expired || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Đã thu hồi</div>
          <div className="text-2xl font-bold text-red-600">{stats.revoked || 0}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus || ''}
              onChange={(e) => {
                const newStatus = e.target.value;
                setFilterStatus(newStatus === '' ? '' : newStatus);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="revoked">Đã thu hồi</option>
              <option value="expired">Hết hạn</option>
              <option value="invalid">Không hợp lệ</option>
            </select>
            <select
              value={filterTargetType || ''}
              onChange={(e) => {
                const newType = e.target.value;
                setFilterTargetType(newType === '' ? '' : newType);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả loại</option>
              <option value="drug">Lô thuốc</option>
              <option value="supplyChain">Chuỗi cung ứng</option>
              <option value="qualityTest">Kiểm định</option>
            </select>
          </div>
          {(user?.role === 'admin' || user?.role === 'manufacturer' || user?.role === 'distributor' || user?.role === 'hospital') && (
            <button
              onClick={() => setShowSignModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FileSignature className="w-5 h-5" />
              Ký số mới
            </button>
          )}
        </div>
      </div>

      {/* Signatures List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : signatures.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có chữ ký số nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đối tượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người ký</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CA Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blockchain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày ký</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {signatures.map((sig, index) => {
                  // Đảm bảo key luôn là string hợp lệ
                  const sigId = normalizeId(sig._id);
                  const uniqueKey = sigId || `signature-${index}-${Date.now()}`;
                  
                  return (
                  <tr key={uniqueKey} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{getTargetTypeLabel(sig.targetType)}</div>
                      <div className="text-xs text-gray-500">{getTargetDisplayName(sig)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{sig.signedByName}</div>
                      <div className="text-xs text-gray-500">{sig.signedByRole}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{sig.certificate?.caName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{sig.certificate?.serialNumber?.substring(0, 20)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      {sig.timestamp?.timestampStatus === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Đã timestamp
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Chưa timestamp</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {sig.blockchain?.transactionHash ? (
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const etherscanUrl = sig.blockchain?.etherscanUrl || 
                                getEtherscanUrl(sig.blockchain?.network, sig.blockchain.transactionHash);
                              return etherscanUrl ? (
                                <a
                                  href={etherscanUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  title="Xem trên Etherscan"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span>Etherscan</span>
                                </a>
                              ) : (
                                <span className="text-gray-500 text-xs">Chưa có link</span>
                              );
                            })()}
                          </div>
                          <div className="text-xs font-mono text-gray-600 break-all" title={sig.blockchain.transactionHash}>
                            {sig.blockchain.transactionHash}
                          </div>
                          {sig.blockchain?.blockNumber && (
                            <div className="text-xs text-gray-500">
                              Block: {sig.blockchain.blockNumber}
                            </div>
                          )}
                          {sig.blockchain?.network && (
                            <div className="text-xs text-gray-500">
                              Network: {sig.blockchain.network}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">Chưa lưu</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(sig.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sig.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSignature(sig);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => {
                            const id = normalizeId(sig._id);
                            if (id) {
                              handleVerify(id);
                            } else {
                              toast.error('Không thể xác định ID chữ ký số');
                            }
                          }}
                          disabled={verifying || !sigId}
                          className="text-green-600 hover:text-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Xác thực"
                        >
                          <Shield className="w-5 h-5" />
                        </button>
                        {(user?.role === 'admin' || sig.signedBy?._id === user?.id) && sig.status === 'active' && (
                          <button
                            onClick={() => {
                              const id = normalizeId(sig._id);
                              if (id) {
                                handleRevoke(id);
                              } else {
                                toast.error('Không thể xác định ID chữ ký số');
                              }
                            }}
                            disabled={!sigId}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Thu hồi"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-4 py-2">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Ký số tài liệu</h2>
              <button onClick={() => setShowSignModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleSign)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại đối tượng *</label>
                <select
                  {...register('targetType', { required: 'Vui lòng chọn loại đối tượng' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn loại</option>
                  <option value="drug">Lô thuốc</option>
                  <option value="supplyChain">Chuỗi cung ứng</option>
                  <option value="qualityTest">Kiểm định chất lượng</option>
                </select>
                {errors.targetType && (
                  <p className="text-red-500 text-sm mt-1">{errors.targetType.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng *</label>
                <select
                  {...register('targetId', { required: 'Vui lòng chọn đối tượng' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn đối tượng</option>
                  {Array.isArray(drugs) && drugs.map((drug) => {
                    // Normalize ID để đảm bảo là string hợp lệ
                    const drugId = drug.id && drug.id !== '[object Object]' && typeof drug.id === 'string'
                      ? drug.id
                      : normalizeId(drug._id || drug.id);
                    
                    if (!drugId || drugId === '[object Object]') {
                      console.warn('Invalid drug ID, skipping:', drug);
                      return null;
                    }
                    
                    return (
                      <option key={drugId} value={drugId}>
                        {drug.name} - {drug.batchNumber}
                      </option>
                    );
                  })}
                </select>
                {errors.targetId && (
                  <p className="text-red-500 text-sm mt-1">{errors.targetId.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CA Provider</label>
                <select
                  {...register('caProvider')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vnca">CA Quốc gia Việt Nam</option>
                  <option value="viettel-ca">Viettel CA</option>
                  <option value="fpt-ca">FPT CA</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('requireTimestamp')}
                  defaultChecked
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Yêu cầu Timestamp Authority (TSA)</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mục đích</label>
                <textarea
                  {...register('purpose')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mục đích ký số (tùy chọn)"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={signing}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {signing ? 'Đang ký số...' : 'Ký số'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Chi tiết chữ ký số</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Loại đối tượng</label>
                  <div className="text-gray-900">{getTargetTypeLabel(selectedSignature.targetType)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Đối tượng được ký</label>
                  <div className="text-gray-900">{getTargetDisplayName(selectedSignature)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Người ký</label>
                  <div className="text-gray-900">{selectedSignature.signedByName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">CA Provider</label>
                  <div className="text-gray-900">{selectedSignature.certificate?.caName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Số seri chứng chỉ</label>
                  <div className="text-gray-900 font-mono text-xs">{selectedSignature.certificate?.serialNumber}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Trạng thái chứng chỉ</label>
                  <div className="text-gray-900">{selectedSignature.certificate?.certificateStatus}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Timestamp</label>
                  <div className="text-gray-900">
                    {selectedSignature.timestamp?.timestampStatus === 'verified' ? (
                      <span className="text-green-600">Đã timestamp</span>
                    ) : (
                      <span className="text-gray-400">Chưa timestamp</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Blockchain</label>
                  <div className="text-gray-900">
                    {selectedSignature.blockchain?.transactionHash ? (
                      <div className="space-y-2">
                        {(() => {
                          const etherscanUrl = selectedSignature.blockchain?.etherscanUrl || 
                            getEtherscanUrl(selectedSignature.blockchain?.network, selectedSignature.blockchain.transactionHash);
                          return etherscanUrl ? (
                            <a
                              href={etherscanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Xem trên Etherscan
                            </a>
                          ) : (
                            <span className="text-gray-500 text-sm">Chưa có link Etherscan</span>
                          );
                        })()}
                        <div className="bg-gray-50 p-3 rounded border">
                          <div className="text-xs text-gray-600 mb-1">Transaction Hash:</div>
                          <div className="font-mono text-xs break-all text-gray-900">
                            {selectedSignature.blockchain.transactionHash}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {selectedSignature.blockchain.blockNumber && (
                            <div>
                              <span className="text-gray-600">Block:</span>{' '}
                              <span className="font-medium">{selectedSignature.blockchain.blockNumber}</span>
                            </div>
                          )}
                          {selectedSignature.blockchain.network && (
                            <div>
                              <span className="text-gray-600">Network:</span>{' '}
                              <span className="font-medium">{selectedSignature.blockchain.network}</span>
                            </div>
                          )}
                          {selectedSignature.blockchain.timestamp && (
                            <div>
                              <span className="text-gray-600">Timestamp:</span>{' '}
                              <span className="font-medium">
                                {new Date(selectedSignature.blockchain.timestamp).toLocaleString('vi-VN')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Chưa lưu lên blockchain</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Ngày ký</label>
                  <div className="text-gray-900">
                    {new Date(selectedSignature.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Trạng thái</label>
                  <div>{getStatusBadge(selectedSignature.status)}</div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Data Hash</label>
                <div className="text-gray-900 font-mono text-xs break-all bg-gray-50 p-2 rounded">
                  {selectedSignature.dataHash}
                </div>
              </div>
              {selectedSignature.certificate?.certificateInfo && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Thông tin chứng chỉ</label>
                  <div className="bg-gray-50 p-4 rounded space-y-2 text-sm">
                    <div><strong>Subject:</strong> {selectedSignature.certificate.certificateInfo.subject}</div>
                    <div><strong>Issuer:</strong> {selectedSignature.certificate.certificateInfo.issuer}</div>
                    <div><strong>Valid From:</strong> {new Date(selectedSignature.certificate.certificateInfo.validFrom).toLocaleString('vi-VN')}</div>
                    <div><strong>Valid To:</strong> {new Date(selectedSignature.certificate.certificateInfo.validTo).toLocaleString('vi-VN')}</div>
                    <div><strong>Algorithm:</strong> {selectedSignature.certificate.certificateInfo.algorithm}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revoke Modal */}
      {showRevokeModal && selectedSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-red-600">Thu hồi chữ ký số</h2>
              <button 
                onClick={() => {
                  setShowRevokeModal(false);
                  setRevokeReason('');
                  setSelectedSignature(null);
                }}
                disabled={revoking}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Đối tượng được ký
                </label>
                <div className="text-gray-900 bg-gray-50 p-2 rounded">
                  {getTargetTypeLabel(selectedSignature.targetType)} - {getTargetDisplayName(selectedSignature)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lý do thu hồi <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  rows={4}
                  disabled={revoking}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  placeholder="Nhập lý do thu hồi chữ ký số..."
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={confirmRevoke}
                  disabled={revoking || !revokeReason.trim()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {revoking ? 'Đang xử lý...' : 'Xác nhận thu hồi'}
                </button>
                <button
                  onClick={() => {
                    setShowRevokeModal(false);
                    setRevokeReason('');
                    setSelectedSignature(null);
                  }}
                  disabled={revoking}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalSignatures;

