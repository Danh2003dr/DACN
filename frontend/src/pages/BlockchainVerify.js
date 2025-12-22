import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import api from '../utils/api';

const BlockchainVerify = () => {
  const { blockchainId: urlBlockchainId } = useParams();
  const navigate = useNavigate();
  const [inputBlockchainId, setInputBlockchainId] = useState('');
  const [loading, setLoading] = useState(false);
  const [drugData, setDrugData] = useState(null);
  const [blockchainData, setBlockchainData] = useState(null);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, verifying, verified, failed

  useEffect(() => {
    if (urlBlockchainId) {
      setInputBlockchainId(urlBlockchainId);
      verifyDrug(urlBlockchainId);
    }
  }, [urlBlockchainId]);

  const verifyDrug = async (id = null) => {
    const blockchainIdToVerify = id || inputBlockchainId.trim();
    
    if (!blockchainIdToVerify) {
      setError('Vui lòng nhập Blockchain ID');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setVerificationStatus('verifying');
      setDrugData(null);
      setBlockchainData(null);

      // Gọi API để lấy thông tin thuốc từ blockchain ID
      const response = await api.get(`/api/drugs/verify/${blockchainIdToVerify}`);
      
      if (response.data.success) {
        setDrugData(response.data.data.drug);
        setBlockchainData(response.data.data.blockchain);
        setVerificationStatus('verified');
        // Update URL nếu chưa có trong URL
        if (!urlBlockchainId) {
          navigate(`/blockchain/verify/${blockchainIdToVerify}`, { replace: true });
        }
      } else {
        setError(response.data.message);
        setVerificationStatus('failed');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError(error.response?.data?.message || 'Lỗi khi xác minh thuốc');
      setVerificationStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    verifyDrug();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-blue-600" />
                Xác minh Blockchain
              </h1>
              <p className="text-gray-600 mt-1">Nhập Blockchain ID để xác minh thông tin thuốc từ blockchain</p>
            </div>
            {verificationStatus !== 'idle' && (
              <div className="flex items-center">
                <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${
                  verificationStatus === 'verified' 
                    ? 'bg-green-100 text-green-800' 
                    : verificationStatus === 'failed'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {verificationStatus === 'verified' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Đã xác minh
                    </>
                  ) : verificationStatus === 'failed' ? (
                    <>
                      <XCircle className="w-4 h-4" />
                      Thất bại
                    </>
                  ) : (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang xác minh
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={inputBlockchainId}
                onChange={(e) => setInputBlockchainId(e.target.value)}
                placeholder="Nhập Blockchain ID hoặc quét QR code..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={!inputBlockchainId.trim() || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xác minh...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Xác minh
                </>
              )}
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Đang xác minh...</h2>
            <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Xác minh thất bại</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    setVerificationStatus('idle');
                    setDrugData(null);
                    setBlockchainData(null);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results - Only show if verified */}
        {verificationStatus === 'verified' && drugData && !loading && (
          <>

        {/* Blockchain ID */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Blockchain ID</h2>
          <div className="bg-gray-50 rounded-md p-4">
            <code className="text-sm text-gray-800 break-all">{urlBlockchainId || inputBlockchainId || blockchainData?.blockchainId || 'N/A'}</code>
          </div>
        </div>

        {/* Thông tin thuốc */}
        {drugData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin thuốc</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Thông tin cơ bản</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Tên thuốc:</span>
                    <p className="font-medium">{drugData.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Hoạt chất:</span>
                    <p className="font-medium">{drugData.activeIngredient}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Dạng bào chế:</span>
                    <p className="font-medium">{drugData.form}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Số lô:</span>
                    <p className="font-medium">{drugData.batchNumber}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Thông tin sản xuất</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Ngày sản xuất:</span>
                    <p className="font-medium">{formatDate(drugData.productionDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Hạn sử dụng:</span>
                    <p className="font-medium">{formatDate(drugData.expiryDate)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Kết quả kiểm định:</span>
                    <p className={`font-medium ${
                      drugData.qualityTest?.testResult === 'đạt' ? 'text-green-600' : 
                      drugData.qualityTest?.testResult === 'không đạt' ? 'text-red-600' : 
                      'text-yellow-600'
                    }`}>
                      {drugData.qualityTest?.testResult || 'Chưa có'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Cơ quan kiểm định:</span>
                    <p className="font-medium">{drugData.qualityTest?.testBy || 'Chưa có'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Thông tin blockchain */}
        {blockchainData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Thông tin Blockchain</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Giao dịch</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Transaction Hash:</span>
                    <p className="font-mono text-sm break-all">{blockchainData.transactionHash}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Block Number:</span>
                    <p className="font-medium">{blockchainData.blockNumber?.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Gas Used:</span>
                    <p className="font-medium">{blockchainData.gasUsed?.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Thời gian</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Thời gian ghi:</span>
                    <p className="font-medium">{formatTimestamp(blockchainData.timestamp)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Trạng thái:</span>
                    <p className={`font-medium ${
                      blockchainData.isOnBlockchain ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {blockchainData.isOnBlockchain ? 'Đã ghi lên blockchain' : 'Chưa ghi lên blockchain'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Contract Address:</span>
                    <p className="font-mono text-sm break-all">{blockchainData.contractAddress}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chữ ký số */}
        {drugData?.blockchain?.digitalSignature && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chữ ký số</h2>
            <div className="bg-gray-50 rounded-md p-4">
              <p className="text-sm text-gray-600 mb-2">Digital Signature:</p>
              <code className="text-xs text-gray-800 break-all">
                {drugData.blockchain.digitalSignature}
              </code>
            </div>
          </div>
        )}

        {/* Lịch sử giao dịch */}
        {drugData?.blockchain?.transactionHistory && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử giao dịch</h2>
            <div className="space-y-4">
              {drugData.blockchain.transactionHistory.map((tx, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{tx.action}</span>
                    <span className="text-sm text-gray-500">{formatTimestamp(tx.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{tx.details}</p>
                  <div className="text-xs text-gray-500">
                    <span>TX Hash: </span>
                    <code className="break-all">{tx.transactionHash}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

            {/* Footer */}
            <div className="mt-8 text-center text-gray-500 text-sm">
              <p>Hệ thống quản lý nguồn gốc xuất xứ thuốc bằng blockchain</p>
              <p>Xác minh được thực hiện vào: {new Date().toLocaleString('vi-VN')}</p>
            </div>
          </>
        )}

        {/* Empty State - Show when no blockchainId and not loading */}
        {verificationStatus === 'idle' && !loading && !urlBlockchainId && (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Xác minh Blockchain</h2>
            <p className="text-gray-600 mb-6">
              Nhập Blockchain ID ở trên để bắt đầu xác minh thông tin thuốc từ blockchain
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left max-w-md mx-auto">
              <p className="text-sm text-blue-800 font-medium mb-2">💡 Cách sử dụng:</p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Nhập Blockchain ID vào ô tìm kiếm</li>
                <li>Hoặc quét QR code từ bao bì thuốc</li>
                <li>Nhấn "Xác minh" để kiểm tra thông tin</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockchainVerify;
