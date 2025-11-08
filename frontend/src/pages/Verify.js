import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  QrCode,
  Shield,
  AlertTriangle,
  CheckCircle,
  Hash,
  Package,
  Thermometer,
  Truck,
  Clock
} from 'lucide-react';
import api from '../utils/api';

const STATUS_LABELS = {
  active: 'Hoạt động',
  recalled: 'Đã thu hồi',
  expired: 'Đã hết hạn',
  suspended: 'Tạm dừng'
};

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  recalled: 'bg-red-100 text-red-800',
  expired: 'bg-red-100 text-red-800',
  suspended: 'bg-yellow-100 text-yellow-800'
};

const DISTRIBUTION_STATUS_LABELS = {
  sản_xuất: 'Sản xuất',
  kiểm_định: 'Kiểm định',
  đóng_gói: 'Đóng gói',
  vận_chuyển: 'Vận chuyển',
  tại_kho: 'Tại kho',
  đã_bán: 'Đã bán',
  đã_sử_dụng: 'Đã sử dụng',
  recalled: 'Đã thu hồi'
};

const LOCATION_LABELS = {
  nhà_máy: 'Nhà máy',
  kho_phân_phối: 'Kho phân phối',
  bệnh_viện: 'Bệnh viện',
  nhà_thuốc: 'Nhà thuốc',
  bệnh_nhân: 'Bệnh nhân'
};

const QUALITY_RESULT_CLASSES = {
  đạt: 'bg-green-100 text-green-800',
  'đang kiểm định': 'bg-yellow-100 text-yellow-800',
  'không đạt': 'bg-red-100 text-red-800'
};

const formatDate = (value, withTime = false) => {
  if (!value) return '—';
  const date = new Date(value);
  const options = withTime
    ? {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }
    : {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      };
  return date.toLocaleString('vi-VN', options);
};

const formatDaysUntilExpiry = (days) => {
  if (typeof days !== 'number') return '—';
  if (days > 0) return `${days} ngày`;
  if (days === 0) return 'Hết hạn hôm nay';
  return `Đã hết hạn ${Math.abs(days)} ngày`;
};

const formatTemperatureRange = (temperature) => {
  if (!temperature || (temperature.min == null && temperature.max == null)) return 'Không có dữ liệu';
  const unit = temperature.unit === 'fahrenheit' ? '°F' : '°C';
  if (temperature.min != null && temperature.max != null) {
    return `${temperature.min}${unit} - ${temperature.max}${unit}`;
  }
  if (temperature.min != null) {
    return `≥ ${temperature.min}${unit}`;
  }
  if (temperature.max != null) {
    return `≤ ${temperature.max}${unit}`;
  }
  return 'Không có dữ liệu';
};

const formatHumidityRange = (humidity) => {
  if (!humidity || (humidity.min == null && humidity.max == null)) return 'Không có dữ liệu';
  const unit = humidity.unit || '%';
  if (humidity.min != null && humidity.max != null) {
    return `${humidity.min}${unit} - ${humidity.max}${unit}`;
  }
  if (humidity.min != null) {
    return `≥ ${humidity.min}${unit}`;
  }
  if (humidity.max != null) {
    return `≤ ${humidity.max}${unit}`;
  }
  return 'Không có dữ liệu';
};

const formatAddress = (address, fallback = '—') => {
  if (!address) return fallback;
  if (typeof address === 'string') return address;
  const { street, ward, district, city } = address;
  const parts = [street, ward, district, city].filter(Boolean);
  return parts.length ? parts.join(', ') : fallback;
};

const capitalize = (text) => {
  if (!text) return '—';
  return text.charAt(0).toLocaleUpperCase('vi-VN') + text.slice(1);
};

