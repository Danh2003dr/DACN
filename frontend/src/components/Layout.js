import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Menu,
  X,
  Home,
  Users,
  Shield,
  Building2,
  Heart,
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  QrCode,
  BarChart3,
  FileText,
  Truck,
  MessageSquare,
  Star,
  FileSignature,
  Award,
  ShoppingCart,
  ExternalLink,
  Search as SearchIcon,
  Store,
  Gavel,
  ArrowUp,
  UserCheck,
  Box,
  ClipboardList,
  FileSearch,
  Database,
  Upload,
  Layers,
  Clock,
  CheckCircle,
  Activity,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { notificationAPI } from '../utils/api';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({
    blockchain: false,
    admin: false
  });
  
  // Notification states
  const [notifications, setNotifications] = useState([]);
  const [notificationStats, setNotificationStats] = useState({ unread: 0, total: 0 });
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationDropdownRef = useRef(null);
  
  const { user, logout, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleSubmenu = (key) => {
    setOpenSubmenus(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Normalize ID helper
  const normalizeId = (id, fallback = '') => {
    if (!id) return fallback;
    if (typeof id === 'string' && id.trim() !== '' && id !== '[object Object]') return id;
    if (typeof id === 'object' && id !== null) {
      if (Object.keys(id).every(key => /^\d+$/.test(key))) {
        const normalized = Object.keys(id)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map(key => id[key])
          .join('');
        if (normalized.length === 24 && /^[0-9a-fA-F]{24}$/.test(normalized)) {
          return normalized;
        }
      }
      if (id._id) {
        const nestedId = id._id;
        if (typeof nestedId === 'string' && nestedId.trim() !== '' && nestedId !== '[object Object]') {
          return nestedId;
        }
      }
      if (id.id) {
        const idValue = id.id;
        if (typeof idValue === 'string' && idValue.trim() !== '' && idValue !== '[object Object]') {
          return idValue;
        }
      }
      if (id.toString && typeof id.toString === 'function') {
        try {
          const str = id.toString();
          if (str !== '[object Object]' && str.trim() !== '') {
            return str;
          }
        } catch (e) {
          // Ignore
        }
      }
    }
    return String(id || fallback);
  };

  // Load notifications
  const loadNotifications = useCallback(async () => {
    try {
      setLoadingNotifications(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '10',
        unreadOnly: 'false'
      });
      
      const response = await notificationAPI.getNotifications(params.toString());
      if (response.success) {
        const notifs = (response.data.notifications || []).map(notif => {
          if (notif._id && typeof notif._id === 'object') {
            const normalizedId = normalizeId(notif._id);
            if (normalizedId) {
              return { ...notif, _id: normalizedId };
            }
          }
          return notif;
        });
        setNotifications(notifs);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  }, []);

  // Load notification stats
  const loadNotificationStats = useCallback(async () => {
    try {
      const response = await notificationAPI.getStats();
      if (response.success) {
        setNotificationStats({
          unread: response.data.stats?.unread || 0,
          total: response.data.stats?.total || 0
        });
      }
    } catch (error) {
      console.error('Error loading notification stats:', error);
    }
  }, []);

  // Mark notification as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      // Reload stats
      loadNotificationStats();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    if (user) {
      loadNotifications();
      loadNotificationStats();
      // Refresh every 30 seconds
      const interval = setInterval(() => {
        loadNotifications();
        loadNotificationStats();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [user, loadNotifications, loadNotificationStats]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };

    if (showNotificationDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotificationDropdown]);

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'urgent':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'normal':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const navigation = [
    // ========== CORE FUNCTIONS (Chức năng Cốt lõi) ==========
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']
    },
    {
      name: 'Quản lý Thuốc',
      href: '/drugs',
      icon: Package,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital']
    },
    {
      name: 'Quản lý Kho',
      href: '/inventory',
      icon: Box,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital']
    },
    {
      name: 'Quản lý Đơn hàng',
      href: '/orders',
      icon: ShoppingCart,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital']
    },
    {
      name: 'Quét QR',
      href: '/qr-scanner',
      icon: QrCode,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']
    },
    
    // ========== BUSINESS (Kinh doanh) ==========
    {
      name: 'B2B Marketplace',
      href: '/marketplace',
      external: true, // Mở trong tab mới hoặc chuyển sang trang riêng
      icon: Store,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital'],
      dividerBefore: true
    },
    {
      name: 'Quản lý Đấu thầu',
      href: '/bids',
      icon: Gavel,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital']
    },
    {
      name: 'Chuỗi Cung ứng',
      href: '/supply-chain',
      icon: Truck,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital']
    },
    {
      name: 'Hóa đơn & Thanh toán',
      href: '/invoices',
      icon: FileText,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital']
    },
    {
      name: 'Quản lý Nhiệm vụ',
      href: '/tasks',
      icon: ClipboardList,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']
    },
    
    // ========== ANALYTICS & TOOLS (Phân tích & Công cụ) ==========
    {
      name: 'Báo cáo',
      href: '/reports',
      icon: BarChart3,
      roles: ['admin', 'manufacturer', 'hospital'],
      dividerBefore: true,
      groupTitle: 'Phân tích & Công cụ'
    },
    {
      name: 'Blockchain',
      icon: Shield,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital'],
      hasSubmenu: true,
      submenu: [
        {
          name: 'Blockchain Dashboard',
          href: '/blockchain',
          icon: Shield,
          roles: ['admin', 'manufacturer', 'distributor', 'hospital']
        },
        {
          name: 'Blockchain Explorer',
          href: '/blockchain/explorer',
          icon: ExternalLink,
          roles: ['admin', 'manufacturer', 'distributor', 'hospital']
        },
        {
          name: 'Xác minh Blockchain',
          href: '/blockchain/verify',
          icon: CheckCircle,
          roles: ['admin', 'manufacturer', 'distributor', 'hospital']
        }
      ]
    },
    {
      name: 'Nhà cung ứng',
      href: '/suppliers',
      icon: Users,
      roles: ['admin', 'manufacturer', 'distributor']
    },
    {
      name: 'Đánh giá',
      href: '/reviews',
      icon: Star,
      roles: ['admin', 'hospital', 'patient']
    },
    
    // ========== ADMIN (Quản trị) ==========
    {
      name: 'Quản trị hệ thống',
      icon: Settings,
      roles: ['admin'],
      dividerBefore: true,
      groupTitle: 'Quản trị',
      hasSubmenu: true,
      submenu: [
        {
          name: 'Quản lý Users',
          href: '/users',
          icon: Users,
          roles: ['admin']
        },
        {
          name: 'Quản lý Yêu cầu Nâng cấp',
          href: '/role-upgrade/management',
          icon: UserCheck,
          roles: ['admin']
        },
        {
          name: 'Audit Log',
          href: '/audit-logs',
          icon: FileSearch,
          roles: ['admin']
        },
        {
          name: 'Backup & Restore',
          href: '/backups',
          icon: Database,
          roles: ['admin']
        },
        {
          name: 'Import/Export',
          href: '/import-export',
          icon: Upload,
          roles: ['admin']
        },
        {
          name: 'Cài đặt',
          href: '/settings',
          icon: Settings,
          roles: ['admin']
        }
      ]
    },
    
    // ========== ADVANCED TOOLS (Công cụ Nâng cao) ==========
    {
      name: 'Chữ ký số',
      href: '/digital-signatures',
      icon: FileSignature,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital'],
      dividerBefore: true
    },
    {
      name: 'Điểm tín nhiệm',
      href: '/trust-scores',
      icon: Award,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital']
    },
    
    // ========== USER-SPECIFIC (Cá nhân) ==========
    {
      name: 'Yêu cầu Nâng cấp Role',
      href: '/role-upgrade/request',
      icon: ArrowUp,
      roles: ['patient'],
      dividerBefore: true
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    hasAnyRole(item.roles)
  );

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
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <SidebarContent 
              navigation={filteredNavigation} 
              location={location}
              user={user}
              RoleIcon={RoleIcon}
              getRoleDisplayName={getRoleDisplayName}
              profileMenuOpen={profileMenuOpen}
              setProfileMenuOpen={setProfileMenuOpen}
              handleLogout={handleLogout}
              openSubmenus={openSubmenus}
              toggleSubmenu={toggleSubmenu}
            />
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <SidebarContent 
            navigation={filteredNavigation} 
            location={location}
            user={user}
            RoleIcon={RoleIcon}
            getRoleDisplayName={getRoleDisplayName}
            profileMenuOpen={profileMenuOpen}
            setProfileMenuOpen={setProfileMenuOpen}
            handleLogout={handleLogout}
            openSubmenus={openSubmenus}
            toggleSubmenu={toggleSubmenu}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <Search className="h-5 w-5" />
                  </div>
                  <input
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                    placeholder="Tìm kiếm..."
                    type="search"
                  />
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notifications */}
              <div className="relative" ref={notificationDropdownRef}>
              <button
                type="button"
                  onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
                  className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 relative"
              >
                <Bell className="h-6 w-6" />
                  {notificationStats.unread > 0 && (
                    <span className="absolute top-0 right-0 inline-block w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>
                  )}
              </button>

                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                    {/* Dropdown Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
                      <button
                        onClick={() => setShowNotificationDropdown(false)}
                        className="p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>

                    {/* Notifications List */}
                    <div className="overflow-y-auto flex-1">
                      {loadingNotifications ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="spinner w-8 h-8"></div>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                          <Bell className="w-12 h-12 mb-2 text-gray-300" />
                          <p className="text-sm">Không có thông báo</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <div
                              key={notification._id}
                              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                !notification.isRead ? 'bg-blue-50' : ''
                              }`}
                              onClick={() => {
                                if (!notification.isRead) {
                                  handleMarkAsRead(notification._id);
                                }
                              }}
                            >
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  {getPriorityIcon(notification.priority)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className={`text-sm font-medium ${
                                      !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                    }`}>
                                      {notification.title}
                                    </h4>
                                    {!notification.isRead && (
                                      <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1.5"></span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {notification.content || notification.message}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Clock className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500">
                                      {formatDate(notification.createdAt || notification.sentAt)}
                                    </span>
                                    {notification.priority === 'urgent' && (
                                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
                                        Khẩn cấp
                                      </span>
                                    )}
                                    {notification.priority === 'high' && (
                                      <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                                        Ưu tiên cao
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dropdown Footer */}
                    <div className="border-t border-gray-200 p-3">
                      <button
                        onClick={() => {
                          setShowNotificationDropdown(false);
                          navigate('/notifications');
                        }}
                        className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Xem tất cả thông báo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div>
                  <button
                    type="button"
                    className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  >
                    <span className="sr-only">Open user menu</span>
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                      {user?.avatar ? (
                        <img
                          src={`http://localhost:5000${user.avatar}`}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <RoleIcon className="h-5 w-5 text-primary-600" />
                      )}
                    </div>
                    <span className="ml-3 text-gray-700 font-medium hidden md:block">
                      {user?.fullName}
                    </span>
                    <ChevronDown className="ml-1 h-4 w-4 text-gray-400" />
                  </button>
                </div>

                {profileMenuOpen && (
                  <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b">
                      <p className="font-medium">{user?.fullName}</p>
                      <p className="text-gray-500">{getRoleDisplayName(user?.role)}</p>
                    </div>
                    <Link
                      to="/profile"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Hồ sơ của tôi
                    </Link>
                    <Link
                      to="/settings"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setProfileMenuOpen(false)}
                    >
                      Cài đặt
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children || <Outlet />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Sidebar content component
const SidebarContent = ({ 
  navigation, 
  location, 
  user, 
  RoleIcon, 
  getRoleDisplayName,
  profileMenuOpen,
  setProfileMenuOpen,
  handleLogout,
  openSubmenus,
  toggleSubmenu
}) => {
  return (
    <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <div className="h-8 w-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">
              Drug Traceability
            </h1>
            <p className="text-xs text-gray-500">Blockchain System</p>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item, index) => {
            // Filter submenu items by role
            const filteredSubmenu = item.submenu ? item.submenu.filter(subItem => {
              // Check if user has any of the required roles
              return subItem.roles.some(role => {
                if (role === 'admin') return user?.role === 'admin';
                if (role === 'manufacturer') return user?.role === 'manufacturer';
                if (role === 'distributor') return user?.role === 'distributor';
                if (role === 'hospital') return user?.role === 'hospital';
                if (role === 'patient') return user?.role === 'patient';
                return false;
              });
            }) : null;

            // Check if any submenu item is active
            const isSubmenuActive = item.submenu && filteredSubmenu?.some(subItem => 
              location.pathname === subItem.href
            );
            const isActive = item.href ? location.pathname === item.href : isSubmenuActive;
            
            // Get submenu key for state management
            const submenuKey = item.name === 'Blockchain' ? 'blockchain' : 
                              item.name === 'Quản trị hệ thống' ? 'admin' : null;
            const isSubmenuOpen = submenuKey ? openSubmenus[submenuKey] : false;

            return (
              <React.Fragment key={item.name}>
                {item.dividerBefore && index > 0 && (
                  <div className="mt-4 mb-2">
                    <hr className="border-t border-gray-200 my-2" />
                    {item.groupTitle && (
                      <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {item.groupTitle}
                      </p>
                    )}
                  </div>
                )}
                
                {item.hasSubmenu && item.submenu ? (
                  <div>
                    <button
                      onClick={() => submenuKey && toggleSubmenu(submenuKey)}
                      className={`nav-link w-full text-left ${
                        isActive ? 'nav-link-active' : 'nav-link-inactive'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      <span className="flex-1">{item.name}</span>
                      {isSubmenuOpen ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                    {isSubmenuOpen && filteredSubmenu && filteredSubmenu.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {filteredSubmenu.map((subItem) => {
                          const isSubItemActive = location.pathname === subItem.href;
                          return (
                            <Link
                              key={subItem.name}
                              to={subItem.href}
                              className={`nav-link pl-8 ${
                                isSubItemActive ? 'nav-link-active' : 'nav-link-inactive'
                              }`}
                            >
                              <subItem.icon className="mr-3 h-4 w-4" />
                              <span className="text-sm">{subItem.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={item.href}
                    className={`nav-link ${
                      isActive ? 'nav-link-active' : 'nav-link-inactive'
                    }`}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* User info */}
      <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img
                src={`http://localhost:5000${user.avatar}`}
                alt="Avatar"
                className="h-full w-full object-cover"
              />
            ) : (
              <RoleIcon className="h-6 w-6 text-primary-600" />
            )}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {user?.fullName}
            </p>
            <p className="text-xs text-gray-500">
              {getRoleDisplayName(user?.role)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
