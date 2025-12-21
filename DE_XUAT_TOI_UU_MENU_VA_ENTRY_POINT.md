# 🎯 ĐỀ XUẤT TỐI ƯU MENU VÀ ENTRY POINT

**Ngày đề xuất:** 2025-01-XX  
**Mục tiêu:** Tối ưu cách tổ chức menu và entry point với collapsible submenu

---

## 📋 TÓM TẮT THAY ĐỔI

### Nguyên tắc
- ✅ Áp dụng **Collapsible Submenu** để gộp các items liên quan
- ✅ Giữ nguyên layout và phong cách UI hiện tại
- ✅ Thêm entry point cho các chức năng thiếu
- ✅ Giảm số lượng menu items hiển thị để giảm cognitive load

### Các nhóm sẽ gộp
1. **Blockchain-related items** → Menu "Blockchain" với submenu
2. **Admin-related items** → Menu "Quản trị hệ thống" với submenu

---

## 🗂️ CẤU TRÚC MENU MỚI

### Nhóm 1: CORE FUNCTIONS (Chức năng Cốt lõi)
**Không thay đổi** - Giữ nguyên các items:
- Dashboard
- Quản lý Thuốc
- Quản lý Kho
- Quản lý Đơn hàng
- Quét QR
- Thông báo

---

### Nhóm 2: BUSINESS (Kinh doanh)
**Không thay đổi** - Giữ nguyên các items:
- B2B Marketplace
- Quản lý Đấu thầu
- Chuỗi Cung ứng
- Hóa đơn & Thanh toán
- Quản lý Nhiệm vụ

---

### Nhóm 3: ANALYTICS & TOOLS (Phân tích & Công cụ)
**Có thay đổi:**

#### Trước:
- Báo cáo
- Blockchain (standalone)
- Blockchain Explorer (standalone)
- Nhà cung ứng
- Đánh giá

#### Sau:
- Báo cáo
- **Blockchain** ⬇️ (Collapsible Submenu)
  - Blockchain Dashboard (`/blockchain`)
  - Blockchain Explorer (`/blockchain/explorer`)
  - Xác minh Blockchain (`/blockchain/verify` hoặc link đến Verify page) ⭐ **MỚI** (entry point)
- Hành trình Thuốc (`/drug-timeline`) ⭐ **MỚI** (icon: Timeline)
- Nhà cung ứng
- Đánh giá

**Lý do thay đổi:**
- **Blockchain Verify:** Thêm entry point trong menu Blockchain submenu. **GIỮ NGUYÊN** route `/verify/:blockchainId` (PUBLIC page) vì đây là page công khai được share và truy cập từ QR code. Chỉ thêm entry point trong menu và cải thiện entry point trong Blockchain Dashboard (thêm "Xác minh nhanh" section).
- **Hành trình Thuốc:** Đặt trong Analytics & Tools vì đây là công cụ phân tích/trực quan hóa dữ liệu (timeline visualization), phù hợp với nhóm này hơn là Advanced Tools.

---

### Nhóm 4: ADMIN (Quản trị hệ thống)
**Gộp thành submenu:**

#### Trước:
- Quản lý Users
- Quản lý Yêu cầu Nâng cấp
- Audit Log
- Backup & Restore
- Import/Export
- Cài đặt

#### Sau:
- **Quản trị hệ thống** ⬇️ (Collapsible Submenu)
  - Quản lý Users (`/users`)
  - Quản lý Yêu cầu Nâng cấp (`/role-upgrade/management`)
  - Audit Log (`/audit-logs`)
  - System Metrics (`/metrics`) ⭐ **MỚI** (tạo page mới)
  - Backup & Restore (`/backups`)
  - Import/Export (`/import-export`)
  - Cài đặt (`/settings`)

---

### Nhóm 5: ADVANCED TOOLS (Công cụ Nâng cao)
**Không thay đổi:**

#### Trước:
- Chữ ký số
- Điểm tín nhiệm

#### Sau:
- Chữ ký số
- Điểm tín nhiệm

**Lý do:** Hành trình Thuốc đã được chuyển sang Analytics & Tools (xem ở trên).

---

### Nhóm 6: USER-SPECIFIC (Cá nhân)
**Không thay đổi:**
- Yêu cầu Nâng cấp Role (patient only)

