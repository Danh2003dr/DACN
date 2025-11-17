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
- Nhập đầy đủ: tiêu đề, mô tả chi tiết, loại nhiệm vụ, mức độ ưu tiên, thời hạn, người thực hiện
- Có thể gắn với lô thuốc hoặc chuỗi cung ứng cụ thể (batchNumber, SupplyChain)
- Hỗ trợ phân loại theo nhóm (logistics, quality, compliance, maintenance, training, ...)
- Cho phép ước lượng thời gian/cost thực hiện và đính kèm tài liệu liên quan
- Tự động gửi thông báo cho người được giao khi tạo nhiệm vụ mới

#### Theo dõi và đánh giá
- Bảng nhiệm vụ có lọc theo trạng thái, mức độ ưu tiên, loại nhiệm vụ và từ khóa tìm kiếm
- Thống kê nhanh: tổng số nhiệm vụ, đang thực hiện, đã hoàn thành, quá hạn
- Cập nhật tiến độ bằng các bản ghi `update` (trạng thái, % hoàn thành, ghi chú, file đính kèm), hiển thị dạng timeline
- Chỉ người giao hoặc người được giao mới được cập nhật; Admin có thể xóa nhiệm vụ không còn cần thiết
- Sau khi hoàn thành, người giao có thể chấm điểm (1–5 sao) và nhận xét chất lượng để đánh giá hiệu quả thực hiện

### 2.5 Module Quản lý Thông báo

#### Tạo và gửi thông báo
- Nhập tiêu đề, nội dung, loại thông báo (hệ thống, thu hồi thuốc, giao nhiệm vụ, cập nhật chuỗi cung ứng, cảnh báo chất lượng, khẩn cấp...)
- Chọn mức độ ưu tiên (thấp, trung bình, cao, khẩn cấp) để phân biệt trên giao diện
- Chọn phạm vi gửi: toàn hệ thống, theo vai trò (admin, manufacturer, distributor, hospital, patient) hoặc danh sách người dùng cụ thể
- Có chế độ "Thông báo hệ thống khẩn cấp" dành riêng cho Admin để gửi nhanh các cảnh báo quan trọng (thu hồi thuốc, sự cố chất lượng)

#### Quản lý thông báo
- Phân tách rõ "Thông báo nhận được" và "Thông báo đã gửi", có phân trang và thống kê (tổng, chưa đọc, ưu tiên cao, khẩn cấp)
- Tìm kiếm theo tiêu đề/nội dung, lọc theo loại thông báo, mức độ ưu tiên, và tùy chọn chỉ xem thông báo chưa đọc
- Đánh dấu từng thông báo hoặc tất cả thông báo là "đã đọc", xem chi tiết thông tin người gửi, thời gian, số người đã xem
- Admin và người gửi có thể xóa thông báo của mình; bệnh nhân chỉ nhận các thông báo công khai phù hợp với phạm vi

### 2.6 Module Đánh giá và Góp ý

#### Đánh giá ẩn danh
- Hỗ trợ đánh giá cho nhiều đối tượng: lô thuốc, nhà phân phối, bệnh viện, nhà sản xuất
- Người dùng có thể đánh giá ẩn danh hoặc theo tài khoản; thông tin người đánh giá được bảo vệ khi chọn ẩn danh
- Điểm tổng thể (1–5 sao) kèm nội dung góp ý; với thuốc có thêm tiêu chí chi tiết như chất lượng, hiệu quả, tác dụng phụ, đóng gói
- Hỗ trợ nhập thông tin xác minh (batchNumber, blockchainId, đơn hàng...) để phân biệt đánh giá đã mua/đã sử dụng

#### Quản lý đánh giá
- Hiển thị danh sách đánh giá công khai với bộ lọc theo điểm số, loại đối tượng và trạng thái
- Người dùng có thể vote "hữu ích" và báo cáo đánh giá không phù hợp; hệ thống lưu lại số lượng vote và báo cáo
- Admin có giao diện riêng để duyệt, từ chối hoặc xóa đánh giá; đánh giá vi phạm có thể bị gắn cờ (flagged)
- Thống kê phân bố điểm số, đánh giá đã xác minh và ẩn danh; liệt kê các đối tượng được đánh giá cao để làm cơ sở cải thiện chuỗi cung ứng

