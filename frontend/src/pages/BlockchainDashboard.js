import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const BlockchainDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [drugs, setDrugs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [selectedDrug, setSelectedDrug] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [drugDetails, setDrugDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy thống kê blockchain
      try {
        const statsResponse = await api.get('/blockchain/stats');
        if (statsResponse.data.success) {
          setStats(statsResponse.data.stats);
        } else {
          console.warn('Stats API returned success:false', statsResponse.data);
        }
      } catch (statsError) {
        console.error('Error loading stats:', statsError);
        // Không set error nếu stats fail, chỉ log
      }

      // Lấy danh sách thuốc từ blockchain
      try {
        const drugsResponse = await api.get('/blockchain/drugs', {
          timeout: 90000 // 90 giây cho blockchain endpoint
        });
        console.log('Drugs response:', drugsResponse.data);
        
        if (drugsResponse.data.success) {
          const drugs = drugsResponse.data.drugs || [];
          console.log('Found drugs:', drugs.length);
          setDrugs(drugs);
          
          if (drugs.length === 0) {
            setError(null); // Không set error nếu không có thuốc, chỉ là empty
          }
        } else {
          console.warn('Drugs API returned success:false', drugsResponse.data);
          setError(drugsResponse.data.message || 'Không thể lấy danh sách thuốc');
        }
      } catch (drugsError) {
        console.error('Error loading drugs:', drugsError);
        setError('Không thể tải dữ liệu blockchain: ' + (drugsError.response?.data?.message || drugsError.message));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Không thể tải dữ liệu blockchain: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadDashboardData();
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/blockchain/search?name=${encodeURIComponent(searchTerm)}`);
      if (response.data.success) {
        setDrugs(response.data.drugs);
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('Lỗi khi tìm kiếm');
    } finally {
      setLoading(false);
    }
  };

  const verifyDrug = async (drugId) => {
    try {
      const response = await api.post(`/blockchain/verify/${drugId}`);
      if (response.data.success) {
        toast.success(`Xác minh thành công: ${response.data.status}`);
        loadDashboardData(); // Reload data
      } else {
        toast.error(`Xác minh thất bại: ${response.data.message}`);
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error('Lỗi khi xác minh thuốc');
    }
  };

  const viewDetails = async (drug) => {
    try {
      setSelectedDrug(drug);
      setShowDetailsModal(true);
      setDetailsLoading(true);
      setDrugDetails(null);

      // Lấy thông tin chi tiết từ blockchain
      let response;
      if (drug.drugId) {
        response = await api.get(`/blockchain/drug/${drug.drugId}`);
      } else if (drug.blockchainId) {
        // Nếu không có drugId, dùng verify endpoint với blockchainId
        response = await api.get(`/drugs/verify/${drug.blockchainId}`);
      } else {
        throw new Error('Không có thông tin để lấy chi tiết');
      }

      if (response.data.success) {
        setDrugDetails(response.data.data || response.data);
      } else {
        toast.error(response.data.message || 'Không thể lấy thông tin chi tiết');
      }
    } catch (error) {
      console.error('Get details error:', error);
      toast.error(error.response?.data?.message || 'Lỗi khi lấy thông tin chi tiết');
    } finally {
      setDetailsLoading(false);
    }
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedDrug(null);
    setDrugDetails(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Đang tải...</h2>
          <p className="text-gray-600">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blockchain Dashboard</h1>
          <p className="text-gray-600 mt-2">Quản lý và theo dõi thuốc trên blockchain</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Lỗi</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Tổng số lô</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalBatches}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Lô hợp lệ</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.activeBatches}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Lô đã thu hồi</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.recalledBatches}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Lô hết hạn</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.expiredBatches}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Tìm kiếm thuốc theo tên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Tìm kiếm
            </button>
            <button
              onClick={loadDashboardData}
              className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Làm mới
            </button>
          </div>
        </div>

        {/* Drugs Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Danh sách thuốc trên Blockchain</h2>
          </div>
          
          {drugs.length === 0 ? (
            <div className="px-6 py-8 text-center text-gray-500">
              <p>Không có dữ liệu thuốc nào</p>
              <p className="text-sm mt-2 text-gray-400">
                {error ? 'Vui lòng kiểm tra kết nối blockchain hoặc tạo thuốc mới có blockchain ID' : 'Chưa có thuốc nào được ghi lên blockchain'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên thuốc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Số lô
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày sản xuất
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hạn sử dụng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Blockchain ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {drugs.map((drug, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{drug.name}</div>
                          <div className="text-sm text-gray-500">{drug.activeIngredient}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {drug.batchNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(drug.productionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(drug.expiryDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          drug.isValid 
                            ? 'bg-green-100 text-green-800' 
                            : drug.isRecalled
                            ? 'bg-red-100 text-red-800'
                            : drug.isExpired
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {drug.status || 'Chưa xác định'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {drug.blockchainId ? drug.blockchainId.substring(0, 20) + '...' : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => verifyDrug(drug.drugId || drug.blockchainId)}
                              className="text-blue-600 hover:text-blue-900 hover:underline"
                            >
                              Xác minh
                            </button>
                            {drug.blockchainId && (
                              <button
                                onClick={() => viewDetails(drug)}
                                className="text-green-600 hover:text-green-900 hover:underline"
                              >
                                Chi tiết
                              </button>
                            )}
                          </div>
                          {drug.blockchainId && (
                            <button
                              onClick={() => window.open(`/verify/${drug.blockchainId}`, '_blank')}
                              className="text-xs text-indigo-600 hover:text-indigo-900 hover:underline text-left"
                            >
                              Mở trang xác minh
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Hệ thống quản lý nguồn gốc xuất xứ thuốc bằng blockchain</p>
          <p>Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}</p>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Chi tiết Blockchain - {selectedDrug?.name || 'Thuốc'}
              </h2>
              <button
                onClick={closeDetailsModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {detailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600">Đang tải thông tin...</span>
                </div>
              ) : drugDetails ? (
                <div className="space-y-6">
                  {/* Blockchain ID */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Blockchain ID</h3>
                    <code className="text-sm text-gray-800 break-all">
                      {selectedDrug?.blockchainId || drugDetails.blockchain?.blockchainId}
                    </code>
                  </div>

                  {/* Thông tin thuốc */}
                  {drugDetails.drug && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cơ bản</h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-500">Tên thuốc:</span>
                            <p className="font-medium text-gray-900">{drugDetails.drug.name}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Hoạt chất:</span>
                            <p className="font-medium text-gray-900">{drugDetails.drug.activeIngredient}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Số lô:</span>
                            <p className="font-medium text-gray-900 font-mono">{drugDetails.drug.batchNumber}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Dạng bào chế:</span>
                            <p className="font-medium text-gray-900">{drugDetails.drug.form}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin sản xuất</h3>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm text-gray-500">Ngày sản xuất:</span>
                            <p className="font-medium text-gray-900">{formatDate(drugDetails.drug.productionDate)}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Hạn sử dụng:</span>
                            <p className="font-medium text-gray-900">{formatDate(drugDetails.drug.expiryDate)}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Kết quả kiểm định:</span>
                            <p className={`font-medium ${
                              drugDetails.drug.qualityTest?.testResult === 'đạt' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {drugDetails.drug.qualityTest?.testResult || 'Chưa có'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Thông tin Blockchain */}
                  {drugDetails.blockchain && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin Blockchain</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm text-gray-500">Transaction Hash:</span>
                              <p className="font-mono text-sm break-all text-gray-900">
                                {drugDetails.blockchain.transactionHash || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Block Number:</span>
                              <p className="font-medium text-gray-900">
                                {drugDetails.blockchain.blockNumber?.toLocaleString() || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Contract Address:</span>
                              <p className="font-mono text-sm break-all text-gray-900">
                                {drugDetails.blockchain.contractAddress || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="space-y-3">
                            <div>
                              <span className="text-sm text-gray-500">Trạng thái:</span>
                              <p className={`font-medium ${
                                drugDetails.blockchain.isOnBlockchain ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {drugDetails.blockchain.isOnBlockchain ? 'Đã ghi lên blockchain' : 'Chưa ghi lên blockchain'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Gas Used:</span>
                              <p className="font-medium text-gray-900">
                                {drugDetails.blockchain.gasUsed?.toLocaleString() || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-500">Thời gian ghi:</span>
                              <p className="font-medium text-gray-900">
                                {formatTimestamp(drugDetails.blockchain.timestamp) || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Lịch sử phân phối */}
                  {drugDetails.distributionHistory && drugDetails.distributionHistory.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Lịch sử phân phối</h3>
                      <div className="space-y-3">
                        {drugDetails.distributionHistory.map((step, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-medium text-gray-900">{step.organizationName || step.fromAddress}</span>
                              <span className="text-sm text-gray-500">{formatTimestamp(step.timestamp)}</span>
                            </div>
                            <p className="text-sm text-gray-600">{step.location || step.notes}</p>
                            {step.transactionHash && (
                              <p className="text-xs text-gray-500 font-mono mt-2 break-all">
                                TX: {step.transactionHash}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Không thể tải thông tin chi tiết</p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={closeDetailsModal}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlockchainDashboard;