---

## 📐 CHI TIẾT CẤU TRÚC DỮ LIỆU

### Cấu trúc Navigation Item mới

#### Item thông thường (không đổi):
```javascript
{
  name: 'Dashboard',
  href: '/dashboard',
  icon: Home,
  roles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']
}
```

#### Item có submenu (mới):
```javascript
{
  name: 'Blockchain',
  icon: Shield,
  roles: ['admin', 'manufacturer', 'distributor', 'hospital'],
  hasSubmenu: true,
  defaultOpen: false, // Có thể mở mặc định nếu cần
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
      name: 'Blockchain Verify',
      href: '/blockchain/verify',
      icon: CheckCircle, // Hoặc icon phù hợp
      roles: ['admin', 'manufacturer', 'distributor', 'hospital']
    }
  ]
}
```

---

## 🎨 UI/UX IMPLEMENTATION

### Visual Design cho Collapsible Submenu

#### Parent Item (khi đóng):
```
┌─────────────────────────────┐
│ 🔒 Blockchain           ▼   │  ← Icon + Text + ChevronDown
└─────────────────────────────┘
```

#### Parent Item (khi mở):
```
┌─────────────────────────────┐
│ 🔒 Blockchain           ▲   │  ← Icon + Text + ChevronUp
├─────────────────────────────┤
│   • Blockchain Dashboard    │  ← Submenu items với indent
│   • Blockchain Explorer     │
│   • Blockchain Verify       │
└─────────────────────────────┘
```

#### Styling:
- **Parent item:** Giữ nguyên style hiện tại (nav-link)
- **Chevron icon:** ChevronDown khi đóng, ChevronUp khi mở
- **Submenu items:**
  - Padding-left: `pl-8` (indent để phân biệt với parent)
  - Icon nhỏ hơn: `h-4 w-4` (thay vì `h-5 w-5`)
  - Text size: `text-sm` (nhỏ hơn parent một chút)
  - Background khi hover: `hover:bg-gray-50`
  - Background khi active: `bg-primary-50` (giống parent active)

---

## 📝 NAVIGATION ARRAY CẤU TRÚC MỚI (CHI TIẾT)

### Import Icons mới cần thiết:
```javascript
import {
  // ... existing icons ...
  ChevronDown,
  ChevronUp,   // Cho submenu toggle
  Activity,    // Cho System Metrics
  Clock        // Cho Drug Timeline (hoặc tìm icon Timeline nếu có)
} from 'lucide-react';
```

### Navigation Array mới:

```javascript
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
    dividerBefore: true,
    groupTitle: 'Kinh doanh'
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
        name: 'Xác minh Blockchain',
        href: '/blockchain/verify', // Hoặc có thể là form page để nhập blockchainId
        icon: CheckCircle, // Hoặc icon phù hợp
        roles: ['admin', 'manufacturer', 'distributor', 'hospital']
      },
      {
        name: 'Blockchain Explorer',
        href: '/blockchain/explorer',
        icon: ExternalLink,
        roles: ['admin', 'manufacturer', 'distributor', 'hospital']
      }
    ]
  },
  {
    name: 'Hành trình Thuốc',
    href: '/drug-timeline',
    icon: Clock, // Hoặc Timeline nếu có trong lucide-react
    roles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']
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
        name: 'System Metrics', // ⭐ MỚI - cần tạo page
        href: '/metrics',
        icon: Activity,
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
    dividerBefore: true,
    groupTitle: 'Công cụ Nâng cao'
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
    dividerBefore: true,
    groupTitle: 'Dành cho Người dùng'
  }
];
```

---

## 🔧 IMPLEMENTATION LOGIC

### State Management cho Submenu

```javascript
const [openSubmenus, setOpenSubmenus] = useState({
  'blockchain': false,
  'admin': false
});

const toggleSubmenu = (key) => {
  setOpenSubmenus(prev => ({
    ...prev,
    [key]: !prev[key]
  }));
};
```

### Rendering Logic trong SidebarContent

