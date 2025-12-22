import React, { useState, useEffect } from 'react';
import { invoiceAPI, paymentAPI } from '../utils/api';
import toast from 'react-hot-toast';

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    invoiceType: '',
    status: '',
    paymentStatus: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'bank_transfer',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    loadInvoices();
    loadStats();
    loadPayments();
  }, [filters, pagination.page]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: pagination.page,
        limit: pagination.limit
      };
      const response = await invoiceAPI.getInvoices(params);
      if (response.success) {
        setInvoices(response.data.invoices || []);
        setPagination(prev => ({
          ...prev,
          total: response.data.pagination?.total || 0
        }));
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        invoiceType: filters.invoiceType,
        status: filters.status
      };
      const response = await invoiceAPI.getInvoiceStats(params);
      if (response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPayments = async () => {
    try {
      const response = await paymentAPI.getPayments({ limit: 10 });
      if (response.success) {
        setPayments(response.data.payments || []);
      }
    } catch (error) {
      console.error('Error loading payments:', error);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleRecordPayment = async () => {
    // Nếu là MoMo, tạo payment request và redirect
    if (paymentData.method === 'momo') {
      try {
        setLoading(true);
        const response = await paymentAPI.createMomoPayment({
          invoiceId: selectedInvoice._id,
          amount: parseFloat(paymentData.amount)
        });

        if (response.success && response.data.paymentUrl) {
          toast.success('Đang chuyển đến trang thanh toán MoMo...');
          // Redirect đến MoMo payment page
          window.location.href = response.data.paymentUrl;
        } else {
          toast.error('Không thể tạo yêu cầu thanh toán MoMo');
        }
      } catch (error) {
        console.error('Error creating MoMo payment:', error);
        toast.error(error.response?.data?.message || 'Lỗi khi tạo thanh toán MoMo');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Các phương thức thanh toán khác (cash, bank_transfer, etc.)
    try {
      if (!selectedInvoice || !paymentData.amount) {
        toast.error('Vui lòng nhập đầy đủ thông tin');
        return;
      }

      await invoiceAPI.recordPayment(selectedInvoice._id, paymentData);
      setShowPaymentModal(false);
      setSelectedInvoice(null);
      setPaymentData({
        amount: '',
        method: 'bank_transfer',
        paymentDate: new Date().toISOString().split('T')[0],
        notes: ''
      });
      loadInvoices();
      loadStats();
      loadPayments();
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      issued: 'bg-blue-100 text-blue-800',
      sent: 'bg-purple-100 text-purple-800',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      void: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadge = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800',
      paid: 'bg-green-100 text-green-800',
      overdue: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
      const invoiceNumber = String(item.invoiceNumber || '');
      const issueDate = item.issueDate ? String(new Date(item.issueDate).getTime()) : String(Date.now());
      const totalAmount = String(item.totalAmount || '');
      idPart = `${invoiceNumber}-${issueDate}-${totalAmount}`;
    }
    
    return `invoice-${idx}-${idPart}`;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Quản lý Hóa đơn & Thanh toán</h1>
        <p className="text-gray-600 mt-2">Quản lý hóa đơn điện tử và thanh toán</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Tổng hóa đơn</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalInvoices || 0}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Tổng giá trị</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalAmount || 0)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Đã thanh toán</div>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(stats.paidAmount || 0)}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-600">Còn nợ</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.dueAmount || 0)}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <select
            value={filters.invoiceType}
            onChange={(e) => handleFilterChange('invoiceType', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Tất cả loại</option>
            <option value="sales">Bán hàng</option>
            <option value="purchase">Mua hàng</option>
            <option value="return">Trả hàng</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="draft">Nháp</option>
            <option value="issued">Đã phát hành</option>
            <option value="sent">Đã gửi</option>
            <option value="paid">Đã thanh toán</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <select
            value={filters.paymentStatus}
            onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">Tất cả thanh toán</option>
            <option value="pending">Chờ thanh toán</option>
            <option value="partial">Thanh toán một phần</option>
            <option value="paid">Đã thanh toán</option>
            <option value="overdue">Quá hạn</option>
          </select>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 border rounded-lg"
            placeholder="Từ ngày"
          />
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-2 border rounded-lg"
            placeholder="Đến ngày"
          />
        </div>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => {
              setFilters({
                invoiceType: '',
                status: '',
                paymentStatus: '',
                startDate: '',
                endDate: '',
                search: ''
              });
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Số HĐ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã ĐH</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người mua</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày phát hành</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tổng tiền</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã trả</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Còn nợ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="10" className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                invoices.map((invoice, idx) => (
                  <tr key={getUniqueKey(invoice, idx)} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.orderNumber ? (
                        <span className="text-blue-600 hover:text-blue-800 cursor-pointer" title="Xem đơn hàng">
                          {invoice.orderNumber}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.invoiceType === 'sales' ? 'Bán hàng' : invoice.invoiceType === 'purchase' ? 'Mua hàng' : 'Khác'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.buyerInfo?.name || invoice.buyer?.fullName || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(invoice.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                      {formatCurrency(invoice.paidAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {formatCurrency(invoice.dueAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentStatusBadge(invoice.paymentStatus)}`}>
                        {invoice.paymentStatus === 'pending' ? 'Chờ thanh toán' :
                         invoice.paymentStatus === 'partial' ? 'Một phần' :
                         invoice.paymentStatus === 'paid' ? 'Đã thanh toán' :
                         invoice.paymentStatus === 'overdue' ? 'Quá hạn' : invoice.paymentStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {invoice.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(invoice);
                            setPaymentData(prev => ({
                              ...prev,
                              amount: invoice.dueAmount || ''
                            }));
                            setShowPaymentModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Thanh toán
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
            <div className="text-sm text-gray-700">
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination.page === 1}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Ghi nhận thanh toán</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hóa đơn
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {selectedInvoice.invoiceNumber}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền còn nợ
                </label>
                <div className="px-3 py-2 bg-gray-50 rounded-lg">
                  {formatCurrency(selectedInvoice.dueAmount)}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số tiền thanh toán *
                </label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Nhập số tiền"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phương thức thanh toán *
                </label>
                <select
                  value={paymentData.method}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="cash">Tiền mặt</option>
                  <option value="bank_transfer">Chuyển khoản</option>
                  <option value="credit_card">Thẻ tín dụng</option>
                  <option value="momo">MoMo</option>
                  <option value="check">Séc</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ngày thanh toán
                </label>
                <input
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <textarea
                  value={paymentData.notes}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedInvoice(null);
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Hủy
              </button>
              <button
                onClick={handleRecordPayment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;

