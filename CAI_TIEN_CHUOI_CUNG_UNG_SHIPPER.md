# 🚚 CẢI THIỆN CHUỖI CUNG ỨNG: NGƯỜI GIAO HÀNG VÀ CẬP NHẬT BẢN ĐỒ

## 📋 TỔNG QUAN

Tài liệu này mô tả các cải thiện đã thực hiện để:
1. **Chỉ định người giao hàng (Shipper)** - Tài khoản chịu trách nhiệm vận chuyển
2. **Cập nhật địa chỉ tự động lên bản đồ** - Khi cập nhật location trong hành trình

---

## 🎯 VẤN ĐỀ

### 1. Người giao hàng
**Vấn đề:**
- Khi tạo chuỗi cung ứng, không có cách để chỉ định một tài khoản cụ thể làm người giao hàng
- Khi phân quyền giao hàng, không rõ ai là người chịu trách nhiệm vận chuyển
- Nhà phân phối hoặc bệnh viện không thể tự giao cho mình

**Giải pháp:**
- Thêm field `shipper` vào SupplyChain model
- Cho phép chỉ định shipper khi tạo chuỗi cung ứng
- Chỉ shipper hoặc admin mới có thể cập nhật location khi giao hàng

### 2. Cập nhật bản đồ
**Vấn đề:**
- Khi cập nhật địa chỉ trong hành trình, bản đồ không tự động refresh

**Giải pháp:**
- Bản đồ đã có useEffect để theo dõi supplyChains và tự động cập nhật
- Đảm bảo khi thêm step mới, location được geocode và lưu vào currentLocation
- Bản đồ sẽ tự động hiển thị location mới

---

## ✅ CÁC THAY ĐỔI ĐÃ THỰC HIỆN

### 1. Model - Thêm Field Shipper

**File:** `models/SupplyChain.js`

```javascript
// Người giao hàng (shipper) - tài khoản chịu trách nhiệm vận chuyển
shipper: {
  shipperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  shipperName: String,
  shipperRole: {
    type: String,
    enum: ['manufacturer', 'distributor', 'dealer', 'pharmacy', 'hospital', 'admin']
  },
  shipperOrganization: String,
  shipperContact: {
    phone: String,
    email: String
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}
```

**Lưu ý:**
- `shipperRole` không bao gồm `patient` - bệnh nhân không thể là shipper
- `assignedBy` lưu người chỉ định shipper
- `assignedAt` lưu thời gian chỉ định

---

### 2. Controller - Xử lý Shipper

**File:** `controllers/supplyChainController.js`

#### 2.1. Khi tạo Supply Chain

```javascript
// Xử lý người giao hàng (shipper) - có thể được chỉ định khi tạo
let shipperData = null;
if (req.body.shipper && req.body.shipper.shipperId) {
  const shipperId = sanitizeInput(req.body.shipper.shipperId);
  
  // Validate ObjectId
  if (mongoose.Types.ObjectId.isValid(shipperId)) {
    const shipperUser = await User.findById(shipperId).select('fullName phone email organizationInfo role');
    if (shipperUser) {
      // Chỉ cho phép các role có thể giao hàng
      const allowedShipperRoles = ['manufacturer', 'distributor', 'dealer', 'pharmacy', 'hospital', 'admin'];
      if (allowedShipperRoles.includes(shipperUser.role)) {
        shipperData = {
          shipperId: shipperUser._id,
          shipperName: shipperUser.fullName || shipperUser.username,
          shipperRole: shipperUser.role,
          shipperOrganization: shipperUser.organizationInfo?.name || '',
          shipperContact: {
            phone: shipperUser.phone || '',
            email: shipperUser.email || ''
          },
          assignedAt: new Date(),
          assignedBy: req.user._id
        };
      }
    }
  }
}
```

**Logic:**
- Chỉ các role: `manufacturer`, `distributor`, `dealer`, `pharmacy`, `hospital`, `admin` mới có thể làm shipper
- `patient` không thể làm shipper
- Validate ObjectId và kiểm tra user tồn tại

#### 2.2. Khi thêm Step - Cập nhật Location