const InfoRow = ({ label, value }) => (
  <div>
    <label className="block text-sm font-medium text-gray-600">{label}</label>
    <p className="mt-1 text-sm text-gray-900 break-words">{value ?? '—'}</p>
  </div>
);

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
        setVerificationData(response.data?.data || response.data);
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

  const { drug = {}, verification } = verificationData || {};
  const manufacturer = useMemo(() => drug.manufacturer || {}, [drug.manufacturer]);
  const organizationInfo = manufacturer?.organizationInfo || {};
  const storage = drug.storage || {};
  const packaging = drug.packaging || {};
  const distribution = drug.distribution || {};
  const distributionHistory = distribution.history || [];
  const currentLocation = distribution.currentLocation || {};
  const blockchainInfo = drug.blockchain || {};

  const statusLabel = STATUS_LABELS[drug.status] || 'Không xác định';
  const statusBadgeClass = STATUS_COLORS[drug.status] || 'bg-gray-100 text-gray-800';
  const qualityTest = drug.qualityTest || null;
  const qualityResult = qualityTest?.testResult?.toLowerCase();
  const qualityBadgeClass = qualityResult
    ? QUALITY_RESULT_CLASSES[qualityResult] || 'bg-gray-100 text-gray-800'
    : 'bg-gray-100 text-gray-800';

  const isRecalled = Boolean(drug.isRecalled);
  const recallLabel = isRecalled ? (drug.recallReason || 'Đã thu hồi') : 'Không';

  const currentDistributionStatus =
    DISTRIBUTION_STATUS_LABELS[distribution.status] || 'Chưa cập nhật';
  const locationTypeLabel =
    LOCATION_LABELS[currentLocation.type] || currentLocation.type || '—';
  const blockchainStatusLabel =
    blockchainInfo.blockchainStatus === 'confirmed'
      ? 'Đã xác nhận'
      : blockchainInfo.blockchainStatus === 'failed'
        ? 'Thất bại'
        : blockchainInfo.blockchainStatus === 'pending'
          ? 'Đang chờ'
          : 'Chưa cập nhật';
  const blockchainStatusClass =
    blockchainInfo.blockchainStatus === 'confirmed'
      ? 'bg-green-100 text-green-700'
      : blockchainInfo.blockchainStatus === 'failed'
        ? 'bg-red-100 text-red-700'
        : 'bg-yellow-100 text-yellow-700';

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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Xác minh lô thuốc</h1>
                <p className="text-gray-600">Thông tin được xác minh từ blockchain</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <div className="flex items-center text-green-600 md:justify-end">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Đã xác minh</span>
              </div>
              <p className="text-sm text-gray-500">
                {verification?.verifiedAt ? formatDate(verification.verifiedAt, true) : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Drug Information */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <QrCode className="w-6 h-6 mr-2 text-blue-600" />
                Thông tin lô thuốc
              </h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeClass}`}>
                {isRecalled ? 'Đã thu hồi' : statusLabel}
              </span>
            </div>

            {isRecalled && (
              <div className="rounded-lg border border-red-200 bg-red-50/80 p-3 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 mt-1" />
                <div>
                  <p className="text-sm font-semibold text-red-700">Lô thuốc đã bị thu hồi</p>
                  <p className="mt-1 text-xs text-red-600">
                    {drug.recallReason ? `Lý do: ${drug.recallReason}` : 'Không rõ lý do'}
                    {drug.recallDate && ` · Ngày thu hồi: ${formatDate(drug.recallDate, true)}`}
                  </p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 text-lg">{drug.name || '—'}</h3>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-blue-800">
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-medium">Mã lô</p>
                  <p>{drug.drugId || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-medium">Số lô sản xuất</p>
                  <p>{drug.batchNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-medium">Ngày sản xuất</p>
                  <p>{formatDate(drug.productionDate)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-blue-600 font-medium">Hạn sử dụng</p>
                  <p>{formatDate(drug.expiryDate)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoRow label="Thành phần hoạt chất" value={drug.activeIngredient} />
              <InfoRow label="Liều lượng" value={drug.dosage} />
              <InfoRow label="Dạng bào chế" value={drug.form} />
              <InfoRow label="Số ngày còn lại" value={formatDaysUntilExpiry(drug.daysUntilExpiry)} />
              <InfoRow label="Trạng thái gần hết hạn" value={drug.isNearExpiry ? 'Có' : 'Không'} />
              <InfoRow label="Ngày cập nhật gần nhất" value={formatDate(drug.updatedAt, true)} />
              <InfoRow label="Tình trạng thu hồi" value={recallLabel} />
            </div>

            {Object.keys(manufacturer).length > 0 && (
              <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2 uppercase tracking-wide">Nhà sản xuất</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="Đơn vị" value={organizationInfo.name || manufacturer.fullName} />
                  <InfoRow label="Giấy phép" value={organizationInfo.license} />
                  <InfoRow label="Loại hình" value={organizationInfo.type} />
                  <InfoRow label="Điện thoại" value={manufacturer.phone} />
                  <InfoRow label="Email" value={manufacturer.email} />
                  <InfoRow label="Địa chỉ" value={formatAddress(manufacturer.address, formatAddress(manufacturer.location?.address))} />
                </div>
                {organizationInfo.description && (
                  <p className="mt-3 text-xs text-blue-800 whitespace-pre-line">
                    {organizationInfo.description}
                  </p>
                )}
              </div>
            )}

            {packaging && (packaging.specifications || packaging.standard || packaging.shelfLife) && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center text-gray-800 font-semibold mb-3">
                  <Package className="w-5 h-5 mr-2 text-gray-600" />
                  Thông tin đóng gói
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="Quy cách" value={packaging.specifications} />
                  <InfoRow label="Tiêu chuẩn" value={packaging.standard} />
                  <InfoRow label="Thời hạn bảo quản" value={packaging.shelfLife} />
                </div>
              </div>
            )}

            {(storage.temperature || storage.humidity || storage.specialInstructions || storage.lightSensitive != null) && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center text-gray-800 font-semibold mb-3">
                  <Thermometer className="w-5 h-5 mr-2 text-gray-600" />
                  Hướng dẫn bảo quản
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="Nhiệt độ" value={formatTemperatureRange(storage.temperature)} />
                  <InfoRow label="Độ ẩm" value={formatHumidityRange(storage.humidity)} />
                  <InfoRow
                    label="Nhạy cảm ánh sáng"
                    value={
                      storage.lightSensitive == null
                        ? '—'
                        : storage.lightSensitive
                          ? 'Có'
                          : 'Không'
                    }
                  />
                  {storage.specialInstructions && (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-600">Hướng dẫn đặc biệt</label>
                      <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                        {storage.specialInstructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {distribution.status && (
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center text-gray-800 font-semibold mb-3">
                  <Truck className="w-5 h-5 mr-2 text-gray-600" />
                  Trạng thái phân phối
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow label="Bước hiện tại" value={currentDistributionStatus} />
                  <InfoRow
                    label="Vị trí hiện tại"
                    value={`${locationTypeLabel}${currentLocation.organizationName ? ` · ${currentLocation.organizationName}` : ''}`}
                  />
                  <InfoRow label="Địa chỉ" value={formatAddress(currentLocation.address)} />
                </div>
                {distributionHistory.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Các cập nhật gần đây
                    </p>
                    {distributionHistory.slice(0, 3).map((entry, index) => (
                      <div key={index} className="border border-gray-100 bg-gray-50 rounded-md p-3">
                        <div className="flex items-center justify-between text-sm text-gray-800">
                          <span className="font-semibold">
                            {DISTRIBUTION_STATUS_LABELS[entry.status] || entry.status || '—'}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(entry.timestamp, true)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-600">
                          {LOCATION_LABELS[entry.location] || entry.location || '—'}
                          {entry.organizationName ? ` · ${entry.organizationName}` : ''}
                        </p>
                        {entry.note && (
                          <p className="mt-1 text-xs text-gray-500">
                            Ghi chú: {entry.note}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Blockchain Information */}
          <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                <Hash className="w-6 h-6 mr-2 text-purple-600" />
                Thông tin Blockchain
              </h2>
              {blockchainInfo && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${blockchainStatusClass}`}>
                  {blockchainStatusLabel}
                </span>
              )}
            </div>

            {blockchainInfo && blockchainInfo.blockchainId ? (
              <>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-purple-600 mr-2" />
                    <span className="font-medium text-purple-900">
                      {blockchainStatusLabel}
                    </span>
                  </div>
                  <p className="text-sm text-purple-800">
                    Lần cập nhật gần nhất: {blockchainInfo.lastUpdated ? formatDate(blockchainInfo.lastUpdated, true) : '—'}
                  </p>
                </div>

                <div className="space-y-3">
                  <InfoRow label="Blockchain ID" value={blockchainInfo.blockchainId} />
                  <InfoRow label="Transaction Hash" value={blockchainInfo.transactionHash} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoRow label="Block Number" value={blockchainInfo.blockNumber != null ? blockchainInfo.blockNumber.toLocaleString() : '—'} />
                    <InfoRow label="Thời điểm ghi nhận" value={formatDate(blockchainInfo.blockchainTimestamp, true)} />
                  </div>
                  {blockchainInfo.contractAddress && (
                    <InfoRow label="Địa chỉ hợp đồng" value={blockchainInfo.contractAddress} />
                  )}
                  {blockchainInfo.digitalSignature && (
                    <InfoRow label="Chữ ký số" value={blockchainInfo.digitalSignature.substring(0, 80) + (blockchainInfo.digitalSignature.length > 80 ? '...' : '')} />
                  )}
                  {blockchainInfo.dataHash && (
                    <InfoRow label="Hash dữ liệu" value={blockchainInfo.dataHash.substring(0, 80) + (blockchainInfo.dataHash.length > 80 ? '...' : '')} />
                  )}
                </div>

                {Array.isArray(blockchainInfo.transactionHistory) && blockchainInfo.transactionHistory.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-800 mb-2">Lịch sử giao dịch</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {blockchainInfo.transactionHistory.map((tx, index) => (
                        <div key={index} className="border border-gray-100 bg-gray-50 rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-800">{tx.action || 'Giao dịch'}</span>
                            <span className="text-xs text-gray-500">{tx.blockNumber ? `Block #${tx.blockNumber}` : ''}</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-600">
                            {tx.details || 'Không có mô tả'}
                          </p>
                          {tx.timestamp && (
                            <p className="mt-1 text-xs text-gray-500">{formatDate(tx.timestamp, true)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                  <span className="text-yellow-800">Chưa ghi lên blockchain</span>
                </div>
                <p className="text-sm text-yellow-700 mt-2">
                  Lô thuốc này chưa có dữ liệu blockchain hoặc đang trong quá trình xác nhận.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quality Test Information */}
        {qualityTest && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Kết quả kiểm định</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Kết quả</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${qualityBadgeClass}`}>
                  {capitalize(qualityTest.testResult)}
                </span>
              </div>
              <InfoRow label="Ngày kiểm định" value={formatDate(qualityTest.testDate, true)} />
              <InfoRow label="Cơ quan kiểm định" value={qualityTest.testBy} />
              <InfoRow label="Số chứng nhận" value={qualityTest.certificateNumber || '—'} />
            </div>
            {qualityTest.testReport && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Báo cáo kiểm định</label>
                <p className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                  {qualityTest.testReport}
                </p>
              </div>
            )}
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
