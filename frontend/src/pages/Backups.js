import React, { useState, useEffect } from 'react';
import { backupAPI } from '../utils/api';
import {
  Database,
  Plus,
  Download,
  Trash2,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  RotateCcw,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

const Backups = () => {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, pages: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    startDate: '',
    endDate: ''
  });

  // Form data
  const [backupForm, setBackupForm] = useState({
    name: '',
    type: 'full',
    scope: 'all',
    format: 'mongodump',
    expiresInDays: 30,
    notes: ''
  });

  const [restoreForm, setRestoreForm] = useState({
    dropBeforeRestore: false,
    collections: []
  });

  // Load backups
  const loadBackups = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pagination.limit,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      };
      
      const response = await backupAPI.getBackups(params);
      if (response && response.success) {
        setBackups(response.data.backups || []);
        setPagination(response.data.pagination || { page: 1, limit: 50, total: 0, pages: 0 });
      } else {
        setBackups([]);
        setPagination({ page: 1, limit: 50, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      if (error.response?.status === 404) {
        setBackups([]);
        setPagination({ page: 1, limit: 50, total: 0, pages: 0 });
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await backupAPI.getStats();
      if (response && response.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadBackups(1);
    loadStats();
  }, []);

  // Create backup
  const handleCreateBackup = async (e) => {
    e.preventDefault();
    try {
      await backupAPI.createBackup(backupForm);
      setShowCreateModal(false);
      setBackupForm({
        name: '',
        type: 'full',
        scope: 'all',
        format: 'mongodump',
        expiresInDays: 30,
        notes: ''
      });
      // Reload sau 2 giây để backup có thời gian hoàn thành
      setTimeout(() => {
        loadBackups(1);
        loadStats();
      }, 2000);
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  // Download backup
  const handleDownload = async (backupId) => {
    try {
      await backupAPI.downloadBackup(backupId);
    } catch (error) {
      console.error('Error downloading backup:', error);
    }
  };

  // Restore backup
  const handleRestore = async (e) => {
    e.preventDefault();
    if (!window.confirm('Bạn có chắc chắn muốn khôi phục dữ liệu từ backup này? Hành động này có thể ghi đè dữ liệu hiện tại.')) {
      return;
    }
    
    try {
      await backupAPI.restoreBackup(selectedBackup._id, restoreForm);
      setShowRestoreModal(false);
      setSelectedBackup(null);
      setRestoreForm({
        dropBeforeRestore: false,
        collections: []
      });
      toast.success('Khôi phục dữ liệu thành công. Vui lòng refresh trang.');
    } catch (error) {
      console.error('Error restoring backup:', error);
    }
  };

  // Delete backup
  const handleDelete = async (backupId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa backup này?')) {
      return;
    }
    
    try {
      await backupAPI.deleteBackup(backupId);
      loadBackups(pagination.page);
      loadStats();
    } catch (error) {
      console.error('Error deleting backup:', error);
    }
  };

  // Cleanup expired backups
  const handleCleanup = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả backups đã hết hạn?')) {
      return;
    }
    
    try {
      await backupAPI.cleanupBackups();
      loadBackups(1);
      loadStats();
    } catch (error) {
      console.error('Error cleaning up backups:', error);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'in_progress': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Backup & Restore</h1>
          <p className="text-gray-600">Quản lý sao lưu và khôi phục dữ liệu</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCleanup}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Cleanup
          </button>
          <button
            onClick={() => {
              loadBackups(1);
              loadStats();
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo Backup
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng backups</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <Database className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Thành công</p>
                <p className="text-2xl font-bold text-green-600">{stats.successful || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Thất bại</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed || 0}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng dung lượng</p>
                <p className="text-2xl font-bold text-gray-900">{formatFileSize(stats.totalSize || 0)}</p>
              </div>
              <HardDrive className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="expired">Expired</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loại</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả</option>
              <option value="full">Full</option>
              <option value="incremental">Incremental</option>
              <option value="differential">Differential</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={() => {
                setFilters({
                  status: '',
                  type: '',
                  startDate: '',
                  endDate: ''
                });
                setTimeout(() => {
                  loadBackups(1);
                  loadStats();
                }, 100);
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              Reset
            </button>
            <button
              onClick={() => {
                loadBackups(1);
                loadStats();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Áp dụng
            </button>
          </div>
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loại
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Format
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kích thước
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày tạo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Đang tải...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{backup.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{backup.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{backup.format}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatFileSize(backup.fileSize)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(backup.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(backup.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                          {backup.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {backup.status === 'completed' && (
                          <>
                            <button
                              onClick={() => handleDownload(backup._id)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => {
                                setSelectedBackup(backup);
                                setShowRestoreModal(true);
                              }}
                              className="text-green-600 hover:text-green-800 text-sm"
                            >
                              Restore
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDelete(backup._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
                onClick={() => loadBackups(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => loadBackups(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Tạo Backup</h2>
            <form onSubmit={handleCreateBackup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên backup</label>
                <input
                  type="text"
                  value={backupForm.name}
                  onChange={(e) => setBackupForm({ ...backupForm, name: e.target.value })}
                  placeholder="Tự động tạo nếu để trống"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại backup</label>
                <select
                  value={backupForm.type}
                  onChange={(e) => setBackupForm({ ...backupForm, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="full">Full Backup</option>
                  <option value="incremental">Incremental</option>
                  <option value="differential">Differential</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                <select
                  value={backupForm.format}
                  onChange={(e) => setBackupForm({ ...backupForm, format: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="mongodump">MongoDB Dump (tar.gz)</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hết hạn sau (ngày)</label>
                <input
                  type="number"
                  value={backupForm.expiresInDays}
                  onChange={(e) => setBackupForm({ ...backupForm, expiresInDays: parseInt(e.target.value) || 0 })}
                  min="0"
                  placeholder="0 = không hết hạn"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                <textarea
                  value={backupForm.notes}
                  onChange={(e) => setBackupForm({ ...backupForm, notes: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Tạo Backup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && selectedBackup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-red-600">Khôi phục dữ liệu</h2>
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ Cảnh báo: Hành động này sẽ khôi phục dữ liệu từ backup và có thể ghi đè dữ liệu hiện tại.
              </p>
            </div>
            <form onSubmit={handleRestore} className="space-y-4">
              <div>
                <p className="text-sm text-gray-700 mb-2">
                  Backup: <span className="font-medium">{selectedBackup.name}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Ngày tạo: {formatDate(selectedBackup.createdAt)}
                </p>
                <p className="text-sm text-gray-600">
                  Kích thước: {formatFileSize(selectedBackup.fileSize)}
                </p>
              </div>
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={restoreForm.dropBeforeRestore}
                    onChange={(e) => setRestoreForm({ ...restoreForm, dropBeforeRestore: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Xóa dữ liệu hiện tại trước khi restore</span>
                </label>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRestoreModal(false);
                    setSelectedBackup(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Khôi phục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backups;

