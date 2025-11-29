import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authAPI, setAuthToken, clearAuth } from '../utils/api';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Action types
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  UPDATE_USER: 'UPDATE_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
      
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };
      
    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };
      
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
      
    case AUTH_ACTIONS.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
      };
      
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };
      
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
      
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check if user is logged in on app start
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      if (token && user) {
        try {
          setAuthToken(token);
          // Verify token with server
          const response = await authAPI.getMe();
          
          dispatch({
            type: AUTH_ACTIONS.LOGIN_SUCCESS,
            payload: {
              user: response.data.user,
              token: token,
            },
          });
          
          // Update localStorage with fresh user data
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (error) {
          // Token is invalid, clear auth
          clearAuth();
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();

    // Lắng nghe sự kiện storage để đồng bộ giữa các tab
    const handleStorageChange = (e) => {
      if (e.key === 'token' || e.key === 'user') {
        if (e.newValue) {
          // Tab khác đã đăng nhập hoặc cập nhật thông tin
          const newToken = localStorage.getItem('token');
          const newUser = localStorage.getItem('user');
          
          if (newToken && newUser) {
            try {
              setAuthToken(newToken);
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                  user: JSON.parse(newUser),
                  token: newToken,
                },
              });
            } catch (error) {
              console.error('Error syncing auth from storage:', error);
            }
          }
        } else {
          // Tab khác đã đăng xuất
          clearAuth();
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Login function
  const login = async (credentials) => {
    try {
      dispatch({ type: AUTH_ACTIONS.LOGIN_START });
      
      const response = await authAPI.login(credentials);
      
      const { user, token } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set auth token for API calls
      setAuthToken(token);
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user, token },
      });
      
      toast.success('Đăng nhập thành công!');
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage,
      });
      
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth regardless of API call success
      clearAuth();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      
      // Trigger storage event để đồng bộ với các tab khác
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('user');
      window.dispatchEvent(new Event('storage'));
      
      toast.success('Đăng xuất thành công!');
    }
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData);
      
      const updatedUser = response.data.user;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      dispatch({
        type: AUTH_ACTIONS.UPDATE_USER,
        payload: updatedUser,
      });
      
      toast.success('Cập nhật thông tin thành công!');
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Cập nhật thông tin thất bại';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Change password
  const changePassword = async (passwordData) => {
    try {
      const response = await authAPI.changePassword(passwordData);
      toast.success('Đổi mật khẩu thành công!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // First change password
  const firstChangePassword = async (passwordData) => {
    try {
      const response = await authAPI.firstChangePassword(passwordData);
      
      // Update user data to reflect password change
      if (response.data.user) {
        dispatch({
          type: AUTH_ACTIONS.UPDATE_USER,
          payload: { mustChangePassword: false },
        });
        
        localStorage.setItem('user', JSON.stringify({
          ...state.user,
          mustChangePassword: false,
        }));
      }
      
      toast.success('Đổi mật khẩu thành công!');
      return { success: true };
      
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Đổi mật khẩu thất bại';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Update user data
  const updateUser = (userData) => {
    dispatch({
      type: AUTH_ACTIONS.UPDATE_USER,
      payload: userData,
    });
    
    // Update localStorage
    const updatedUser = { ...state.user, ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return state.user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(state.user?.role);
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!state.user) return false;
    
    const rolePermissions = {
      admin: ['read', 'write', 'delete', 'manage_users', 'manage_drugs', 'view_reports'],
      manufacturer: ['read', 'write_drugs', 'manage_own_drugs', 'view_own_reports'],
      distributor: ['read', 'update_shipment', 'manage_inventory', 'view_shipments'],
      hospital: ['read', 'update_inventory', 'manage_patients', 'view_reports'],
      patient: ['read_own', 'scan_qr', 'view_notifications']
    };
    
    return rolePermissions[state.user.role]?.includes(permission) || false;
  };

  // Set token function (for Google OAuth callback)
  const setToken = (token) => {
    localStorage.setItem('token', token);
    setAuthToken(token);
    // Fetch user data after setting token
    authAPI.getMe()
      .then((response) => {
        const user = response.data.user;
        localStorage.setItem('user', JSON.stringify(user));
        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, token },
        });
        toast.success('Đăng nhập bằng Google thành công!');
      })
      .catch((error) => {
        console.error('Error fetching user after setting token:', error);
        clearAuth();
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
        toast.error('Lỗi khi lấy thông tin người dùng');
      });
  };

  const contextValue = {
    // State
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    
    // Actions
    login,
    logout,
    updateProfile,
    changePassword,
    firstChangePassword,
    updateUser,
    clearError,
    setToken,
    
    // Utilities
    hasRole,
    hasAnyRole,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
