import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Dashboard from '../../pages/Dashboard';
import { AuthContext } from '../../contexts/AuthContext';

// Mock API
jest.mock('../../utils/api', () => ({
  reportAPI: {
    getDashboardSummary: jest.fn().mockResolvedValue({
      success: true,
      data: {
        stats: {
          totalDrugs: 100,
          activeUsers: 50,
          completedTasks: 25
        },
        recentActivities: []
      }
    })
  }
}));

const mockAuthContextValue = {
  user: {
    _id: '123',
    username: 'admin',
    role: 'admin',
    fullName: 'Admin User'
  },
  hasAnyRole: jest.fn().mockReturnValue(true)
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

describe('Dashboard Component - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render dashboard with stats', async () => {
    renderWithRouter(<Dashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/tổng số thuốc/i)).toBeInTheDocument();
      expect(screen.getByText(/100/i)).toBeInTheDocument();
    });
  });

  it('should display welcome message with user name', () => {
    renderWithRouter(<Dashboard />);
    
    expect(screen.getByText(/chào mừng/i)).toBeInTheDocument();
  });
});

