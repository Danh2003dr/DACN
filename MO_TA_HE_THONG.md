# HỆ THỐNG QUẢN LÝ NGUỒN GỐC XUẤT XỨ THUỐC TẠI BỆNH VIỆN BẰNG BLOCKCHAIN

## 1. TỔNG QUAN HỆ THỐNG

### 1.1 Bối cảnh và Vấn đề
Hệ thống được phát triển để giải quyết vấn đề nghiêm trọng về thuốc giả và thuốc kém chất lượng tại Việt Nam. Theo báo cáo của Bộ Y tế (tháng 4/2025), ít nhất 21 loại thuốc giả đã được phát hiện tại các tỉnh thành lớn như Hà Nội, TP.HCM, An Giang và Thanh Hóa. Nguyên nhân chính là thiếu minh bạch trong chuỗi cung ứng thuốc, tạo điều kiện cho việc tráo đổi, thay thế hoặc làm giả thuốc.

Theo WHO, thuốc giả chiếm khoảng 10% thị trường dược phẩm ở các nước đang phát triển như Việt Nam, đặc biệt nguy hiểm trong bối cảnh thương mại điện tử phát triển với 50% thuốc bán trực tuyến có nguy cơ là giả.

### 1.2 Mục tiêu chính
- **Đảm bảo minh bạch**: Truy xuất nguồn gốc thuốc từ nhà sản xuất đến bệnh nhân
- **Chống thuốc giả**: Sử dụng blockchain và smart contract để xác minh tính hợp lệ
- **Giao diện thân thiện**: Quét mã QR để tra cứu nguồn gốc thuốc
- **Tăng niềm tin**: Cải thiện uy tín hệ thống y tế và hỗ trợ cơ quan quản lý

### 1.3 Các vai trò người dùng
1. **Admin**: Quản trị toàn hệ thống
2. **Nhà sản xuất**: Ghi thông tin lô thuốc lên blockchain
3. **Nhà phân phối/Bệnh viện**: Quản lý lưu trữ, giao nhận, kiểm định
4. **Bệnh nhân**: Tra cứu nguồn gốc thuốc qua mã QR

## 2. CÁC MODULE CHÍNH CỦA HỆ THỐNG

### 2.1 Module Quản lý Tài khoản Người dùng

#### Chức năng đăng nhập
- **Nhà sản xuất**: Mã định danh doanh nghiệp (do Bộ Y tế cấp)
- **Nhà phân phối/Bệnh viện**: Mã định danh tổ chức
- **Bệnh nhân**: Mã số bệnh nhân hoặc CCCD
- **Bảo mật**: Mật khẩu mặc định, bắt buộc đổi sau lần đăng nhập đầu

#### Quản lý tài khoản
- Cập nhật thông tin cá nhân (tên, địa chỉ, liên hệ)
- Đổi mật khẩu (mã hóa bằng bcrypt)
- Đăng xuất an toàn
- Phân quyền truy cập dựa trên JWT

### 2.2 Module Quản lý Lô Thuốc

#### Thêm lô thuốc mới
- Nhập thông tin chi tiết: mã lô, tên thuốc, thành phần, ngày sản xuất, hạn sử dụng
- Kết quả kiểm định từ cơ quan có thẩm quyền
- Tạo mã QR liên kết với ID trên blockchain
- Ghi dữ liệu lên blockchain với timestamp và chữ ký số

#### Cập nhật và quản lý
- Chỉnh sửa thông tin lô thuốc (hạn sử dụng, kiểm định mới)
- Chỉ Admin có quyền xóa lô thuốc (trường hợp thu hồi)
- Xem danh sách lô thuốc với quyền truy cập phân cấp

### 2.3 Module Quản lý Chuỗi Cung ứng (Core Module)

#### Ghi nhận hành trình thuốc
- **Nhà sản xuất**: Ghi dữ liệu gốc lên blockchain
- **Nhà phân phối**: Cập nhật trạng thái vận chuyển, điều kiện bảo quản
- **Bệnh viện**: Xác nhận nhận hàng, cập nhật lưu trữ, cấp phát cho bệnh nhân
- Mỗi bước được ghi với timestamp và chữ ký số bất biến

