import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  QrCode,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2,
  Heart,
  User,
  Shield,
  RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { reportAPI } from '../utils/api';

const activityIconMap = {
  drug_created: Package,
  qr_scan: QrCode,
  task_completed: CheckCircle,
  task_updated: Clock,
  alert: AlertTriangle,
  user_registered: Users,
  supply_chain: TrendingUp
};

const activityPillMap = {
  drug_created: { bg: 'bg-green-50', ring: 'ring-green-200', iconBg: 'bg-green-600' },
  qr_scan: { bg: 'bg-blue-50', ring: 'ring-blue-200', iconBg: 'bg-blue-600' },
  task_completed: { bg: 'bg-emerald-50', ring: 'ring-emerald-200', iconBg: 'bg-emerald-600' },
  task_updated: { bg: 'bg-amber-50', ring: 'ring-amber-200', iconBg: 'bg-amber-600' },
  alert: { bg: 'bg-red-50', ring: 'ring-red-200', iconBg: 'bg-red-600' },
  user_registered: { bg: 'bg-purple-50', ring: 'ring-purple-200', iconBg: 'bg-purple-600' },
  supply_chain: { bg: 'bg-indigo-50', ring: 'ring-indigo-200', iconBg: 'bg-indigo-600' }
};

const formatRelativeTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 1) return 'Vừa xong';
  if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) return rtf.format(diffDays, 'day');

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) return rtf.format(diffMonths, 'month');

  const diffYears = Math.round(diffMonths / 12);
  return rtf.format(diffYears, 'year');
};

const getRoleDisplayName = (role) => {
  const roleNames = {
    admin: 'Quản trị viên',
    manufacturer: 'Nhà sản xuất',
    distributor: 'Nhà phân phối',
    hospital: 'Bệnh viện',
    patient: 'Bệnh nhân'
  };
  return roleNames[role] || role || 'Người dùng';
};

const getRoleIcon = (role) => {
  const roleIcons = {
    admin: Shield,
    manufacturer: Building2,
    distributor: Users,
    hospital: Heart,
    patient: User
  };
  return roleIcons[role] || User;
};