```javascript
// Trong navigation.map()
{hasSubmenu ? (
  // Render parent với submenu
  <div>
    <button onClick={() => toggleSubmenu(itemKey)}>
      <item.icon />
      <span>{item.name}</span>
      {openSubmenus[itemKey] ? <ChevronUp /> : <ChevronDown />}
    </button>
    {openSubmenus[itemKey] && (
      <div className="pl-8">
        {item.submenu.map(subItem => (
          <Link to={subItem.href}>
            <subItem.icon className="h-4 w-4" />
            <span className="text-sm">{subItem.name}</span>
          </Link>
        ))}
      </div>
    )}
  </div>
) : (
  // Render item thông thường
  <Link to={item.href}>
    <item.icon />
    <span>{item.name}</span>
  </Link>
)}
```

---

## ➕ THÊM ENTRY POINT CHO CÁC CHỨC NĂNG THIẾU

### 1. Link Đăng ký từ Login page

**Vị trí:** Sau button "Đăng nhập với Google" hoặc cuối form  
**Text:** "Chưa có tài khoản? Đăng ký ngay"  
**Link:** `/register`  
**Styling:** Giữ nguyên style hiện tại (text-slate-400 text-sm, link màu indigo-400)

**Lý do:**
- Đây là pattern phổ biến trong các hệ thống web (Login → Register link)
- Giúp người dùng mới dễ dàng tìm thấy cách đăng ký
- Vị trí sau Google login là nơi người dùng thường tìm kiếm options khác

### 2. System Metrics Page (mới - cần tạo)

**Route:** `/metrics`  
**Page mới:** `frontend/src/pages/Metrics.js`  
**Menu:** Trong submenu "Quản trị hệ thống"  
**Roles:** Admin only

**Lý do:**
- System metrics là chức năng quản trị quan trọng, phù hợp với nhóm Admin
- Giúp admin theo dõi performance và health của hệ thống

### 3. Blockchain Verify (thêm entry point, giữ nguyên page)

**Route:** `/verify/:blockchainId` - **GIỮ NGUYÊN** (PUBLIC page)  
**Route:** `/blockchain/verify` - Thêm menu item, có thể là redirect hoặc form nhập blockchainId  
**Triển khai:** 
- **GIỮ NGUYÊN** Verify page (`/verify/:blockchainId`) vì đây là PUBLIC page được share và truy cập từ QR code
- Thêm menu item "Xác minh Blockchain" trong Blockchain submenu
- Cải thiện Blockchain Dashboard: Thêm section "Xác minh nhanh" với form nhập blockchainId

**Lý do:**
- Verify page là PUBLIC page quan trọng: được share link, truy cập từ QR code, không cần đăng nhập
- Nếu gộp vào Dashboard (PRIVATE), sẽ mất tính công khai → QR code và share link không hoạt động
- Tất cả links hiện tại đến `/verify/:blockchainId` sẽ bị broken nếu thay đổi route
- **Giải pháp:** Giữ nguyên Verify page, chỉ thêm entry point tốt hơn trong menu và Dashboard

### 4. Drug Timeline (thêm vào menu - Analytics & Tools)

**Route:** `/drug-timeline` (đã có)  
**Menu:** Trong nhóm "Analytics & Tools"  
**Icon:** Timeline (hoặc Clock nếu Timeline không có trong lucide-react)  
**Page:** `DrugTimelineDemo.js` (đã có)

**Lý do:**
- Timeline là công cụ phân tích/trực quan hóa dữ liệu (visualization tool)
- Phù hợp với nhóm Analytics & Tools hơn Advanced Tools (Advanced Tools tập trung vào các tính năng như chữ ký số, trust scores - tính năng nghiệp vụ nâng cao)
- Timeline giúp phân tích hành trình thuốc, đây là tính năng phân tích

---

## 🔗 CÁC ENTRY POINT KHÁC (TRONG PAGES)

### 1. Audit Log Entity History

**Vị trí:** Thêm button/link trong các detail pages:
- Drug Detail Page → Button "Xem lịch sử thay đổi"
- User Detail Page → Button "Xem lịch sử thay đổi"
- Order Detail Page → Button "Xem lịch sử thay đổi"

**Action:** Mở modal hoặc navigate đến Audit Logs với filter entity

### 2. Tạo Invoice từ Order

**Vị trí:** Order Detail Page  
**Button:** "Tạo Hóa đơn" (bên cạnh các actions khác)  
**Action:** Call API `createInvoiceFromOrder` và redirect đến Invoice detail

### 3. Reorder Order

