# 📋 PHÂN TÍCH GIAO DIỆN HIỆN TẠI - HỆ THỐNG DRUG TRACEABILITY

**Ngày phân tích:** 2025-01-XX  
**Mục đích:** Ghi nhận và mô tả cấu trúc giao diện hiện tại, không đề xuất thay đổi

---

## 🏗️ CẤU TRÚC LAYOUT TỔNG THỂ

### 1. Kiến trúc Layout

Hệ thống sử dụng **Layout Component** (`frontend/src/components/Layout.js`) làm wrapper cho tất cả các trang được bảo vệ (protected routes).

**Cấu trúc tổng thể:**
```
┌─────────────────────────────────────────────────────────┐
│                     LAYOUT CONTAINER                    │
│  ┌──────────┐  ┌────────────────────────────────────┐  │
│  │ SIDEBAR  │  │  HEADER (Top Navigation Bar)       │  │
│  │  (Fixed) │  │  ┌──────────────────────────────┐  │  │
│  │          │  │  │  Search Bar  │ Notif │ User  │  │  │
│  │          │  │  └──────────────────────────────┘  │  │
│  │          │  ├────────────────────────────────────┤  │
│  │          │  │                                     │  │
│  │          │  │        MAIN CONTENT AREA            │  │
│  │          │  │      (Children/Outlet renders)      │  │
│  │          │  │                                     │  │
│  │          │  │                                     │  │
│  └──────────┘  └────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

**Breakpoints Responsive:**
- **Desktop (≥768px):** Sidebar cố định, hiển thị đầy đủ (width: 256px / w-64)
- **Mobile (<768px):** Sidebar ẩn, chỉ hiển thị khi click menu button, overlay với backdrop

---

## 📐 CHI TIẾT CÁC KHU VỰC GIAO DIỆN

### A. SIDEBAR (Thanh điều hướng bên)

#### 1. Cấu trúc Sidebar

**Vị trí:** Bên trái màn hình  
**Width:** 256px (w-64)  
**Background:** Trắng (bg-white)  
**Border:** Border bên phải (border-r border-gray-200)  
**Height:** Full screen (h-0 flex-1)

**Component:** `SidebarContent` (rendered cho cả desktop và mobile)

#### 2. Phần Logo (Top of Sidebar)

- **Logo Icon:** Shield icon trong ô vuông bo tròn (bg-primary-600)
- **Text:** 
  - Tiêu đề: "Drug Traceability" (text-lg font-semibold)
  - Subtitle: "Blockchain System" (text-xs text-gray-500)
- **Vị trí:** pt-5 pb-4, px-4

#### 3. Navigation Menu

**Cấu trúc:**
- Container: `nav.mt-5.flex-1.px-2.space-y-1`
- Scroll: `overflow-y-auto` (nếu menu dài)
- Mỗi item: Link với icon và text

**Menu Items:** 25 items được chia thành 6 nhóm logic:

**Nhóm 1: CORE FUNCTIONS (Chức năng Cốt lõi)** - 6 items
1. Dashboard (Home icon) - Tất cả roles
2. Quản lý Thuốc (Package icon) - 4 roles (admin, manufacturer, distributor, hospital)
3. Quản lý Kho (Box icon) - 4 roles
4. Quản lý Đơn hàng (ShoppingCart icon) - 4 roles
5. Quét QR (QrCode icon) - Tất cả roles
6. Thông báo (Bell icon) - Tất cả roles

**Nhóm 2: BUSINESS (Kinh doanh)** - 5 items (có dividerBefore)
- B2B Marketplace (Store icon)
- Quản lý Đấu thầu (Gavel icon)
- Chuỗi Cung ứng (Truck icon)
- Hóa đơn & Thanh toán (FileText icon)
- Quản lý Nhiệm vụ (ClipboardList icon)

**Nhóm 3: ANALYTICS & TOOLS (Phân tích & Công cụ)** - 5 items (có dividerBefore)
- Báo cáo (BarChart3 icon)
- Blockchain (Shield icon)
- Blockchain Explorer (ExternalLink icon)
- Nhà cung ứng (Users icon)
- Đánh giá (Star icon)

**Nhóm 4: ADMIN (Quản trị)** - 6 items (có dividerBefore, chỉ admin)
- Quản lý Users (Users icon)
- Quản lý Yêu cầu Nâng cấp (UserCheck icon)
- Audit Log (FileSearch icon)
- Backup & Restore (Database icon)
- Import/Export (Upload icon)
- Cài đặt (Settings icon)

**Nhóm 5: ADVANCED TOOLS (Công cụ Nâng cao)** - 2 items (có dividerBefore)
- Chữ ký số (FileSignature icon)
- Điểm tín nhiệm (Award icon)

**Nhóm 6: USER-SPECIFIC (Cá nhân)** - 1 item (có dividerBefore, chỉ patient)
- Yêu cầu Nâng cấp Role (ArrowUp icon)

**Visual Separators:**
- Divider: `<hr className="border-t border-gray-200 my-2" />`
- Group Title: Text nhỏ, uppercase, gray (nếu có `groupTitle` property)

**Navigation Link Styles:**
- **Active:** `.nav-link-active` → bg-primary-100, text-primary-700
- **Inactive:** `.nav-link-inactive` → text-gray-600, hover:bg-gray-100, hover:text-gray-900
- **Base:** `.nav-link` → flex items-center, px-3 py-2, text-sm font-medium, rounded-lg, transition-colors

**Icon:** Lucide-react icons, size h-5 w-5, margin-right mr-3

#### 4. User Info Footer (Bottom of Sidebar)

- **Vị trí:** flex-shrink-0, border-top
- **Avatar:** 40x40px rounded-full, bg-primary-100 hoặc user avatar image
- **Text:**
  - Name: text-sm font-medium text-gray-700
  - Role: text-xs text-gray-500
- **Vị trí:** p-4

---

### B. HEADER (Top Navigation Bar)

#### 1. Cấu trúc Header

**Vị trí:** Phía trên cùng, dưới Sidebar (desktop) hoặc full width (mobile)  
**Height:** 64px (h-16)  
**Background:** Trắng (bg-white)  
**Shadow:** shadow (box-shadow mặc định)  
**Z-index:** z-10 (relative)

#### 2. Mobile Menu Button

- **Vị trí:** Bên trái, chỉ hiển thị trên mobile (md:hidden)
- **Icon:** Menu (lucide-react)
- **Action:** Mở sidebar overlay
- **Style:** px-4, border-right, text-gray-500

#### 3. Search Bar

- **Vị trí:** Giữa header, flex-1
- **Input:**
  - Placeholder: "Tìm kiếm..."
  - Icon: Search icon bên trái (absolute)
  - Style: border-transparent, text-gray-900, placeholder-gray-500
  - Full width với padding-left cho icon (pl-8)
- **Hiện tại:** Chỉ là input field, chưa có chức năng search

#### 4. Right Actions

**Notifications Button:**
- Icon: Bell
- Style: p-1 rounded-full, text-gray-400, hover:text-gray-500
- **Hiện tại:** Chỉ là button, chưa có dropdown/notification list

**Profile Dropdown:**
- **Trigger Button:**
  - Avatar: 32x32px rounded-full (bg-primary-100 hoặc user image)
  - Name: text-gray-700 font-medium (hidden trên mobile, hiện trên desktop)
  - ChevronDown icon
- **Dropdown Menu:**
  - Vị trí: absolute right-0 mt-2
  - Width: 192px (w-48)
  - Background: bg-white, rounded-md, shadow-lg
  - **Menu Items:**
    1. User Info Section (border-bottom):
       - Full Name (font-medium)
       - Role Display Name (text-gray-500)
    2. "Hồ sơ của tôi" → `/profile`
    3. "Cài đặt" → `/settings` (chỉ hiển thị nếu user là admin)
    4. "Đăng xuất" → handleLogout function

---

### C. MAIN CONTENT AREA (Vùng nội dung chính)

#### 1. Cấu trúc Content

**Container:**
- `flex-1 relative overflow-y-auto` (scrollable)
- Background: bg-gray-100

**Inner Container:**
- Padding: py-6 (vertical), px-4 sm:px-6 md:px-8 (horizontal responsive)
- Max-width: max-w-7xl (1280px)
- Margin: mx-auto (center)

**Rendering:**
- Sử dụng `{children || <Outlet />}` để render page content
- Pages được wrap trong Layout component

#### 2. Responsive Behavior

- **Desktop:** Content area chiếm phần còn lại sau khi trừ Sidebar (256px)
- **Mobile:** Content area full width (sidebar ẩn)

---

## 🎨 PHONG CÁCH UI & MÀU SẮC

### 1. Color Palette

**Primary Colors (Blue):**
- primary-50 → #eff6ff (lightest)
- primary-100 → #dbeafe
- primary-600 → #2563eb (main)
- primary-700 → #1d4ed8
- primary-900 → #1e3a8a (darkest)

**Secondary Colors (Green):**
- secondary-600 → #16a34a (success actions)

**Danger Colors (Red):**
- danger-600 → #dc2626 (error, delete actions)

**Warning Colors (Yellow/Amber):**
- warning-600 → #d97706 (warning actions)

**Gray Scale:**
- gray-50 → Background chính (bg-gray-50)
- gray-100 → Hover states, backgrounds
- gray-200 → Borders
- gray-500 → Secondary text
- gray-700 → Primary text
- gray-900 → Headings

### 2. Typography

**Font Family:**
- Sans-serif: 'Inter', system-ui, sans-serif
- Mono: 'Fira Code' (cho code elements)

**Font Sizes:**
- text-xs (0.75rem)
- text-sm (0.875rem)
- text-base (1rem)
- text-lg (1.125rem)
- text-xl, text-2xl, text-3xl cho headings

**Font Weights:**
- font-medium (500)
- font-semibold (600)
- font-bold (700)

### 3. Spacing

- Sử dụng Tailwind spacing scale (4px base unit)
- Common: p-4, px-4, py-2, px-3, py-6
- Gaps: gap-3, gap-4, space-y-1, space-y-6

### 4. Border Radius

- rounded-lg (0.5rem) - Buttons, inputs, cards
- rounded-xl (0.75rem) - Larger elements
- rounded-full - Avatars, badges, pills
- rounded-md (0.375rem) - Dropdowns

### 5. Shadows

- shadow (mặc định) - Header
- shadow-lg - Dropdowns, modals
- shadow-soft - Cards (custom trong index.css)
- shadow-medium, shadow-hard - Custom shadows

### 6. Transitions

- transition-colors - Hover states
- transition-all duration-300 - Smooth animations
- focus:ring-2 - Focus states (accessibility)

---

## 📱 CÁC MÀN HÌNH CHÍNH

### A. PUBLIC PAGES (Không cần authentication)

#### 1. Login (`/login`)
- **Component:** `frontend/src/components/Login.js`
- **Layout:** Fullscreen, không có Layout wrapper
- **Style:** Dark theme với gradient background (slate-900/800)
- **Features:**
  - Form đăng nhập (username/email + password)
  - Google OAuth login
  - Demo accounts selector (right panel trên desktop)
  - Animated background với grid pattern và floating orbs
  - **Thiếu:** Link đến trang Register

#### 2. Register (`/register`)
- **Component:** `frontend/src/pages/Register.js`
- **Layout:** Fullscreen, không có Layout wrapper
- **Style:** Tương tự Login (dark theme)
- **Features:**
  - Form đăng ký công khai
  - Tự động đăng nhập sau khi đăng ký thành công
  - Link quay lại Login

#### 3. Verify (`/verify/:blockchainId`)
- **Component:** `frontend/src/pages/Verify.js`
- **Layout:** Fullscreen, không có Layout wrapper
- **Purpose:** Public blockchain verification page
- **Features:** Hiển thị thông tin verify từ blockchain ID

#### 4. Google Callback (`/google/callback`)
- **Component:** `GoogleCallback` (inline trong App.js)
- **Purpose:** Xử lý OAuth redirect từ Google

---

### B. PROTECTED PAGES (Cần authentication, có Layout wrapper)

#### 1. Dashboard (`/dashboard`)
- **Component:** `frontend/src/pages/Dashboard.js`
- **Roles:** Tất cả roles
- **Features:**
  - Statistics cards (tổng thuốc, users, tasks, alerts, scans)
  - Quick actions (links đến các chức năng chính)
  - Recent activities feed
  - Role-specific content

#### 2. Quản lý Thuốc (`/drugs`)
- **Component:** `frontend/src/pages/Drugs.js`
- **Roles:** admin, manufacturer, distributor, hospital
- **Features:**
  - CRUD operations cho drugs
  - List view với filters
  - QR code generation
  - Blockchain integration

#### 3. Quản lý Kho (`/inventory`)
- **Component:** `frontend/src/pages/Inventory.js`
- **Roles:** admin, manufacturer, distributor, hospital
- **Features:**
  - Stock management (nhập, xuất, điều chuyển)
  - Inventory locations
  - Low stock alerts
  - Expiry date tracking

#### 4. Quản lý Đơn hàng (`/orders`)
- **Component:** `frontend/src/pages/Orders.js`
- **Roles:** admin, manufacturer, distributor, hospital
- **Features:**
  - Order list với status tracking
  - Order details
  - Order creation/editing

#### 5. Quét QR (`/qr-scanner`)
- **Component:** `frontend/src/pages/QRScanner.js`
- **Roles:** Tất cả roles
- **Features:**
  - QR code scanner (camera hoặc file upload)
  - Drug information display
  - Blockchain verification

#### 6. Thông báo (`/notifications`)
- **Component:** `frontend/src/pages/Notifications.js`
- **Roles:** Tất cả roles
- **Features:**
  - Notification list
  - Mark as read/unread
  - Filter by type

#### 7. B2B Marketplace (`/marketplace`)
- **Component:** `frontend/src/pages/Marketplace.js`
- **Roles:** admin, manufacturer, distributor, hospital
- **Layout:** **KHÔNG có Layout wrapper** (fullscreen riêng)
- **Features:**
  - Product catalog
  - Shopping cart (CartDrawer component)
  - Product search/filter
  - Product detail modal
  - **Đặc biệt:** Có header riêng với cart icon

#### 8. Checkout (`/checkout`)
- **Component:** `frontend/src/pages/Checkout.js`
- **Roles:** admin, manufacturer, distributor, hospital
- **Layout:** **KHÔNG có Layout wrapper** (fullscreen riêng)
- **Features:**
  - Order review
  - Shipping address form
  - Billing address form
  - Payment method selection
  - Order confirmation

#### 9. Quản lý Đấu thầu (`/bids`)
- **Component:** `frontend/src/pages/Bids.js`
- **Roles:** admin, manufacturer, distributor, hospital

#### 10. Chuỗi Cung ứng (`/supply-chain`)
- **Component:** `frontend/src/pages/SupplyChain.js`
- **Roles:** admin, manufacturer, distributor, hospital
- **Features:**
  - Supply chain tracking
  - Step management
  - Map view (SupplyChainMap component)
  - Timeline view (DrugTimeline component)

#### 11. Hóa đơn & Thanh toán (`/invoices`)
- **Component:** `frontend/src/pages/Invoices.js`
- **Roles:** admin, manufacturer, distributor, hospital

#### 12. Quản lý Nhiệm vụ (`/tasks`)
- **Component:** `frontend/src/pages/Tasks.js`
- **Roles:** Tất cả roles
- **Features:**
  - Task list với filters
  - Task creation/editing
  - Task assignment
  - Status tracking

#### 13. Báo cáo (`/reports`)
- **Component:** `frontend/src/pages/Reports.js`
- **Roles:** admin, manufacturer, hospital

#### 14. Blockchain (`/blockchain`)
- **Component:** `frontend/src/pages/BlockchainDashboard.js`
- **Roles:** admin, manufacturer, distributor, hospital

#### 15. Blockchain Explorer (`/blockchain/explorer`)
- **Component:** `frontend/src/pages/BlockchainExplorer.js`
- **Roles:** admin, manufacturer, distributor, hospital

#### 16. Blockchain Verify (`/blockchain/verify`)
- **Component:** `frontend/src/pages/BlockchainVerify.js`
- **Roles:** admin, manufacturer, distributor, hospital
- **Ghi chú:** Chưa có trong menu navigation

#### 17. Nhà cung ứng (`/suppliers`)
- **Component:** `frontend/src/pages/Suppliers.js`
- **Roles:** admin, manufacturer, distributor

#### 18. Đánh giá (`/reviews`)
- **Component:** `frontend/src/pages/Reviews.js`
- **Roles:** admin, hospital, patient

#### 19. Quản lý Users (`/users`)
- **Component:** `frontend/src/pages/Users.js`
- **Roles:** admin only

#### 20. Quản lý Yêu cầu Nâng cấp (`/role-upgrade/management`)
- **Component:** `frontend/src/pages/RoleUpgradeManagement.js`
- **Roles:** admin only

#### 21. Audit Log (`/audit-logs`)
- **Component:** `frontend/src/pages/AuditLogs.js`
- **Roles:** admin only

#### 22. Backup & Restore (`/backups`)
- **Component:** `frontend/src/pages/Backups.js`
- **Roles:** admin only

#### 23. Import/Export (`/import-export`)
- **Component:** `frontend/src/pages/ImportExport.js`
- **Roles:** admin only

#### 24. Cài đặt (`/settings`)
- **Component:** `frontend/src/pages/Settings.js`
- **Roles:** admin only

#### 25. Profile (`/profile`)
- **Component:** `frontend/src/pages/ProfilePage.js`
- **Roles:** Tất cả roles
- **Features:**
  - Tabbed interface (ProfileTabs component)
  - General info tab
  - Notification preferences tab
  - Organization info tab (nếu có)
  - Security tab

#### 26. Profile Old (`/profile-old`)
- **Component:** `frontend/src/pages/Profile.js`
- **Ghi chú:** Version cũ, vẫn còn route nhưng không được dùng

#### 27. Yêu cầu Nâng cấp Role (`/role-upgrade/request`)
- **Component:** `frontend/src/pages/RoleUpgradeRequest.js`
- **Roles:** patient only
- **Features:**
  - Form gửi yêu cầu nâng cấp role
  - Upload documents
  - View request history

#### 28. Chữ ký số (`/digital-signatures`)
- **Component:** `frontend/src/pages/DigitalSignatures.js`
- **Roles:** admin, manufacturer, distributor, hospital

#### 29. Điểm tín nhiệm (`/trust-scores`)
- **Component:** `frontend/src/pages/TrustScores.js`
- **Roles:** admin, manufacturer, distributor, hospital

#### 30. Drug Timeline Demo (`/drug-timeline`)
- **Component:** `frontend/src/pages/DrugTimelineDemo.js`
- **Roles:** Tất cả roles
- **Ghi chú:** Demo page, chưa có trong menu navigation

---

## 🔍 CÁC THÀNH PHẦN UI PHỤ

### 1. Global Components

**CartDrawer:**
- Component: `frontend/src/components/CartDrawer.jsx`
- Usage: Dùng trong Marketplace
- Features: Slide-out cart panel

**AIChatWidget:**
- Component: `frontend/src/components/AIChatWidget.jsx`
- Usage: Global widget (rendered trong App.js)

**Toaster (Notifications):**
- Library: react-hot-toast
- Position: top-right
- Duration: 3000ms

### 2. Common UI Patterns

**Cards:**
- Class: `.card` → bg-white, rounded-lg, shadow-soft, border
- Structure: card-header, card-body, card-footer

**Buttons:**
- Primary: `.btn-primary` → bg-primary-600, text-white
- Secondary: `.btn-secondary` → bg-gray-200
- Success: `.btn-success` → bg-secondary-600
- Danger: `.btn-danger` → bg-danger-600
- Warning: `.btn-warning` → bg-warning-600
- Outline: `.btn-outline` → border, transparent background

**Forms:**
- Input: `.form-input` → rounded-lg, border-gray-300
- Label: `.form-label` → text-sm font-medium
- Error: `.form-error` → text-danger-600

**Tables:**
- Container: `.table` → min-w-full, divide-y
- Header: `.table-header` → bg-gray-50
- Row: `.table-row` → hover:bg-gray-50
- Cell: `.table-cell` → px-6 py-4

**Badges:**
- Classes: `.badge-primary`, `.badge-secondary`, `.badge-danger`, `.badge-warning`, `.badge-gray`

**Modals:**
- Overlay: `.modal-overlay` → fixed inset-0, bg-black/50
- Content: `.modal-content` → bg-white, rounded-lg, shadow-xl

---

## 📊 THỐNG KÊ TỔNG HỢP

### Menu Navigation
- **Tổng số items:** 25 items
- **Số nhóm:** 6 nhóm logic
- **Items có divider:** 5 items (first item của mỗi nhóm sau nhóm đầu)

### Routes
- **Public routes:** 4 routes
- **Protected routes:** 27 routes
- **Routes không có trong menu:** 3 routes
  - `/blockchain/verify` - Có route, không có menu
  - `/drug-timeline` - Có route, không có menu
  - `/checkout` - Có route, không có menu (được gọi từ Marketplace)

### Pages không dùng Layout
- `/login` - Fullscreen
- `/register` - Fullscreen
- `/verify/:blockchainId` - Fullscreen
- `/marketplace` - Fullscreen riêng (có header riêng)
- `/checkout` - Fullscreen riêng (có header riêng)

### User Roles
- **5 roles:** admin, manufacturer, distributor, hospital, patient
- **Menu filtering:** Mỗi menu item có `roles` array để filter

---

## 📝 GHI CHÚ QUAN TRỌNG

### 1. Responsive Design
- Sidebar: Hidden trên mobile, overlay khi mở
- Search bar: Full width
- User name: Ẩn trên mobile, hiện trên desktop
- Menu items: Scrollable nếu quá dài

### 2. Accessibility
- Focus states: ring-2 với màu primary
- Semantic HTML: Sử dụng proper HTML elements
- ARIA labels: Có sr-only text cho screen readers

### 3. State Management
- Authentication: AuthContext
- Cart: CartContext (cho Marketplace)
- Navigation state: React Router location state

### 4. Icons
- Library: lucide-react
- Size: Thường là h-5 w-5 hoặc h-6 w-6
- Style: Outline style (stroke, không fill)

---

## ✅ KẾT LUẬN

Đây là bản ghi nhận đầy đủ về cấu trúc giao diện hiện tại của hệ thống. Tài liệu này mô tả:

1. ✅ Cấu trúc Layout tổng thể (Sidebar, Header, Content)
2. ✅ Chi tiết từng khu vực giao diện
3. ✅ Danh sách đầy đủ các màn hình chính
4. ✅ Phong cách UI (màu sắc, typography, spacing)
5. ✅ Các thành phần UI phụ và patterns

**Không có đề xuất thay đổi** trong tài liệu này, chỉ ghi nhận và mô tả hiện trạng.

