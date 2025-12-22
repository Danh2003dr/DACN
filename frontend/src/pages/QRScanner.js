import React, { useState, useRef, useEffect } from 'react';
import { 
  QrCode, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  RefreshCw,
  ExternalLink,
  Shield,
  Calendar,
  MapPin,
  Upload,
  Video,
  FileText,
  AlertCircle,
  Database,
  Hash
} from 'lucide-react';
import { BrowserMultiFormatReader, DecodeHintType } from '@zxing/library';
import { drugAPI } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const QRScanner = () => {
  const { user, hasRole } = useAuth();
  const [scanResult, setScanResult] = useState(null);
  const [drugInfo, setDrugInfo] = useState(null);
  const [blockchainData, setBlockchainData] = useState(null);
  const [blockchainInfo, setBlockchainInfo] = useState(null);
  const [riskInfo, setRiskInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [manualQR, setManualQR] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [scanMode, setScanMode] = useState(null); // 'camera', 'upload', 'manual'
  const [isScanning, setIsScanning] = useState(false);
  const [alertModal, setAlertModal] = useState(null); // { type: 'recalled' | 'expired', data: {...} }
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const codeReader = useRef(null);
  const streamRef = useRef(null); // Lưu stream để cleanup
  const scanIntervalRef = useRef(null); // Ref để lưu scan interval
  const canvasRef = useRef(null); // Canvas để xử lý image trước khi decode

  // Initialize QR code reader với hints để xử lý QR code từ màn hình sáng
  useEffect(() => {
    const hints = new Map();
    // Hints để xử lý QR code từ màn hình sáng/chói
    hints.set(DecodeHintType.TRY_HARDER, true); // Cố gắng quét kỹ hơn
    hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
    // Tăng độ chính xác khi quét từ màn hình
    hints.set(DecodeHintType.ASSUME_GS1, false);
    
    codeReader.current = new BrowserMultiFormatReader(hints);
    
    return () => {
      if (codeReader.current) {
        try {
          codeReader.current.reset();
        } catch (e) {
          console.warn('Error resetting codeReader on init cleanup:', e);
        }
      }
    };
  }, []);

  // Load scan history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('qrScanHistory');
    if (savedHistory) {
      setScanHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Stop camera when component unmounts or mode changes
  useEffect(() => {
    return () => {
      // Dừng scan loop nếu đang chạy
      if (scanIntervalRef.current && scanIntervalRef.current.stop) {
        scanIntervalRef.current.stop();
        scanIntervalRef.current = null;
      }
      
      // Cleanup khi component unmount hoặc mode thay đổi
      if (codeReader.current) {
        try {
          codeReader.current.reset();
        } catch (e) {
          console.warn('Error resetting codeReader on cleanup:', e);
        }
      }
      
      // Dừng stream từ ref
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
          });
          streamRef.current = null;
        } catch (e) {
          console.warn('Error stopping stream from ref on cleanup:', e);
        }
      }
      
      // Dừng tất cả video tracks từ video element
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject;
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => {
            try {
              track.stop();
              track.enabled = false;
            } catch (e) {
              console.warn('Error stopping track on cleanup:', e);
            }
          });
        }
        videoRef.current.srcObject = null;
      }
      
      setIsScanning(false);
    };
  }, [scanMode]);

  // Save scan history to localStorage
  const saveToHistory = (scanData) => {
    const newHistory = [
      { ...scanData, timestamp: new Date().toISOString() },
      ...scanHistory.slice(0, 9) // Keep only last 10 scans
    ];
    setScanHistory(newHistory);
    localStorage.setItem('qrScanHistory', JSON.stringify(newHistory));
  };

  // Start camera scanning
  const startCameraScan = async () => {
    try {
      setScanMode('camera');
      setShowScanner(true);
      setError(null);
      setIsScanning(true);

      // Kiểm tra xem browser có hỗ trợ MediaDevices API không
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Trình duyệt của bạn không hỗ trợ truy cập camera. Vui lòng sử dụng trình duyệt hiện đại hơn (Chrome, Firefox, Edge).');
      }

      // Đảm bảo dừng tất cả stream camera hiện có trước khi khởi động lại
      if (videoRef.current && videoRef.current.srcObject) {
        const existingStream = videoRef.current.srcObject;
        existingStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        videoRef.current.srcObject = null;
        // Đợi một chút để camera giải phóng hoàn toàn
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Kiểm tra quyền camera trước (không dừng stream, chỉ kiểm tra)
      try {
        const testStream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        // Dừng stream test ngay để codeReader có thể tự quản lý stream
        testStream.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        // Đợi một chút để camera giải phóng
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (permissionError) {
        if (permissionError.name === 'NotAllowedError' || permissionError.name === 'PermissionDeniedError') {
          setIsScanning(false);
          setError('Quyền truy cập camera bị từ chối. Vui lòng:\n1. Click vào biểu tượng khóa ở thanh địa chỉ\n2. Cho phép quyền truy cập camera\n3. Thử lại');
          toast.error('Vui lòng cấp quyền truy cập camera', {
            duration: 5000,
            icon: '🔒'
          });
          return;
        } else if (permissionError.name === 'NotFoundError' || permissionError.name === 'DevicesNotFoundError') {
          throw new Error('Không tìm thấy camera. Vui lòng kiểm tra kết nối camera.');
        } else if (permissionError.name === 'NotReadableError' || permissionError.name === 'TrackStartError') {
          setIsScanning(false);
          setError('Camera đang được sử dụng bởi ứng dụng khác. Vui lòng:\n1. Đóng tất cả ứng dụng đang sử dụng camera\n2. Làm mới trang (F5)\n3. Thử lại');
          toast.error('Camera đang được sử dụng', {
            duration: 5000
          });
          return;
        } else {
          throw permissionError;
        }
      }

      // Get available video input devices
      const videoInputDevices = await codeReader.current.listVideoInputDevices();
      
      if (videoInputDevices.length === 0) {
        throw new Error('Không tìm thấy camera. Vui lòng kiểm tra kết nối camera.');
      }

      // Use the first available camera (usually the default)
      const selectedDeviceId = videoInputDevices[0].deviceId;

      // Đảm bảo video element sẵn sàng
      if (!videoRef.current) {
        throw new Error('Video element không tồn tại');
      }

      // Set attributes cho video element
      videoRef.current.setAttribute('playsinline', 'true');
      videoRef.current.setAttribute('autoplay', 'true');
      videoRef.current.setAttribute('muted', 'true');

      // Lấy stream camera trước
      try {
        console.log('🎥 Getting camera stream with device:', selectedDeviceId);
        
        // Lấy stream từ camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDeviceId },
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });

        // Lưu stream vào ref để cleanup
        streamRef.current = stream;

        // Set stream vào video element
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          console.log('✅ Stream đã được set vào video element');
        }

        // Đợi video load và play
        await new Promise((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element không tồn tại'));
            return;
          }

          const video = videoRef.current;
          
          const onLoadedMetadata = async () => {
            try {
              await video.play();
              console.log('✅ Video đang phát');
              video.removeEventListener('loadedmetadata', onLoadedMetadata);
              video.removeEventListener('error', onError);
              resolve();
            } catch (playError) {
              console.warn('⚠️ Video play error:', playError);
              video.removeEventListener('loadedmetadata', onLoadedMetadata);
              video.removeEventListener('error', onError);
              resolve(); // Vẫn resolve để tiếp tục
            }
          };

          const onError = (error) => {
            console.error('❌ Video error:', error);
            video.removeEventListener('loadedmetadata', onLoadedMetadata);
            video.removeEventListener('error', onError);
            reject(error);
          };

          video.addEventListener('loadedmetadata', onLoadedMetadata);
          video.addEventListener('error', onError);

          // Nếu metadata đã load sẵn
          if (video.readyState >= 1) {
            onLoadedMetadata();
          }
        });

        // Đợi một chút để video hiển thị
        await new Promise(resolve => setTimeout(resolve, 500));

        // Sử dụng decodeOnceFromVideoElement trong loop để quét liên tục
        // Cách này đơn giản và hiệu quả hơn, tự động quét khi có QR code
        console.log('🔍 Starting QR scan (continuous mode)...');
        
        let scanActive = true;
        let scanTimeoutId = null;
        
        const scanLoop = async () => {
          // Kiểm tra điều kiện dừng
          if (!scanActive || !videoRef.current) {
            return;
          }
          
          // Kiểm tra video đã sẵn sàng
          if (videoRef.current.readyState < 2) {
            scanTimeoutId = setTimeout(scanLoop, 100);
            return;
          }
          
          try {
            // Thử decode từ video element
            const result = await codeReader.current.decodeOnceFromVideoElement(videoRef.current);
            if (result) {
              console.log('✅ QR Code detected:', result.getText());
              scanActive = false;
              if (scanTimeoutId) {
                clearTimeout(scanTimeoutId);
                scanTimeoutId = null;
              }
              setIsScanning(false);
              if (codeReader.current) {
                try {
                  codeReader.current.reset();
                } catch (e) {
                  console.warn('Error resetting codeReader:', e);
                }
              }
              handleScanResult(result.getText());
              return;
            }
          } catch (error) {
            // NotFoundException là bình thường khi chưa có QR code
            if (error.name === 'NotFoundException') {
              // Tiếp tục quét
              scanTimeoutId = setTimeout(scanLoop, 150); // Quét lại sau 150ms
              return;
            }
            
            // Các lỗi khác
            console.error('❌ Scan error:', error);
            scanActive = false;
            if (scanTimeoutId) {
              clearTimeout(scanTimeoutId);
              scanTimeoutId = null;
            }
            setIsScanning(false);
            
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
              setError('Quyền truy cập camera bị từ chối. Vui lòng cấp quyền và thử lại.');
              toast.error('Quyền camera bị từ chối');
              stopCameraScan();
            } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
              setError('Camera đang được sử dụng bởi ứng dụng khác. Vui lòng:\n1. Đóng tất cả ứng dụng đang sử dụng camera\n2. Làm mới trang (F5)\n3. Thử lại');
              toast.error('Camera đang được sử dụng', {
                duration: 5000
              });
              stopCameraScan();
            } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
              setError('Không tìm thấy camera. Vui lòng kiểm tra kết nối camera.');
              toast.error('Không tìm thấy camera');
              stopCameraScan();
            }
            return;
          }
          
          // Tiếp tục quét
          scanTimeoutId = setTimeout(scanLoop, 150);
        };
        
        // Bắt đầu quét
        scanLoop();
        
        // Lưu controller để có thể dừng
        scanIntervalRef.current = { 
          stop: () => { 
            scanActive = false;
            if (scanTimeoutId) {
              clearTimeout(scanTimeoutId);
              scanTimeoutId = null;
            }
          } 
        };

        console.log('✅ QR scanning đã bắt đầu - sẽ tự động quét khi có QR code trong khung');
        
      } catch (scanError) {
        console.error('❌ Failed to start scanning:', scanError);
        setIsScanning(false);
        
        // Xử lý lỗi khi khởi động scan
        if (scanError.name === 'NotReadableError' || scanError.name === 'TrackStartError') {
          setError('Camera đang được sử dụng bởi ứng dụng khác. Vui lòng:\n1. Đóng tất cả ứng dụng đang sử dụng camera\n2. Làm mới trang (F5)\n3. Thử lại');
          toast.error('Camera đang được sử dụng', {
            duration: 5000
          });
          stopCameraScan();
        } else if (scanError.name === 'NotAllowedError' || scanError.name === 'PermissionDeniedError') {
          setError('Quyền truy cập camera bị từ chối. Vui lòng cấp quyền và thử lại.');
          toast.error('Quyền camera bị từ chối');
          stopCameraScan();
        } else {
          setError(scanError.message || 'Không thể khởi động camera. Vui lòng thử lại.');
          toast.error(scanError.message || 'Lỗi khi khởi động camera');
          stopCameraScan();
          throw scanError;
        }
      }

    } catch (error) {
      console.error('Camera scan error:', error);
      setIsScanning(false);
      
      // Xử lý các loại lỗi cụ thể
      let errorMessage = 'Không thể truy cập camera.';
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Quyền truy cập camera bị từ chối. Vui lòng:\n1. Click vào biểu tượng khóa/camera ở thanh địa chỉ\n2. Cho phép quyền truy cập camera\n3. Làm mới trang và thử lại';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'Không tìm thấy camera. Vui lòng kiểm tra kết nối camera.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng khác và thử lại.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
      toast.error(errorMessage, {
        duration: 6000
      });
    }
  };

  // Stop camera scanning
  const stopCameraScan = () => {
    setIsScanning(false);
    
    // Dừng scan loop
    if (scanIntervalRef.current && scanIntervalRef.current.stop) {
      scanIntervalRef.current.stop();
      scanIntervalRef.current = null;
    }
    
    // Dừng codeReader trước
    if (codeReader.current) {
      try {
        codeReader.current.reset();
      } catch (e) {
        console.warn('Error resetting codeReader:', e);
      }
    }
    
    // Dừng stream từ ref
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
      } catch (e) {
        console.warn('Error stopping stream from ref:', e);
      }
    }
    
    // Dừng tất cả video tracks từ video element
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => {
          try {
            track.stop();
            track.enabled = false;
          } catch (e) {
            console.warn('Error stopping track:', e);
          }
        });
      }
      videoRef.current.srcObject = null;
    }
    
    setIsScanning(false);
    setScanMode(null);
    setShowScanner(false);
  };

  // Handle scan result
  const handleScanResult = async (text) => {
    if (text) {
      stopCameraScan();
      setScanResult(text);
      await processQRData(text);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setScanMode('upload');

      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          // Decode QR code trực tiếp từ DataURL của ảnh
          if (!codeReader.current) {
            throw new Error('Bộ đọc QR chưa được khởi tạo');
          }

          const imageDataUrl = e.target.result;

          const result = await codeReader.current.decodeFromImageUrl(imageDataUrl);

          if (result) {
            await handleScanResult(result.getText());
          } else {
            throw new Error('Không tìm thấy QR code trong ảnh');
          }
        } catch (error) {
          console.error('Decode error:', error);
          setError('Không thể đọc QR code từ ảnh. Vui lòng kiểm tra chất lượng ảnh.');
          toast.error('Không thể đọc QR code từ ảnh');
        } finally {
          setLoading(false);
          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      };

      reader.onerror = () => {
        setError('Lỗi khi đọc file ảnh');
        setLoading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Lỗi khi xử lý file ảnh');
      setLoading(false);
    }
  };

  // Process QR data
  const processQRData = async (qrData) => {
    try {
      setLoading(true);
      setError(null);
      setAlertModal(null);
      setBlockchainData(null);
      setBlockchainInfo(null);
      setRiskInfo(null);
      
      // Làm sạch QR data - loại bỏ ký tự thừa
      if (typeof qrData === 'string') {
        let cleanedQR = qrData.trim();
        
        // Thử extract blockchainId từ JSON nếu có
        const jsonMatch = cleanedQR.match(/"blockchainId"\s*:\s*"([^"]+)"/);
        if (jsonMatch && jsonMatch[1]) {
          cleanedQR = jsonMatch[1];
          console.log('📦 [Frontend] Đã extract blockchainId từ JSON:', cleanedQR);
        } else {
          // Loại bỏ các ký tự thừa ở cuối: ", ', }, ], và các ký tự đặc biệt
          cleanedQR = cleanedQR.replace(/["'}\]\]]+$/, '');
          
          // Loại bỏ các ký tự thừa ở đầu
          cleanedQR = cleanedQR.replace(/^["'{}\[\]]+/, '');
          
          // Trim lại
          cleanedQR = cleanedQR.trim();
        }
        
        // Cập nhật qrData nếu đã thay đổi
        if (cleanedQR !== qrData) {
          console.log('🧹 [Frontend] Đã làm sạch QR data:', {
            original: qrData,
            cleaned: cleanedQR,
            removed: qrData.length - cleanedQR.length
          });
          qrData = cleanedQR;
        }
        
        // Kiểm tra nếu là URL (có thể là verification URL)
        // Nếu là URL verification, extract blockchainId hoặc drugId
        if (qrData.includes('/verify/')) {
          const parts = qrData.split('/verify/');
          if (parts.length > 1) {
            qrData = parts[1].split('?')[0]; // Lấy phần sau /verify/ và bỏ query params
          }
        }
        
        // Bỏ qua các URL scheme không hợp lệ
        if (qrData.startsWith('tel:') || qrData.startsWith('mailto:') || qrData.startsWith('sms:')) {
          setError('QR code không hợp lệ: Không phải là mã QR của hệ thống');
          toast.error('QR code không hợp lệ. Vui lòng quét mã QR từ nhãn thuốc.');
          setLoading(false);
          return;
        }
      }
      
      // Gửi QR data lên server (có thể là string hoặc object)
      // Backend sẽ tự động xử lý nhiều định dạng
      const response = await drugAPI.scanQRCode(qrData);
      
      // Response thành công
      if (response.success) {
        const data = response.data;
        const drugData = data.drug || data;
        
        setDrugInfo(drugData);
        setBlockchainData(data.blockchain || null);
        setBlockchainInfo(data.blockchainInfo || drugData.blockchain || null);
        setRiskInfo(data.risk || null);
        
        // Kiểm tra warning (thuốc gần hết hạn)
        if (response.warning) {
          toast(response.warning, { icon: '⚠️' });
        } else {
          toast.success(response.message || 'Quét QR code thành công!');
        }
        
        // Save to history
        saveToHistory({
          qrData: typeof qrData === 'string' ? qrData : JSON.stringify(qrData),
          drugInfo: drugData,
          success: true
        });
      } else {
        setError(response.message || 'Không tìm thấy thông tin thuốc');
        toast.error(response.message || 'Không tìm thấy thông tin thuốc');
      }
    } catch (error) {
      console.error('Process QR Error:', error);
      
      // Xử lý lỗi từ API (có thể là lỗi 400 với alertType cho thuốc bị thu hồi/hết hạn)
      const errorResponse = error.response?.data;
      
      if (errorResponse?.alertType) {
        // Thuốc bị thu hồi hoặc hết hạn - vẫn hiển thị thông tin nhưng có cảnh báo
        const data = errorResponse.data;
        const drugData = data.drug || data;
        
        setDrugInfo(drugData);
        setBlockchainData(data.blockchain || null);
        setBlockchainInfo(data.blockchainInfo || drugData.blockchain || null);
        setRiskInfo(data.risk || null);
        setAlertModal({
          type: errorResponse.alertType,
          data: data,
          message: errorResponse.message
        });
        
        // Save to history
        saveToHistory({
          qrData: typeof qrData === 'string' ? qrData : JSON.stringify(qrData),
          drugInfo: drugData,
          success: true,
          alertType: errorResponse.alertType
        });
      } else {
        const errorMessage = errorResponse?.message || error.message || 'Lỗi khi xử lý dữ liệu QR code';
        const debugInfo = errorResponse?.debug;
        
        // Tạo thông báo lỗi chi tiết hơn nếu có debug info
        let fullErrorMessage = errorMessage;
        if (debugInfo && process.env.NODE_ENV === 'development') {
          console.log('🔍 Debug info từ server:', debugInfo);
          console.log('📋 Search Attempts:', debugInfo.searchAttempts);
          console.log('📝 QR Data Type:', debugInfo.qrDataType);
          console.log('📄 QR Data Preview:', debugInfo.qrDataPreview);
          
          // Hiển thị chi tiết search attempts
          if (debugInfo.searchAttempts && Array.isArray(debugInfo.searchAttempts)) {
            console.log('🔎 Chi tiết các lần tìm kiếm:');
            debugInfo.searchAttempts.forEach((attempt, index) => {
              console.log(`   ${index + 1}. ${attempt}`);
            });
          }
          
          fullErrorMessage += `\n\nDebug: ${JSON.stringify(debugInfo, null, 2)}`;
        }
        
        setError(errorMessage);
        
        // Log thông tin chi tiết để debug
        console.error('❌ Process QR Error:', {
          error,
          errorResponse,
          qrData: typeof qrData === 'string' ? qrData.substring(0, 200) : JSON.stringify(qrData).substring(0, 200),
          debugInfo
        });
        
        // Save failed scan to history
        saveToHistory({
          qrData: typeof qrData === 'string' ? qrData : JSON.stringify(qrData),
          error: errorMessage,
          success: false
        });
        
        toast.error(errorMessage);
      }
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
    stopCameraScan();
    setScanResult(null);
    setDrugInfo(null);
    setBlockchainData(null);
    setBlockchainInfo(null);
    setError(null);
    setShowScanner(false);
    setScanMode(null);
    setManualQR('');
    setShowManualInput(false);
    setAlertModal(null);
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

  const getRiskColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLabel = (level) => {
    switch (level) {
      case 'critical': return 'Rất cao';
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
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
        
        {drugInfo && (
          <button
            onClick={resetScanner}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Quét mã khác</span>
          </button>
        )}
      </div>

      {/* Scan Mode Selection */}
      {!drugInfo && !showScanner && !showManualInput && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Chọn phương thức quét QR</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Camera Scan */}
            <button
              onClick={startCameraScan}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
            >
              <Video className="h-12 w-12 text-gray-400 group-hover:text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Quét bằng Camera</h4>
              <p className="text-sm text-gray-600">Sử dụng camera để quét QR code trực tiếp</p>
            </button>

            {/* Upload Image */}
            <label className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center group cursor-pointer">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <Upload className="h-12 w-12 text-gray-400 group-hover:text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Tải ảnh lên</h4>
              <p className="text-sm text-gray-600">Tải ảnh chứa QR code để quét</p>
            </label>

            {/* Manual Input */}
            <button
              onClick={() => {
                setShowManualInput(true);
                setScanMode('manual');
              }}
              className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
            >
              <FileText className="h-12 w-12 text-gray-400 group-hover:text-blue-600 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-900 mb-2">Nhập thủ công</h4>
              <p className="text-sm text-gray-600">Nhập mã QR code bằng tay</p>
            </button>
          </div>
        </div>
      )}

      {/* Manual QR Input */}
      {showManualInput && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Nhập mã QR thủ công</h3>
            <button
              onClick={() => {
                setShowManualInput(false);
                setManualQR('');
                setScanMode(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập mã QR code (blockchainId, drugId, hoặc batchNumber)
              </label>
              <input
                type="text"
                value={manualQR}
                onChange={(e) => setManualQR(e.target.value)}
                placeholder="Ví dụ: DRUG_001, BATCH001, hoặc blockchainId..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={!manualQR.trim() || loading}
                className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <QrCode className="h-5 w-5" />
                    <span>Tra cứu</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowManualInput(false);
                  setManualQR('');
                  setScanMode(null);
                }}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Camera Scanner */}
      {showScanner && scanMode === 'camera' && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Quét bằng Camera</h3>
              <button
                onClick={stopCameraScan}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full h-auto rounded-lg bg-black"
                style={{ 
                  maxHeight: '500px'
                  // Không dùng CSS filter, sẽ xử lý bằng canvas để không ảnh hưởng đến decode
                }}
              />
              {isScanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="border-4 border-blue-500 rounded-lg" style={{ width: '250px', height: '250px' }}>
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mt-4 text-center">
              Đưa QR code vào khung và đợi hệ thống tự động quét
            </p>
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
          <div className="flex items-start space-x-3 text-red-600">
            <AlertTriangle className="h-6 w-6 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Lỗi khi quét QR</h3>
              <div className="text-gray-600 whitespace-pre-line mb-4">{error}</div>
              
              {/* Hướng dẫn cấp quyền camera nếu là lỗi permission */}
              {(error.includes('Quyền truy cập camera') || error.includes('Permission denied') || error.includes('NotAllowedError')) && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Hướng dẫn cấp quyền camera:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                    <li>Tìm biểu tượng khóa 🔒 hoặc camera 📷 ở đầu thanh địa chỉ (bên trái URL)</li>
                    <li>Click vào biểu tượng đó</li>
                    <li>Chọn "Cho phép" (Allow) cho quyền Camera</li>
                    <li>Làm mới trang (F5) và thử lại</li>
                  </ol>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setError(null);
                        startCameraScan();
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Thử lại
                    </button>
                    <button
                      onClick={() => {
                        setError(null);
                        setShowScanner(false);
                        setScanMode(null);
                        setIsScanning(false);
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}
              
              {process.env.NODE_ENV === 'development' && scanResult && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-xs space-y-2">
                  <div>
                    <p className="font-semibold text-gray-700 mb-1">QR Data đã quét:</p>
                    <code className="text-gray-600 break-all">{scanResult.substring(0, 200)}{scanResult.length > 200 ? '...' : ''}</code>
                  </div>
                  {error && error.includes('Debug:') && (
                    <div className="mt-2">
                      <p className="font-semibold text-gray-700 mb-1">Debug Info:</p>
                      <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                        {error.split('Debug:')[1]}
                      </pre>
                    </div>
                  )}
                </div>
              )}
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
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(drugInfo.status)}`}>
                  {getStatusText(drugInfo.status)}
                </span>
                {riskInfo && (
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(riskInfo.level)}`}>
                    Rủi ro nghi vấn: {getRiskLabel(riskInfo.level)} ({Math.round(riskInfo.score)}%)
                  </span>
                )}
              </div>
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

            {/* Blockchain Information */}
            {(blockchainInfo || blockchainData) && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 border-b pb-2 mb-4 flex items-center space-x-2">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span>Thông tin Blockchain</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                  {blockchainInfo?.blockchainId && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center space-x-1">
                        <Hash className="h-3 w-3" />
                        <span>Blockchain ID</span>
                      </label>
                      <p className="text-gray-900 font-mono text-sm break-all">{blockchainInfo.blockchainId}</p>
                    </div>
                  )}
                  {blockchainInfo?.isOnBlockchain !== undefined && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                      <p className={`font-medium ${blockchainInfo.isOnBlockchain ? 'text-green-600' : 'text-gray-600'}`}>
                        {blockchainInfo.isOnBlockchain ? 'Đã lưu trên blockchain' : 'Chưa lưu trên blockchain'}
                      </p>
                    </div>
                  )}
                  {blockchainInfo?.transactionHash && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Transaction Hash</label>
                      <p className="text-gray-900 font-mono text-sm break-all">{blockchainInfo.transactionHash}</p>
                    </div>
                  )}
                  {blockchainInfo?.blockNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Block Number</label>
                      <p className="text-gray-900 font-mono">{blockchainInfo.blockNumber}</p>
                    </div>
                  )}
                  {blockchainData && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Dữ liệu từ Blockchain</label>
                      <div className="mt-2 p-3 bg-white rounded border border-blue-200">
                        <pre className="text-xs text-gray-700 overflow-auto">
                          {JSON.stringify(blockchainData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
            <div className="mt-6 flex flex-wrap gap-3">
              {(blockchainInfo?.blockchainId || drugInfo.blockchain?.blockchainId) && (
                <>
                  <button
                    onClick={() =>
                      window.open(
                        `/verify/${blockchainInfo?.blockchainId || drugInfo.blockchain?.blockchainId}`,
                        '_blank'
                      )
                    }
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Trang xác minh</span>
                  </button>
                  <button
                    onClick={() => window.open('/blockchain', '_blank')}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center space-x-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Blockchain Dashboard</span>
                  </button>
                </>
              )}

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

      {/* Alert Modal - Cảnh báo thuốc bị thu hồi hoặc hết hạn */}
      {alertModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className={`p-6 ${alertModal.type === 'recalled' ? 'bg-red-50 border-b-4 border-red-500' : 'bg-orange-50 border-b-4 border-orange-500'}`}>
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 ${alertModal.type === 'recalled' ? 'text-red-600' : 'text-orange-600'}`}>
                  <AlertCircle className="h-12 w-12" />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {alertModal.type === 'recalled' ? '⚠️ CẢNH BÁO: THUỐC BỊ THU HỒI' : '⚠️ CẢNH BÁO: THUỐC ĐÃ HẾT HẠN'}
                  </h3>
                  <p className="text-lg text-gray-700 font-medium">{alertModal.message}</p>
                </div>
                <button
                  onClick={() => setAlertModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {alertModal.type === 'recalled' && alertModal.data.recallReason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Lý do thu hồi:</h4>
                  <p className="text-red-800">{alertModal.data.recallReason}</p>
                  {alertModal.data.recallDate && (
                    <p className="text-sm text-red-700 mt-2">
                      Ngày thu hồi: {formatDate(alertModal.data.recallDate)}
                    </p>
                  )}
                </div>
              )}

              {alertModal.type === 'expired' && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">Thông tin hết hạn:</h4>
                  <p className="text-orange-800">
                    Hạn sử dụng: {alertModal.data.expiryDate ? formatDate(alertModal.data.expiryDate) : 'N/A'}
                  </p>
                  {alertModal.data.daysExpired && (
                    <p className="text-sm text-orange-700 mt-2">
                      Đã hết hạn {alertModal.data.daysExpired} ngày
                    </p>
                  )}
                </div>
              )}

              {alertModal.data.drug && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Thông tin thuốc:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Tên thuốc:</span>
                      <p className="font-medium text-gray-900">{alertModal.data.drug.name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Mã lô:</span>
                      <p className="font-medium text-gray-900 font-mono">{alertModal.data.drug.batchNumber}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4 border-t">
                <button
                  onClick={() => setAlertModal(null)}
                  className="flex-1 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 font-medium"
                >
                  Tôi đã hiểu
                </button>
                {alertModal.type === 'recalled' && (
                  <button
                    onClick={() => {
                      window.open('https://www.moh.gov.vn/', '_blank');
                      setAlertModal(null);
                    }}
                    className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 font-medium"
                  >
                    Báo cáo Bộ Y tế
                  </button>
                )}
              </div>
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

