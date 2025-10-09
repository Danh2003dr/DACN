import React, { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  RefreshCw,
  Download,
  ExternalLink,
  Shield,
  Calendar,
  MapPin,
  Package
} from 'lucide-react';
import { drugAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const QRScanner = () => {
  const { user, hasRole } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [drugInfo, setDrugInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(true);
  const [manualQR, setManualQR] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  // Load scan history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('qrScanHistory');
    if (savedHistory) {
      setScanHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save scan history to localStorage
  const saveToHistory = (scanData) => {
    const newHistory = [
      { ...scanData, timestamp: new Date().toISOString() },
      ...scanHistory.slice(0, 9) // Keep only last 10 scans
    ];
    setScanHistory(newHistory);
    localStorage.setItem('qrScanHistory', JSON.stringify(newHistory));
  };

  // Handle QR scan result (placeholder for future camera integration)
  const handleScan = async (result) => {
    if (result && result.text) {
      setScanResult(result.text);
      setShowScanner(false);
      await processQRData(result.text);
    }
  };

  // Handle scan error (placeholder for future camera integration)
  const handleError = (error) => {
    console.error('QR Scanner Error:', error);
    toast.error('Lỗi khi quét QR code');
  };

  // Process QR data
  const processQRData = async (qrData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await drugAPI.scanQRCode({ qrData });
      
      if (response.success) {
        setDrugInfo(response.data);
        
        // Save to history
        saveToHistory({
          qrData,
          drugInfo: response.data,
          success: true
        });
        
        toast.success('Quét QR code thành công!');
      } else {
        setError(response.message);
        
        // Save failed scan to history
        saveToHistory({
          qrData,
          error: response.message,
          success: false
        });
      }
    } catch (error) {
      console.error('Process QR Error:', error);
      setError('Lỗi khi xử lý dữ liệu QR code');
      toast.error('Lỗi khi xử lý dữ liệu QR code');
    } finally {
      setLoading(false);
    }
  };

  // Manual QR input
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (manualQR.trim()) {
      await processQRData(manualQR.trim());
      setManualQR('');
      setShowManualInput(false);
    }
  };

  // Reset scanner
  const resetScanner = () => {
    setScanResult(null);
    setDrugInfo(null);
    setError(null);
    setShowScanner(true);
  };

  // Clear history
  const clearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem('qrScanHistory');
    toast.success('Đã xóa lịch sử quét');
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'recalled': return 'text-red-600 bg-red-100';
      case 'expired': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Hoạt động';
      case 'recalled': return 'Đã thu hồi';
      case 'expired': return 'Hết hạn';
      default: return 'Không xác định';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quét Mã QR</h1>
          <p className="text-gray-600">Quét mã QR để tra cứu thông tin thuốc</p>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => setShowManualInput(!showManualInput)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Package className="h-5 w-5" />
            <span>Nhập thủ công</span>
          </button>
          
          {!showScanner && (
            <button
              onClick={resetScanner}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Quét lại</span>
            </button>
          )}
        </div>
      </div>

      {/* Manual QR Input */}
      {showManualInput && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Nhập mã QR thủ công</h3>
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <input
              type="text"
              value={manualQR}
              onChange={(e) => setManualQR(e.target.value)}
              placeholder="Nhập dữ liệu QR code..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!manualQR.trim() || loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : 'Tra cứu'}
            </button>
          </form>
        </div>
      )}

      {/* QR Scanner */}
      {showScanner && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Quét mã QR</h3>
            
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-8 mb-4">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  Camera quét QR sẽ được tích hợp trong phiên bản mobile
                </p>
                <p className="text-sm text-gray-500">
                  Hiện tại vui lòng sử dụng chức năng "Nhập thủ công" bên dưới
                </p>
              </div>
              
              <button
                onClick={() => setShowManualInput(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2 mx-auto"
              >
                <QrCode className="h-5 w-5" />
                <span>Nhập mã QR thủ công</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Đang xử lý dữ liệu...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h3 className="font-semibold">Lỗi khi quét QR</h3>
              <p className="text-gray-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Drug Information */}
      {drugInfo && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Thông tin thuốc</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(drugInfo.status)}`}>
                {getStatusText(drugInfo.status)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Thông tin cơ bản</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tên thuốc</label>
                    <p className="text-gray-900">{drugInfo.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mã lô</label>
                    <p className="text-gray-900 font-mono">{drugInfo.batchNumber}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Hoạt chất</label>
                    <p className="text-gray-900">{drugInfo.activeIngredient}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Liều lượng</label>
                    <p className="text-gray-900">{drugInfo.dosage}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Dạng bào chế</label>
                    <p className="text-gray-900">{drugInfo.form}</p>
                  </div>
                </div>
              </div>

              {/* Dates and Quality */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Thông tin sản xuất</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Ngày sản xuất</label>
                      <p className="text-gray-900">{formatDate(drugInfo.productionDate)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Hạn sử dụng</label>
                      <p className={`font-medium ${drugInfo.isExpired ? 'text-red-600' : drugInfo.isNearExpiry ? 'text-orange-600' : 'text-gray-900'}`}>
                        {formatDate(drugInfo.expiryDate)}
                        {drugInfo.isExpired && ' (Đã hết hạn)'}
                        {drugInfo.isNearExpiry && ` (Còn ${drugInfo.daysUntilExpiry} ngày)`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <div>
                      <label className="text-sm font-medium text-gray-500">Kết quả kiểm định</label>
                      <p className={`font-medium ${drugInfo.qualityTest?.testResult === 'đạt' ? 'text-green-600' : 'text-red-600'}`}>
                        {drugInfo.qualityTest?.testResult || 'Chưa kiểm định'}
                      </p>
                    </div>
                  </div>
                  
                  {drugInfo.manufacturerId && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Nhà sản xuất</label>
                      <p className="text-gray-900">{drugInfo.manufacturerId.fullName}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Distribution History */}
            {drugInfo.distribution?.history && drugInfo.distribution.history.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 border-b pb-2 mb-4">Hành trình phân phối</h4>
                <div className="space-y-3">
                  {drugInfo.distribution.history.map((step, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{step.organizationName}</p>
                        <p className="text-sm text-gray-600">{step.location}</p>
                        {step.note && <p className="text-sm text-gray-500">{step.note}</p>}
                      </div>
                      <span className="text-sm text-gray-500">
                        {formatDate(step.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="mt-6 flex space-x-3">
              <button
                onClick={() => window.open(`/verify/${drugInfo.blockchainId}`, '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Xem trên blockchain</span>
              </button>
              
              <button
                onClick={resetScanner}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Quét mã khác</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Lịch sử quét gần đây</h3>
              <button
                onClick={clearHistory}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Xóa lịch sử
              </button>
            </div>
            
            <div className="space-y-2">
              {scanHistory.slice(0, 5).map((scan, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {scan.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900">
                        {scan.success ? scan.drugInfo?.name || 'Thuốc' : 'Lỗi quét'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {scan.success ? scan.drugInfo?.batchNumber : scan.error}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(scan.timestamp).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