```javascript
// Cập nhật currentLocation với coordinates đã geocode (nếu có)
// Nếu có shipper và action là shipped/received, dùng thông tin shipper
let locationActor = {
  actorId: req.user._id,
  actorName: req.user.fullName,
  actorRole: req.user.role
};

// Nếu có shipper và đang thực hiện hành động giao hàng, ưu tiên dùng shipper
if (supplyChain.shipper && supplyChain.shipper.shipperId && 
    (action === 'shipped' || action === 'received' || action === 'handover')) {
  // Kiểm tra quyền: chỉ shipper hoặc admin mới có thể cập nhật location khi giao hàng
  if (req.user._id.toString() === supplyChain.shipper.shipperId.toString() || req.user.role === 'admin') {
    locationActor = {
      actorId: supplyChain.shipper.shipperId,
      actorName: supplyChain.shipper.shipperName,
      actorRole: supplyChain.shipper.shipperRole
    };
  }
}

supplyChain.currentLocation = {
  ...locationActor,
  address: processedLocation?.address || req.user.location?.address,
  coordinates: finalCoordinates,
  lastUpdated: new Date()
};
```

**Logic:**
- Nếu có shipper và action là `shipped`, `received`, hoặc `handover`:
  - Chỉ shipper hoặc admin mới có thể cập nhật location
  - `currentLocation.actorId` sẽ là `shipperId` thay vì `req.user._id`
- Địa chỉ được geocode tự động và lưu vào `currentLocation.coordinates`
- Bản đồ sẽ tự động hiển thị location mới

---

### 3. Frontend - UI Chọn Shipper

**File:** `frontend/src/pages/SupplyChain.js`

#### 3.1. Form Tạo Supply Chain

Cần thêm field để chọn shipper:

```javascript
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">
    Người giao hàng (Tùy chọn)
  </label>
  <select
    {...register('shipper.shipperId')}
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
  >
    <option value="">Không chỉ định (tự động)</option>
    {shippers.map(shipper => (
      <option key={shipper._id} value={shipper._id}>
        {shipper.fullName} ({shipper.role}) - {shipper.organizationInfo?.name || ''}
      </option>
    ))}
  </select>
  <p className="text-xs text-gray-500 mt-1">
    Chỉ định người chịu trách nhiệm vận chuyển. Chỉ các role: Manufacturer, Distributor, Dealer, Pharmacy, Hospital mới có thể làm shipper.
  </p>
</div>
```

**Lưu ý:**
- Field này là tùy chọn (optional)
- Nếu không chọn, hệ thống sẽ dùng người tạo hoặc người thêm step
- Cần load danh sách users với role phù hợp

---

### 4. Bản Đồ Tự Động Cập Nhật

**File:** `frontend/src/components/SupplyChainMap.js`

Bản đồ đã có logic tự động cập nhật:

```javascript
// Tính toán bounds từ tất cả supply chains
useEffect(() => {
  const bounds = [];
  
  supplyChains.forEach((chain) => {
    // Xử lý path (steps)
    if (chain.path && chain.path.length > 0) {
      chain.path.forEach(point => {
        if (point.coordinates && point.coordinates.length === 2) {
          const [lng, lat] = point.coordinates;
          bounds.push({ lat, lng, chain, point });
        }
      });
    }
    
    // Xử lý currentLocation - LUÔN thêm vào bounds nếu có coordinates
    if (chain.currentLocation?.coordinates && chain.currentLocation.coordinates.length === 2) {
      const [lng, lat] = chain.currentLocation.coordinates;
      bounds.push({ lat, lng, chain, isCurrent: true });
    }
  });
  
  setAllBounds(bounds);
}, [supplyChains]); // Tự động cập nhật khi supplyChains thay đổi
```

**Cách hoạt động:**
1. Khi thêm step mới, location được geocode và lưu vào `currentLocation.coordinates`
2. `supplyChains` state được cập nhật (từ `loadSupplyChains()`)
3. `SupplyChainMap` component nhận `supplyChains` mới
4. `useEffect` tự động chạy và tính toán lại bounds
5. Bản đồ tự động hiển thị location mới

---

## 🔄 QUY TRÌNH HOẠT ĐỘNG

### 1. Tạo Supply Chain với Shipper

1. User (admin/manufacturer) tạo supply chain
2. Chọn shipper từ dropdown (tùy chọn)
3. Nếu chọn shipper:
   - Validate shipper role (phải là một trong: manufacturer, distributor, dealer, pharmacy, hospital, admin)
   - Lưu thông tin shipper vào database
