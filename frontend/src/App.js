import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { setAuthToken } from './utils/api';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Drugs from './pages/Drugs';
import Verify from './pages/Verify';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import SupplyChain from './pages/SupplyChain';
import Tasks from './pages/Tasks';
import Notifications from './pages/Notifications';
import Reviews from './pages/Reviews';
import QRScanner from './pages/QRScanner';
import Reports from './pages/Reports';
import MapDemo from './pages/MapDemo';
import BlockchainVerify from './pages/BlockchainVerify';
import BlockchainDashboard from './pages/BlockchainDashboard';

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

  // Check if user has required role
  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Không có quyền truy cập</h1>
          <p className="text-gray-600 mb-4">Bạn không có quyền truy cập trang này.</p>
          <button
            onClick={() => window.history.back()}
            className="btn btn-primary"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// Public Route Component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

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

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Google OAuth Callback Component
const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();
  
  useEffect(() => {
    const token = searchParams.get('token');
    const success = searchParams.get('success');
    const error = searchParams.get('error');
    
    if (success === 'true' && token) {
      // Lưu token và redirect
      setToken(token);
      
      // Lấy thông tin user
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 500);
    } else if (error) {
      // Có lỗi, redirect về login
      navigate('/login?error=' + error, { replace: true });
    } else {
      // Không có token, redirect về login
      navigate('/login?error=google_auth_failed', { replace: true });
    }
  }, [searchParams, navigate, setToken]);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="spinner w-12 h-12 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang xử lý đăng nhập Google...</p>
      </div>
    </div>
  );
};

// App Routes
const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      
      {/* Google OAuth Callback */}
      <Route
        path="/auth/callback"
        element={<GoogleCallback />}
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Admin only routes */}
        <Route
          path="users"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Users />
            </ProtectedRoute>
          }
        />
        
        {/* Drugs management - accessible by all authenticated users */}
        <Route
          path="drugs"
          element={
            <ProtectedRoute>
              <Drugs />
            </ProtectedRoute>
          }
        />

        {/* Supply Chain management */}
        <Route
          path="supply-chain"
          element={
            <ProtectedRoute>
              <SupplyChain />
            </ProtectedRoute>
          }
        />

        {/* Task management */}
        <Route
          path="tasks"
          element={
            <ProtectedRoute>
              <Tasks />
            </ProtectedRoute>
          }
        />

        {/* Notification management */}
        <Route
          path="notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        {/* Review management */}
        <Route
          path="reviews"
          element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          }
        />

        {/* QR Scanner */}
        <Route
          path="qr-scanner"
          element={
            <ProtectedRoute>
              <QRScanner />
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="reports"
          element={
            <ProtectedRoute>
              <Reports />
            </ProtectedRoute>
          }
        />

        {/* Blockchain Dashboard */}
        <Route
          path="blockchain"
          element={
            <ProtectedRoute>
              <BlockchainDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Verify route - không cần authentication */}
        <Route
          path="verify/:blockchainId"
          element={<Verify />}
        />
        
        {/* Blockchain Verify route - không cần authentication */}
        <Route
          path="blockchain-verify/:blockchainId"
          element={<BlockchainVerify />}
        />
        
        {/* Settings - Admin only */}
        <Route
          path="settings"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Settings />
            </ProtectedRoute>
          }
        />
        
        {/* Profile - All authenticated users */}
        <Route
          path="profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Map Demo - All authenticated users */}
        <Route
          path="map-demo"
          element={
            <ProtectedRoute>
              <MapDemo />
            </ProtectedRoute>
          }
        />
        
        {/* Placeholder routes for future development */}
        <Route path="supply-chain" element={<div className="p-6"><h1 className="text-2xl font-bold">Chuỗi Cung ứng</h1><p>Đang phát triển...</p></div>} />
        <Route path="qr-scanner" element={<div className="p-6"><h1 className="text-2xl font-bold">Quét QR</h1><p>Đang phát triển...</p></div>} />
        <Route path="reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Báo cáo</h1><p>Đang phát triển...</p></div>} />
        <Route path="notifications" element={<div className="p-6"><h1 className="text-2xl font-bold">Thông báo</h1><p>Đang phát triển...</p></div>} />
        <Route path="tasks" element={<div className="p-6"><h1 className="text-2xl font-bold">Nhiệm vụ</h1><p>Đang phát triển...</p></div>} />
        <Route path="reviews" element={<div className="p-6"><h1 className="text-2xl font-bold">Đánh giá</h1><p>Đang phát triển...</p></div>} />
      </Route>

      {/* 404 Route */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33m6.08 2.33c2.34 0 4.47-.881 6.08-2.33M9 12h6m-6-4h6" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">404 - Trang không tồn tại</h1>
              <p className="text-gray-600 mb-4">Trang bạn đang tìm kiếm không tồn tại.</p>
              <a
                href="/dashboard"
                className="btn btn-primary"
              >
                Về trang chủ
              </a>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

// Main App Component
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <AppRoutes />
            
            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#fff',
                  color: '#374151',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                },
                success: {
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
