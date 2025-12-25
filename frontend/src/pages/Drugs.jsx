import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  QrCode,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { QRCode } from 'react-qr-code';
import { useAuth } from '../contexts/AuthContext';
import api, { drugAPI } from '../utils/api';

const StatCard = ({ label, value, icon: Icon, tone = 'blue' }) => {
  const toneMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-200' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', ring: 'ring-green-200' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', ring: 'ring-red-200' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-200' }
  };

  const style = toneMap[tone] || toneMap.blue;
  const displayValue = typeof value === 'number' ? value.toLocaleString('vi-VN') : (value || 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{displayValue}</p>
        </div>
        <div className={`h-11 w-11 rounded-xl ${style.bg} ring-1 ${style.ring} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${style.icon}`} />
        </div>
      </div>
    </div>
  );
};

const IconButton = ({ onClick, title, children, tone = 'gray', disabled = false }) => {
  const toneMap = {
    gray: 'text-gray-700 hover:text-gray-900 hover:bg-gray-100',
    blue: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
    green: 'text-green-600 hover:text-green-800 hover:bg-green-50',
    red: 'text-red-600 hover:text-red-800 hover:bg-red-50',
    orange: 'text-orange-600 hover:text-orange-800 hover:bg-orange-50',
    purple: 'text-purple-600 hover:text-purple-800 hover:bg-purple-50'
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`inline-flex items-center justify-center rounded-lg p-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${toneMap[tone] || toneMap.gray}`}
    >
      {children}
    </button>
  );
};