**Vị trí:** Order Detail Page  
**Button:** "Đặt lại đơn hàng" (trong action menu)  
**Action:** Call API `reorder` và navigate đến Order create với items đã điền sẵn

### 4. Payment Detail

**Vị trí:** Invoices Page → Payment List  
**Action:** Click vào payment → Mở modal hiển thị chi tiết payment

### 5. Export Audit Logs

**Vị trí:** Audit Logs Page  
**Button:** "Xuất dữ liệu" (trong header, bên cạnh filters)  
**Action:** Call API `/api/audit-logs/export` và download file

### 6. Blockchain Distribute/Recall

**Vị trí:** Blockchain Dashboard → Drug Detail  
**Buttons:** "Ghi nhận Phân phối" và "Thu hồi" (nếu user có quyền)  
**Action:** Mở modal form và call API tương ứng

---

## 📊 SO SÁNH TRƯỚC VÀ SAU

### Số lượng Menu Items

#### Trước:
- **Tổng items hiển thị:** ~25 items (tùy role)
- **Admin menu items:** 6 items riêng lẻ
- **Blockchain items:** 2 items riêng lẻ

#### Sau:
- **Tổng items hiển thị:** ~20 items (tùy role, khi submenu đóng)
- **Admin menu items:** 1 parent + 7 submenu items
- **Blockchain items:** 1 parent + 3 submenu items

**Giảm cognitive load:** ~20% số items visible khi submenu đóng

### Menu Structure

| Nhóm | Trước | Sau |
|------|-------|-----|
| Core Functions | 6 items | 6 items (không đổi) |
| Business | 5 items | 5 items (không đổi) |
| Analytics & Tools | 5 items | 4 items (Blockchain gộp) |
| Admin | 6 items | 1 parent + 7 submenu |
| Advanced Tools | 2 items | 3 items (+ Drug Timeline) |
| User-Specific | 1 item | 1 item (không đổi) |

---

## ✅ CHECKLIST IMPLEMENTATION

### Backend (không cần thay đổi)
- ✅ Tất cả API endpoints đã có sẵn
- ✅ Routes đã được định nghĩa đầy đủ

### Frontend - Layout Component
- [ ] Thêm state `openSubmenus` để quản lý submenu mở/đóng
- [ ] Thêm function `toggleSubmenu` để toggle submenu
- [ ] Cập nhật cấu trúc `navigation` array với submenu
- [ ] Cập nhật rendering logic trong `SidebarContent` để hỗ trợ submenu
- [ ] Thêm styling cho submenu items (indent, icon size, text size)

### Frontend - Pages (thêm mới)
- [ ] Tạo page `Metrics.js` để hiển thị system metrics
- [ ] Thêm route `/metrics` trong App.js

### Frontend - Pages (cập nhật)
- [ ] **Login.js:** Thêm link "Chưa có tài khoản? Đăng ký ngay" sau button Google login hoặc cuối form
- [ ] **BlockchainDashboard.js:** 
  - Thêm section "Xác minh nhanh" với:
    - Input field: Nhập Blockchain ID hoặc quét QR
    - Button "Xác minh ngay"
    - Khi submit: Navigate đến `/verify/:blockchainId` (giữ nguyên route PUBLIC)
  - Hoặc thêm button/link rõ ràng hơn đến Verify page
- [ ] Orders.js: Thêm button "Tạo Hóa đơn" và "Đặt lại" trong Order detail
- [ ] Invoices.js: Thêm modal để xem Payment detail
- [ ] AuditLogs.js: Thêm button "Xuất dữ liệu"
- [ ] BlockchainDashboard.js: Thêm buttons "Ghi nhận Phân phối" và "Thu hồi" (nếu chưa có)
- [ ] Drugs.js, Users.js, Orders.js: Thêm button "Xem lịch sử thay đổi" (audit entity history)

### Frontend - Routes
- [ ] Đảm bảo route `/metrics` được thêm vào App.js
- [ ] Kiểm tra route `/blockchain/verify` đã có
- [ ] Kiểm tra route `/drug-timeline` đã có

---

## 🎨 STYLING DETAILS

