# 📥 Hướng Dẫn Import Dữ Liệu Thuốc

## 📋 Tổng Quan

Hệ thống hỗ trợ import dữ liệu thuốc từ 2 nguồn:
1. **PDF Công văn Bộ Y tế** - Import trực tiếp từ file PDF công văn
2. **CSV/Excel** - Import từ file CSV hoặc Excel với cấu trúc linh hoạt

---

## 📄 1. IMPORT TỪ PDF CÔNG VĂN BỘ Y TẾ

### 🎯 Cách Sử Dụng

#### Bước 1: Vào trang Import/Export
- Đăng nhập với tài khoản Admin
- Vào menu **"Import/Export"** ở sidebar

#### Bước 2: Chọn Import từ PDF
1. Chọn tab **"Import"**
2. Chọn **"Loại dữ liệu"**: `Thuốc (Drugs)`
3. Chọn **"Định dạng file"**: `PDF (Công văn Bộ Y tế)`
4. Click **"Chọn file"** và chọn file PDF công văn
5. Click **"Import"**

#### Bước 3: Kiểm tra kết quả
- Hệ thống sẽ hiển thị số lượng records đã import thành công
- Nếu có lỗi, sẽ hiển thị số lượng records có lỗi

### 📄 Định Dạng PDF Được Hỗ Trợ

#### Loại công văn:
- **Quyết định về việc ban hành Danh mục thuốc được gia hạn giấy đăng ký**
- Ví dụ: `720/QĐ-QLD` - Danh mục 42 thuốc sản xuất trong nước được gia hạn

#### Cấu trúc PDF:
1. **Trang QUYẾT ĐỊNH** với:
   - Bộ Y tế - Cục Quản lý Dược
   - Số quyết định
   - Ngày ban hành

2. **Phụ lục I, II, III** với:
   - Phụ lục I: Thuốc gia hạn 05 năm
   - Phụ lục II: Thuốc gia hạn 03 năm
   - Phụ lục III: Thuốc gia hạn đến ngày cụ thể

3. **Bảng danh mục thuốc** với các cột:
   - STT (Số thứ tự)
   - Tên thuốc
   - Hoạt chất chính - Hàm lượng
   - Dạng bào chế
   - Quy cách đóng gói
   - Tiêu chuẩn
   - Tuổi thọ (tháng)
   - **SĐK Gia hạn (Mới)** - Format: `893100493025 (VD-4878-14)`
   - Số lần gia hạn

### 🔍 Thông Tin Được Extract

Hệ thống sẽ tự động extract:
- ✅ **Tên thuốc** - Từ cột "Tên thuốc"
- ✅ **Hoạt chất** - Từ cột "Hoạt chất chính - Hàm lượng"
- ✅ **Dạng bào chế** - Từ cột "Dạng bào chế"
- ✅ **Số đăng ký mới** - 12 chữ số (893100493025)
- ✅ **Số đăng ký cũ** - Trong ngoặc (VD-4878-14)
- ✅ **Tuổi thọ** - Số tháng (36, 24, 48)
- ✅ **Cơ sở đăng ký/Sản xuất** - Từ header của nhóm thuốc

### ⚠️ Thông Tin Mặc Định

Vì PDF không chứa đầy đủ thông tin, hệ thống sẽ tự động điền:
- **Liều lượng**: "Theo chỉ định"
- **Ngày sản xuất**: Ngày hiện tại
- **Số lô**: Tự động tạo từ số đăng ký + STT
- **Kết quả kiểm định**: "đạt"
- **Cơ quan kiểm định**: "Bộ Y tế - Cục Quản lý Dược"

**Lưu ý**: Bạn có thể chỉnh sửa các thông tin này sau khi import.

---

## 📊 2. IMPORT TỪ CSV/EXCEL

### 🎯 Cách Sử Dụng

#### Bước 1: Chuẩn bị file
- Export từ Google Sheet sang CSV hoặc Excel
- Đảm bảo có header row (dòng đầu tiên là tên cột)
- Encoding UTF-8 để hiển thị tiếng Việt đúng

#### Bước 2: Import vào hệ thống
1. Vào trang **Import/Export**
2. Chọn **"Thuốc (Drugs)"**
3. Chọn **"CSV/Excel (Thông thường)"**
4. Upload file CSV/Excel
5. Click **"Import"**

### 📋 Cấu Trúc File CSV/Excel

#### Cột bắt buộc:
- **Tên thuốc** (hoặc `name`) - **BẮT BUỘC**
  - Ví dụ: "Iodine", "Prednison 5 mg"