const Drugs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [drugs, setDrugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showBlockchainModal, setShowBlockchainModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [stats, setStats] = useState({});
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const qrCodeRef = useRef(null);

  const defaultFormValues = {
    name: '',
    activeIngredient: '',
    dosage: '',
    form: '',
    batchNumber: '',
    productionDate: '',
    expiryDate: '',
  };

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: defaultFormValues,
  });

  // Load drugs data
  const loadDrugs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (searchTerm) params.append('search', searchTerm);
      if (filterStatus) params.append('status', filterStatus);

      const response = await drugAPI.getDrugs(params);
      
      if (response.success) {
        setDrugs(response.data.drugs);
        setTotalPages(response.data.pagination.pages);
      }
    } catch (error) {
      setError('Không thể tải danh sách thuốc');
      console.error('Error loading drugs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, filterStatus]);

  // Load stats
  const loadStats = async () => {
    try {
      const response = await drugAPI.getDrugStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadDrugs();
    loadStats();
  }, [loadDrugs]);

  // Create new drug
  const onSubmitCreate = async (data) => {
    try {
      const response = await drugAPI.createDrug(data);
      if (response.success || response.data?.success) {
        handleCloseCreateModal();
        loadDrugs();
        loadStats();
        alert('Tạo lô thuốc thành công!');
      }
    } catch (error) {
      setError('Không thể tạo lô thuốc');
      console.error('Error creating drug:', error);
    }
  };

  // Helper function để normalize ID (giống như trong Users.js)
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

  // Update drug
  const onSubmitEdit = async (data) => {
    if (!selectedDrug) return;

    const updatePayload = {
      name: data.name,
      activeIngredient: data.activeIngredient,
      dosage: data.dosage,
      form: data.form,
    };

    try {
      // Normalize ID trước khi gọi API
      const normalizedId = normalizeId(selectedDrug._id);
      if (!normalizedId || normalizedId === '[object Object]') {
        console.error('Drug ID không hợp lệ:', selectedDrug._id);
        setError('ID lô thuốc không hợp lệ');
        return;
      }
      
      const response = await drugAPI.updateDrug(normalizedId, updatePayload);
      if (response.success) {
        setShowEditModal(false);
        setSelectedDrug(null);
        reset(defaultFormValues);
        loadDrugs();
        loadStats();
        alert('Cập nhật lô thuốc thành công!');
      }
    } catch (error) {
      setError('Không thể cập nhật lô thuốc');
      console.error('Error updating drug:', error);
    }
  };

  // Delete drug
  const handleDelete = async (drugId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa lô thuốc này?')) return;
    
    try {
      // Normalize ID trước khi gọi API
      const normalizedId = normalizeId(drugId);
      if (!normalizedId || normalizedId === '[object Object]') {
        console.error('Drug ID không hợp lệ:', drugId);
        setError('ID lô thuốc không hợp lệ');
        return;
      }
      
      const response = await api.delete(`/drugs/${normalizedId}`);
      if (response.data.success) {
        loadDrugs();
        loadStats();
        alert('Xóa lô thuốc thành công!');
      }
    } catch (error) {
      setError('Không thể xóa lô thuốc');
      console.error('Error deleting drug:', error);
    }
  };

  // Recall drug
  const handleRecall = async (drugId) => {
    const reason = prompt('Nhập lý do thu hồi:');
    if (!reason) return;
    
    try {
      // Normalize ID trước khi gọi API
      const normalizedId = normalizeId(drugId);
      if (!normalizedId || normalizedId === '[object Object]') {
        console.error('Drug ID không hợp lệ:', drugId);
        setError('ID lô thuốc không hợp lệ');
        return;
      }
      
      const response = await api.put(`/drugs/${normalizedId}/recall`, { reason });
      if (response.data.success) {
        loadDrugs();
        loadStats();
        alert('Thu hồi lô thuốc thành công!');
      }
    } catch (error) {
      setError('Không thể thu hồi lô thuốc');
      console.error('Error recalling drug:', error);
    }
  };

  // Open edit modal
  const openEditModal = (drug) => {
    setSelectedDrug(drug);
    reset({
      name: drug.name || '',
      activeIngredient: drug.activeIngredient || '',
      dosage: drug.dosage || '',
      form: drug.form || '',
      batchNumber: drug.batchNumber || '',
      productionDate: drug.productionDate
        ? new Date(drug.productionDate).toISOString().split('T')[0]
        : '',
      expiryDate: drug.expiryDate
        ? new Date(drug.expiryDate).toISOString().split('T')[0]
        : '',
    });
    setShowEditModal(true);
  };

  const handleOpenCreateModal = () => {
    setSelectedDrug(null);
    reset(defaultFormValues);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    reset(defaultFormValues);
    setSelectedDrug(null);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    reset(defaultFormValues);
    setSelectedDrug(null);
  };

  // Open QR modal
  const openQRModal = async (drug) => {
    setSelectedDrug(drug);
    setShowQRModal(true);
    setError(null);
    
    // Nếu chưa có QR code data, tự động generate
    const needsGenerate = !drug.qrCode?.data && !drug.qrCode?.imageUrl;
    
    if (needsGenerate) {
      try {
        setLoading(true);
        const normalizedId = normalizeId(drug._id);
        if (!normalizedId || normalizedId === '[object Object]') {
          console.error('Drug ID không hợp lệ:', drug._id);
          setError('ID lô thuốc không hợp lệ');
          return;
        }
        const response = await drugAPI.generateQRCode(normalizedId);
        if (response.success) {
          // Cập nhật drug với QR code mới từ response
          let updatedDrug;
          if (response.data.drug) {
            updatedDrug = response.data.drug;
          } else {
            // Nếu không có drug trong response, cập nhật qrCode vào drug hiện tại
            updatedDrug = {
              ...drug,
              qrCode: {
                ...drug.qrCode,
                data: response.data.qrData ? JSON.stringify(response.data.qrData) : drug.qrCode?.data,
                imageUrl: response.data.qrCode || drug.qrCode?.imageUrl
              }
            };
          }
          setSelectedDrug(updatedDrug);
          // Cập nhật trong danh sách
          setDrugs(drugs.map(d => d._id === drug._id ? updatedDrug : d));
        }
      } catch (error) {
        console.error('Error generating QR code:', error);
        setError('Không thể tạo QR code: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  // State để lưu server URL
  const [serverUrl, setServerUrl] = useState(null);

  // Load server URL từ backend
  useEffect(() => {
    const loadServerUrl = async () => {
      try {
        const response = await drugAPI.getServerUrl();
        if (response.success) {
          setServerUrl(response.data.frontendUrl || response.data.serverUrl);
        }
      } catch (error) {
        console.error('Error loading server URL:', error);
        // Fallback về window.location.origin nếu API lỗi
        setServerUrl(window.location.origin);
      }
    };
    loadServerUrl();
  }, []);

  // Lấy QR data để hiển thị
  const getQRData = (drug) => {
    if (!drug) return null;
    
    // Sử dụng serverUrl từ backend hoặc fallback về window.location.origin
    const baseUrl = serverUrl || window.location.origin;
    
    // Ưu tiên parse từ qrCode.data
    if (drug.qrCode?.data) {
      try {
        const parsed = typeof drug.qrCode.data === 'string' 
          ? JSON.parse(drug.qrCode.data)
          : drug.qrCode.data;
        
        // Đảm bảo có blockchainId nếu drug có blockchain
        if (drug.blockchain?.blockchainId && !parsed.blockchainId) {
          parsed.blockchainId = drug.blockchain.blockchainId;
        }
        
        // Đảm bảo có verificationUrl với server URL đúng
        if (!parsed.verificationUrl && drug.blockchain?.blockchainId) {
          parsed.verificationUrl = `${baseUrl}/verify/${drug.blockchain.blockchainId}`;
        } else if (parsed.verificationUrl && parsed.verificationUrl.includes('localhost')) {
          // Nếu URL cũ có localhost, thay thế bằng server URL mới
          parsed.verificationUrl = parsed.verificationUrl.replace(/http:\/\/localhost:\d+/, baseUrl);
        }
        
        return parsed;
      } catch (e) {
        console.error('Error parsing QR data:', e);
      }
    }
    
    // Nếu chưa có, tạo QR data từ thông tin drug
    const qrData = {
      drugId: drug.drugId,
      name: drug.name,
      batchNumber: drug.batchNumber,
      manufacturer: drug.manufacturerId?._id || drug.manufacturerId,
      productionDate: drug.productionDate,
      expiryDate: drug.expiryDate,
      blockchainId: drug.blockchain?.blockchainId || null,
      verificationUrl: drug.qrCode?.verificationUrl || 
        (drug.blockchain?.blockchainId 
          ? `${baseUrl}/verify/${drug.blockchain.blockchainId}`
          : null),
      timestamp: Date.now()
    };
    
    return qrData;
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
      const drugId = String(item.drugId || '');
      const batchNumber = String(item.batchNumber || '');
      const name = String(item.name || '');
      const createdAt = item.createdAt ? String(new Date(item.createdAt).getTime()) : String(Date.now());
      idPart = `${drugId}-${batchNumber}-${name}-${createdAt}`;
    }
    
    // Luôn kết hợp index làm phần chính để đảm bảo unique tuyệt đối
    return `drug-${idx}-${idPart}`;
  };

  // Open blockchain modal
  const openBlockchainModal = (drug) => {
    setSelectedDrug(drug);
    setShowBlockchainModal(true);
  };

  const handleCloseBlockchainModal = () => {
    setShowBlockchainModal(false);
    setSelectedDrug(null);
  };

  const handleCopyBlockchainId = async () => {
    if (!selectedDrug?.blockchain?.blockchainId) return;
    try {
      await navigator.clipboard.writeText(selectedDrug.blockchain.blockchainId);
      alert('Đã copy Blockchain ID!');
    } catch (copyError) {
      console.error('Error copying blockchain ID:', copyError);
      alert('Không thể copy Blockchain ID. Vui lòng thử lại.');
    }
  };

  const handleViewBlockchainDetail = () => {
    if (!selectedDrug?.blockchain?.blockchainId) return;
    navigate(`/verify/${selectedDrug.blockchain.blockchainId}`);
  };

  const getVerificationUrl = (drug) => {
    if (!drug) return null;
    const qrData = getQRData(drug);
    return qrData?.verificationUrl || '';
  };

  const handleCloseQRModal = () => {
    setShowQRModal(false);
    setSelectedDrug(null);
    setLoading(false);
    setError(null);
  };

  const handleDownloadQR = () => {
    if (!selectedDrug) return;

    const fallbackFileName = selectedDrug.drugId ? `${selectedDrug.drugId}_qr.svg` : 'qr-code.svg';

    const imageUrl = selectedDrug.qrCode?.imageUrl;
    if (imageUrl) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = fallbackFileName.replace('.svg', '.png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (qrCodeRef.current) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(qrCodeRef.current);
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fallbackFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      alert('Không thể tải xuống QR Code. Vui lòng thử lại sau.');
    }
  };

  const handleVerify = () => {
    const verificationUrl = getVerificationUrl(selectedDrug);
    if (verificationUrl) {
      window.open(verificationUrl, '_blank', 'noopener');
    } else {
      alert('Không tìm thấy đường dẫn xác minh.');
    }
  };

  // Get status icon
  const getStatusIcon = (drug) => {
    if (drug.isRecalled) return <XCircle className="w-5 h-5 text-red-500" />;
    if (drug.isExpired) return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    if (drug.isNearExpiry) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <CheckCircle className="w-5 h-5 text-green-500" />;
  };

  // Get status text
  const getStatusText = (drug) => {
    if (drug.isRecalled) return 'Đã thu hồi';
    if (drug.isExpired) return 'Hết hạn';
    if (drug.isNearExpiry) return 'Gần hết hạn';
    return 'Hoạt động';
  };

  // Get status color
  const getStatusColor = (drug) => {
    if (drug.isRecalled) return 'bg-red-100 text-red-800';
    if (drug.isExpired) return 'bg-orange-100 text-orange-800';
    if (drug.isNearExpiry) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50 border border-gray-100 shadow-soft">
        <div className="p-6 md:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Quản lý Lô Thuốc</h1>
              <p className="text-gray-600 mt-2">Theo dõi và quản lý các lô thuốc trong hệ thống</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadDrugs}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </button>

              {(user?.role === 'admin' || user?.role === 'manufacturer') && (
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                  Tạo lô thuốc mới
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Tổng số lô" value={stats.total || 0} icon={CheckCircle} tone="blue" />
        <StatCard label="Đang hoạt động" value={stats.active || 0} icon={CheckCircle} tone="green" />
        <StatCard label="Đã thu hồi" value={stats.recalled || 0} icon={XCircle} tone="red" />
        <StatCard label="Sắp hết hạn" value={stats.expiringSoon || 0} icon={AlertTriangle} tone="amber" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-5">
        <div className="flex flex-col md:flex-row gap-4 md:items-center">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mã lô, số lô..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              />
            </div>
          </div>

          <div className="md:w-56">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="recalled">Đã thu hồi</option>
              <option value="expired">Hết hạn</option>
              <option value="suspended">Tạm dừng</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setPage(1);
              loadDrugs();
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            <RefreshCw className="w-5 h-5" />
            Áp dụng
          </button>
        </div>
      </div>

      {/* Drugs Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-600">Đang tải dữ liệu...</p>
          </div>
        ) : drugs.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có dữ liệu</h3>
            <p className="text-gray-600">Chưa có lô thuốc nào trong hệ thống</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50/70">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Thông tin thuốc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Nhà sản xuất
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Ngày sản xuất
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Hạn sử dụng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drugs.map((drug, idx) => (
                    <tr key={getUniqueKey(drug, idx)} className="hover:bg-gray-50/70">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {drug.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Mã lô: {drug.drugId}
                          </div>
                          <div className="text-sm text-gray-500">
                            Số lô: {drug.batchNumber}
                          </div>
                          {drug.blockchain?.blockchainId && (
                            <div className="text-xs text-blue-600 mt-1">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                </svg>
                                Blockchain: {drug.blockchain.blockchainId.substring(0, 8)}...
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {drug.manufacturerId?.fullName || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(drug.productionDate).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(drug.expiryDate).toLocaleDateString('vi-VN')}
                        </div>
                        {drug.daysUntilExpiry && (
                          <div className="text-xs text-gray-500">
                            {drug.daysUntilExpiry > 0 ? `${drug.daysUntilExpiry} ngày` : 'Đã hết hạn'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(drug)}`}>
                          {getStatusIcon(drug)}
                          {getStatusText(drug)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <IconButton onClick={() => openQRModal(drug)} title="Xem QR Code" tone="blue">
                            <QrCode className="w-5 h-5" />
                          </IconButton>
                          {drug.blockchain?.blockchainId && (
                            <IconButton onClick={() => openBlockchainModal(drug)} title="Xem thông tin Blockchain" tone="purple">
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                              </svg>
                            </IconButton>
                          )}
                          {/* Chỉ admin và manufacturer mới có thể chỉnh sửa */}
                          {(user?.role === 'admin' || user?.role === 'manufacturer') && (
                            <IconButton onClick={() => openEditModal(drug)} title="Chỉnh sửa" tone="green">
                              <Edit className="w-5 h-5" />
                            </IconButton>
                          )}
                          {/* Chỉ admin và manufacturer mới có thể thu hồi */}
                          {!drug.isRecalled && (user?.role === 'admin' || user?.role === 'manufacturer') && (
                            <IconButton onClick={() => handleRecall(drug._id)} title="Thu hồi" tone="orange">
                              <AlertTriangle className="w-5 h-5" />
                            </IconButton>
                          )}
                          {user?.role === 'admin' && (
                            <IconButton onClick={() => handleDelete(drug._id)} title="Xóa" tone="red">
                              <Trash2 className="w-5 h-5" />
                            </IconButton>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="ml-3 inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Sau
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Trang <span className="font-medium">{page}</span> / <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex items-center gap-2">
                      <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Trước
                      </button>
                      <span className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700">
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        Sau
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Drug Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative mx-auto w-11/12 max-w-3xl py-10">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">Lô thuốc</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">Tạo lô thuốc mới</h3>
                </div>
                <button
                  type="button"
                  onClick={handleCloseCreateModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Đóng"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmitCreate)} className="px-6 py-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên thuốc *
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Tên thuốc là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thành phần hoạt chất *
                    </label>
                    <input
                      type="text"
                      {...register('activeIngredient', { required: 'Thành phần hoạt chất là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.activeIngredient && (
                      <p className="text-red-500 text-sm mt-1">{errors.activeIngredient.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Liều lượng *
                    </label>
                    <input
                      type="text"
                      {...register('dosage', { required: 'Liều lượng là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.dosage && (
                      <p className="text-red-500 text-sm mt-1">{errors.dosage.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dạng bào chế *
                    </label>
                    <select
                      {...register('form', { required: 'Dạng bào chế là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                      <option value="">Chọn dạng bào chế</option>
                      <option value="viên nén">Viên nén</option>
                      <option value="viên nang">Viên nang</option>
                      <option value="siro">Siro</option>
                      <option value="dung dịch tiêm">Dung dịch tiêm</option>
                      <option value="kem">Kem</option>
                      <option value="gel">Gel</option>
                      <option value="thuốc mỡ">Thuốc mỡ</option>
                      <option value="khác">Khác</option>
                    </select>
                    {errors.form && (
                      <p className="text-red-500 text-sm mt-1">{errors.form.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lô sản xuất *
                    </label>
                    <input
                      type="text"
                      {...register('batchNumber', { required: 'Số lô sản xuất là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {errors.batchNumber && (
                      <p className="text-red-500 text-sm mt-1">{errors.batchNumber.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sản xuất *
                    </label>
                    <input
                      type="date"
                      {...register('productionDate', { required: 'Ngày sản xuất là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    {errors.productionDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.productionDate.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hạn sử dụng *
                    </label>
                    <input
                      type="date"
                      {...register('expiryDate', { required: 'Hạn sử dụng là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    {errors.expiryDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.expiryDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 md:flex-row md:justify-end">
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 md:w-auto"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 md:w-auto"
                  >
                    Tạo lô thuốc
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Drug Modal */}
      {showEditModal && selectedDrug && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative mx-auto w-11/12 max-w-3xl py-10">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-green-600">Cập nhật</p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">Chỉnh sửa lô thuốc</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Mã lô: <span className="font-medium text-gray-700">{selectedDrug?.drugId}</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Đóng"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmitEdit)} className="px-6 py-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên thuốc *
                    </label>
                    <input
                      type="text"
                      {...register('name', { required: 'Tên thuốc là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Thành phần hoạt chất *
                    </label>
                    <input
                      type="text"
                      {...register('activeIngredient', { required: 'Thành phần hoạt chất là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {errors.activeIngredient && (
                      <p className="text-red-500 text-sm mt-1">{errors.activeIngredient.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Liều lượng *
                    </label>
                    <input
                      type="text"
                      {...register('dosage', { required: 'Liều lượng là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    {errors.dosage && (
                      <p className="text-red-500 text-sm mt-1">{errors.dosage.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dạng bào chế *
                    </label>
                    <select
                      {...register('form', { required: 'Dạng bào chế là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                    >
                      <option value="">Chọn dạng bào chế</option>
                      <option value="viên nén">Viên nén</option>
                      <option value="viên nang">Viên nang</option>
                      <option value="siro">Siro</option>
                      <option value="dung dịch tiêm">Dung dịch tiêm</option>
                      <option value="kem">Kem</option>
                      <option value="gel">Gel</option>
                      <option value="thuốc mỡ">Thuốc mỡ</option>
                      <option value="khác">Khác</option>
                    </select>
                    {errors.form && (
                      <p className="text-red-500 text-sm mt-1">{errors.form.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Số lô sản xuất
                    </label>
                    <input
                      type="text"
                      {...register('batchNumber', { required: 'Số lô sản xuất là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ngày sản xuất
                    </label>
                    <input
                      type="date"
                      {...register('productionDate', { required: 'Ngày sản xuất là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                      disabled
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hạn sử dụng
                    </label>
                    <input
                      type="date"
                      {...register('expiryDate', { required: 'Hạn sử dụng là bắt buộc' })}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed"
                      disabled
                    />
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-4 md:flex-row md:justify-end">
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 md:w-auto"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700 md:w-auto"
                  >
                    Lưu thay đổi
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedDrug && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative mx-auto w-11/12 max-w-3xl py-10">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">QR Code</p>
                  <h3 className="text-lg font-semibold text-gray-900 mt-1">Thông tin xác thực lô thuốc</h3>
                </div>
                <button
                  onClick={handleCloseQRModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Đóng"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="px-6 py-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50 p-12">
                    <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
                    <p className="mt-3 text-sm text-blue-700">Đang tạo QR Code, vui lòng chờ...</p>
                  </div>
                ) : (() => {
                  const qrData = getQRData(selectedDrug);
                  const verificationUrl = getVerificationUrl(selectedDrug);

                  if (!qrData) {
                    return (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
                        <QrCode className="mx-auto h-12 w-12 text-red-400" />
                        <p className="mt-3 text-base font-semibold text-red-600">Không thể tạo QR Code</p>
                        <p className="mt-1 text-sm text-red-500">Thiếu thông tin cần thiết. Vui lòng kiểm tra lại lô thuốc.</p>
                      </div>
                    );
                  }

                  const qrDataString = JSON.stringify(qrData);

                  return (
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Lô thuốc</p>
                          <h4 className="mt-2 text-xl font-semibold text-blue-900">{selectedDrug.name}</h4>
                          <div className="mt-4 space-y-2 text-sm text-blue-800">
                            <div className="flex justify-between">
                              <span className="text-blue-600">Mã lô</span>
                              <span className="font-medium">{selectedDrug.drugId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-600">Số lô SX</span>
                              <span className="font-medium">{selectedDrug.batchNumber || '---'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-blue-600">Hạn sử dụng</span>
                              <span className="font-medium">
                                {selectedDrug.expiryDate
                                  ? new Date(selectedDrug.expiryDate).toLocaleDateString('vi-VN')
                                  : '---'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-3">
                          {selectedDrug.blockchain?.blockchainId && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Blockchain ID</p>
                              <p className="mt-1 text-sm font-mono text-gray-800 break-all">
                                {selectedDrug.blockchain.blockchainId}
                              </p>
                            </div>
                          )}
                          {verificationUrl && (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Verification URL</p>
                              <p className="mt-1 text-sm text-gray-800 break-all">
                                {verificationUrl}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col justify-between">
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                          <div className="flex justify-center rounded-lg border border-gray-100 bg-white p-4 shadow-inner">
                            <QRCode
                              value={qrDataString}
                              size={260}
                              level="H"
                              fgColor="#1f2937"
                              bgColor="#ffffff"
                              ref={qrCodeRef}
                            />
                          </div>
                          <p className="mt-3 text-xs text-gray-500 text-center">
                            Quét mã QR bằng ứng dụng DACN Mobile để xác thực ngay trên hệ thống.
                          </p>
                        </div>

                        {(!selectedDrug.qrCode?.data || !selectedDrug.qrCode?.imageUrl) && (
                          <button
                            onClick={async () => {
                              try {
                                setLoading(true);
                                const normalizedId = normalizeId(selectedDrug._id);
                                if (!normalizedId || normalizedId === '[object Object]') {
                                  console.error('Drug ID không hợp lệ:', selectedDrug._id);
                                  setError('ID lô thuốc không hợp lệ');
                                  return;
                                }
                                const response = await drugAPI.generateQRCode(normalizedId);
                                if (response.success) {
                                  let updatedDrug;
                                  if (response.data.drug) {
                                    updatedDrug = response.data.drug;
                                  } else {
                                    updatedDrug = {
                                      ...selectedDrug,
                                      qrCode: {
                                        ...selectedDrug.qrCode,
                                        data: response.data.qrData ? JSON.stringify(response.data.qrData) : selectedDrug.qrCode?.data,
                                        imageUrl: response.data.qrCode || selectedDrug.qrCode?.imageUrl
                                      }
                                    };
                                  }
                                  setSelectedDrug(updatedDrug);
                                  loadDrugs();
                                } else {
                                  setError('Không thể tạo QR code');
                                }
                              } catch (error) {
                                setError('Không thể tạo QR code: ' + (error.response?.data?.message || error.message));
                              } finally {
                                setLoading(false);
                              }
                            }}
                            className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
                          >
                            Lưu QR Code vào hệ thống
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {!loading && (
                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-6 py-4 md:flex-row md:justify-end">
                  <button
                    type="button"
                    onClick={handleCloseQRModal}
                    className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 md:w-auto"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleVerify}
                    className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700 md:w-auto"
                  >
                    Xác minh
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 md:w-auto"
                  >
                    Tải xuống
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blockchain Info Modal */}
      {showBlockchainModal && selectedDrug && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative mx-auto w-11/12 max-w-3xl py-10">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-500">
                    Blockchain
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">
                    Thông tin xác thực trên Blockchain
                  </h3>
                </div>
                <button
                  onClick={handleCloseBlockchainModal}
                  className="text-gray-400 transition-colors hover:text-gray-600"
                  aria-label="Đóng"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="px-6 py-6">
                <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                    Thông tin lô thuốc
                  </p>
                  <div className="mt-3 text-blue-900">
                    <h4 className="text-xl font-semibold">{selectedDrug.name}</h4>
                    <p className="mt-1 text-sm">
                      Mã lô: <span className="font-medium text-blue-800">{selectedDrug.drugId}</span>
                    </p>
                    <p className="mt-1 text-sm">
                      Nhà sản xuất:{' '}
                      <span className="font-medium text-blue-800">
                        {selectedDrug.manufacturerId?.fullName || 'Chưa cập nhật'}
                      </span>
                    </p>
                  </div>
                </div>

                {selectedDrug.blockchain ? (
                  <div className="mt-6 space-y-5">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Blockchain ID
                        </p>
                        <p className="mt-2 text-sm font-mono text-gray-800 break-all">
                          {selectedDrug.blockchain.blockchainId}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Trạng thái
                        </p>
                        <span
                          className={`mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                            selectedDrug.blockchain.blockchainStatus === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {selectedDrug.blockchain.blockchainStatus === 'confirmed'
                            ? 'Đã xác nhận'
                            : 'Đang chờ'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Transaction Hash
                        </p>
                        <p className="mt-2 text-sm font-mono text-gray-800 break-all">
                          {selectedDrug.blockchain.transactionHash || 'N/A'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Block Number
                        </p>
                        <p className="mt-2 text-sm font-semibold text-gray-800">
                          {selectedDrug.blockchain.blockNumber
                            ? selectedDrug.blockchain.blockNumber.toLocaleString()
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Chữ ký số
                        </p>
                        <p className="mt-2 text-sm font-mono text-gray-800 break-all">
                          {selectedDrug.blockchain.digitalSignature
                            ? `${selectedDrug.blockchain.digitalSignature.substring(0, 60)}...`
                            : 'N/A'}
                        </p>
                      </div>

                      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Hash dữ liệu
                        </p>
                        <p className="mt-2 text-sm font-mono text-gray-800 break-all">
                          {selectedDrug.blockchain.dataHash
                            ? `${selectedDrug.blockchain.dataHash.substring(0, 60)}...`
                            : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {selectedDrug.blockchain.transactionHistory &&
                      selectedDrug.blockchain.transactionHistory.length > 0 && (
                        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                          <p className="text-sm font-semibold text-gray-800">Lịch sử giao dịch</p>
                          <div className="mt-3 space-y-2">
                            {selectedDrug.blockchain.transactionHistory.map((tx, index) => (
                              <div
                                key={`tx-${index}-${tx.action || ''}-${tx.timestamp || tx.date || ''}`}
                                className="rounded-lg border border-gray-100 bg-gray-50 p-3"
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="text-sm font-semibold text-gray-800">{tx.action}</p>
                                    <p className="text-xs text-gray-600">{tx.details}</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                      {tx.timestamp
                                        ? new Date(tx.timestamp).toLocaleString('vi-VN')
                                        : '---'}
                                    </p>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-500">
                                    Block #{tx.blockNumber || '--'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 md:flex-row md:justify-end">
                      <button
                        onClick={handleCopyBlockchainId}
                        className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 md:w-auto"
                      >
                        Copy Blockchain ID
                      </button>
                      <button
                        onClick={handleViewBlockchainDetail}
                        className="w-full rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-green-700 md:w-auto"
                      >
                        Xem chi tiết
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-center">
                    <p className="text-sm font-medium text-yellow-800">
                      Lô thuốc này chưa được ghi nhận trên blockchain.
                    </p>
                    <p className="mt-1 text-xs text-yellow-700">
                      Vui lòng kiểm tra lại trạng thái triển khai smart contract hoặc thử lại sau.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-md">
          <div className="rounded-2xl border border-red-200 bg-red-50 shadow-lg px-4 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 h-9 w-9 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-red-800">Có lỗi xảy ra</p>
                <p className="mt-0.5 text-sm text-red-700 break-words">{error}</p>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600 transition-colors"
                aria-label="Đóng thông báo lỗi"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drugs;
