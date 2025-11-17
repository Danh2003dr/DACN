import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  FileSignature,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Eye,
  X,
  Shield,
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { digitalSignatureAPI, drugAPI } from '../utils/api';
import toast from 'react-hot-toast';

const DigitalSignatures = () => {
  const { user } = useAuth();
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSignModal, setShowSignModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSignature, setSelectedSignature] = useState(null);
  const [stats, setStats] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTargetType, setFilterTargetType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [drugs, setDrugs] = useState([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    loadSignatures();
    loadStats();
    if (user?.role === 'manufacturer' || user?.role === 'admin') {
      loadDrugs();
    }
  }, [user, page, filterStatus, filterTargetType, searchTerm]);

  const loadSignatures = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(filterStatus && filterStatus !== 'all' && { status: filterStatus }),
        ...(filterTargetType && filterTargetType !== 'all' && { targetType: filterTargetType }),
        ...(searchTerm && { search: searchTerm })
      };
      const response = await digitalSignatureAPI.getSignatures(params);
      if (response.success) {
        setSignatures(Array.isArray(response.data) ? response.data : []);
        setTotalPages(response.pagination?.pages || 1);
      } else {
        setSignatures([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error loading signatures:', error);
      toast.error('Không thể tải danh sách chữ ký số');
      setSignatures([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await digitalSignatureAPI.getStats();
      if (response.success && response.data) {
        setStats({
          total: response.data.total || 0,
          active: response.data.active || 0,
          expired: response.data.expired || 0,
          revoked: response.data.revoked || 0
        });
      } else {
        setStats({
          total: 0,
          active: 0,
          expired: 0,
          revoked: 0
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      setStats({
        total: 0,
        active: 0,
        expired: 0,
        revoked: 0
      });
    }
  };

  const loadDrugs = async () => {
    try {
      const response = await drugAPI.getDrugs({ limit: 100 });
      if (response.success) {
        // response.data có thể là object với drugs array hoặc trực tiếp là array
        const drugsData = response.data?.drugs || response.data || [];
        setDrugs(Array.isArray(drugsData) ? drugsData : []);
      } else {
        setDrugs([]);
      }
    } catch (error) {
      console.error('Error loading drugs:', error);
      setDrugs([]);
    }
  };

  const handleSign = async (data) => {
    try {
      const response = await digitalSignatureAPI.signDocument({
        targetType: data.targetType,
        targetId: data.targetId,
        options: {
          caProvider: data.caProvider || 'vnca',
          requireTimestamp: data.requireTimestamp !== false,
          purpose: data.purpose
        }
      });

      if (response.success) {
        toast.success('Ký số thành công!');
        setShowSignModal(false);
        reset();
        loadSignatures();
        loadStats();
      }
    } catch (error) {
      console.error('Error signing document:', error);
      toast.error(error.response?.data?.message || 'Không thể ký số');
    }
  };

  const handleVerify = async (signatureId) => {
    try {
      const response = await digitalSignatureAPI.verifySignature({
        signatureId
      });

      if (response.success && response.data.valid) {
        toast.success('Chữ ký số hợp lệ!');
      } else {
        toast.error(response.data?.message || 'Chữ ký số không hợp lệ');
      }
    } catch (error) {
      console.error('Error verifying signature:', error);
      toast.error('Không thể xác thực chữ ký số');
    }
  };

  const handleRevoke = async (id) => {
    const reason = prompt('Vui lòng nhập lý do thu hồi:');
    if (!reason) return;

    try {
      const response = await digitalSignatureAPI.revokeSignature(id, reason);
      if (response.success) {
        toast.success('Thu hồi chữ ký số thành công');
        loadSignatures();
        loadStats();
      }
    } catch (error) {
      console.error('Error revoking signature:', error);
      toast.error('Không thể thu hồi chữ ký số');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Hoạt động' },
      revoked: { color: 'bg-red-100 text-red-800', icon: XCircle, text: 'Đã thu hồi' },
      expired: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Hết hạn' },
      invalid: { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Không hợp lệ' }
    };
    const badge = badges[status] || badges.invalid;
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  const getTargetTypeLabel = (type) => {
    const labels = {
      drug: 'Lô thuốc',
      supplyChain: 'Chuỗi cung ứng',
      qualityTest: 'Kiểm định chất lượng',
      recall: 'Thu hồi',
      distribution: 'Phân phối',
      other: 'Khác'
    };
    return labels[type] || type;
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FileSignature className="w-8 h-8" />
          Quản lý Chữ ký số
        </h1>
        <p className="text-gray-600">
          Ký số và xác thực tài liệu theo chuẩn Việt Nam (CA quốc gia) với Timestamp Authority
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Tổng số chữ ký</div>
          <div className="text-2xl font-bold text-gray-900">{stats.total || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Đang hoạt động</div>
          <div className="text-2xl font-bold text-green-600">{stats.active || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Đã hết hạn</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.expired || 0}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-sm text-gray-600 mb-1">Đã thu hồi</div>
          <div className="text-2xl font-bold text-red-600">{stats.revoked || 0}</div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-1 gap-4 w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="revoked">Đã thu hồi</option>
              <option value="expired">Hết hạn</option>
              <option value="invalid">Không hợp lệ</option>
            </select>
            <select
              value={filterTargetType}
              onChange={(e) => setFilterTargetType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả loại</option>
              <option value="drug">Lô thuốc</option>
              <option value="supplyChain">Chuỗi cung ứng</option>
              <option value="qualityTest">Kiểm định</option>
            </select>
          </div>
          {(user?.role === 'admin' || user?.role === 'manufacturer' || user?.role === 'distributor' || user?.role === 'hospital') && (
            <button
              onClick={() => setShowSignModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FileSignature className="w-5 h-5" />
              Ký số mới
            </button>
          )}
        </div>
      </div>

      {/* Signatures List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Đang tải...</div>
        ) : signatures.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Chưa có chữ ký số nào</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đối tượng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người ký</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CA Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày ký</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {signatures.map((sig) => (
                  <tr key={sig._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{getTargetTypeLabel(sig.targetType)}</div>
                      <div className="text-xs text-gray-500">{sig.targetId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{sig.signedByName}</div>
                      <div className="text-xs text-gray-500">{sig.signedByRole}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{sig.certificate?.caName || 'N/A'}</div>
                      <div className="text-xs text-gray-500">{sig.certificate?.serialNumber?.substring(0, 20)}...</div>
                    </td>
                    <td className="px-6 py-4">
                      {sig.timestamp?.timestampStatus === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm">
                          <CheckCircle className="w-4 h-4" />
                          Đã timestamp
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">Chưa timestamp</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(sig.status)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(sig.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedSignature(sig);
                            setShowDetailModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleVerify(sig._id)}
                          className="text-green-600 hover:text-green-800"
                          title="Xác thực"
                        >
                          <Shield className="w-5 h-5" />
                        </button>
                        {(user?.role === 'admin' || sig.signedBy?._id === user?.id) && sig.status === 'active' && (
                          <button
                            onClick={() => handleRevoke(sig._id)}
                            className="text-red-600 hover:text-red-800"
                            title="Thu hồi"
                          >
                            <X className="w-5 h-5" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Trước
          </button>
          <span className="px-4 py-2">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border rounded-lg disabled:opacity-50"
          >
            Sau
          </button>
        </div>
      )}

      {/* Sign Modal */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Ký số tài liệu</h2>
              <button onClick={() => setShowSignModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit(handleSign)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại đối tượng *</label>
                <select
                  {...register('targetType', { required: 'Vui lòng chọn loại đối tượng' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn loại</option>
                  <option value="drug">Lô thuốc</option>
                  <option value="supplyChain">Chuỗi cung ứng</option>
                  <option value="qualityTest">Kiểm định chất lượng</option>
                </select>
                {errors.targetType && (
                  <p className="text-red-500 text-sm mt-1">{errors.targetType.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đối tượng *</label>
                <select
                  {...register('targetId', { required: 'Vui lòng chọn đối tượng' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn đối tượng</option>
                  {Array.isArray(drugs) && drugs.map((drug) => (
                    <option key={drug._id} value={drug._id}>
                      {drug.name} - {drug.batchNumber}
                    </option>
                  ))}
                </select>
                {errors.targetId && (
                  <p className="text-red-500 text-sm mt-1">{errors.targetId.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CA Provider</label>
                <select
                  {...register('caProvider')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vnca">CA Quốc gia Việt Nam</option>
                  <option value="viettel-ca">Viettel CA</option>
                  <option value="fpt-ca">FPT CA</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  {...register('requireTimestamp')}
                  defaultChecked
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">Yêu cầu Timestamp Authority (TSA)</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mục đích</label>
                <textarea
                  {...register('purpose')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Mục đích ký số (tùy chọn)"
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Ký số
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSignature && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Chi tiết chữ ký số</h2>
              <button onClick={() => setShowDetailModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Loại đối tượng</label>
                  <div className="text-gray-900">{getTargetTypeLabel(selectedSignature.targetType)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Người ký</label>
                  <div className="text-gray-900">{selectedSignature.signedByName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">CA Provider</label>
                  <div className="text-gray-900">{selectedSignature.certificate?.caName}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Số seri chứng chỉ</label>
                  <div className="text-gray-900 font-mono text-xs">{selectedSignature.certificate?.serialNumber}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Trạng thái chứng chỉ</label>
                  <div className="text-gray-900">{selectedSignature.certificate?.certificateStatus}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Timestamp</label>
                  <div className="text-gray-900">
                    {selectedSignature.timestamp?.timestampStatus === 'verified' ? (
                      <span className="text-green-600">Đã timestamp</span>
                    ) : (
                      <span className="text-gray-400">Chưa timestamp</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Ngày ký</label>
                  <div className="text-gray-900">
                    {new Date(selectedSignature.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Trạng thái</label>
                  <div>{getStatusBadge(selectedSignature.status)}</div>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Data Hash</label>
                <div className="text-gray-900 font-mono text-xs break-all bg-gray-50 p-2 rounded">
                  {selectedSignature.dataHash}
                </div>
              </div>
              {selectedSignature.certificate?.certificateInfo && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Thông tin chứng chỉ</label>
                  <div className="bg-gray-50 p-4 rounded space-y-2 text-sm">
                    <div><strong>Subject:</strong> {selectedSignature.certificate.certificateInfo.subject}</div>
                    <div><strong>Issuer:</strong> {selectedSignature.certificate.certificateInfo.issuer}</div>
                    <div><strong>Valid From:</strong> {new Date(selectedSignature.certificate.certificateInfo.validFrom).toLocaleString('vi-VN')}</div>
                    <div><strong>Valid To:</strong> {new Date(selectedSignature.certificate.certificateInfo.validTo).toLocaleString('vi-VN')}</div>
                    <div><strong>Algorithm:</strong> {selectedSignature.certificate.certificateInfo.algorithm}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DigitalSignatures;