#### Truy xuất nguồn gốc
- Quét mã QR để xem thông tin chi tiết
- Hiển thị hành trình từ A → B → C
- Phân quyền xem thông tin (bệnh nhân chỉ xem công khai)

#### Smart Contract
- Tự động xác nhận giao nhận giữa các bên
- Kiểm tra tính hợp lệ (thuốc hết hạn, sai dữ liệu sẽ bị từ chối)
- Phát hiện thuốc giả khi mã QR không khớp dữ liệu blockchain

### 2.4 Module Giao Nhiệm vụ và Theo dõi Tiến độ

#### Tạo nhiệm vụ
- Tiêu đề, mô tả chi tiết, thời hạn, mức độ ưu tiên
- Tệp đính kèm (biên bản, tài liệu liên quan)
- Ví dụ: "Vận chuyển lô thuốc X đến bệnh viện Y trước ngày Z"

#### Theo dõi và đánh giá
- Cập nhật trạng thái: đang xử lý, hoàn thành, quá hạn
- Ghi chú vấn đề, đính kèm kết quả
- Đánh giá chất lượng hoàn thành (tốt, trung bình, kém)

### 2.5 Module Quản lý Thông báo

#### Tạo và gửi thông báo
- Nội dung: tiêu đề, nội dung chính, thời gian
- Gửi đến toàn hệ thống, nhóm cụ thể, hoặc cá nhân
- Ví dụ: "Thu hồi lô thuốc X do lỗi sản xuất"

#### Quản lý thông báo
- Danh sách thông báo theo thứ tự thời gian
- Đánh dấu "đã đọc" để theo dõi
- Bệnh nhân chỉ nhận thông báo công khai

### 2.6 Module Đánh giá và Góp ý

#### Đánh giá ẩn danh
- Đánh giá lô thuốc hoặc nhà phân phối
- Tiêu chí: chất lượng thuốc, thời gian giao hàng, hỗ trợ khách hàng
- Gửi góp ý dạng văn bản tự do
- Bảo vệ danh tính người gửi

#### Quản lý đánh giá
- Xem thống kê đánh giá để cải thiện chuỗi cung ứng
- Khen thưởng nhà phân phối uy tín
- Báo cáo lô thuốc nghi vấn

### 2.7 Module Thống kê và Báo cáo

#### Thống kê hệ thống
- Số lượng lô thuốc, nhà phân phối, bệnh viện, bệnh nhân
- Tỷ lệ hoàn thành nhiệm vụ, số lô nghi vấn
- Thống kê thông báo và đánh giá

#### Xuất báo cáo
- Định dạng Excel/PDF
- Báo cáo hành trình phân phối, đánh giá chất lượng
- Báo cáo lô thuốc nghi vấn giả
- Hỗ trợ cơ quan quản lý giám sát

## 3. KIẾN TRÚC KỸ THUẬT

### 3.1 Công nghệ sử dụng

#### Blockchain
- **Ethereum testnet** (Ropsten/Sepolia) hoặc **Hyperledger Fabric**
- **Smart Contract**: Viết bằng Solidity
- Chức năng: Tự động hóa xác nhận giao nhận, kiểm tra tính hợp lệ

#### Frontend
- **React.js** 
- Tích hợp thư viện quét mã QR (qrcode.react, ZXing)
- Giao diện responsive, thân thiện với người dùng

#### Backend
- **Node.js/Express**
- Kết nối blockchain qua **Web3.js**
- API RESTful cho tất cả các chức năng

#### Cơ sở dữ liệu
- **MongoDB** 
- Lưu trữ: thông tin tài khoản, log hệ thống, cache dữ liệu

### 3.2 Bảo mật

#### Mã hóa dữ liệu
- **Mật khẩu**: bcrypt với salt rounds
- **Dữ liệu nhạy cảm**: AES-256 encryption
- **Chứng chỉ số**: Digital signature cho nhà sản xuất/phân phối

