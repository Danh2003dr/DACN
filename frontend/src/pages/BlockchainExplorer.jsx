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
  Loader2,
  Shield
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
    drugId: '',
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
          Object.entries(filters).filter(([_, value]) => value !== '' && value !== null)
        )
      };

      const response = await blockchainTransactionAPI.getRecentTransactions(params);
      
      // Debug: Log response để kiểm tra format
      console.log('Blockchain Explorer - API Response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', response ? Object.keys(response) : 'null');
      console.log('Response.data:', response?.data);
      console.log('Response.data?.transactions:', response?.data?.transactions);
      console.log('Response.data?.transactions length:', response?.data?.transactions?.length);
      console.log('Response.data?.pagination:', response?.data?.pagination);
      
      if (response && response.debug) {
        console.log('🔍 Debug info:', response.debug);
      }
      
      if (response && response.success) {
        const transactions = response.data?.transactions || response.transactions || [];
        const pagination = response.data?.pagination || response.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
        
        console.log('✅ Parsed transactions:', transactions.length);
        console.log('✅ Parsed pagination:', pagination);
        console.log('✅ First transaction:', transactions[0]);
        
        setTransactions(transactions);
        setPagination(pagination);
        
        // Calculate stats
        const totalGas = transactions.reduce((sum, tx) => sum + (tx.gasUsed || 0), 0);
        setStats({
          totalTransactions: pagination.total || 0,
          totalGasUsed: totalGas
        });
      } else {
        console.error('❌ API response error:', {
          success: response?.success,
          message: response?.message,
          error: response?.error,
          debug: response?.debug
        });
        setTransactions([]);
        setPagination({ page: 1, limit: 20, total: 0, pages: 0 });
        // Show error toast with detailed message
        if (response && !response.success) {
          const errorMsg = response.error || response.message || 'Không thể tải danh sách transactions';
          console.error('API error details:', errorMsg);
          toast.error(errorMsg);
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

  // Get explorer URL - chỉ trả về URL cho networks thực, không phải development/mock
  const getExplorerUrl = (txHash, network = 'development') => {
    if (!txHash) return null;
    
    // Chỉ trả về URL cho networks thực sự trên blockchain
    // Development và mock networks không có transactions thực trên explorer
    const realNetworks = {
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
    
    // Chỉ trả về URL nếu network là real network
    // Development và mock không có transactions thực
    if (network === 'development' || network === 'mock' || !realNetworks[network]) {
      return null; // Không có URL cho development/mock
    }
    
    return realNetworks[network];
  };

  // Get contract address explorer URL
  const getContractExplorerUrl = (contractAddress, network = 'development') => {
    if (!contractAddress) return null;
    
    const contractUrls = {
      'sepolia': `https://sepolia.etherscan.io/address/${contractAddress}`,
      'mainnet': `https://etherscan.io/address/${contractAddress}`,
      'polygon_mumbai': `https://mumbai.polygonscan.com/address/${contractAddress}`,
      'polygon_mainnet': `https://polygonscan.com/address/${contractAddress}`,
      'bsc_testnet': `https://testnet.bscscan.com/address/${contractAddress}`,
      'bsc_mainnet': `https://bscscan.com/address/${contractAddress}`,
      'arbitrum_sepolia': `https://sepolia.arbiscan.io/address/${contractAddress}`,
      'arbitrum_one': `https://arbiscan.io/address/${contractAddress}`,
      'optimism_sepolia': `https://sepolia-optimism.etherscan.io/address/${contractAddress}`,
      'optimism_mainnet': `https://optimistic.etherscan.io/address/${contractAddress}`
    };
    
    if (network === 'development' || network === 'mock' || !contractUrls[network]) {
      return null;
    }
    
    return contractUrls[network];
  };

  // Contract address - có thể lấy từ env hoặc hardcode
  const CONTRACT_ADDRESS = '0x9E34F4cdeA152c6f10e0b08BfB48264c9fc7fd86';
  const CURRENT_NETWORK = 'sepolia'; // Có thể lấy từ API hoặc config
  const contractExplorerUrl = getContractExplorerUrl(CONTRACT_ADDRESS, CURRENT_NETWORK);
  
  // Check if transaction is on real blockchain
  const isRealBlockchainTransaction = (network) => {
    const realNetworks = ['sepolia', 'mainnet', 'polygon_mumbai', 'polygon_mainnet', 
                          'bsc_testnet', 'bsc_mainnet', 'arbitrum_sepolia', 'arbitrum_one',
                          'optimism_sepolia', 'optimism_mainnet'];
    return network && realNetworks.includes(network);
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
    setFilters({ search: '', drugId: '', status: '', network: '' });
    setTimeout(() => {
      loadTransactions(1);
    }, 100);
  };

  // Helper function để tạo unique key - luôn đảm bảo trả về string và unique
  const getUniqueKey = (item, idx) => {
    let idPart = '';
    
    if (item._id) {
      if (typeof item._id === 'string' && item._id.trim() !== '' && item._id !== '[object Object]') {
        idPart = item._id;
      } else if (typeof item._id === 'object' && item._id !== null) {
        const nestedId = item._id._id || item._id.id;
        if (nestedId && typeof nestedId === 'string' && nestedId !== '[object Object]') {
          idPart = nestedId;
        }
      }
    }
    
    if (!idPart || idPart === '[object Object]') {
      const transactionHash = String(item.transactionHash || '');
      const timestamp = item.timestamp ? String(new Date(item.timestamp).getTime()) : String(Date.now());
      idPart = `${transactionHash}-${timestamp}`;
    }
    
    return `blockchain-tx-${idx}-${idPart}`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Blockchain Explorer</h1>
            <p className="text-gray-600">
              Xem và quản lý các transactions trên blockchain với business context
            </p>
          </div>
        </div>
        
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <ExternalLink className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-blue-900 mb-1">
                Blockchain Explorer vs Etherscan
              </h3>
              <p className="text-sm text-blue-800">
                <strong>Blockchain Explorer</strong> hiển thị transactions với business context (lô thuốc, chuỗi cung ứng, chữ ký số). 
                <strong> Etherscan</strong> hiển thị raw blockchain data. 
                Click vào icon <ExternalLink className="w-4 h-4 inline mx-1" /> để xem chi tiết kỹ thuật trên Etherscan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 mb-2">Smart Contract</p>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-gray-900 break-all" title={CONTRACT_ADDRESS}>
                    {CONTRACT_ADDRESS}
                  </code>
                  <button
                    onClick={() => copyToClipboard(CONTRACT_ADDRESS)}
                    className="text-gray-400 hover:text-gray-600 transition flex-shrink-0"
                    title="Sao chép"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {contractExplorerUrl && (
                    <a
                      href={contractExplorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition flex-shrink-0 inline-flex items-center gap-1"
                      title="Xem contract trên Etherscan"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-xs">Etherscan</span>
                    </a>
                  )}
                </div>
                <p className="text-xs text-gray-500">Network: <span className="font-medium capitalize">{CURRENT_NETWORK}</span></p>
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0 ml-3">
              <Shield className="w-6 h-6 text-purple-600" />
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tìm kiếm (Tx Hash / Lô thuốc)
            </label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Nhập hash hoặc tên lô thuốc..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lô thuốc (Drug ID)
            </label>
            <input
              type="text"
              value={filters.drugId || ''}
              onChange={(e) => handleFilterChange('drugId', e.target.value)}
              placeholder="Nhập ID lô thuốc..."
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
                      Lô thuốc / Đối tượng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Loại
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
                  {transactions.map((tx, idx) => (
                    <tr key={getUniqueKey(tx, idx)} className="hover:bg-gray-50">
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
                          {tx.transactionHash && (() => {
                            const explorerUrl = getExplorerUrl(tx.transactionHash, tx.network);
                            const isReal = isRealBlockchainTransaction(tx.network);
                            
                            if (explorerUrl && isReal) {
                              return (
                                <a
                                  href={explorerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 transition"
                                  title={`Mở trên ${tx.network} Explorer\n${explorerUrl}`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              );
                            } else {
                              // Không hiển thị icon cho development/mock transactions
                              // Vì chúng không tồn tại trên blockchain thực
                              return null;
                            }
                          })()}
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
                        {tx.transactionType ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {tx.transactionType === 'recordDrug' ? 'Ghi lô thuốc' :
                             tx.transactionType === 'updateSupplyChain' ? 'Cập nhật chuỗi' :
                             tx.transactionType === 'recordDigitalSignature' ? 'Ghi chữ ký số' :
                             tx.transactionType}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
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
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleVerify(tx)}
                            className="text-blue-600 hover:text-blue-900 hover:underline"
                            title="Xác minh transaction trên blockchain"
                          >
                            Verify
                          </button>
                          {(() => {
                            const explorerUrl = getExplorerUrl(tx.transactionHash, tx.network);
                            const isReal = isRealBlockchainTransaction(tx.network);
                            
                            if (explorerUrl && isReal) {
                              return (
                                <a
                                  href={explorerUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-900 inline-flex items-center gap-1"
                                  title={`Xem trên ${tx.network} Explorer`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  <span className="text-xs">Etherscan</span>
                                </a>
                              );
                            }
                            return null;
                          })()}
                        </div>
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
                <div className="mb-6 space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Transaction Hash</h3>
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-mono text-gray-900 break-all">
                        {selectedTx.transactionHash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(selectedTx.transactionHash)}
                        className="text-gray-400 hover:text-gray-600 transition"
                        title="Sao chép"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {(() => {
                        const explorerUrl = getExplorerUrl(selectedTx.transactionHash, selectedTx.network);
                        const isReal = isRealBlockchainTransaction(selectedTx.network);
                        if (explorerUrl && isReal) {
                          return (
                            <a
                              href={explorerUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                              title="Xem trên Etherscan"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span className="text-xs">Etherscan</span>
                            </a>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  
                  {/* Business Context */}
                  {selectedTx.drugId && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h3 className="text-sm font-semibold text-blue-900 mb-2">Business Context</h3>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Lô thuốc:</span>{' '}
                          <span className="text-blue-900">{selectedTx.drugId.name || selectedTx.drugId.drugId}</span>
                        </div>
                        {selectedTx.drugId.batchNumber && (
                          <div>
                            <span className="text-blue-700 font-medium">Số lô:</span>{' '}
                            <span className="text-blue-900">{selectedTx.drugId.batchNumber}</span>
                          </div>
                        )}
                        {selectedTx.transactionType && (
                          <div>
                            <span className="text-blue-700 font-medium">Loại transaction:</span>{' '}
                            <span className="text-blue-900">
                              {selectedTx.transactionType === 'recordDrug' ? 'Ghi lô thuốc' :
                               selectedTx.transactionType === 'updateSupplyChain' ? 'Cập nhật chuỗi cung ứng' :
                               selectedTx.transactionType === 'recordDigitalSignature' ? 'Ghi chữ ký số' :
                               selectedTx.transactionType}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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

