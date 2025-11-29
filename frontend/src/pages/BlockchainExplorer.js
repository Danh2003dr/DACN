import React, { useState, useEffect } from 'react';
import { blockchainTransactionAPI } from '../utils/api';
import { VerifyAnimation } from '../components/Blockchain';
import {
  Copy,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';

const BlockchainExplorer = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalGasUsed: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  
  // Verify modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('idle');
  const [verifyResult, setVerifyResult] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    network: ''
  });

  // Load transactions
  const loadTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };

      const response = await blockchainTransactionAPI.getRecentTransactions(params);
      
      if (response && response.success) {
        setTransactions(response.data.transactions || []);
        setPagination(response.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
        
        // Calculate stats
        const totalGas = (response.data.transactions || []).reduce((sum, tx) => sum + (tx.gasUsed || 0), 0);
        setStats({
          totalTransactions: response.data.pagination?.total || 0,
          totalGasUsed: totalGas
        });
      } else {
        setTransactions([]);
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
        // Don't show error toast if it's just empty data
        if (response && !response.success && response.message) {
          console.warn('API returned error:', response.message);
        }
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Only show error toast if it's a real error, not just empty data
      if (error.response?.status !== 404) {
        toast.error('Không thể tải danh sách transactions: ' + (error.response?.data?.message || error.message));
      }
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions(1);
  }, []);

  // Handle verify transaction
  const handleVerify = async (transaction) => {
    setSelectedTx(transaction);
    setShowVerifyModal(true);
    setVerifyStatus('sending');
    setVerifyResult(null);

    try {
      // Simulate sending
      await new Promise(resolve => setTimeout(resolve, 500));
      setVerifyStatus('connecting');

      // Call API
      const response = await blockchainTransactionAPI.verifyTransaction(transaction.transactionHash);
      
      setVerifyStatus('verifying');
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (response && response.success && response.data) {
        setVerifyStatus('success');
        setVerifyResult(response.data);
        toast.success('Xác minh thành công!');
        
        // Reload transactions to update status
        setTimeout(() => {
          loadTransactions(pagination.page);
        }, 2000);
      } else {
        setVerifyStatus('error');
        toast.error(response?.message || 'Xác minh thất bại');
      }
    } catch (error) {
      console.error('Verify error:', error);
      setVerifyStatus('error');
      toast.error('Lỗi khi xác minh transaction');
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Đã sao chép!');
    }).catch(() => {
      toast.error('Không thể sao chép');
    });
  };

  // Get explorer URL
  const getExplorerUrl = (txHash, network = 'development') => {
    const explorers = {
      'sepolia': `https://sepolia.etherscan.io/tx/${txHash}`,
      'mainnet': `https://etherscan.io/tx/${txHash}`,
      'polygon_mumbai': `https://mumbai.polygonscan.com/tx/${txHash}`,
      'polygon_mainnet': `https://polygonscan.com/tx/${txHash}`,
      'bsc_testnet': `https://testnet.bscscan.com/tx/${txHash}`,
      'bsc_mainnet': `https://bscscan.com/tx/${txHash}`,
      'arbitrum_sepolia': `https://sepolia.arbiscan.io/tx/${txHash}`,
      'arbitrum_one': `https://arbiscan.io/tx/${txHash}`,
      'optimism_sepolia': `https://sepolia-optimism.etherscan.io/tx/${txHash}`,
      'optimism_mainnet': `https://optimistic.etherscan.io/tx/${txHash}`
    };
    return explorers[network] || '#';
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Format hash (show first 10 and last 6 characters)
  const formatHash = (hash) => {
    if (!hash) return 'N/A';
    if (hash.length <= 16) return hash;
    return `${hash.substring(0, 10)}...${hash.substring(hash.length - 6)}`;
  };

  // Format gas used
  const formatGas = (gas) => {
    if (!gas) return '0';
    return gas.toLocaleString('vi-VN');
  };

  // Get status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Thành công
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Thất bại
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Đang chờ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status || 'N/A'}
          </span>
        );
    }
  };

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    loadTransactions(1);
  };

  const handleResetFilters = () => {
    setFilters({ search: '', status: '', network: '' });
    setTimeout(() => {
      loadTransactions(1);
    }, 100);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Blockchain Explorer</h1>
        <p className="text-gray-600">Xem và xác minh các transactions trên blockchain</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng số Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTransactions.toLocaleString('vi-VN')}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tổng Gas Used</p>
              <p className="text-2xl font-bold text-gray-900">{formatGas(stats.totalGasUsed)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Bộ lọc
          </h2>
          <div className="flex gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Áp dụng
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm (Tx Hash)
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Nhập transaction hash..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
              <option value="pending">Đang chờ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Network
            </label>
            <select
              value={filters.network}
              onChange={(e) => handleFilterChange('network', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="development">Development</option>
              <option value="sepolia">Sepolia</option>
              <option value="mainnet">Mainnet</option>
              <option value="polygon_mumbai">Polygon Mumbai</option>
              <option value="polygon_mainnet">Polygon Mainnet</option>
              <option value="bsc_testnet">BSC Testnet</option>
              <option value="bsc_mainnet">BSC Mainnet</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Danh sách Transactions</h2>
          <button
            onClick={() => loadTransactions(pagination.page)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Làm mới
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-600">Đang tải...</span>
          </div>
        ) : transactions.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <p>Không có dữ liệu transactions</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thời gian
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lô thuốc
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Block
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gas Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((tx) => (
                    <tr key={tx._id || tx.transactionHash} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatTimestamp(tx.timestamp)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono text-gray-900">
                            {formatHash(tx.transactionHash)}
                          </code>
                          <button
                            onClick={() => copyToClipboard(tx.transactionHash)}
                            className="text-gray-400 hover:text-gray-600 transition"
                            title="Sao chép"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {tx.network && tx.network !== 'development' && (
                            <a
                              href={getExplorerUrl(tx.transactionHash, tx.network)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 transition"
                              title="Mở trên Explorer"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.drugId?.name ? (
                          <div>
                            <div className="font-medium">{tx.drugId.name}</div>
                            <div className="text-xs text-gray-500">{tx.drugId.batchNumber || tx.drugId.drugId}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tx.blockNumber?.toLocaleString('vi-VN') || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatGas(tx.gasUsed)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(tx.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleVerify(tx)}
                          className="text-blue-600 hover:text-blue-900 hover:underline"
                        >
                          Verify on Chain
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Trang {pagination.page} / {pagination.pages} (Tổng: {pagination.total})
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadTransactions(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Trước
                  </button>
                  <button
                    onClick={() => loadTransactions(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 flex items-center gap-1"
                  >
                    Sau
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Verify Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                Xác minh Transaction
              </h2>
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setVerifyStatus('idle');
                  setVerifyResult(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {/* Transaction Info */}
              {selectedTx && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Transaction Hash</h3>
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-mono text-gray-900 break-all">
                      {selectedTx.transactionHash}
                    </code>
                    <button
                      onClick={() => copyToClipboard(selectedTx.transactionHash)}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Verify Animation */}
              <div className="mb-6">
                <VerifyAnimation
                  status={verifyStatus}
                  transactionHash={selectedTx?.transactionHash}
                  size="large"
                />
              </div>

              {/* Verify Result */}
              {verifyResult && verifyStatus === 'success' && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-green-800 mb-2">Kết quả xác minh</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Block Number:</span>
                      <span className="font-medium text-gray-900">{verifyResult.blockNumber?.toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Confirmations:</span>
                      <span className="font-medium text-gray-900">{verifyResult.confirmations || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Gas Used:</span>
                      <span className="font-medium text-gray-900">{formatGas(verifyResult.gasUsed)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className="font-medium text-green-600">Thành công</span>
                    </div>
                    {verifyResult.explorerUrl && verifyResult.explorerUrl !== '#' && (
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <a
                          href={verifyResult.explorerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Xem trên Blockchain Explorer
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {verifyResult && verifyStatus === 'error' && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-sm font-semibold text-red-800 mb-2">Xác minh thất bại</h3>
                  <p className="text-sm text-red-700">
                    {verifyResult.error || 'Không thể xác minh transaction trên blockchain'}
                  </p>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={() => {
                  setShowVerifyModal(false);
                  setVerifyStatus('idle');
                  setVerifyResult(null);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
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

export default BlockchainExplorer;

