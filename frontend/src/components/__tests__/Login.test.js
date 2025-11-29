import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { AuthContext } from '../../contexts/AuthContext';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ state: null })
}));

// Mock API
jest.mock('../../utils/api', () => ({
  authAPI: {
    login: jest.fn()
  }
}));

const mockLogin = jest.fn();
const mockAuthContextValue = {
  login: mockLogin,
  isAuthenticated: false,
  user: null
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={mockAuthContextValue}>
        {component}
      </AuthContext.Provider>
    </BrowserRouter>
  );
};

describe('Login Component - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render login form', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByLabelText(/tên đăng nhập hoặc email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/mật khẩu/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /đăng nhập/i })).toBeInTheDocument();
  });

  it('should show password when toggle button is clicked', () => {
    renderWithRouter(<Login />);
    
    const passwordInput = screen.getByLabelText(/mật khẩu/i);
    const toggleButton = screen.getByRole('button', { name: /hiển thị mật khẩu/i });
    
    expect(passwordInput).toHaveAttribute('type', 'password');
    
    fireEvent.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
  });

  it('should call login function on form submit', async () => {
    mockLogin.mockResolvedValue({ success: true });
    
    renderWithRouter(<Login />);
    
    const identifierInput = screen.getByLabelText(/tên đăng nhập hoặc email/i);
    const passwordInput = screen.getByLabelText(/mật khẩu/i);
    const submitButton = screen.getByRole('button', { name: /đăng nhập/i });
    
    fireEvent.change(identifierInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        identifier: 'testuser',
        password: 'password123'
      });
    });
  });

  it('should display error message on login failure', async () => {
    mockLogin.mockResolvedValue({ 
      success: false, 
      error: 'Mật khẩu không chính xác' 
    });
    
    renderWithRouter(<Login />);
    
    const identifierInput = screen.getByLabelText(/tên đăng nhập hoặc email/i);
    const passwordInput = screen.getByLabelText(/mật khẩu/i);
    const submitButton = screen.getByRole('button', { name: /đăng nhập/i });
    
    fireEvent.change(identifierInput, { target: { value: 'testuser' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/mật khẩu không chính xác/i)).toBeInTheDocument();
    });
  });

  it('should display demo accounts', () => {
    renderWithRouter(<Login />);
    
    expect(screen.getByText(/tài khoản demo/i)).toBeInTheDocument();
    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });
});

