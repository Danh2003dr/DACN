import React, { useState } from 'react';
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
  Activity
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState({
    blockchain: false,
    admin: false
  });
  
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
    {
      name: 'Thông báo',
      href: '/notifications',
      icon: Bell,
      roles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']
    },
    
    // ========== BUSINESS (Kinh doanh) ==========
    {
      name: 'B2B Marketplace',
      href: '/marketplace',
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
              <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Bell className="h-6 w-6" />
              </button>

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