#### Các cột tùy chọn (sẽ được điền mặc định nếu thiếu):
- **Hoạt chất - Hàm lượng** (hoặc `activeIngredient`, `Thành phần`, `Hoạt chất`)
- **Dạng bào chế** (hoặc `form`, `Dạng bào chế`)
- **SĐK Gia hạn (Mới)** (hoặc `registrationNumber`, `Số đăng ký`, `SĐK`)
- **SĐK Cũ** (hoặc `SĐK Cũ`)
- **Số lô** (hoặc `batchNumber`, `Số lô`)
- **Ngày sản xuất** (hoặc `productionDate`, `Ngày sản xuất`)
- **Hạn sử dụng** (hoặc `expiryDate`, `Hạn sử dụng`, `Ngày hết hạn`)
- **Tuổi thọ (tháng)** (hoặc `shelfLife`, `Tuổi thọ`)
- **Cơ sở Đăng ký / Sản xuất** (hoặc `manufacturerName`)

### ✅ Các Cột Được Hỗ Trợ (Tự Động Nhận Diện)

Hệ thống tự động nhận diện các tên cột sau (không phân biệt hoa thường):

| Loại | Tên cột được hỗ trợ |
|------|-------------------|
| **Tên thuốc** | `name`, `Tên thuốc`, `Tên Thuốc`, `TEN THUOC` |
| **Hoạt chất** | `activeIngredient`, `Thành phần`, `Hoạt chất`, `Hoạt chất - Hàm lượng` |
| **Dạng bào chế** | `form`, `Dạng bào chế`, `dạng bào chế`, `Dạng Bào Chế` |
| **Số đăng ký** | `registrationNumber`, `SĐK Gia hạn (Mới)`, `SĐK Gia hạn`, `Số đăng ký`, `SĐK` |
| **Số đăng ký cũ** | `SĐK Cũ`, `Số đăng ký đã cấp`, `oldRegistrationNumber` |
| **Số lô** | `batchNumber`, `Số lô`, `số lô`, `Số Lô`, `Batch Number` |
| **Ngày sản xuất** | `productionDate`, `Ngày sản xuất`, `ngày sản xuất`, `Ngày Sản Xuất` |
| **Hạn sử dụng** | `expiryDate`, `Hạn sử dụng`, `hạn sử dụng`, `Hạn Sử Dụng`, `Ngày hết hạn` |
| **Tuổi thọ** | `shelfLife`, `Tuổi thọ`, `Tuổi thọ (tháng)`, `Shelf life (months)` |

### 📝 Ví Dụ File CSV

#### Format 1: Đầy đủ thông tin
```csv
Tên thuốc,Hoạt chất - Hàm lượng,Dạng bào chế,SĐK Gia hạn (Mới),SĐK Cũ,Cơ sở Đăng ký / Sản xuất,Ngày sản xuất,Hạn sử dụng
Iodine,Povidone iodine 10% (w/v),Dung dịch dùng ngoài,893100493025,VS-4878-14,BIDIPHAR,2025-01-01,2026-01-01
Prednison 5 mg,Prednison 5mg,Viên nén,893110493125,VD-22739-15,Dược Enlie,2025-01-01,2026-01-01
```

#### Format 2: Tối thiểu (chỉ có tên thuốc)
```csv
Tên thuốc
Iodine
Prednison 5 mg
Amoxicilin/Acid clavulanic 250/31,25
```

### ⚠️ Lưu Ý Quan Trọng

1. **Header row bắt buộc**: File CSV phải có dòng đầu tiên là tên cột
2. **Encoding UTF-8**: Để hiển thị tiếng Việt đúng
3. **Tên thuốc là bắt buộc**: Nếu thiếu sẽ bỏ qua dòng đó
4. **Các cột khác**: Sẽ được điền mặc định nếu thiếu
5. **Kích thước file**: Tối đa 10MB
6. **Format ngày**: YYYY-MM-DD hoặc DD/MM/YYYY

---

## 🔧 Xử Lý Sau Khi Import

### 1. Kiểm tra dữ liệu đã import
- Vào trang **"Quản lý Thuốc"**
- Tìm các thuốc mới được import

### 2. Cập nhật thông tin thiếu
- Click vào từng thuốc để chỉnh sửa
- Bổ sung thông tin còn thiếu

---

## 🐛 Xử Lý Lỗi

### Nếu import thất bại:
1. **Kiểm tra file**:
   - File có đúng format không?
   - File có bị hỏng không?
   - Kích thước file có < 10MB không?

2. **Kiểm tra encoding**:
   - File CSV phải là UTF-8
   - File PDF phải là text-based (không phải scan)

3. **Thử lại**:
   - Refresh trang
   - Upload lại file
   - Kiểm tra console để xem lỗi chi tiết

---

## 📥 File Mẫu

Đã tạo file mẫu `MAU_IMPORT_THUOC.csv` trong thư mục dự án. Bạn có thể:
1. Mở file này để xem cấu trúc
2. Copy dữ liệu từ Google Sheet vào file này
3. Import vào hệ thống

---

**Last Updated:** 2024-12-06

