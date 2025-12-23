import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { QRCode } from 'react-qr-code';
import {
  Package,
  Truck,
  Building2,
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  QrCode,
  Download,
  RefreshCw,
  Thermometer,
  Droplets,
  Sun,
  FileText,
  Shield,
  Bell,
  X,
  Map,
  Trash2,
  FileDown,
  CheckSquare,
  Square,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supplyChainAPI, drugAPI, userAPI } from '../utils/api';
import toast from 'react-hot-toast';
import DrugTimeline from '../components/DrugTimeline';
import SupplyChainMap from '../components/SupplyChainMap';

const SupplyChain = () => {
  const { user, hasRole, hasAnyRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [supplyChains, setSupplyChains] = useState([]);
  const [selectedSupplyChain, setSelectedSupplyChain] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStepModal, setShowStepModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQRData, setSelectedQRData] = useState(null);
  const [showMapView, setShowMapView] = useState(false);
  const [mapData, setMapData] = useState([]);
  const [focusAddress, setFocusAddress] = useState(null); // Địa chỉ cần focus trên bản đồ
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [sseConnected, setSseConnected] = useState(false);
  const [showTimelineHelp, setShowTimelineHelp] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    role: ''
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Helper function để chuyển đổi ID thành string an toàn
  const normalizeId = (id) => {
    if (!id && id !== 0) return '';
    if (typeof id === 'string') {
      if (id === '[object Object]' || id.trim() === '[object Object]') return '';
      const trimmed = id.trim();
      if (trimmed === '') return '';
      return trimmed;
    }
    if (typeof id === 'number') return String(id);
    if (typeof id === 'object' && id !== null) {
      // Kiểm tra xem có phải là MongoDB ObjectId không (có thuộc tính toString và valueOf)
      // MongoDB ObjectId thường có toString() trả về 24 ký tự hex
      if (typeof id.toString === 'function') {
        try {
          const str = id.toString();
          // Kiểm tra xem có phải là MongoDB ObjectId format không (24 ký tự hex)
          if (str && /^[0-9a-fA-F]{24}$/.test(str)) {
            return str;
          }
          // Nếu toString trả về hợp lệ và không phải [object Object]
          if (str && str !== '[object Object]' && str.trim() !== '[object Object]' && str.length > 0) {
            return str.trim();
          }
        } catch (e) {
          // Ignore toString error, try other methods
        }
      }
      
      // Nếu là object có numeric keys (array-like), thử ghép lại thành string
      if (Object.keys(id).every(key => !isNaN(parseInt(key)))) {
        const keys = Object.keys(id).sort((a, b) => parseInt(a) - parseInt(b));
        const reconstructed = keys.map(key => id[key]).join('');
        if (reconstructed && /^[0-9a-fA-F]{24}$/.test(reconstructed)) {
          return reconstructed;
        }
      }
      
      // Nếu là object có thuộc tính _id hoặc id, đệ quy normalize
      if (id._id !== undefined && id._id !== null) {
        const normalized = normalizeId(id._id);
        if (normalized && normalized !== '[object Object]' && normalized.length > 0) return normalized;
      }
      if (id.id !== undefined && id.id !== null) {
        const normalized = normalizeId(id.id);
        if (normalized && normalized !== '[object Object]' && normalized.length > 0) return normalized;
      }
      
      // Thử valueOf
      if (typeof id.valueOf === 'function') {
        try {
          const val = id.valueOf();
          if (val && val !== id) {
            const normalized = normalizeId(val);
            if (normalized && normalized !== '[object Object]' && normalized.length > 0) return normalized;
          }
        } catch (e) {
          // Ignore valueOf error
        }
      }
      
      // Fallback: thử lấy từ các thuộc tính phổ biến
      if (id.str && typeof id.str === 'string') return id.str;
      if (id.value) {
        const normalized = normalizeId(id.value);
        if (normalized && normalized !== '[object Object]' && normalized.length > 0) return normalized;
      }
      
      // Nếu là object rỗng {}, không log warning
      if (Object.keys(id).length === 0) {
        return '';
      }
      
      console.warn('Unable to normalize ID, object without valid toString:', id);
      return '';
    }
    return String(id);
  };

  // Load supply chains
  const loadSupplyChains = useCallback(async () => {
    try {
      setLoading(true);
      // Chỉ truyền các giá trị primitive, filter ra empty và object
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => 
          value !== '' && value !== null && value !== undefined && typeof value !== 'object'
        )
      );
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: '10',
        ...cleanFilters
      });

      const response = await supplyChainAPI.getSupplyChains(params.toString());
      
      if (response.success) {
        // Normalize _id thành string để tránh lỗi [object Object]
        const normalizedSupplyChains = (response.data.supplyChains || []).map(supplyChain => {
          // Ưu tiên sử dụng id (thường đã là string hợp lệ từ backend)
          let validId = '';
          if (supplyChain.id && typeof supplyChain.id === 'string' && supplyChain.id !== '[object Object]' && supplyChain.id.length >= 20) {
            validId = supplyChain.id;
          } else if (supplyChain._id) {
            validId = normalizeId(supplyChain._id);
            // Log nếu ID bị cắt ngắn
            if (validId && validId.length < 20) {
              console.warn('Normalized ID is too short:', validId, 'from:', supplyChain._id);
            }
          } else {
            validId = normalizeId(supplyChain.id || supplyChain._id);
          }
          
          // Đảm bảo validId không rỗng và không phải [object Object] và có độ dài hợp lệ
          if (!validId || validId === '' || validId === '[object Object]' || validId.length < 20) {
            console.warn('Unable to normalize supply chain ID:', {
              originalId: supplyChain._id,
              originalIdType: typeof supplyChain._id,
              originalIdValue: supplyChain._id,
              normalizedId: validId,
              supplyChain: supplyChain
            });
            // Fallback: tạo ID tạm từ các field khác
            validId = supplyChain.drugId || supplyChain.batchNumber || `temp-${Date.now()}-${Math.random()}`;
          }
          
          // Đảm bảo drugId được populate đúng
          if (supplyChain.drugId && typeof supplyChain.drugId === 'object' && !supplyChain.drugId.name) {
            console.warn('Drug data not properly populated for supply chain:', validId);
          }
          
          return {
            ...supplyChain,
            _id: validId,
            id: validId
          };
        });
        setSupplyChains(normalizedSupplyChains);
        setPagination(response.data.pagination || pagination);
      } else {
        toast.error(response.message || 'Không thể tải danh sách hành trình');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.status === 401 ? 'Phiên đăng nhập đã hết hạn' :
                          error.response?.status === 403 ? 'Bạn không có quyền xem danh sách hành trình' :
                          'Lỗi khi tải danh sách hành trình';
      toast.error(errorMessage);
      console.error('Load supply chains error:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.current, filters]);

  useEffect(() => {
    loadSupplyChains();
  }, [loadSupplyChains]);

  // Load map data
  const loadMapData = useCallback(async () => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => 
          value !== '' && value !== null && value !== undefined && typeof value !== 'object'
        )
      );
      const params = new URLSearchParams(cleanFilters);
      const response = await supplyChainAPI.getMapData(params.toString());
      if (response && response.success) {
        console.log('🗺️ Map data received:', response.data);
        console.log('🗺️ Number of chains:', response.data?.length || 0);
        // Log coordinates for debugging
        response.data?.forEach((chain, idx) => {
          const currentLoc = chain.currentLocation;
          console.log(`  Chain ${idx + 1} (${chain.batchNumber}):`, {
            hasPath: !!chain.path,
            pathLength: chain.path?.length || 0,
            pathDetails: chain.path?.map(p => ({
              action: p.action,
              hasCoords: !!p.coordinates,
              coords: p.coordinates,
              address: p.address
            })),
            hasCurrentLocation: !!currentLoc,
            currentLocationCoords: currentLoc?.coordinates,
            currentLocationCoordsType: typeof currentLoc?.coordinates,
            currentLocationCoordsIsArray: Array.isArray(currentLoc?.coordinates),
            currentLocationAddress: currentLoc?.address,
            currentLocationKeys: currentLoc ? Object.keys(currentLoc) : null
          });
        });
        setMapData(response.data || []);
      } else {
        console.warn('Load map data: No data received');
        setMapData([]);
      }
    } catch (error) {
      console.error('Load map data error:', error);
      toast.error('Không thể tải dữ liệu bản đồ');
      setMapData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (showMapView) {
      loadMapData();
    }
  }, [showMapView, loadMapData]);

  // Export data
  const handleExport = async (format = 'csv') => {
    try {
      setLoading(true);
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => 
          value !== '' && value !== null && value !== undefined && typeof value !== 'object'
        )
      );
      const params = new URLSearchParams({
        limit: pagination.total.toString() || '10000',
        format: format === 'xlsx' ? 'xlsx' : 'csv',
        ...cleanFilters
      });
      
      const blob = await supplyChainAPI.export(params.toString(), format);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = format === 'xlsx' ? 'xlsx' : 'csv';
      link.download = `supply-chains-${new Date().toISOString().split('T')[0]}.${fileExtension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success(`Đã xuất file ${format.toUpperCase()}`);
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Lỗi khi xuất file';
      toast.error(errorMessage);
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Bulk delete
  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) {
      toast.error('Vui lòng chọn ít nhất một hành trình');
      return;
    }
    
    if (!window.confirm(`Bạn có chắc chắn muốn xóa ${selectedItems.length} hành trình?`)) {
      return;
    }

    try {
      setLoading(true);
      const ids = selectedItems.map(item => normalizeId(item._id || item.id)).filter(id => id);
      const response = await supplyChainAPI.bulkDelete(ids);
      
      if (response.success) {
        toast.success(`Đã xóa ${selectedItems.length} hành trình`);
        setSelectedItems([]);
        setIsSelectMode(false);
        loadSupplyChains();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa hành trình');
    } finally {
      setLoading(false);
    }
  };

  // Toggle select item
  const toggleSelectItem = (item) => {
    const id = normalizeId(item._id || item.id);
    setSelectedItems(prev => {
      if (prev.some(i => normalizeId(i._id || i.id) === id)) {
        return prev.filter(i => normalizeId(i._id || i.id) !== id);
      } else {
        return [...prev, item];
      }
    });
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedItems.length === supplyChains.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...supplyChains]);
    }
  };

  // SSE Connection
  useEffect(() => {
    if (!sseConnected) return;

    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const token = localStorage.getItem('token');
    const eventSource = new EventSource(`${apiUrl}/supply-chain/events?token=${token}`);
    
    eventSource.onopen = () => {
      console.log('SSE connected');
      setSseConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        // Bỏ qua heartbeat messages
        if (event.data.trim() === ': heartbeat' || !event.data.trim()) {
          return;
        }
        
        const data = JSON.parse(event.data);
        
        // Kiểm tra nếu là error message
        if (data.error) {
          console.error('SSE error message:', data.message || data.error);
          toast.error(data.message || 'Lỗi kết nối SSE');
          setSseConnected(false);
          eventSource.close();
          return;
        }
        
        if (data.type === 'supplyChain:created' || data.type === 'supplyChain:step_added') {
          toast.success('Có cập nhật mới về chuỗi cung ứng');
          loadSupplyChains();
          if (showMapView) {
            loadMapData();
          }
        }
      } catch (error) {
        console.error('SSE message parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // Chỉ đóng connection nếu thực sự có lỗi (không phải do reconnect)
      if (eventSource.readyState === EventSource.CLOSED) {
        setSseConnected(false);
        toast.error('Mất kết nối với server. Vui lòng thử lại.');
        eventSource.close();
      }
    };

    return () => {
      eventSource.close();
    };
  }, [sseConnected, loadSupplyChains, loadMapData, showMapView]);

  // Create new supply chain
  const onCreateSupplyChain = async (data) => {
    try {
      setLoading(true);
      
      // Normalize drugId để đảm bảo là string ID, không phải object
      if (data.drugId) {
        if (typeof data.drugId === 'object' && data.drugId !== null) {
          data.drugId = data.drugId._id?.toString() || data.drugId.id?.toString() || String(data.drugId);
        } else {
          data.drugId = String(data.drugId);
        }
      }
      
      // Validate required fields
      if (!data.drugId || !data.drugBatchNumber) {
        toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }
      
      // Xử lý shipper data
      if (data.shipperType === 'user' && data.shipperId) {
        // Chọn từ user trong hệ thống
        data.shipper = {
          shipperId: data.shipperId
        };
      } else if (data.shipperType === 'third_party') {
        // Bên thứ 3 vận chuyển - chỉ có thông tin text, không có shipperId
        if (!data.thirdPartyName || !data.thirdPartyName.trim()) {
          toast.error('Vui lòng nhập tên bên vận chuyển');
          return;
        }
        data.shipper = {
          shipperName: data.thirdPartyName.trim(),
          shipperOrganization: data.thirdPartyOrganization?.trim() || '',
          shipperContact: {
            phone: data.thirdPartyPhone?.trim() || '',
            email: data.thirdPartyEmail?.trim() || ''
          },
          shipperRole: 'third_party' // Đánh dấu là bên thứ 3
        };
      }
      
      // Xóa các field tạm không cần gửi lên backend
      delete data.shipperType;
      delete data.shipperId;
      delete data.thirdPartyName;
      delete data.thirdPartyOrganization;
      delete data.thirdPartyPhone;
      delete data.thirdPartyEmail;
      
      console.log('📤 Creating supply chain with data:', { ...data, drugId: data.drugId });
      
      const response = await supplyChainAPI.createSupplyChain(data);
      
      if (response.success) {
        toast.success('Tạo hành trình thành công');
        setShowCreateModal(false);
        reset();
        loadSupplyChains();
      } else {
        toast.error(response.message || 'Lỗi khi tạo hành trình');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.join(', ') || 
                          'Lỗi khi tạo hành trình';
      toast.error(errorMessage);
      console.error('Create supply chain error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add step to supply chain
  const onAddStep = async (data) => {
    try {
      setLoading(true);
      const id = normalizeId(selectedSupplyChain?._id || selectedSupplyChain?.id);
      if (!id || id === '[object Object]') {
        toast.error('ID hành trình không hợp lệ');
        return;
      }
      
      // Validate required fields
      if (!data.action) {
        toast.error('Vui lòng chọn hành động');
        return;
      }
      
      // Format data - loại bỏ các trường rỗng
      console.log('📝 Raw form data:', data);
      
      const formattedData = {};
      
      // Action là bắt buộc
      if (!data.action) {
        toast.error('Vui lòng chọn hành động');
        return;
      }
      formattedData.action = data.action;
      
      // Location - đảm bảo format đúng
      if (data.location?.address && data.location.address.trim() !== '') {
        formattedData.location = {
          address: data.location.address.trim()
        };
      } else if (data['location.address']) {
        // Fallback nếu react-hook-form trả về nested key khác
        formattedData.location = {
          address: String(data['location.address']).trim()
        };
      }
      
      // Conditions - chỉ gửi nếu có ít nhất một giá trị
      const conditions = {};
      if (data.conditions?.temperature !== undefined && data.conditions.temperature !== null && data.conditions.temperature !== '') {
        conditions.temperature = Number(data.conditions.temperature);
      }
      if (data.conditions?.humidity !== undefined && data.conditions.humidity !== null && data.conditions.humidity !== '') {
        conditions.humidity = Number(data.conditions.humidity);
      }
      if (data.conditions?.light && data.conditions.light !== '') {
        conditions.light = data.conditions.light;
      }
      if (data.conditions?.notes && data.conditions.notes.trim() !== '') {
        conditions.notes = data.conditions.notes.trim();
      }
      if (Object.keys(conditions).length > 0) {
        formattedData.conditions = conditions;
      }
      
      // Metadata - chỉ gửi các trường có giá trị
      const metadata = {};
      if (data.metadata?.quantity !== undefined && data.metadata.quantity !== null && data.metadata.quantity !== '') {
        metadata.quantity = Number(data.metadata.quantity);
      }
      if (data.metadata?.unit && data.metadata.unit !== '') {
        metadata.unit = data.metadata.unit;
      }
      if (data.metadata?.transportation && data.metadata.transportation.trim() !== '') {
        metadata.transportation = data.metadata.transportation.trim();
      }
      if (data.metadata?.receiver && data.metadata.receiver.trim() !== '') {
        metadata.receiver = data.metadata.receiver.trim();
      }
      if (data.metadata?.notes && data.metadata.notes.trim() !== '') {
        metadata.notes = data.metadata.notes.trim();
      }
      if (Object.keys(metadata).length > 0) {
        formattedData.metadata = metadata;
      }

      console.log('📤 Adding step with formatted data:', JSON.stringify(formattedData, null, 2));
      
      const response = await supplyChainAPI.addStep(id, formattedData);
      
      if (response.success) {
        toast.success('Thêm bước thành công');
        setShowStepModal(false);
        reset();
        
        // Reload supply chains để cập nhật danh sách
        await loadSupplyChains();
        
        // Reload chi tiết nếu modal đang mở (sử dụng id đã normalize)
        const currentId = normalizeId(selectedSupplyChain?._id || selectedSupplyChain?.id);
        if (currentId && currentId === id) {
          await getSupplyChainDetails(id);
        }
      } else {
        toast.error(response.message || 'Lỗi khi thêm bước');
      }
    } catch (error) {
      console.error('Add step error:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Lỗi khi thêm bước';
      
      if (error.response?.data) {
        const errorData = error.response.data;
        
        // Nếu có message
        if (errorData.message) {
          errorMessage = errorData.message;
        }
        
        // Nếu có errors array
        if (errorData.errors && Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.join(', ');
        }
        
        // Nếu có details từ Joi validation
        if (errorData.details && Array.isArray(errorData.details)) {
          const details = errorData.details.map(d => `${d.message || d.path?.join('.')}: ${d.message}`).join(', ');
          errorMessage = details || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get supply chain details
  const getSupplyChainDetails = async (id) => {
    try {
      const normalizedId = normalizeId(id);
      if (!normalizedId || normalizedId === '[object Object]') {
        console.error('Invalid supply chain ID:', id);
        toast.error('ID hành trình không hợp lệ');
        return;
      }
      
      setLoading(true);
      const response = await supplyChainAPI.getSupplyChain(normalizedId);
      
      if (response.success) {
        // Ensure drugId is populated
        if (response.data.supplyChain.drugId && typeof response.data.supplyChain.drugId === 'object') {
          setSelectedSupplyChain(response.data.supplyChain);
        } else {
          // If drugId is not populated, try to reload
          console.warn('Drug data not populated, reloading...');
          loadSupplyChains();
          toast.error('Dữ liệu thuốc chưa được tải. Vui lòng thử lại.');
          return;
        }
        setShowDetailModal(true);
      } else {
        toast.error(response.message || 'Không thể lấy thông tin hành trình');
      }
    } catch (error) {
      console.error('Error getting supply chain details:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.status === 404 ? 'Hành trình không tồn tại' :
                          'Lỗi khi lấy thông tin hành trình';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    const icons = {
      manufacturer: Package,
      distributor: Truck,
      hospital: Building2,
      patient: User,
      admin: Shield
    };
    return icons[role] || User;
  };

  // Get action color
  const getActionColor = (action) => {
    const colors = {
      created: 'bg-green-100 text-green-800',
      shipped: 'bg-blue-100 text-blue-800',
      received: 'bg-purple-100 text-purple-800',
      stored: 'bg-yellow-100 text-yellow-800',
      dispensed: 'bg-indigo-100 text-indigo-800',
      recalled: 'bg-red-100 text-red-800',
      quality_check: 'bg-orange-100 text-orange-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      recalled: 'bg-red-100 text-red-800',
      expired: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      suspended: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Helper function để tạo unique key - luôn đảm bảo trả về string và unique
  const getUniqueKey = (item, idx) => {
    // Luôn bao gồm index để đảm bảo uniqueness
    let idPart = '';
    
    // Thử lấy ID từ nhiều nguồn
    if (item._id) {
      if (typeof item._id === 'string' && item._id.trim() !== '') {
        idPart = item._id;
      } else if (typeof item._id === 'object' && item._id !== null) {
        // Nếu _id là object, lấy nested _id hoặc id
        const nestedId = item._id._id || item._id.id;
        if (nestedId && typeof nestedId === 'string') {
          idPart = nestedId;
        } else if (nestedId && typeof nestedId === 'object' && nestedId.toString) {
          idPart = nestedId.toString();
        }
      } else if (item._id && item._id.toString && typeof item._id.toString === 'function') {
        idPart = item._id.toString();
      }
    }
    
    // Nếu không có ID hợp lệ, tạo từ các giá trị khác
    if (!idPart || idPart === '[object Object]') {
      const batchNumber = String(item.drugBatchNumber || '');
      const drugIdValue = typeof item.drugId === 'object' && item.drugId 
        ? String(item.drugId._id || item.drugId.id || '') 
        : String(item.drugId || '');
      const createdAt = item.createdAt ? String(new Date(item.createdAt).getTime()) : '';
      idPart = `sc-${batchNumber}-${drugIdValue}-${createdAt}`;
    }
    
    // Luôn kết hợp với index để đảm bảo unique ngay cả khi có duplicate ID
    return `supplychain-${idx}-${idPart}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chuỗi Cung ứng</h1>
          <p className="text-gray-600">Quản lý hành trình thuốc từ sản xuất đến người dùng</p>
        </div>
        
        {hasAnyRole && hasAnyRole(['admin', 'manufacturer']) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Plus className="h-5 w-5" />
            <span>Tạo hành trình mới</span>
          </button>
        )}
      </div>

      {/* Timeline Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg">
        <button
          onClick={() => setShowTimelineHelp(!showTimelineHelp)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-100 transition-colors rounded-lg"
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">ℹ️</span>
            </div>
            <div>
              <h3 className="font-semibold text-blue-900">Hướng dẫn đọc Timeline</h3>
              <p className="text-sm text-blue-700">Giải thích cách đọc hành trình thuốc trên timeline</p>
            </div>
          </div>
          {showTimelineHelp ? (
            <ChevronUp className="h-5 w-5 text-blue-600 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-600 flex-shrink-0" />
          )}
        </button>
        
        {showTimelineHelp && (
          <div className="px-4 pb-4 pt-2 border-t border-blue-200">
            <div className="mt-3 space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-blue-500 rounded-full mt-0.5 flex-shrink-0"></div>
                <div>
                  <strong>Màu xanh:</strong> Trạng thái bình thường, đã hoàn thành
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full mt-0.5 flex-shrink-0"></div>
                <div>
                  <strong>Màu đỏ:</strong> Cảnh báo (nhiệt độ cao, sốc, v.v.)
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-4 h-4 bg-gray-300 rounded-full mt-0.5 flex-shrink-0"></div>
                <div>
                  <strong>Màu xám:</strong> Đang chờ xử lý
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Shield className="w-4 h-4 mt-0.5 text-green-600 flex-shrink-0" />
                <div>
                  <strong>Verified badge:</strong> Đã được ký số và xác minh trên blockchain
                </div>
              </div>
              <div className="pt-2 border-t border-blue-200 space-y-1">
                <div><strong>Đường nét liền:</strong> Bước đã hoàn thành</div>
                <div><strong>Đường nét đứt:</strong> Bước đang chờ xử lý</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tìm theo lô, tên..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="recalled">Thu hồi</option>
              <option value="expired">Hết hạn</option>
              <option value="completed">Hoàn thành</option>
              <option value="suspended">Tạm dừng</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vai trò
            </label>
            <select
              value={filters.role}
              onChange={(e) => setFilters({ ...filters, role: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả vai trò</option>
              <option value="manufacturer">Nhà sản xuất</option>
              <option value="distributor">Nhà phân phối</option>
              <option value="hospital">Bệnh viện</option>
              <option value="patient">Bệnh nhân</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={loadSupplyChains}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowMapView(!showMapView)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              showMapView 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Map className="h-4 w-4" />
            <span>{showMapView ? 'Xem danh sách' : 'Xem bản đồ'}</span>
          </button>
          
          <button
            onClick={() => handleExport('csv')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <FileDown className="h-4 w-4" />
            <span>Xuất CSV</span>
          </button>
          
          <button
            onClick={() => handleExport('xlsx')}
            disabled={loading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center space-x-2"
          >
            <FileDown className="h-4 w-4" />
            <span>Xuất Excel</span>
          </button>

          {hasRole && hasRole('admin') && (
            <>
              <button
                onClick={() => setIsSelectMode(!isSelectMode)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
                  isSelectMode 
                    ? 'bg-orange-600 text-white hover:bg-orange-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                <span>{isSelectMode ? 'Hủy chọn' : 'Chọn nhiều'}</span>
              </button>
              
              {isSelectMode && selectedItems.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Xóa ({selectedItems.length})</span>
                </button>
              )}
            </>
          )}

          <button
            onClick={() => setSseConnected(!sseConnected)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              sseConnected 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            title="Bật/tắt cập nhật real-time"
          >
            <Bell className="h-4 w-4" />
            <span>{sseConnected ? 'Đang theo dõi' : 'Theo dõi'}</span>
          </button>
        </div>
      </div>

      {/* Map View */}
      {showMapView && (
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bản đồ chuỗi cung ứng</h3>
          <SupplyChainMap 
            supplyChains={mapData} 
            height="600px" 
            focusAddress={focusAddress}
            onFocusComplete={() => setFocusAddress(null)} // Reset sau khi focus xong
          />
        </div>
      )}

      {/* Supply Chains List */}
      {!showMapView && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Danh sách hành trình</h3>
            {isSelectMode && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  {selectedItems.length === supplyChains.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                </button>
                <span className="text-sm text-gray-600">
                  Đã chọn: {selectedItems.length}
                </span>
              </div>
            )}
          </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {isSelectMode && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === supplyChains.length && supplyChains.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lô thuốc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thuốc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vị trí hiện tại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bước cuối
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="h-5 w-5 animate-spin text-blue-600 mr-2" />
                      <span>Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : supplyChains.length === 0 ? (
                <tr>
                  <td colSpan={isSelectMode ? 8 : 7} className="px-6 py-4 text-center text-gray-500">
                    Không có hành trình nào
                  </td>
                </tr>
              ) : (
                supplyChains.map((supplyChain, idx) => {
                  const currentStep = supplyChain.steps[supplyChain.steps.length - 1];
                  const RoleIcon = getRoleIcon(currentStep?.actorRole);
                  
                  const chainId = normalizeId(supplyChain._id || supplyChain.id);
                  const isSelected = selectedItems.some(i => normalizeId(i._id || i.id) === chainId);
                  
                  return (
                    <tr key={getUniqueKey(supplyChain, idx)} className={`hover:bg-gray-50 ${isSelected ? 'bg-blue-50' : ''}`}>
                      {isSelectMode && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectItem(supplyChain)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Package className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="font-medium text-gray-900">
                            {supplyChain.drugBatchNumber}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {supplyChain.drugId?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {supplyChain.drugId?.activeIngredient || supplyChain.drugId?.genericName || supplyChain.drugBatchNumber}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {currentStep ? (
                            <>
                              <RoleIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {currentStep.actorName || 'N/A'}
                              </span>
                            </>
                          ) : supplyChain.currentLocation ? (
                            <>
                              <RoleIcon className="h-4 w-4 text-gray-400 mr-2" />
                              <span className="text-sm text-gray-900">
                                {supplyChain.currentLocation.actorName || 'N/A'}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">Chưa có</span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(supplyChain.status || 'active')}`}>
                          {supplyChain.status || 'active'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {currentStep?.action ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActionColor(currentStep.action)}`}>
                            {currentStep.action}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Chưa có</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(supplyChain.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              // Ưu tiên sử dụng supplyChain.id (thường đã là string hợp lệ)
                              const id = supplyChain.id && supplyChain.id !== '[object Object]' && typeof supplyChain.id === 'string'
                                ? supplyChain.id
                                : normalizeId(supplyChain._id || supplyChain.id);
                              if (!id || id === '[object Object]') {
                                console.error('Invalid supply chain ID in button click:', supplyChain);
                                toast.error('ID hành trình không hợp lệ');
                                return;
                              }
                              getSupplyChainDetails(id);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                            title="Xem chi tiết"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedQRData({
                                batchNumber: supplyChain.drugBatchNumber,
                                blockchainId: supplyChain.qrCode?.blockchainId,
                                verificationUrl: supplyChain.qrCode?.verificationUrl,
                                drugName: supplyChain.drugId?.name
                              });
                              setShowQRModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                            title="Xem QR Code"
                          >
                            <QrCode className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Hiển thị {supplyChains.length} trong {pagination.total} kết quả
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setPagination({ ...pagination, current: pagination.current - 1 })}
                  disabled={pagination.current === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  Trước
                </button>
                <span className="px-3 py-1 text-sm">
                  {pagination.current} / {pagination.pages}
                </span>
                <button
                  onClick={() => setPagination({ ...pagination, current: pagination.current + 1 })}
                  disabled={pagination.current === pagination.pages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      )}

      {/* Create Supply Chain Modal */}
      {showCreateModal && (
        <CreateSupplyChainModal
          onSubmit={onCreateSupplyChain}
          onClose={() => setShowCreateModal(false)}
          loading={loading}
        />
      )}

      {/* Add Step Modal */}
      {showStepModal && selectedSupplyChain && (
        <AddStepModal
          supplyChain={selectedSupplyChain}
          onSubmit={onAddStep}
          onClose={() => setShowStepModal(false)}
          loading={loading}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSupplyChain && (
        <SupplyChainDetailModal
          supplyChain={selectedSupplyChain}
          onClose={() => setShowDetailModal(false)}
          onAddStep={() => {
            setShowDetailModal(false);
            setShowStepModal(true);
          }}
          onAddressClick={(address) => {
            setFocusAddress(address);
            setShowDetailModal(false);
            setShowMapView(true);
          }}
        />
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedQRData && (
        <QRCodeModal
          qrData={selectedQRData}
          onClose={() => {
            setShowQRModal(false);
            setSelectedQRData(null);
          }}
        />
      )}
    </div>
  );
};

// Create Supply Chain Modal Component
const CreateSupplyChainModal = ({ onSubmit, onClose, loading }) => {
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm();
  const [drugs, setDrugs] = useState([]);
  const [loadingDrugs, setLoadingDrugs] = useState(false);
  const [shippers, setShippers] = useState([]);
  const [loadingShippers, setLoadingShippers] = useState(false);
  const selectedDrugId = watch('drugId');
  const shipperType = watch('shipperType');

  // Load danh sách drugs khi modal mở
  useEffect(() => {
    const loadDrugs = async () => {
      try {
        setLoadingDrugs(true);
        let allDrugs = [];
        let page = 1;
        const limit = 100;
        let hasMore = true;

        // Load tất cả drugs bằng cách load nhiều pages
        while (hasMore) {
          const response = await drugAPI.getDrugs({ limit, page });
          
          if (response.success && response.data?.drugs) {
            allDrugs = [...allDrugs, ...response.data.drugs];
            
            const total = response.data.pagination?.total || 0;
            const currentPage = response.data.pagination?.current || page;
            const totalPages = response.data.pagination?.pages || 1;
            
            if (currentPage >= totalPages || allDrugs.length >= total) {
              hasMore = false;
            } else {
              page++;
            }
          } else {
            hasMore = false;
          }
        }

        if (allDrugs.length > 0) {
          setDrugs(allDrugs);
          console.log(`✅ Đã tải ${allDrugs.length} thuốc cho supply chain`);
        }
      } catch (error) {
        console.error('Error loading drugs:', error);
        toast.error('Không thể tải danh sách thuốc');
      } finally {
        setLoadingDrugs(false);
      }
    };

    loadDrugs();
  }, []);

  // Load danh sách shippers (users có thể làm shipper)
  useEffect(() => {
    const loadShippers = async () => {
      try {
        setLoadingShippers(true);
        // Các role có thể làm shipper
        const shipperRoles = ['manufacturer', 'distributor', 'dealer', 'pharmacy', 'hospital', 'admin'];
        let allShippers = [];
        
        // Load users từ từng role
        for (const role of shipperRoles) {
          try {
            let page = 1;
            let hasMore = true;
            const limit = 100;
            
            while (hasMore) {
              const response = await userAPI.getUsers({ role, limit, page });
              
              if (response.success && response.data?.users) {
                allShippers = [...allShippers, ...response.data.users];
                
                const total = response.data.pagination?.total || 0;
                const currentPage = response.data.pagination?.current || page;
                const totalPages = response.data.pagination?.pages || 1;
                
                if (currentPage >= totalPages || allShippers.length >= total) {
                  hasMore = false;
                } else {
                  page++;
                }
              } else {
                hasMore = false;
              }
            }
          } catch (error) {
            console.warn(`Error loading shippers for role ${role}:`, error);
          }
        }
        
        if (allShippers.length > 0) {
          setShippers(allShippers);
          console.log(`✅ Đã tải ${allShippers.length} shippers`);
        }
      } catch (error) {
        console.error('Error loading shippers:', error);
        // Không hiển thị toast error vì đây là optional field
      } finally {
        setLoadingShippers(false);
      }
    };
    
    loadShippers();
  }, []);

  // Normalize drug ID helper
  const normalizeDrugId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') {
      if (/^[0-9a-fA-F]{24}$/.test(id.trim())) {
        return id.trim();
      }
      return null;
    }
    if (typeof id === 'object' && id !== null) {
      const keys = Object.keys(id);
      if (keys.length > 0 && keys.every(key => /^\d+$/.test(key))) {
        const normalized = keys
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => String(id[key]))
          .join('');
        if (/^[0-9a-fA-F]{24}$/.test(normalized)) {
          return normalized;
        }
      }
      if (id._id) return normalizeDrugId(id._id);
      if (id.id) return normalizeDrugId(id.id);
      if (id.toString && typeof id.toString === 'function') {
        const str = id.toString();
        if (str && str !== '[object Object]' && /^[0-9a-fA-F]{24}$/.test(str)) {
          return str;
        }
      }
    }
    return null;
  };

  // Khi chọn drug, tự động fill batchNumber
  useEffect(() => {
    if (selectedDrugId) {
      const selectedDrug = drugs.find(d => {
        const drugId = normalizeDrugId(d._id || d.id);
        return drugId === selectedDrugId;
      });
      
      if (selectedDrug && selectedDrug.batchNumber) {
        setValue('drugBatchNumber', selectedDrug.batchNumber);
      }
    }
  }, [selectedDrugId, drugs, setValue]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Tạo hành trình mới</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Chọn thuốc *
            </label>
            {loadingDrugs ? (
              <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                <span className="text-gray-500 text-sm">Đang tải danh sách thuốc...</span>
              </div>
            ) : (
              <select
                {...register('drugId', { required: 'Vui lòng chọn thuốc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn thuốc</option>
                {drugs
                  .map((drug) => {
                    const drugId = normalizeDrugId(drug._id || drug.id);
                    if (!drugId) return null;
                    return { drug, drugId };
                  })
                  .filter(item => item !== null)
                  .map(({ drug, drugId }) => (
                    <option key={drugId} value={drugId}>
                      {drug.name || drug.drugId || 'N/A'}
                      {drug.batchNumber ? ` - Lô: ${drug.batchNumber}` : ''}
                      {drug.activeIngredient ? ` (${drug.activeIngredient})` : ''}
                    </option>
                  ))}
              </select>
            )}
            {errors.drugId && (
              <p className="text-red-500 text-sm mt-1">{errors.drugId.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lô *
            </label>
            <input
              type="text"
              {...register('drugBatchNumber', { required: 'Số lô là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập số lô"
            />
            {errors.drugBatchNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.drugBatchNumber.message}</p>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Số lượng
              </label>
              <input
                type="number"
                {...register('metadata.quantity')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Số lượng"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn vị
              </label>
              <select
                {...register('metadata.unit')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="unit">Đơn vị</option>
                <option value="box">Hộp</option>
                <option value="bottle">Chai</option>
                <option value="tablet">Viên</option>
              </select>
            </div>
          </div>

          {/* Shipper Selection */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Người vận chuyển (Shipper)
            </label>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại shipper
                </label>
                <select
                  {...register('shipperType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Không chọn</option>
                  <option value="user">Chọn từ hệ thống</option>
                  <option value="third_party">Bên thứ 3 vận chuyển</option>
                </select>
              </div>

              {/* Chọn từ user trong hệ thống */}
              {shipperType === 'user' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chọn người vận chuyển *
                  </label>
                  {loadingShippers ? (
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center">
                      <span className="text-gray-500 text-sm">Đang tải danh sách...</span>
                    </div>
                  ) : (
                    <select
                      {...register('shipperId', { 
                        required: shipperType === 'user' ? 'Vui lòng chọn người vận chuyển' : false 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn người vận chuyển</option>
                      {shippers.map((shipper) => {
                        const shipperId = shipper._id || shipper.id;
                        if (!shipperId) return null;
                        return (
                          <option key={shipperId} value={shipperId}>
                            {shipper.fullName || shipper.username || 'N/A'}
                            {shipper.organizationInfo?.name ? ` - ${shipper.organizationInfo.name}` : ''}
                            {shipper.role ? ` (${shipper.role})` : ''}
                          </option>
                        );
                      })}
                    </select>
                  )}
                  {errors.shipperId && (
                    <p className="text-red-500 text-sm mt-1">{errors.shipperId.message}</p>
                  )}
                </div>
              )}

              {/* Bên thứ 3 vận chuyển */}
              {shipperType === 'third_party' && (
                <div className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-200">
                  <h4 className="font-medium text-gray-900 text-sm">📦 Thông tin bên thứ 3 vận chuyển</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên bên vận chuyển *
                    </label>
                    <input
                      type="text"
                      {...register('thirdPartyName', { 
                        required: shipperType === 'third_party' ? 'Vui lòng nhập tên bên vận chuyển' : false 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Ví dụ: Công ty Vận chuyển ABC"
                    />
                    {errors.thirdPartyName && (
                      <p className="text-red-500 text-sm mt-1">{errors.thirdPartyName.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tên tổ chức
                    </label>
                    <input
                      type="text"
                      {...register('thirdPartyOrganization')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Tên công ty/tổ chức"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Số điện thoại
                      </label>
                      <input
                        type="tel"
                        {...register('thirdPartyPhone')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Số điện thoại"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        {...register('thirdPartyEmail')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Email"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
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
              {loading ? 'Đang tạo...' : 'Tạo hành trình'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Add Step Modal Component
const AddStepModal = ({ supplyChain, onSubmit, onClose, loading }) => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const selectedAction = watch('action');

  // Các hành động cần theo dõi nhiệt độ và điều kiện bảo quản
  const requiresTemperature = ['shipped', 'received', 'stored', 'quality_check'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Thêm bước mới</h3>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hành động *
            </label>
            <select
              {...register('action', { required: 'Hành động là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn hành động</option>
              <option value="shipped">🚚 Vận chuyển / Gửi hàng</option>
              <option value="received">📦 Nhận hàng</option>
              <option value="stored">📦 Lưu kho</option>
              <option value="dispensed">💊 Cấp phát</option>
              <option value="quality_check">✅ Kiểm tra chất lượng</option>
            </select>
            {errors.action && (
              <p className="text-red-500 text-sm mt-1">{errors.action.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Địa điểm *
            </label>
            <input
              type="text"
              {...register('location.address', { required: 'Địa điểm là bắt buộc' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập địa chỉ vận chuyển/nhận hàng"
            />
            {errors['location.address'] && (
              <p className="text-red-500 text-sm mt-1">{errors['location.address'].message}</p>
            )}
          </div>

          {/* Điều kiện bảo quản - chỉ hiển thị khi cần */}
          {selectedAction && requiresTemperature.includes(selectedAction) && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-200">
              <h4 className="font-medium text-gray-900 text-sm">🌡️ Điều kiện bảo quản</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nhiệt độ (°C) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('conditions.temperature', { 
                      required: requiresTemperature.includes(selectedAction) ? 'Nhiệt độ là bắt buộc' : false,
                      valueAsNumber: true 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: 25"
                  />
                  {errors['conditions.temperature'] && (
                    <p className="text-red-500 text-sm mt-1">{errors['conditions.temperature'].message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Nhiệt độ khi vận chuyển/lưu kho</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Độ ẩm (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    {...register('conditions.humidity', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: 60"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Điều kiện ánh sáng
                </label>
                <select
                  {...register('conditions.light')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn điều kiện</option>
                  <option value="dark">Tối (Dark)</option>
                  <option value="low">Ánh sáng yếu (Low)</option>
                  <option value="normal">Bình thường (Normal)</option>
                  <option value="bright">Sáng (Bright)</option>
                </select>
              </div>
            </div>
          )}

          {/* Thông tin vận chuyển - chỉ hiển thị khi shipped */}
          {selectedAction === 'shipped' && (
            <div className="bg-green-50 p-4 rounded-lg space-y-4 border border-green-200">
              <h4 className="font-medium text-gray-900 text-sm">📦 Thông tin vận chuyển</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số lượng
                  </label>
                  <input
                    type="number"
                    {...register('metadata.quantity', { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Số lượng vận chuyển"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn vị
                  </label>
                  <select
                    {...register('metadata.unit')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn đơn vị</option>
                    <option value="unit">Đơn vị</option>
                    <option value="box">Hộp</option>
                    <option value="bottle">Chai</option>
                    <option value="tablet">Viên</option>
                    <option value="vial">Lọ</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phương tiện vận chuyển
                </label>
                <input
                  type="text"
                  {...register('metadata.transportation')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ví dụ: Xe tải, Máy bay, Tàu..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Người nhận dự kiến
                </label>
                <input
                  type="text"
                  {...register('metadata.receiver')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Tên người/nơi nhận hàng"
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ghi chú
            </label>
            <textarea
              {...register('metadata.notes')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ghi chú về bước này (tùy chọn)"
            />
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
              {loading ? 'Đang thêm...' : 'Thêm bước'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Supply Chain Detail Modal Component
const SupplyChainDetailModal = ({ supplyChain, onClose, onAddStep, onAddressClick }) => {
  // Convert supply chain steps to DrugTimeline events format
  const convertStepsToTimelineEvents = (steps, supplyChain) => {
    const events = [];

    // Map action to Vietnamese stage name
    const getStageName = (action) => {
      const stageMap = {
        created: 'Sản xuất',
        shipped: 'Vận chuyển',
        received: 'Tiếp nhận',
        stored: 'Lưu kho',
        dispensed: 'Cấp phát',
        recalled: 'Thu hồi',
        quality_check: 'Kiểm tra chất lượng',
        manufacturing: 'Sản xuất',
        transportation: 'Vận chuyển',
        hospital_reception: 'Tiếp nhận tại Bệnh viện',
        warehouse: 'Lưu kho'
      };
      return stageMap[action] || action;
    };

    // Determine status based on step data
    const getStatus = (step) => {
      // Check if step has warning conditions
      const temperature = step.metadata?.temperature;
      const hasWarning = step.metadata?.hasWarning || step.metadata?.warning;
      
      // Temperature warning (exceeds 25°C)
      if (temperature && temperature > 25) {
        return 'warning';
      }
      
      // Explicit warning flag
      if (hasWarning) {
        return 'warning';
      }
      
      // Check if step is completed (has timestamp and actor)
      if (step.timestamp && step.actorName) {
        return 'normal';
      }
      
      // Pending if no timestamp
      return 'pending';
    };

    // If no steps, create an initial "created" step from supply chain info
    if (!steps || steps.length === 0) {
      if (supplyChain.createdAt) {
        events.push({
          stageName: 'Tạo hành trình',
          location: supplyChain.currentLocation?.address || supplyChain.currentLocation?.actorName || 'N/A',
          timestamp: supplyChain.createdAt,
          signerName: supplyChain.createdBy?.fullName || 'Hệ thống',
          isVerified: false,
          temperature: null,
          status: 'normal'
        });
      }
      return events;
    }

    // Convert actual steps
    return steps.map((step) => ({
      stageName: getStageName(step.action),
      location: step.location?.address || step.location?.name || step.actorName || 'N/A',
      timestamp: step.timestamp || step.createdAt || new Date(),
      signerName: step.actorName || step.actorId?.fullName || step.actorId?.organizationInfo?.name || 'N/A',
      isVerified: step.digitalSignature || step.isVerified || step.blockchainVerified || false,
      temperature: step.metadata?.temperature || step.temperature,
      status: getStatus(step),
      warningMessage: step.metadata?.warningMessage || 
                     (step.metadata?.temperature && step.metadata.temperature > 25 
                       ? `Nhiệt độ: ${step.metadata.temperature}°C - Vượt quá giới hạn cho phép (25°C)`
                       : step.metadata?.warning || null)
    }));
  };

  const timelineEvents = convertStepsToTimelineEvents(supplyChain.steps, supplyChain);
  
  // Handler để click vào địa chỉ trong timeline
  const handleAddressClick = (address) => {
    if (address && onAddressClick) {
      onAddressClick(address);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Chi tiết hành trình</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        {/* Supply Chain Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Thông tin cơ bản</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Lô thuốc:</span> {supplyChain.drugBatchNumber}</p>
              <p><span className="font-medium">Thuốc:</span> {supplyChain.drugId?.name}</p>
              <p><span className="font-medium">Trạng thái:</span> {supplyChain.status}</p>
              <p><span className="font-medium">Ngày tạo:</span> {new Date(supplyChain.createdAt).toLocaleString('vi-VN')}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Vị trí hiện tại</h4>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Tại:</span> {supplyChain.currentLocation?.actorName}</p>
              <p><span className="font-medium">Vai trò:</span> {supplyChain.currentLocation?.actorRole}</p>
              <p>
                <span className="font-medium">Địa chỉ:</span>{' '}
                {supplyChain.currentLocation?.address ? (
                  onAddressClick ? (
                    <button
                      onClick={() => onAddressClick(supplyChain.currentLocation.address)}
                      className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      title="Click để xem trên bản đồ"
                    >
                      {supplyChain.currentLocation.address}
                    </button>
                  ) : (
                    supplyChain.currentLocation.address
                  )
                ) : (
                  'N/A'
                )}
              </p>
              <p><span className="font-medium">Cập nhật:</span> {new Date(supplyChain.currentLocation?.lastUpdated).toLocaleString('vi-VN')}</p>
            </div>
          </div>
        </div>
        
        {/* Steps Timeline */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Hành trình chi tiết</h4>
          {timelineEvents.length > 0 ? (
            <div className="bg-gray-50 rounded-lg p-4">
              <DrugTimeline events={timelineEvents} onAddressClick={handleAddressClick} />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-8 h-8 text-gray-400" />
                </div>
                <h5 className="text-lg font-medium text-gray-900 mb-2">
                  Chưa có bước nào trong hành trình
                </h5>
                <p className="text-sm text-gray-500 mb-4 max-w-md">
                  Hành trình này chưa có bước nào được ghi nhận. Hãy thêm bước đầu tiên để bắt đầu theo dõi hành trình của lô thuốc.
                </p>
                <button
                  onClick={onAddStep}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm bước đầu tiên</span>
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onAddStep}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Thêm bước
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

// QR Code Modal Component
const QRCodeModal = ({ qrData, onClose }) => {
  // Tạo verification URL nếu chưa có
  const getVerificationUrl = () => {
    if (qrData.verificationUrl) {
      // Nếu có verificationUrl nhưng là localhost, thay bằng hostname hiện tại
      if (qrData.verificationUrl.includes('localhost')) {
        const currentHost = window.location.origin;
        const urlPath = qrData.verificationUrl.split('/verify/')[1];
        return `${currentHost}/verify/${urlPath || qrData.blockchainId || qrData.batchNumber}`;
      }
      return qrData.verificationUrl;
    }
    
    // Tạo verification URL từ blockchainId hoặc batchNumber
    const currentHost = window.location.origin;
    const id = qrData.blockchainId || qrData.batchNumber;
    return `${currentHost}/verify/${id}`;
  };
  
  const verificationUrl = getVerificationUrl();
  
  // Tạo QR code data - ưu tiên verificationUrl để có thể quét và mở trực tiếp
  const qrValue = verificationUrl;

  // Nếu không có dữ liệu để tạo QR code
  if (!qrValue) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">QR Code</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">Không có dữ liệu QR code cho lô thuốc này</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    try {
      // Tìm SVG element trong container
      const container = document.getElementById('qrcode-container');
      if (!container) return;

      const svg = container.querySelector('svg');
      if (!svg) return;

      // Serialize SVG
      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      // Tạo canvas để convert sang PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Download
        canvas.toBlob((blob) => {
          const downloadLink = document.createElement('a');
          downloadLink.download = `QR_${qrData.batchNumber || 'code'}.png`;
          downloadLink.href = URL.createObjectURL(blob);
          downloadLink.click();
          URL.revokeObjectURL(downloadLink.href);
        });
        
        URL.revokeObjectURL(url);
      };

      img.src = url;
    } catch (error) {
      console.error('Error downloading QR code:', error);
      toast.error('Không thể tải QR code');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">QR Code</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Thông tin lô thuốc */}
          {qrData.drugName && (
            <div>
              <p className="text-sm text-gray-600">Tên thuốc:</p>
              <p className="font-medium text-gray-900">{qrData.drugName}</p>
            </div>
          )}
          
          {qrData.batchNumber && (
            <div>
              <p className="text-sm text-gray-600">Số lô:</p>
              <p className="font-medium text-gray-900">{qrData.batchNumber}</p>
            </div>
          )}

          {qrData.blockchainId && (
            <div>
              <p className="text-sm text-gray-600">Blockchain ID:</p>
              <p className="font-medium text-gray-900 text-xs break-all">{qrData.blockchainId}</p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-gray-600">Verification URL:</p>
            <p className="font-medium text-gray-900 text-xs break-all">{verificationUrl}</p>
          </div>

          {/* QR Code */}
          <div className="flex justify-center p-4 bg-gray-50 rounded-lg">
            <div id="qrcode-container" className="bg-white p-4 rounded-lg">
              <QRCode
                id="qrcode-svg"
                value={qrValue}
                size={256}
                level="H"
                fgColor="#000000"
                bgColor="#ffffff"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-center space-x-3">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Tải xuống</span>
            </button>
            
            {qrData.verificationUrl && (
              <button
                onClick={() => window.open(qrData.verificationUrl, '_blank')}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <QrCode className="h-4 w-4" />
                <span>Xác minh</span>
              </button>
            )}
            
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChain;
