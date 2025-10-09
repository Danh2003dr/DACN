# FRONTEND - DRUG TRACEABILITY SYSTEM

## Tổng quan
Frontend React.js cho hệ thống quản lý nguồn gốc xuất xứ thuốc bằng blockchain với giao diện hiện đại và responsive.

## ✅ Đã hoàn thành

### 1. **Cấu trúc dự án hoàn chỉnh**
- React 18 với functional components và hooks
- React Router v6 cho navigation
- React Query cho state management và API calls
- Tailwind CSS cho styling
- React Hook Form cho form handling

### 2. **Authentication & Authorization**
- Context API cho quản lý auth state
- JWT token handling
- Protected routes với role-based access
- Auto redirect sau login/logout

### 3. **Components chính**
- **Login**: Giao diện đăng nhập với tài khoản demo
- **Layout**: Sidebar navigation với responsive design
- **Dashboard**: Trang chủ với stats và quick actions
- **Users**: Quản lý users (Admin only)

### 4. **API Integration**
- Axios với interceptors
- Error handling toàn diện
- Toast notifications
- Loading states

### 5. **UI/UX Features**
- Responsive design (mobile-first)
- Dark/Light theme support
- Loading spinners và skeletons
- Form validation với error messages
- Modal dialogs
- Pagination
- Search và filtering

## 🚀 Cách chạy Frontend

### 1. Cài đặt dependencies
```bash
cd frontend
npm install
```

### 2. Khởi động development server
```bash
npm start
```

Frontend sẽ chạy tại: `http://localhost:3000`

### 3. Build production
```bash
npm run build
```

## 📱 Giao diện chính

### 1. **Trang đăng nhập** (`/login`)
- Form đăng nhập với validation
- Hiển thị tài khoản demo cho từng vai trò
- Responsive design
- Auto redirect nếu đã đăng nhập

### 2. **Dashboard** (`/dashboard`)
- Welcome message theo vai trò
- Stats cards (tổng thuốc, users, tasks, etc.)
- Quick actions dựa trên quyền
- Recent activities feed
- Responsive grid layout

### 3. **Quản lý Users** (`/users`) - Admin only
- Danh sách users với pagination
- Search và filter theo vai trò
- Stats overview
- Actions: Edit, Lock/Unlock, Delete
- Modal confirmations

### 4. **Layout & Navigation**
- Sidebar với navigation items theo role
- Top bar với search và user menu
- Mobile-responsive sidebar
- Breadcrumb navigation

## 🎨 Design System

### Colors
- **Primary**: Blue shades (#3b82f6)
- **Secondary**: Green shades (#22c55e)  
- **Danger**: Red shades (#ef4444)
- **Warning**: Yellow shades (#f59e0b)
- **Gray**: Neutral shades

### Components
- **Buttons**: Primary, Secondary, Danger, Warning, Outline
- **Forms**: Input, Select, Textarea với validation
- **Cards**: Header, Body, Footer
- **Tables**: Responsive với sorting
- **Modals**: Overlay với backdrop
- **Badges**: Status indicators
- **Loading**: Spinners và skeletons

## 🔐 Authentication Flow

### 1. **Login Process**
```javascript
// User enters credentials
const result = await login(credentials);

// Success: Save token, redirect to dashboard
if (result.success) {
  localStorage.setItem('token', token);
  navigate('/dashboard');
}
```

### 2. **Protected Routes**
```javascript
// Check authentication
if (!isAuthenticated) {
  return <Navigate to="/login" />;
}

// Check role permissions
if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
  return <AccessDenied />;
}
```

### 3. **API Calls**
```javascript
// Automatic token injection
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 📊 State Management

### 1. **React Query**
- Caching API responses
- Background refetching
- Optimistic updates
- Error handling

### 2. **Auth Context**
- User state management
- Login/logout actions
- Role-based permissions
- Persistent auth state

### 3. **Local State**
- Form state với React Hook Form
- UI state (modals, dropdowns)
- Search và filter states

## 🎯 Tài khoản Demo

| Vai trò | Username | Password | Quyền hạn |
|---------|----------|----------|-----------|
| Admin | admin | default123 | Quản lý toàn hệ thống |
| Nhà sản xuất | manufacturer1 | default123 | Quản lý lô thuốc |
| Nhà phân phối | distributor1 | default123 | Vận chuyển thuốc |
| Bệnh viện | hospital1 | default123 | Quản lý kho thuốc |
| Bệnh nhân | patient1 | default123 | Tra cứu thuốc |

## 🔧 Cấu hình

### Environment Variables
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

### Tailwind Config
- Custom color palette
- Extended animations
- Component classes
- Responsive breakpoints

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px  
- **Desktop**: > 1024px

### Mobile Features
- Collapsible sidebar
- Touch-friendly buttons
- Swipe gestures
- Optimized forms

## 🚀 Tính năng nổi bật

### 1. **Real-time Updates**
- Auto refresh data
- Optimistic UI updates
- Background sync

### 2. **Error Handling**
- Global error boundary
- Toast notifications
- Form validation errors
- Network error handling

### 3. **Performance**
- Code splitting
- Lazy loading
- Image optimization
- Bundle optimization

### 4. **Accessibility**
- ARIA labels
- Keyboard navigation
- Screen reader support
- Focus management

## 🔄 Tích hợp với Backend

### API Endpoints
```javascript
// Auth
POST /api/auth/login
POST /api/auth/logout
GET /api/auth/me

// Users (Admin only)
GET /api/users
POST /api/users
PUT /api/users/:id
DELETE /api/users/:id
```

### Error Handling
```javascript
// Global error interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

## 📈 Performance

### Optimization
- React.memo cho components
- useMemo cho expensive calculations
- useCallback cho event handlers
- Virtual scrolling cho large lists

### Bundle Size
- Code splitting by route
- Tree shaking
- Dynamic imports
- Compression

## 🧪 Testing

### Test Setup
```bash
npm test
```

### Test Coverage
- Component unit tests
- Integration tests
- E2E tests với Cypress

## 🚀 Deployment

### Build
```bash
npm run build
```

### Deploy Options
- **Vercel**: Automatic deployment
- **Netlify**: Static hosting
- **AWS S3**: Cloud storage
- **Docker**: Container deployment

## 📝 Scripts

```json
{
  "start": "react-scripts start",
  "build": "react-scripts build", 
  "test": "react-scripts test",
  "eject": "react-scripts eject",
  "lint": "eslint src --ext .js,.jsx",
  "lint:fix": "eslint src --ext .js,.jsx --fix"
}
```

## 🔮 Roadmap

### Phase 1 ✅
- [x] Authentication system
- [x] User management
- [x] Dashboard
- [x] Responsive design

### Phase 2 🔄
- [ ] Drug management
- [ ] QR code scanner
- [ ] Supply chain tracking
- [ ] Reports & analytics

### Phase 3 📋
- [ ] Real-time notifications
- [ ] Advanced search
- [ ] Data export
- [ ] Mobile app

---

**Frontend đã sẵn sàng để tích hợp với backend và triển khai!** 🎉
