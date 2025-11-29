import React, { useEffect, useMemo, useState } from 'react';
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
  Shield
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

const activityColorMap = {
  drug_created: 'text-green-600',
  qr_scan: 'text-blue-600',
  task_completed: 'text-emerald-600',
  task_updated: 'text-yellow-600',
  alert: 'text-red-600',
  user_registered: 'text-purple-600',
  supply_chain: 'text-indigo-600'
};

const formatRelativeTime = (value) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = date.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  const rtf = new Intl.RelativeTimeFormat('vi', { numeric: 'auto' });

  if (Math.abs(diffMinutes) < 1) {
    return 'Vừa xong';
  }

  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, 'minute');
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, 'day');
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return rtf.format(diffMonths, 'month');
  }

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

const Dashboard = () => {
  const { user, hasAnyRole } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await reportAPI.getDashboardSummary();

        if (response && response.success) {
          setStats(response.data?.stats || null);
          setActivities(response.data?.recentActivities || []);
        } else {
          // Empty data hoặc response không thành công - không phải lỗi nghiêm trọng
          setStats(null);
          setActivities([]);
          // Chỉ set error message để hiển thị trên UI, không hiển thị toast
          setError('Chưa có dữ liệu để hiển thị.');
        }
      } catch (err) {
        // Chỉ hiển thị toast cho lỗi network hoặc server (500+)
        const status = err.response?.status;
        if (status && status >= 500) {
          const message = err.response?.data?.message || 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối.';
          setError(message);
          toast.error(message);
        } else if (status === 404) {
          // 404 = không có data, không phải lỗi
          setStats(null);
          setActivities([]);
          setError('Chưa có dữ liệu để hiển thị.');
        } else {
          // Các lỗi khác (401, 403, etc) đã được xử lý bởi interceptor
          setStats(null);
          setActivities([]);
          setError('Không thể tải dữ liệu dashboard.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
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
      color: 'bg-blue-500 hover:bg-blue-600',
      roles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']
    },
    {
      name: 'Quản lý Thuốc',
      description: 'Thêm và quản lý lô thuốc mới',
      icon: Package,
      href: '/drugs',
      color: 'bg-green-500 hover:bg-green-600',
      roles: ['admin', 'manufacturer', 'distributor', 'hospital']
    },
    {
      name: 'Quản lý Users',
      description: 'Quản lý tài khoản người dùng',
      icon: Users,
      href: '/users',
      color: 'bg-purple-500 hover:bg-purple-600',
      roles: ['admin']
    },
    {
      name: 'Xem Báo cáo',
      description: 'Thống kê và báo cáo hệ thống',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-orange-500 hover:bg-orange-600',
      roles: ['admin', 'manufacturer', 'hospital']
    }
  ]), []);

  const filteredQuickActions = quickActions.filter((action) =>
    !action.roles?.length || hasAnyRole(action.roles)
  );

  const statsCards = useMemo(() => ([
    {
      key: 'totalDrugs',
      label: 'Tổng lô thuốc',
      value: statsDisplay.totalDrugs,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      key: 'activeUsers',
      label: 'Người dùng hoạt động',
      value: statsDisplay.activeUsers,
      icon: Users,
      color: 'text-green-600'
    },
    {
      key: 'completedTasks',
      label: 'Nhiệm vụ hoàn thành',
      value: statsDisplay.completedTasks,
      icon: CheckCircle,
      color: 'text-emerald-600'
    },
    {
      key: 'pendingTasks',
      label: 'Nhiệm vụ chờ xử lý',
      value: statsDisplay.pendingTasks,
      icon: Clock,
      color: 'text-yellow-600'
    },
    {
      key: 'alerts',
      label: 'Cảnh báo',
      value: statsDisplay.alerts,
      icon: AlertTriangle,
      color: 'text-red-600'
    },
    {
      key: 'todayScans',
      label: 'Quét QR hôm nay',
      value: statsDisplay.todayScans,
      icon: QrCode,
      color: 'text-purple-600'
    }
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
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {user?.fullName || 'bạn'}!
            </h1>
            <p className="text-gray-600 mt-1">
              Chào mừng bạn đến với hệ thống quản lý nguồn gốc thuốc
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <RoleIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {getRoleDisplayName(user?.role)}
              </p>
              <p className="text-sm text-gray-500">
                {user?.organizationInfo?.name || user?.patientId || 'Tài khoản hệ thống'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <p className="font-semibold">{error}</p>
          <p className="text-sm mt-1">Vui lòng thử tải lại trang hoặc kiểm tra kết nối server.</p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statsCards.map((card) => {
          const Icon = card.icon;
          const valueLabel = typeof card.value === 'number'
            ? card.value.toLocaleString('vi-VN')
            : card.value;

          return (
            <div key={card.key} className="bg-white rounded-lg shadow-soft p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Icon className={`h-8 w-8 ${card.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500">
                      {card.label}
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {loading && !stats ? 'Đang tải...' : valueLabel}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredQuickActions.length === 0 && (
            <p className="text-sm text-gray-500 col-span-full">
              Chưa có thao tác phù hợp với quyền của bạn.
            </p>
          )}
          {filteredQuickActions.map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="group relative rounded-lg p-4 border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center">
                <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${action.color} flex items-center justify-center`}>
                  <action.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-900 group-hover:text-primary-600">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Hoạt động gần đây
          </h2>
          {loading && (
            <span className="text-sm text-gray-500">Đang cập nhật...</span>
          )}
        </div>

        {activities.length === 0 && !loading ? (
          <p className="text-sm text-gray-500">Chưa có hoạt động nào được ghi nhận.</p>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, index) => {
                const IconComponent = activityIconMap[activity.type] || TrendingUp;
                const colorClass = activityColorMap[activity.type] || 'text-indigo-600';
                const timeLabel = formatRelativeTime(activity.timestamp);

                return (
                  <li key={`${activity.type}-${activity.timestamp}-${index}`}>
                    <div className="relative pb-8">
                      {index !== activities.length - 1 ? (
                        <span
                          className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className={`h-8 w-8 rounded-full ${colorClass} flex items-center justify-center ring-8 ring-white`}>
                            <IconComponent className="h-5 w-5 text-white" />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                          <div>
                            <p className="text-sm text-gray-900">
                              {activity.title || activity.message}
                            </p>
                            <p className="text-sm text-gray-500">
                              bởi {activity.actor || 'Hệ thống'}
                            </p>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {timeLabel}
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