const StatCard = ({ label, value, icon: Icon, tone = 'blue', loading = false }) => {
  const toneMap = {
    blue: { bg: 'bg-blue-50', icon: 'text-blue-600', ring: 'ring-blue-200' },
    green: { bg: 'bg-green-50', icon: 'text-green-600', ring: 'ring-green-200' },
    emerald: { bg: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-200' },
    amber: { bg: 'bg-amber-50', icon: 'text-amber-600', ring: 'ring-amber-200' },
    red: { bg: 'bg-red-50', icon: 'text-red-600', ring: 'ring-red-200' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-200' }
  };

  const toneStyle = toneMap[tone] || toneMap.blue;
  const valueLabel = typeof value === 'number' ? value.toLocaleString('vi-VN') : (value ?? '0');

  return (
    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <div className="mt-2">
            {loading ? (
              <div className="h-7 w-20 rounded bg-gray-100 animate-pulse" />
            ) : (
              <p className="text-2xl font-semibold text-gray-900">{valueLabel}</p>
            )}
          </div>
        </div>
        <div className={`h-11 w-11 rounded-xl ${toneStyle.bg} ring-1 ${toneStyle.ring} flex items-center justify-center`}>
          <Icon className={`h-6 w-6 ${toneStyle.icon}`} />
        </div>
      </div>
    </div>
  );
};

const ActionCard = ({ name, description, icon: Icon, href, tone = 'blue' }) => {
  const toneMap = {
    blue: { bg: 'bg-blue-600', hover: 'hover:bg-blue-700' },
    green: { bg: 'bg-green-600', hover: 'hover:bg-green-700' },
    purple: { bg: 'bg-purple-600', hover: 'hover:bg-purple-700' },
    orange: { bg: 'bg-orange-600', hover: 'hover:bg-orange-700' }
  };
  const style = toneMap[tone] || toneMap.blue;

  return (
    <Link
      to={href}
      className="group block rounded-xl border border-gray-100 bg-white shadow-soft p-5 hover:border-gray-200 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className={`h-11 w-11 rounded-xl ${style.bg} ${style.hover} flex items-center justify-center transition-colors`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">{name}</p>
          <p className="mt-1 text-sm text-gray-500 line-clamp-2">{description}</p>
        </div>
      </div>
    </Link>
  );
};

const Dashboard = () => {
  const { user, hasAnyRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboardData = async ({ silent = false } = {}) => {
    try {
      if (!silent) setLoading(true);
      setRefreshing(true);
      setError(null);

      const response = await reportAPI.getDashboardSummary();

      if (response && response.success) {
        setStats(response.data?.stats || null);
        setActivities(response.data?.recentActivities || []);
      } else {
        setStats(null);
        setActivities([]);
        setError('Chưa có dữ liệu để hiển thị.');
      }
    } catch (err) {
      const status = err.response?.status;
      if (status && status >= 500) {
        const message = err.response?.data?.message || 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
        setError(message);
        toast.error(message);
      } else if (status === 404) {
        setStats(null);
        setActivities([]);
        setError('Chưa có dữ liệu để hiển thị.');
      } else {
        setStats(null);
        setActivities([]);
        setError('Không thể tải dữ liệu dashboard.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const statsDisplay = useMemo(() => ({
    totalDrugs: stats?.totalDrugs ?? 0,
    activeUsers: stats?.activeUsers ?? 0,
    completedTasks: stats?.completedTasks ?? 0,
    pendingTasks: stats?.pendingTasks ?? 0,
    alerts: stats?.alerts ?? 0,
    todayScans: stats?.todayScans ?? 0
  }), [stats]);

  const quickActions = useMemo(() => ([
    {
      name: 'Quét QR Code',
      description: 'Quét mã QR để tra cứu nguồn gốc thuốc',
      icon: QrCode,
      href: '/qr-scanner',
      tone: 'blue',
      roles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']
    },
    {
      name: 'Quản lý Thuốc',
      description: 'Thêm và quản lý lô thuốc mới',
      icon: Package,
      href: '/drugs',
      tone: 'green',
      roles: ['admin', 'manufacturer', 'distributor', 'hospital']
    },
    {
      name: 'Quản lý Users',
      description: 'Quản lý tài khoản người dùng',
      icon: Users,
      href: '/users',
      tone: 'purple',
      roles: ['admin']
    },
    {
      name: 'Xem Báo cáo',
      description: 'Thống kê và báo cáo hệ thống',
      icon: BarChart3,
      href: '/reports',
      tone: 'orange',
      roles: ['admin', 'manufacturer', 'hospital']
    }
  ]), []);

  const filteredQuickActions = quickActions.filter((action) =>
    !action.roles?.length || hasAnyRole(action.roles)
  );

  const statsCards = useMemo(() => ([
    { key: 'totalDrugs', label: 'Tổng lô thuốc', value: statsDisplay.totalDrugs, icon: Package, tone: 'blue' },
    { key: 'activeUsers', label: 'Người dùng hoạt động', value: statsDisplay.activeUsers, icon: Users, tone: 'green' },
    { key: 'completedTasks', label: 'Nhiệm vụ hoàn thành', value: statsDisplay.completedTasks, icon: CheckCircle, tone: 'emerald' },
    { key: 'pendingTasks', label: 'Nhiệm vụ chờ xử lý', value: statsDisplay.pendingTasks, icon: Clock, tone: 'amber' },
    { key: 'alerts', label: 'Cảnh báo', value: statsDisplay.alerts, icon: AlertTriangle, tone: 'red' },
    { key: 'todayScans', label: 'Quét QR hôm nay', value: statsDisplay.todayScans, icon: QrCode, tone: 'purple' }
  ]), [statsDisplay]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const RoleIcon = getRoleIcon(user?.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-50 to-blue-50 border border-gray-100 shadow-soft">
        <div className="p-6 md:p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {getGreeting()}, {user?.fullName || 'bạn'}!
              </h1>
              <p className="text-gray-600 mt-2">
                Chào mừng bạn đến với hệ thống quản lý nguồn gốc thuốc
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fetchDashboardData({ silent: true })}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                aria-label="Tải lại dashboard"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Tải lại
              </button>

              <div className="flex items-center gap-3 rounded-xl bg-white/70 border border-gray-200 px-4 py-3">
                <div className="h-11 w-11 bg-primary-100 rounded-xl flex items-center justify-center">
                  <RoleIcon className="h-7 w-7 text-primary-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {getRoleDisplayName(user?.role)}
                  </p>
                  <p className="text-sm text-gray-500 truncate">
                    {user?.organizationInfo?.name || user?.patientId || 'Tài khoản hệ thống'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
          <p className="font-semibold">{error}</p>
          <p className="text-sm mt-1 text-red-700">Vui lòng thử tải lại trang hoặc kiểm tra kết nối server.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4">
        {statsCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={card.value}
            icon={card.icon}
            tone={card.tone}
            loading={loading && !stats}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Thao tác nhanh</h2>
          <span className="text-sm text-gray-500">Theo quyền hiện tại</span>
        </div>

        {filteredQuickActions.length === 0 ? (
          <p className="text-sm text-gray-500">Chưa có thao tác phù hợp với quyền của bạn.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredQuickActions.map((action) => (
              <ActionCard
                key={action.name}
                name={action.name}
                description={action.description}
                icon={action.icon}
                href={action.href}
                tone={action.tone}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-soft p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h2>
          {refreshing && <span className="text-sm text-gray-500">Đang cập nhật...</span>}
        </div>

        {activities.length === 0 && !loading ? (
          <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-6">
            <p className="text-sm text-gray-600">Chưa có hoạt động nào được ghi nhận.</p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, index) => {
                const IconComponent = activityIconMap[activity.type] || TrendingUp;
                const pill = activityPillMap[activity.type] || activityPillMap.supply_chain;
                const timeLabel = formatRelativeTime(activity.timestamp);

                return (
                  <li key={`${activity.type}-${activity.timestamp}-${index}`}>
                    <div className="relative pb-8">
                      {index !== activities.length - 1 ? (
                        <span
                          className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}

                      <div className="relative flex items-start gap-4">
                        <div className={`h-10 w-10 rounded-xl ${pill.bg} ring-1 ${pill.ring} flex items-center justify-center`}>
                          <span className={`h-8 w-8 rounded-lg ${pill.iconBg} flex items-center justify-center`}>
                            <IconComponent className="h-4.5 w-4.5 text-white" />
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.title || activity.message}
                              </p>
                              <p className="text-sm text-gray-500">
                                bởi {activity.actor || 'Hệ thống'}
                              </p>
                            </div>
                            <div className="text-sm text-gray-500 whitespace-nowrap">
                              {timeLabel}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;