### Submenu Parent Item
```css
/* Khi đóng */
.nav-link-submenu-parent {
  /* Giống nav-link hiện tại */
  /* + cursor: pointer (không phải default) */
}

/* Khi mở */
.nav-link-submenu-parent.active {
  background-color: bg-primary-50;
  color: text-primary-700;
}
```

### Submenu Items
```css
.nav-link-submenu-item {
  padding-left: 2rem; /* pl-8 */
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
  font-size: 0.875rem; /* text-sm */
}

.nav-link-submenu-item:hover {
  background-color: bg-gray-50;
}

.nav-link-submenu-item.active {
  background-color: bg-primary-50;
  color: text-primary-700;
}
```

### Chevron Icon
- Position: Right side của parent item
- Size: `h-4 w-4` (nhỏ hơn icon chính)
- Color: `text-gray-400`
- Transition: Rotate animation khi toggle

---

## 🔄 BEHAVIOR & INTERACTION

### Submenu Toggle
- Click vào parent item → Toggle mở/đóng submenu
- Click vào submenu item → Navigate đến route (và có thể tự động đóng submenu nếu muốn)

### Active State
- Parent item active khi bất kỳ submenu item nào active
- Submenu item active khi route khớp

### Persistence (Optional)
- Có thể lưu state submenu mở/đóng vào localStorage để giữ trạng thái khi reload

### Mobile Behavior
- Submenu vẫn hoạt động tương tự trên mobile
- Click vào parent → Toggle submenu
- Submenu items hiển thị với indent rõ ràng

---

## 📱 RESPONSIVE CONSIDERATIONS

### Desktop (≥768px)
- Submenu mở/đóng với animation smooth
- Hover state cho parent và submenu items

### Mobile (<768px)
- Submenu vẫn hoạt động nhưng có thể cần điều chỉnh spacing
- Touch-friendly: Đảm bảo tap area đủ lớn

---

## 🚀 LUỒNG TRUY CẬP MỚI

### Ví dụ 1: Truy cập Blockchain Verify
**Trước:**
- Không có cách truy cập từ menu (phải nhớ URL `/verify/:blockchainId`)
- Có thể truy cập từ QR code hoặc share link

**Sau:**
1. Option 1: Click menu "Blockchain" → "Xác minh Blockchain" → Form nhập blockchainId → Navigate đến `/verify/:blockchainId`
2. Option 2: Vào "Blockchain Dashboard" → Section "Xác minh nhanh" → Nhập blockchainId → Navigate đến `/verify/:blockchainId`
3. Option 3: Vẫn truy cập trực tiếp từ QR code hoặc share link `/verify/:blockchainId` (KHÔNG ĐỔI)

**Lý do điều chỉnh:**
- Verify page (`/verify/:blockchainId`) là PUBLIC page, được share và truy cập từ QR code
- Nếu gộp vào Dashboard (PRIVATE), sẽ mất tính công khai
- Giải pháp: Giữ nguyên Verify page, chỉ thêm entry point tốt hơn trong menu và Dashboard

### Ví dụ 2: Truy cập System Metrics
**Trước:**
- Không có page (chỉ có API)

**Sau:**
1. Mở menu "Quản trị hệ thống" (click để mở submenu)
2. Click "System Metrics"
3. Navigate đến `/metrics` (page mới)

### Ví dụ 3: Xem Audit History của một Drug
**Trước:**
- Phải vào Audit Logs page và filter thủ công

**Sau:**
1. Vào Drug Detail page
2. Click button "Xem lịch sử thay đổi"
3. Mở modal hoặc navigate đến Audit Logs với filter tự động

---

## ✅ LỢI ÍCH

1. **Giảm Cognitive Load:** Giảm ~20% số items visible khi submenu đóng
2. **Tổ chức tốt hơn:** Các chức năng liên quan được nhóm lại
3. **Dễ mở rộng:** Dễ thêm submenu items mới trong tương lai
4. **Entry point đầy đủ:** Tất cả chức năng đều có cách truy cập rõ ràng
5. **Giữ nguyên UX:** Không thay đổi layout và phong cách UI

---

## 📝 LƯU Ý IMPLEMENTATION

1. **Giữ nguyên styling:** Chỉ thêm logic submenu, không thay đổi màu sắc, spacing, font
2. **Smooth animation:** Submenu mở/đóng nên có transition smooth
3. **Keyboard navigation:** Cân nhắc hỗ trợ keyboard để mở/đóng submenu
4. **Accessibility:** Đảm bảo ARIA labels đúng cho screen readers
5. **Testing:** Test với tất cả roles để đảm bảo menu filtering hoạt động đúng

