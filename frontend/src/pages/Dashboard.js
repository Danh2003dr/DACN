import React from 'react';
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
import { useAuth } from '../contexts/AuthContext';

const Dashboard = () => {
  const { user, hasRole } = useAuth();

  // Mock data - trong thực tế sẽ lấy từ API
  const stats = {
    totalDrugs: 1247,
    activeUsers: 89,
    completedTasks: 156,
    pendingTasks: 23,
    alerts: 5,
    todayScans: 234
  };

  const recentActivities = [
    {
      id: 1,
      type: 'drug_created',
      message: 'Lô thuốc PARACETAMOL-001 đã được tạo',
      user: 'Nguyễn Văn A',
      time: '5 phút trước',
      icon: Package,
      color: 'text-green-600'
    },
    {
      id: 2,
      type: 'scan_qr',
      message: 'Bệnh nhân đã quét QR code thuốc',
      user: 'Lê Thị B',
      time: '12 phút trước',
      icon: QrCode,
      color: 'text-blue-600'
    },
    {
      id: 3,
      type: 'user_registered',
      message: 'Tài khoản nhà phân phối mới đã đăng ký',
      user: 'Trần Văn C',
      time: '1 giờ trước',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      id: 4,
      type: 'task_completed',
      message: 'Nhiệm vụ vận chuyển đã hoàn thành',
      user: 'Phạm Thị D',
      time: '2 giờ trước',
      icon: CheckCircle,
      color: 'text-green-600'
    }
  ];

  const quickActions = [
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
  ];

  const filteredQuickActions = quickActions.filter(action => 
    hasRole(action.roles.includes(user?.role))
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      admin: 'Quản trị viên',
      manufacturer: 'Nhà sản xuất',
      distributor: 'Nhà phân phối',
      hospital: 'Bệnh viện',
      patient: 'Bệnh nhân'
    };
    return roleNames[role] || role;
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

  const RoleIcon = getRoleIcon(user?.role);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {getGreeting()}, {user?.fullName}!
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
                {user?.organizationInfo?.name || user?.patientId}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Tổng lô thuốc
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalDrugs.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Người dùng hoạt động
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.activeUsers}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Nhiệm vụ hoàn thành
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.completedTasks}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Nhiệm vụ chờ xử lý
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.pendingTasks}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Cảnh báo
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.alerts}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-soft p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <QrCode className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Quét QR hôm nay
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.todayScans}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-soft p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Thao tác nhanh
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredQuickActions.map((action, index) => (
            <a
              key={index}
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
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Hoạt động gần đây
        </h2>
        <div className="flow-root">
          <ul className="-mb-8">
            {recentActivities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== recentActivities.length - 1 ? (
                    <span
                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span className={`h-8 w-8 rounded-full ${activity.color} flex items-center justify-center ring-8 ring-white`}>
                        <activity.icon className="h-5 w-5 text-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                      <div>
                        <p className="text-sm text-gray-900">
                          {activity.message}
                        </p>
                        <p className="text-sm text-gray-500">
                          bởi {activity.user}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        {activity.time}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