### 2.7 Module Thống kê và Báo cáo

#### Dashboard KPI tự động hóa
- **KPI Thuốc**: Tỷ lệ hợp lệ, tỷ lệ thu hồi, blockchain coverage, chữ ký số coverage, số ngày trung bình đến hết hạn
- **KPI Chuỗi cung ứng**: Tỷ lệ hoàn thành, trung bình số bước/chuỗi, thời gian hoàn thành trung bình, tỷ lệ có vấn đề
- **KPI Chất lượng**: Điểm đánh giá trung bình, tỷ lệ xác minh, tỷ lệ đạt kiểm định, tỷ lệ khiếu nại
- **KPI Hiệu quả**: Tỷ lệ hoàn thành nhiệm vụ, tỷ lệ đúng hạn, thời gian hoàn thành trung bình, đánh giá hiệu quả
- **KPI Tuân thủ**: Tỷ lệ chữ ký số hợp lệ, tỷ lệ timestamp, tỷ lệ đọc thông báo, số chứng chỉ hết hạn
- **Đánh giá KPI**: Hệ thống tự động đánh giá từ A (Xuất sắc) đến D (Cần cải thiện) dựa trên các chỉ số
- **KPI Time Series**: Dữ liệu KPI theo thời gian (30 ngày, 90 ngày) để vẽ biểu đồ xu hướng

#### Cảnh báo thời gian thực
- **Cảnh báo Thuốc**: Thuốc đã hết hạn, sắp hết hạn (7 ngày), bị thu hồi, chưa có blockchain
- **Cảnh báo Chuỗi cung ứng**: Chuỗi bị trễ, có vấn đề, không hoàn thành đúng hạn
- **Cảnh báo Nhiệm vụ**: Nhiệm vụ quá hạn, sắp đến hạn (3 ngày), cần xử lý
- **Cảnh báo Tuân thủ**: Chứng chỉ số hết hạn, chữ ký số chưa có timestamp
- **Cảnh báo Chất lượng**: Thuốc không đạt kiểm định, đánh giá tiêu cực (1-2 sao)
- **Tự động làm mới**: Cảnh báo tự động cập nhật mỗi 30 giây, hiển thị badge số lượng cảnh báo khẩn cấp
- **Phân loại ưu tiên**: Critical (khẩn cấp), High (cao), Medium (trung bình), Low (thấp)

#### Xuất báo cáo động
- **Định dạng đa dạng**: Excel (.xlsx), PDF (.pdf), CSV (.csv) với template tùy chỉnh
- **Tùy chọn cột**: Người dùng chọn các cột muốn xuất trong báo cáo
- **Bộ lọc nâng cao**: Lọc theo ngày, trạng thái, loại, nhóm theo nhiều tiêu chí
- **Sắp xếp tùy chỉnh**: Sắp xếp dữ liệu theo nhiều cột và thứ tự
- **Template báo cáo**: Nhiều template sẵn có cho cơ quan quản lý (Bộ Y tế, Sở Y tế, FDA...)
- **Báo cáo tự động**: Có thể lên lịch xuất báo cáo định kỳ (hàng ngày, tuần, tháng)
- **Báo cáo chuyên biệt**: Hành trình phân phối, đánh giá chất lượng, thuốc nghi vấn giả

### 2.8 Module Quét mã QR & Xác minh thuốc

#### Chức năng quét QR
- Trang riêng `Quét QR` hỗ trợ 3 phương thức: quét trực tiếp bằng camera, tải ảnh chứa QR code, hoặc nhập mã thủ công (blockchainId, drugId, batchNumber)
- Sử dụng thư viện ZXing trên frontend để giải mã QR từ video và ảnh; backend chấp nhận nhiều định dạng dữ liệu (URL verify, JSON, chuỗi thuần)

