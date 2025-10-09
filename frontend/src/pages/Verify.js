import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QrCode, Shield, AlertTriangle, CheckCircle, Hash } from 'lucide-react';
import api from '../utils/api';

const Verify = () => {
  const { blockchainId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [verificationData, setVerificationData] = useState(null);

  useEffect(() => {
    const verifyDrug = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/drugs/verify/${blockchainId}`);
        setVerificationData(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Không thể xác minh thông tin lô thuốc');
      } finally {
        setLoading(false);
      }
    };

    if (blockchainId) {
      verifyDrug();
    }
  }, [blockchainId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang xác minh thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không thể xác minh</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="text-sm text-gray-600 font-mono">Blockchain ID: {blockchainId}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!verificationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy dữ liệu</h2>
          <p className="text-gray-600">Không tìm thấy thông tin cho blockchain ID này.</p>
        </div>
      </div>
    );
  }

  const { drug, blockchain, verification } = verificationData;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Xác minh lô thuốc</h1>
                <p className="text-gray-600">Thông tin được xác minh từ blockchain</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Đã xác minh</span>
              </div>
              <p className="text-sm text-gray-500">
                {new Date(verification.verifiedAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Drug Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <QrCode className="w-6 h-6 mr-2" />
              Thông tin lô thuốc
            </h2>
            
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">{drug.name}</h3>
                <p className="text-sm text-blue-800">Mã lô: {drug.drugId}</p>
                <p className="text-sm text-blue-700">Số lô: {drug.batchNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Thành phần hoạt chất</label>
                  <p className="mt-1 text-sm text-gray-900">{drug.activeIngredient}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Liều lượng</label>
                  <p className="mt-1 text-sm text-gray-900">{drug.dosage}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dạng bào chế</label>
                  <p className="mt-1 text-sm text-gray-900">{drug.form}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    drug.isRecalled ? 'bg-red-100 text-red-800' :
                    drug.status === 'active' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {drug.isRecalled ? 'Đã thu hồi' : 
                     drug.status === 'active' ? 'Hoạt động' : drug.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Ngày sản xuất</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(drug.productionDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Hạn sử dụng</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(drug.expiryDate).toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {drug.manufacturer && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nhà sản xuất</label>
                  <p className="mt-1 text-sm text-gray-900">{drug.manufacturer.fullName}</p>
                  {drug.manufacturer.organizationInfo && (
                    <p className="text-xs text-gray-600">{drug.manufacturer.organizationInfo.name}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Blockchain Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Hash className="w-6 h-6 mr-2" />
              Thông tin Blockchain
            </h2>
            
            {drug.blockchain ? (
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-medium text-green-900">Đã ghi lên blockchain</span>
                  </div>
                  <p className="text-sm text-green-800">
                    Trạng thái: {drug.blockchain.blockchainStatus === 'confirmed' ? 'Đã xác nhận' : 'Đang chờ'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Blockchain ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono break-all">
                      {drug.blockchain.blockchainId}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Transaction Hash</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono break-all">
                      {drug.blockchain.transactionHash}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Block Number</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {drug.blockchain.blockNumber?.toLocaleString() || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Timestamp</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {drug.blockchain.blockchainTimestamp ? 
                          new Date(drug.blockchain.blockchainTimestamp).toLocaleString('vi-VN') : 
                          'N/A'
                        }
                      </p>
                    </div>
                  </div>

                  {drug.blockchain.digitalSignature && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Chữ ký số</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono break-all">
                        {drug.blockchain.digitalSignature.substring(0, 60)}...
                      </p>
                    </div>
                  )}

                  {drug.blockchain.dataHash && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Hash dữ liệu</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono break-all">
                        {drug.blockchain.dataHash.substring(0, 60)}...
                      </p>
                    </div>
                  )}
                </div>

                {drug.blockchain.transactionHistory && drug.blockchain.transactionHistory.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lịch sử giao dịch</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {drug.blockchain.transactionHistory.map((tx, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded border">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{tx.action}</p>
                              <p className="text-xs text-gray-600">{tx.details}</p>
                            </div>
                            <span className="text-xs text-gray-500">Block #{tx.blockNumber}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800">Chưa ghi lên blockchain</span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  Lô thuốc này chưa được ghi lên blockchain.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quality Test Information */}
        {drug.qualityTest && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Kết quả kiểm định</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Kết quả</label>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  drug.qualityTest.result === 'PASSED' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {drug.qualityTest.result === 'PASSED' ? 'Đạt' : 'Không đạt'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cơ quan kiểm định</label>
                <p className="mt-1 text-sm text-gray-900">{drug.qualityTest.testBy}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Số chứng nhận</label>
                <p className="mt-1 text-sm text-gray-900">{drug.qualityTest.certificateNumber || 'N/A'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigator.clipboard.writeText(blockchainId)}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Copy Blockchain ID
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
            >
              In báo cáo
            </button>
            <button
              onClick={() => window.close()}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Verify;
