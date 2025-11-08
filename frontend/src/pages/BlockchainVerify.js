import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../utils/api';

const BlockchainVerify = () => {
  const { blockchainId } = useParams();
  const [loading, setLoading] = useState(true);
  const [drugData, setDrugData] = useState(null);
  const [blockchainData, setBlockchainData] = useState(null);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('verifying');

  useEffect(() => {
    if (blockchainId) {
      verifyDrug();
    }
  }, [blockchainId]);

  const verifyDrug = async () => {
    try {
      setLoading(true);
      setError(null);
      setVerificationStatus('verifying');

      // Gọi API để lấy thông tin thuốc từ blockchain ID
      const response = await api.get(`/api/drugs/verify/${blockchainId}`);
      
      if (response.data.success) {
        setDrugData(response.data.data.drug);
        setBlockchainData(response.data.data.blockchain);
        setVerificationStatus('verified');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Đang xác minh...</h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Xác minh thất bại</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Xác minh Blockchain</h1>
              <p className="text-gray-600">Thông tin xác minh thuốc từ blockchain</p>
            </div>
            <div className="flex items-center">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                verificationStatus === 'verified' 
                  ? 'bg-green-100 text-green-800' 
                  : verificationStatus === 'failed'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {verificationStatus === 'verified' ? '✅ Đã xác minh' : 
                 verificationStatus === 'failed' ? '❌ Thất bại' : '⏳ Đang xác minh'}
              </div>
            </div>
          </div>
        </div>

        {/* Blockchain ID */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Blockchain ID</h2>
          <div className="bg-gray-50 rounded-md p-4">
            <code className="text-sm text-gray-800 break-all">{blockchainId}</code>
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
      </div>
    </div>
  );
};

export default BlockchainVerify;