#### Phân quyền và xác thực
- **JWT (JSON Web Token)** cho session management
- **Role-based access control** (RBAC)
- **API authentication** với middleware

#### Bảo mật blockchain
- **Private key management** an toàn
- **Smart contract audit** để tránh lỗ hổng
- **Gas optimization** để giảm chi phí giao dịch

### 3.3 Công cụ phát triển

#### Blockchain Development
- **Truffle/Ganache**: Test blockchain environment
- **Remix IDE**: Viết và deploy smart contract
- **Web3.js/Web3.py**: Tương tác với blockchain

#### DevOps và Deployment
- **Docker**: Containerization
- **Git**: Version control
- **CI/CD pipeline**: Automated testing và deployment

## 4. PHẠM VI VÀ GIỚI HẠN

### 4.1 Quy mô dự án
- **Mô phỏng nhỏ**: 1 nhà sản xuất, 1 nhà phân phối, 1 bệnh viện
- **Dữ liệu mẫu**: 20-50 lô thuốc giả lập
- **Môi trường test**: Không kết nối thực tế với Bộ Y tế

### 4.2 Chức năng cốt lõi
- Ghi nhận lô thuốc lên blockchain
- Theo dõi hành trình phân phối
- Truy xuất nguồn gốc qua mã QR
- Xác nhận giao nhận tự động
- Phát hiện thuốc giả

### 4.3 Giới hạn kỹ thuật
- Không tích hợp phần cứng IoT (theo dõi nhiệt độ)
- Không kết nối hệ thống y tế hiện có (HIS)
- Không xử lý vấn đề pháp lý phức tạp
- Chỉ sử dụng testnet, không triển khai mainnet

## 5. KẾT QUẢ MONG ĐỢI

### 5.1 Sản phẩm hoàn thiện
- **Hệ thống web/app** chạy trên localhost hoặc testnet
- **Demo quét mã QR** hiển thị thông tin lô thuốc
- **Phát hiện thuốc giả** khi mã QR không hợp lệ
- **Giao diện admin** để quản lý hệ thống

### 5.2 Tài liệu dự án
- **Báo cáo chi tiết**: Phân tích, thiết kế, triển khai, kiểm thử
- **Slide thuyết trình**: Trình bày tính sáng tạo và thực tiễn
- **Source code**: Đầy đủ với comment và documentation
- **User manual**: Hướng dẫn sử dụng cho từng vai trò

### 5.3 Đánh giá hiệu quả
- **Tính khả thi**: Hệ thống hoạt động ổn định trên testnet
- **Bảo mật**: Các biện pháp bảo mật được triển khai đúng
- **Tính thực tiễn**: Giải quyết được vấn đề thuốc giả trong phạm vi demo
- **Khả năng mở rộng**: Có thể phát triển thêm cho môi trường thực tế

## 6. LỢI ÍCH VÀ THÁCH THỨC

### 6.1 Lợi ích
- **Chống thuốc giả hiệu quả**: Phát hiện sớm thuốc không có nguồn gốc
- **Minh bạch hoàn toàn**: Tăng niềm tin của bệnh nhân và bệnh viện
- **Tự động hóa quy trình**: Giảm thời gian xử lý, tăng độ chính xác
- **Phù hợp xu hướng**: Đáp ứng chiến lược số hóa y tế Việt Nam 2030

### 6.2 Thách thức và giải pháp
- **Chi phí blockchain**: Sử dụng testnet miễn phí
- **Triển khai thực tế**: Đề xuất pilot project, không thay thế hoàn toàn hệ thống cũ
- **Bảo mật dữ liệu**: Mã hóa mạnh và phân quyền chặt chẽ
- **Học tập công nghệ**: Tài liệu miễn phí từ Ethereum.org, Truffle Suite

---

*Tài liệu này mô tả chi tiết hệ thống quản lý nguồn gốc xuất xứ thuốc bằng blockchain, phù hợp cho đồ án tốt nghiệp với tính thực tiễn cao và khả năng ứng dụng trong tương lai.*