#### Xử lý và hiển thị kết quả
- Tự động trích xuất và chuẩn hóa dữ liệu từ QR, tra cứu lô thuốc tương ứng trong cơ sở dữ liệu và trên blockchain
- Hiển thị chi tiết: thông tin lô thuốc, kết quả kiểm định, hành trình phân phối, trạng thái lưu trữ trên blockchain (blockchainId, transactionHash, blockNumber...)
- Cảnh báo trực quan khi thuốc bị **thu hồi**, **hết hạn** hoặc **gần hết hạn**, nhưng vẫn cho phép xem đầy đủ thông tin để ra quyết định
- Lưu lịch sử quét gần đây (thành công/thất bại) để người dùng và quản trị viên có thể theo dõi các lần kiểm tra thuốc nghi vấn

### 2.9 Module Chữ ký số & Tiêu chuẩn

#### Ký số theo chuẩn Việt Nam
- Hỗ trợ ký số cho các đối tượng: lô thuốc, chuỗi cung ứng, kết quả kiểm định chất lượng, thông báo thu hồi, giao nhận phân phối
- Tích hợp với **CA Quốc gia Việt Nam** (VNCA) và các nhà cung cấp chứng chỉ số khác (Viettel CA, FPT CA, Bkav CA, Vietnam Post CA)
- Mỗi chữ ký số bao gồm: thông tin người ký (tên, vai trò, tổ chức), chứng chỉ số (số seri, CA provider, thời hạn hiệu lực), hash dữ liệu (SHA-256), chữ ký (RSA-SHA256), và metadata

#### Timestamp Authority (TSA)
- Tích hợp **Timestamp Authority** để tăng giá trị pháp lý: mỗi chữ ký số có thể được đóng dấu thời gian từ TSA server (mô phỏng `https://tsa.vnca.gov.vn`)
- Timestamp token chứa: thời điểm được timestamp, hash của dữ liệu, thông tin TSA, và được lưu kèm với chữ ký số
- Xác thực timestamp token để đảm bảo tính toàn vẹn và thời điểm ký không thể bị thay đổi

#### Quản lý và xác thực chữ ký số
- Giao diện quản lý chữ ký số: danh sách tất cả chữ ký (lọc theo trạng thái, loại đối tượng, người ký), thống kê (tổng số, đang hoạt động, đã hết hạn, đã thu hồi)
- Chức năng ký số: chọn đối tượng cần ký (lô thuốc, chuỗi cung ứng...), chọn CA provider, tùy chọn yêu cầu timestamp, xem trước và xác nhận ký
- Xác thực chữ ký số: kiểm tra tính hợp lệ của chữ ký (so sánh hash, verify signature với public key, kiểm tra chứng chỉ số còn hiệu lực, xác thực timestamp token nếu có)
- Thu hồi chữ ký số: chỉ admin hoặc người ký mới được thu hồi, yêu cầu nhập lý do thu hồi, cập nhật trạng thái và lưu lịch sử

#### Bảo mật và tuân thủ
- Chữ ký số được lưu trữ an toàn trong database với đầy đủ thông tin chứng chỉ số và timestamp
- Hỗ trợ kiểm tra trạng thái chứng chỉ số (valid, expired, revoked) và cảnh báo khi chứng chỉ sắp hết hạn
- Mỗi chữ ký số có thể liên kết với blockchain transaction để tăng tính minh bạch và không thể phủ nhận (non-repudiation)
- Phân quyền: chỉ admin, nhà sản xuất, nhà phân phối, bệnh viện mới được ký số; mọi người dùng đều có thể xác thực chữ ký số

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
- **Chữ ký số**: Digital signature theo chuẩn Việt Nam (CA quốc gia) với thuật toán RSA-SHA256, tích hợp Timestamp Authority (TSA) để tăng giá trị pháp lý
- **Hash dữ liệu**: SHA-256 để đảm bảo tính toàn vẹn dữ liệu

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