4. Nếu không chọn:
   - Shipper = null
   - Location sẽ dùng thông tin người tạo/người thêm step

### 2. Thêm Step và Cập Nhật Location

1. User thêm step mới với action `shipped`, `received`, hoặc `handover`
2. Nhập địa chỉ mới
3. Hệ thống tự động geocode địa chỉ thành coordinates
4. Nếu có shipper:
   - Kiểm tra quyền: chỉ shipper hoặc admin mới có thể cập nhật
   - `currentLocation.actorId` = `shipperId`
5. Nếu không có shipper:
   - `currentLocation.actorId` = `req.user._id`
6. Lưu `currentLocation` với coordinates mới
7. Frontend reload supply chains
8. Bản đồ tự động hiển thị location mới

---

## 📊 VÍ DỤ SỬ DỤNG

### Scenario 1: Có Shipper

1. **Tạo Supply Chain:**
   - Admin tạo supply chain cho lô thuốc ABC-123
   - Chọn shipper: "Nguyễn Văn A (Distributor) - Công ty Dược phẩm XYZ"
   - Shipper được lưu vào database

2. **Giao hàng:**
   - Shipper (Nguyễn Văn A) đăng nhập
   - Thêm step với action `shipped`
   - Nhập địa chỉ: "123 Đường ABC, Quận 1, TP.HCM"
   - Hệ thống geocode và lưu coordinates
   - `currentLocation.actorId` = shipperId (Nguyễn Văn A)
   - Bản đồ tự động hiển thị vị trí mới

3. **Nhận hàng:**
   - Bệnh viện nhận hàng
   - Thêm step với action `received`
   - Nhập địa chỉ: "456 Đường XYZ, Quận 2, TP.HCM"
   - `currentLocation.actorId` vẫn là shipperId (vì có shipper)
   - Bản đồ tự động cập nhật

### Scenario 2: Không có Shipper

1. **Tạo Supply Chain:**
   - Admin tạo supply chain
   - Không chọn shipper
   - Shipper = null

2. **Giao hàng:**
   - Nhà phân phối thêm step với action `shipped`
   - `currentLocation.actorId` = nhà phân phối (req.user._id)
   - Bản đồ tự động hiển thị

---

## ⚠️ LƯU Ý

1. **Phân quyền:**
   - Chỉ admin và manufacturer mới có thể tạo supply chain
   - Chỉ shipper hoặc admin mới có thể cập nhật location khi giao hàng
   - Các role khác vẫn có thể thêm step nhưng location sẽ không dùng shipper

2. **Shipper Role:**
   - `patient` không thể làm shipper
   - Chỉ các role có thể vận chuyển: manufacturer, distributor, dealer, pharmacy, hospital, admin

3. **Bản đồ:**
   - Bản đồ tự động cập nhật khi `supplyChains` prop thay đổi
   - Cần đảm bảo `loadSupplyChains()` được gọi sau khi thêm step
   - Coordinates phải ở format GeoJSON: `[longitude, latitude]`

4. **Geocoding:**
   - Địa chỉ được geocode tự động khi thêm step
   - Nếu geocode fail, location vẫn được lưu nhưng không có coordinates
   - Bản đồ sẽ không hiển thị nếu không có coordinates

---

## 🚀 CÁC BƯỚC TIẾP THEO (Tùy chọn)

1. **UI Chọn Shipper:**
   - Thêm dropdown chọn shipper trong form tạo supply chain
   - Load danh sách users với role phù hợp
   - Hiển thị thông tin shipper trong detail modal

2. **Thay đổi Shipper:**
   - Cho phép thay đổi shipper sau khi tạo
   - Chỉ admin mới có thể thay đổi
   - Lưu lịch sử thay đổi shipper

3. **Thông báo cho Shipper:**
   - Gửi notification cho shipper khi được chỉ định
   - Gửi notification khi có step mới cần xử lý

4. **Dashboard Shipper:**
   - Dashboard riêng cho shipper
   - Hiển thị các supply chains được giao
   - Thống kê số lượng giao hàng

---

**Cập nhật lần cuối:** 23/12/2025  
**Trạng thái:** ✅ Đã hoàn thành backend, ⚠️ Cần thêm UI frontend