---

## 🎯 KẾT LUẬN

Đề xuất này sẽ:
- ✅ Giảm số lượng menu items visible từ ~25 xuống ~20
- ✅ Gộp các Blockchain items vào 1 submenu (3 items: Dashboard + Explorer + Verify entry)
- ✅ Gộp các Admin items vào 1 submenu (7 items)
- ✅ Thêm entry point cho Blockchain Verify trong menu (GIỮ NGUYÊN Verify page PUBLIC)
- ✅ Cải thiện Blockchain Dashboard với section "Xác minh nhanh"
- ✅ Thêm entry point cho System Metrics (page mới)
- ✅ Thêm entry point cho Drug Timeline trong Analytics & Tools (icon: Timeline/Clock)
- ✅ Thêm link Register từ Login page ("Chưa có tài khoản? Đăng ký ngay")
- ✅ Giữ nguyên hoàn toàn layout và phong cách UI hiện tại
- ✅ Đảm bảo không mất dữ liệu, không phá vỡ UI hiện tại

---

## 📋 TÓM TẮT QUYẾT ĐỊNH VÀ LÝ DO

### 1. Link Đăng ký trên Login Page
**Quyết định:** Thêm link "Chưa có tài khoản? Đăng ký ngay" sau button Google login hoặc cuối form

**Lý do:**
- Pattern phổ biến trong các hệ thống web hiện đại
- Người dùng mới dễ dàng tìm thấy cách đăng ký
- Vị trí sau Google login là điểm người dùng thường tìm options khác
- Không làm phức tạp UI, chỉ thêm một dòng text link đơn giản

---

### 2. Drug Timeline - Đặt trong Analytics & Tools
**Quyết định:** Đặt "Hành trình Thuốc" trong nhóm Analytics & Tools, icon Timeline/Clock

**Lý do:**
- Timeline là công cụ trực quan hóa và phân tích dữ liệu (data visualization tool)
- Giúp người dùng phân tích hành trình thuốc → thuộc nhóm phân tích
- Analytics & Tools tập trung vào các công cụ phân tích (Reports, Timeline) và công cụ hỗ trợ (Blockchain, Suppliers)
- Advanced Tools tập trung vào tính năng nghiệp vụ nâng cao (Chữ ký số, Điểm tín nhiệm)
- Phân loại theo chức năng: Timeline = phân tích, không phải tính năng nghiệp vụ nâng cao

---

### 3. Blockchain Verify - Thêm Entry Point, Giữ Nguyên Page
**Quyết định:** **GIỮ NGUYÊN** Verify page (`/verify/:blockchainId`), thêm entry point trong menu và cải thiện Dashboard

**Lý do điều chỉnh:**

**Verify page là PUBLIC page quan trọng:**
- ✅ Được share link công khai
- ✅ Được truy cập từ QR code (không cần đăng nhập)
- ✅ Được sử dụng để xác minh tính xác thực của thuốc cho người dùng cuối
- ✅ Có print functionality để in báo cáo xác minh
- ❌ Nếu gộp vào Dashboard (PRIVATE), sẽ mất tính công khai → QR code và share link không hoạt động

**Rủi ro nếu gộp:**
- 🔴 Tất cả links hiện tại đến `/verify/:blockchainId` sẽ bị broken
- 🔴 QR code không hoạt động cho user chưa đăng nhập
- 🟡 Dữ liệu Verify page rất chi tiết (khác với Dashboard list view)
- 🟡 Cần refactor lớn, có thể mất dữ liệu hoặc phá vỡ UI

**Giải pháp:**
- ✅ Giữ nguyên route `/verify/:blockchainId` (PUBLIC)
- ✅ Thêm menu item "Xác minh Blockchain" trong Blockchain submenu
- ✅ Cải thiện Blockchain Dashboard: Thêm section "Xác minh nhanh" với form nhập blockchainId
- ✅ Tất cả links hiện tại vẫn hoạt động
- ✅ QR code và public access vẫn hoạt động
- ✅ Không mất dữ liệu, không phá vỡ UI

