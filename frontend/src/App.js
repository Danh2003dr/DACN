import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setAuthToken } from './utils/api';
import logger from './utils/logger';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Users from './pages/Users.jsx';
import Drugs from './pages/Drugs.jsx';
import Verify from './pages/Verify.jsx';
import Settings from './pages/Settings.jsx';
import Profile from './pages/Profile.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SupplyChain from './pages/SupplyChain.jsx';
import Tasks from './pages/Tasks.jsx';
import Notifications from './pages/Notifications.jsx';
import Reviews from './pages/Reviews.jsx';
import QRScanner from './pages/QRScanner.jsx';
import Reports from './pages/Reports.jsx';
import BlockchainVerify from './pages/BlockchainVerify.jsx';
import BlockchainDashboard from './pages/BlockchainDashboard.jsx';
import BlockchainExplorer from './pages/BlockchainExplorer.jsx';
import DigitalSignatures from './pages/DigitalSignatures.jsx';
import TrustScores from './pages/TrustScores.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Inventory from './pages/Inventory.jsx';
import Orders from './pages/Orders.jsx';
import Backups from './pages/Backups.jsx';
import Invoices from './pages/Invoices.jsx';
import ImportExport from './pages/ImportExport.jsx';
import Suppliers from './pages/Suppliers.jsx';
import DrugTimelineDemo from './pages/DrugTimelineDemo.jsx';
import Marketplace from './pages/Marketplace.jsx';
import Bids from './pages/Bids.jsx';
import Checkout from './pages/Checkout.jsx';
import VnpayCallback from './pages/VnpayCallback.jsx';
import RoleUpgradeRequest from './pages/RoleUpgradeRequest.jsx';
import RoleUpgradeManagement from './pages/RoleUpgradeManagement.jsx';
import Metrics from './pages/Metrics.jsx';
import AIChatWidget from './components/AIChatWidget';
import CartDrawer from './components/CartDrawer';
import { CartProvider } from './contexts/CartContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, isLoading, user, hasAnyRole } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return children;
};

// Google OAuth Callback Handler
const GoogleCallback = () => {
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + encodeURIComponent(error));
      return;
    }

    if (token) {
      setToken(token);
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  }, [searchParams, setToken, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="spinner w-12 h-12 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang xử lý đăng nhập...</p>
      </div>
    </div>
  );
};

// Main App Routes
const AppRoutes = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = window.location;
  
  // Log page views
  React.useEffect(() => {
    logger.pageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
    }
    
    // Health check khi app khởi động
    const checkBackendHealth = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${apiUrl}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(3000) // Timeout 3 giây
        });
        
        if (response.ok) {
          console.log('✅ Backend server đang chạy');
        } else {
          console.warn('⚠️ Backend server trả về lỗi:', response.status);
        }
      } catch (error) {
        // Chỉ log, không hiển thị toast vì có thể backend chưa sẵn sàng
        console.warn('⚠️ Không thể kết nối đến backend server:', error.message);
        console.info('💡 Đảm bảo backend đang chạy tại http://localhost:5000');
      }
    };
    
    // Chỉ check health khi không phải production hoặc khi cần thiết
    if (process.env.NODE_ENV !== 'production') {
      checkBackendHealth();
    }
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="spinner w-12 h-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" replace />} />
      <Route path="/google/callback" element={<GoogleCallback />} />
      <Route path="/payments/vnpay/callback" element={<VnpayCallback />} />
      <Route path="/verify/:blockchainId" element={<Verify />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital', 'patient']}>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <Layout>
              <Users />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/drugs"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Layout>
              <Drugs />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/inventory"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Layout>
              <Inventory />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/orders"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Layout>
              <Orders />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/marketplace"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Marketplace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/bids"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Layout>
              <Bids />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/checkout"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Checkout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/supply-chain"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Layout>
              <SupplyChain />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tasks"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital', 'patient']}>
            <Layout>
              <Tasks />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital', 'patient']}>
            <Layout>
              <Notifications />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reviews"
        element={
          <ProtectedRoute requiredRoles={['admin', 'hospital', 'patient']}>
            <Layout>
              <Reviews />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'hospital']}>
            <Layout>
              <Reports />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/qr-scanner"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital', 'patient']}>
            <Layout>
              <QRScanner />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/blockchain"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Layout>
              <BlockchainDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/blockchain/verify/:blockchainId?"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Layout>
              <BlockchainVerify />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/blockchain/explorer"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Layout>
              <BlockchainExplorer />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/digital-signatures"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Layout>
              <DigitalSignatures />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/trust-scores"
        element={
          <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
            <Layout>
              <TrustScores />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <Layout>
              <AuditLogs />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/metrics"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <Layout>
              <Metrics />
            </Layout>
          </ProtectedRoute>
        }
      />

        <Route
          path="/backups"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Layout>
                <Backups />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital']}>
              <Layout>
                <Invoices />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/import-export"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Layout>
                <ImportExport />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/suppliers"
          element={
            <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor']}>
              <Layout>
                <Suppliers />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/drug-timeline"
          element={
            <ProtectedRoute requiredRoles={['admin', 'manufacturer', 'distributor', 'hospital', 'patient']}>
              <Layout>
                <DrugTimelineDemo />
              </Layout>
            </ProtectedRoute>
          }
        />

      <Route
        path="/settings"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Profile Routes - Có 2 routes: Profile cũ và ProfilePage mới */}
      <Route
        path="/profile-old"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Profile Page mới - Module Quản lý Hồ sơ Cá nhân */}
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfilePage />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Role Upgrade Request - Patient only */}
      <Route
        path="/role-upgrade/request"
        element={
          <ProtectedRoute requiredRoles={['patient']}>
            <Layout>
              <RoleUpgradeRequest />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Role Upgrade Management - Admin only */}
      <Route
        path="/role-upgrade/management"
        element={
          <ProtectedRoute requiredRoles={['admin']}>
            <Layout>
              <RoleUpgradeManagement />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

// Main App Component
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Router>
            <AppRoutes />
            <CartDrawer />
            <AIChatWidget />
            <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 4000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          </Router>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
