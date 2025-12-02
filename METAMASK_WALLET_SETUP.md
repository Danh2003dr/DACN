# 🦊 HƯỚNG DẪN TẠO WALLET METAMASK - BƯỚC TIẾP THEO

Bạn đang ở màn hình **"Chào mừng" (Welcome)** của MetaMask. Đây là các bước tiếp theo:

## 🎯 BƯỚC HIỆN TẠI: Chọn tạo ví mới

Bạn thấy 2 nút:
- **"Tạo ví mới"** (Create a new wallet) - Nếu chưa có wallet
- **"Tôi đã có ví"** (I already have a wallet) - Nếu đã có wallet từ trước

### ✅ Nếu chưa có wallet → Click **"Tạo ví mới"**

---

## 📋 CÁC BƯỚC TIẾP THEO (Sau khi click "Tạo ví mới")

### Bước 1: Đồng ý với Điều khoản

1. **Đọc Terms of Service** (Tùy chọn, nhưng nên đọc)
2. **Click checkbox** "Tôi đồng ý với Điều khoản dịch vụ" (I agree to Terms of Service)
3. **Click "Tạo ví"** hoặc "Next"

---

### Bước 2: Tạo Password (QUAN TRỌNG)

1. **Nhập password mạnh:**
   - Ít nhất 8 ký tự
   - Nên có: chữ hoa, chữ thường, số, ký tự đặc biệt
   - Ví dụ: `MyWallet2024!Secure`

2. **Xác nhận password:**
   - Nhập lại password vừa tạo
   - Phải khớp với password đầu tiên

3. **Click "Tạo ví"** hoặc "Next"

**⚠️ LƯU Ý:**
- Password này dùng để unlock MetaMask trên máy này
- Nếu quên password, vẫn có thể khôi phục bằng Secret Recovery Phrase
- Nhưng nếu quên cả password VÀ Secret Recovery Phrase → Mất wallet vĩnh viễn!

---

### Bước 3: Lưu Secret Recovery Phrase (CỰC KỲ QUAN TRỌNG!)

**Đây là bước QUAN TRỌNG NHẤT!**

1. **MetaMask sẽ hiển thị 12 từ (hoặc 24 từ):**
   - Ví dụ: `apple banana cat dog elephant fish ...`
   - Đây là **Secret Recovery Phrase** (Cụm từ khôi phục bí mật)

2. **Ghi chép lại 12 từ này:**
   - ✅ **Viết tay** vào giấy (khuyên dùng nhất)
   - ✅ Hoặc lưu vào password manager (1Password, LastPass, etc.)
   - ✅ Hoặc lưu vào file text được mã hóa
   - ❌ **KHÔNG** chụp ảnh màn hình
   - ❌ **KHÔNG** lưu trên cloud (Google Drive, iCloud, etc.)
   - ❌ **KHÔNG** gửi qua email
   - ❌ **KHÔNG** chia sẻ với ai

3. **Click "Next"** sau khi đã ghi chép xong

**⚠️ CẢNH BÁO:**
- Nếu mất Secret Recovery Phrase → **KHÔNG THỂ** khôi phục wallet
- Ai có Secret Recovery Phrase → Có thể truy cập wallet của bạn
- Lưu ở nơi an toàn, không dễ mất

---

### Bước 4: Xác nhận Secret Recovery Phrase

1. **MetaMask sẽ yêu cầu chọn các từ theo thứ tự:**
   - Ví dụ: "Chọn từ thứ 3" → Chọn từ thứ 3 trong 12 từ bạn đã ghi
   - Ví dụ: "Chọn từ thứ 7" → Chọn từ thứ 7 trong 12 từ bạn đã ghi
   - Lặp lại 3-4 lần

2. **Mục đích:**
   - Đảm bảo bạn đã ghi chép đúng
   - Đảm bảo bạn nhớ thứ tự các từ

3. **Click "Xác nhận"** hoặc "Confirm" sau khi chọn đúng

**💡 Mẹo:**
- Nếu chọn sai, MetaMask sẽ báo lỗi
- Phải chọn đúng thứ tự mới được tiếp tục

---

### Bước 5: Hoàn tất - Wallet đã được tạo!

1. **Bạn sẽ thấy màn hình thành công:**
   - "Ví của bạn đã sẵn sàng!" (Your wallet is ready!)
   - Hoặc "Chào mừng đến với MetaMask!" (Welcome to MetaMask!)

2. **Click "Hoàn tất"** hoặc "Get Started"

3. **Bạn sẽ thấy màn hình chính của MetaMask:**
   - Địa chỉ wallet (bắt đầu với `0x...`)
   - Balance: 0 ETH
   - Network: Ethereum Mainnet (mặc định)

---

## 🎯 BƯỚC TIẾP THEO: Chuyển sang Sepolia Testnet

Sau khi tạo wallet xong, bạn cần chuyển sang Sepolia Testnet để có thể nhận test ETH và deploy contract.

**Tại sao cần Sepolia?**
- Sepolia là testnet (mạng thử nghiệm)
- Test ETH miễn phí, không có giá trị thực
- Dùng để test và develop mà không tốn phí

---

### Cách 1: Chọn từ danh sách có sẵn (Nhanh nhất - Khuyên dùng)

**Bước 1.1: Mở MetaMask**

1. **Click icon MetaMask** trên browser toolbar (góc trên bên phải)
   - Icon hình con cáo màu cam
   - Hoặc click icon puzzle (Extensions) → MetaMask

2. **Nếu MetaMask bị khóa:**
   - Nhập password để unlock
   - Click "Unlock"

**Bước 1.2: Tìm network dropdown**

1. **Ở góc trên cùng của cửa sổ MetaMask:**
   - Bạn sẽ thấy tên network hiện tại (mặc định là "Ethereum Mainnet")
   - Có thể thấy icon mạng lưới hoặc tên "Ethereum Mainnet"
   - Bên cạnh có icon mũi tên xuống (▼) hoặc icon mạng lưới

2. **Click vào network dropdown:**
   - Click vào tên network hoặc icon mũi tên
   - Một menu dropdown sẽ mở ra

**Bước 1.3: Chọn Sepolia từ danh sách**

1. **Trong menu dropdown, bạn sẽ thấy danh sách networks:**
   - Ethereum Mainnet (mặc định)
   - Sepolia test network
   - Goerli test network (deprecated)
   - Polygon Mainnet
   - BSC Mainnet
   - ... và các networks khác

2. **Scroll xuống** trong danh sách để tìm "Sepolia test network"
   - Có thể có icon testnet (biểu tượng ống nghiệm hoặc chữ "Test")
   - Tên đầy đủ: "Sepolia test network" hoặc chỉ "Sepolia"

3. **Click vào "Sepolia test network"**
   - MetaMask sẽ tự động chuyển sang Sepolia
   - Có thể có popup xác nhận "Switch to Sepolia test network?" → Click "Switch network"

**Bước 1.4: Xác nhận đã chuyển sang Sepolia**

1. **Kiểm tra network hiện tại:**
   - Ở góc trên cùng, bạn sẽ thấy "Sepolia" thay vì "Ethereum Mainnet"
   - Có thể có icon testnet (ống nghiệm) bên cạnh

2. **Kiểm tra balance:**
   - Balance sẽ hiển thị "0 ETH" (chưa có test ETH)
   - Địa chỉ wallet vẫn giữ nguyên (ví dụ: `0x1234...5678`)

3. **Nếu thấy "Sepolia" ở góc trên → ✅ Thành công!**

---

### Cách 2: Thêm network thủ công (Nếu không thấy Sepolia trong danh sách)

**Khi nào dùng cách này?**
- Không thấy "Sepolia" trong danh sách networks
- Muốn dùng RPC URL riêng (có API key của bạn)
- Muốn tùy chỉnh cấu hình network

**Bước 2.1: Mở network dropdown**

1. **Click vào network dropdown** (góc trên cùng)
2. **Scroll xuống cuối danh sách**
3. **Tìm và click "Add network"** hoặc "Thêm mạng"
   - Có thể có icon dấu cộng (+)
   - Hoặc "Add a network" / "Thêm mạng"

**Bước 2.2: Chọn "Add a network manually"**

1. **MetaMask sẽ hiển thị 2 tùy chọn:**
   - "Add a network" (từ danh sách phổ biến)
   - "Add a network manually" hoặc "Thêm mạng thủ công"

2. **Click "Add a network manually"** hoặc "Thêm mạng thủ công"
   - Đây là tùy chọn ở cuối cùng
   - Cho phép bạn nhập thông tin network thủ công

**Bước 2.3: Nhập thông tin Sepolia**

Một form sẽ hiển thị với các trường cần điền:

1. **Network Name:**
   - Nhập: `Sepolia`
   - Hoặc: `Sepolia Testnet`
   - Đây là tên hiển thị trong MetaMask

2. **New RPC URL:**
   - Nhập: `https://sepolia.infura.io/v3/c7b0ee9f14774684a619e43305849f6f`
   - Đây là RPC endpoint với API key của bạn
   - **Lưu ý:** Đảm bảo copy đúng, không có khoảng trắng thừa

3. **Chain ID:**
   - Nhập: `11155111`
   - Đây là Chain ID của Sepolia Testnet
   - Phải chính xác, không được sai

4. **Currency Symbol:**
   - Nhập: `ETH`
   - Hoặc: `SepoliaETH`
   - Đây là ký hiệu tiền tệ hiển thị

5. **Block Explorer URL (Optional):**
   - Nhập: `https://sepolia.etherscan.io`
   - Đây là URL để xem transactions trên Etherscan
   - Có thể để trống, nhưng nên điền để tiện xem transactions

**Bước 2.4: Lưu network**

1. **Kiểm tra lại thông tin:**
   - Đảm bảo tất cả các trường đã điền đúng
   - Đặc biệt chú ý Chain ID: `11155111`

2. **Click "Save"** hoặc "Lưu" ở cuối form
   - MetaMask sẽ validate thông tin
   - Nếu có lỗi, sẽ hiển thị thông báo (ví dụ: "Invalid RPC URL")

3. **Nếu thành công:**
   - MetaMask sẽ tự động chuyển sang Sepolia network
   - Bạn sẽ thấy "Sepolia" ở góc trên

**Bước 2.5: Xác nhận**

1. **Kiểm tra network:**
   - Ở góc trên cùng, bạn sẽ thấy "Sepolia"
   - Balance hiển thị "0 ETH"

2. **Kiểm tra RPC connection:**
   - MetaMask sẽ tự động test kết nối RPC
   - Nếu RPC URL sai, sẽ có thông báo lỗi

---

### Cách 3: Sử dụng chainlist.org (Dễ nhất - Khuyên dùng cho người mới)

**Ưu điểm:**
- Tự động điền thông tin network
- Không cần nhập thủ công
- Hỗ trợ nhiều networks

**Bước 3.1: Truy cập chainlist.org**

1. **Mở browser** và truy cập: https://chainlist.org
2. **Đảm bảo MetaMask đã được cài đặt** và unlock

**Bước 3.2: Kết nối MetaMask**

1. **Trên trang chainlist.org, click "Connect Wallet"**
   - Ở góc trên bên phải
   - Hoặc ở giữa trang

2. **Chọn "MetaMask"** từ danh sách wallets
   - MetaMask popup sẽ xuất hiện
   - Yêu cầu kết nối với chainlist.org

3. **Xác nhận trong MetaMask:**
   - Click "Next" trong MetaMask popup
   - Click "Connect" để cho phép chainlist.org truy cập
   - MetaMask sẽ kết nối với chainlist.org

**Bước 3.3: Tìm Sepolia**

1. **Trên trang chainlist.org:**
   - Bạn sẽ thấy danh sách networks
   - Có ô tìm kiếm ở trên cùng

2. **Gõ "Sepolia"** vào ô tìm kiếm
   - Kết quả sẽ hiển thị "Sepolia" network
   - Có thể có nhiều kết quả, chọn "Sepolia" (Chain ID: 11155111)

3. **Tìm network "Sepolia"** trong kết quả:
   - Chain ID: 11155111
   - Network: Sepolia
   - Currency: ETH

**Bước 3.4: Thêm Sepolia vào MetaMask**

1. **Click "Add to MetaMask"** bên cạnh Sepolia
   - Có thể có icon dấu cộng (+) hoặc nút "Add to MetaMask"

2. **Xác nhận trong MetaMask popup:**
   - MetaMask sẽ hiển thị thông tin network
   - Click "Approve" để thêm network
   - Click "Switch network" để chuyển sang Sepolia ngay

3. **Nếu thành công:**
   - MetaMask sẽ tự động chuyển sang Sepolia
   - Bạn sẽ thấy "Sepolia" ở góc trên

---

## ✅ KIỂM TRA ĐÃ CHUYỂN SANG SEPOLIA THÀNH CÔNG

Sau khi chuyển sang Sepolia, kiểm tra:

1. **Network hiển thị:**
   - ✅ Ở góc trên cùng: "Sepolia" (thay vì "Ethereum Mainnet")
   - ✅ Có thể có icon testnet (ống nghiệm)

2. **Balance:**
   - ✅ Hiển thị "0 ETH" (chưa có test ETH)
   - ✅ Địa chỉ wallet vẫn giữ nguyên

3. **Kiểm tra trên Etherscan:**
   - Copy địa chỉ wallet
   - Truy cập: https://sepolia.etherscan.io/address/YOUR_WALLET_ADDRESS
   - Thay `YOUR_WALLET_ADDRESS` bằng địa chỉ wallet của bạn
   - Nếu thấy trang wallet trên Sepolia Etherscan → ✅ Thành công!

---

## 🆘 TROUBLESHOOTING

### Lỗi: "Invalid RPC URL"

**Nguyên nhân:**
- RPC URL sai format
- API key không hợp lệ
- Network không kết nối được

**Giải pháp:**
1. Kiểm tra RPC URL đúng chưa: `https://sepolia.infura.io/v3/c7b0ee9f14774684a619e43305849f6f`
2. Kiểm tra không có khoảng trắng thừa
3. Thử dùng RPC URL khác:
   - `https://rpc.sepolia.org`
   - `https://sepolia.gateway.tenderly.co`
   - `https://sepolia.infura.io/v3/YOUR_INFURA_KEY`

### Lỗi: "Chain ID mismatch"

**Nguyên nhân:**
- Chain ID sai (phải là `11155111`)

**Giải pháp:**
1. Kiểm tra Chain ID: `11155111` (không có khoảng trắng)
2. Xóa network cũ và thêm lại

### Lỗi: "Network already exists"

**Nguyên nhân:**
- Sepolia đã được thêm vào MetaMask trước đó

**Giải pháp:**
1. Tìm Sepolia trong danh sách networks
2. Click vào để chuyển sang
3. Hoặc vào Settings → Networks → Tìm Sepolia → Click để chuyển

### Lỗi: "Failed to add network"

**Nguyên nhân:**
- Kết nối internet không ổn định
- RPC endpoint không hoạt động

**Giải pháp:**
1. Kiểm tra kết nối internet
2. Thử lại sau vài phút
3. Thử dùng cách 3 (chainlist.org) thay vì cách 2

### Không thấy "Sepolia" trong danh sách

**Nguyên nhân:**
- MetaMask chưa cập nhật danh sách networks mới nhất

**Giải pháp:**
1. Update MetaMask lên phiên bản mới nhất
2. Dùng cách 2 (thêm thủ công) hoặc cách 3 (chainlist.org)

---

## 📋 CHECKLIST

Sau khi hoàn tất, bạn cần có:

- [ ] ✅ MetaMask đã chuyển sang Sepolia network
- [ ] ✅ Ở góc trên hiển thị "Sepolia" (không phải "Ethereum Mainnet")
- [ ] ✅ Balance hiển thị "0 ETH"
- [ ] ✅ Địa chỉ wallet vẫn giữ nguyên
- [ ] ✅ Có thể xem wallet trên https://sepolia.etherscan.io

---

**Tiếp theo:** Export Private Key và lấy Sepolia ETH! 🚀

---

## 📋 CHECKLIST SAU KHI TẠO WALLET

Sau khi hoàn tất các bước trên, bạn cần:

- [ ] ✅ Wallet đã được tạo thành công
- [ ] ✅ Secret Recovery Phrase đã được ghi chép và lưu an toàn
- [ ] ✅ Đã chuyển sang Sepolia Testnet
- [ ] ✅ Đã thấy địa chỉ wallet (ví dụ: `0x1234...5678`)
- [ ] ✅ Balance hiển thị "0 ETH" (chưa có ETH)

---

## 🔐 BƯỚC TIẾP THEO: Export Private Key

Sau khi có wallet và đã chuyển sang Sepolia, bạn cần export Private Key:

1. **Click icon account** (góc trên bên phải, hình tròn)
2. **Chọn "Account details"** hoặc "Chi tiết tài khoản"
3. **Click "Export Private Key"** hoặc "Xuất khóa riêng tư"
4. **Nhập password** (password bạn đã tạo ở Bước 2)
5. **Copy Private Key** (bắt đầu với `0x...`)
6. **Cập nhật vào file `.env`:**
   ```env
   PRIVATE_KEY=your_private_key_without_0x_prefix
   ```

**⚠️ LƯU Ý:**
- Private Key cho phép ai đó truy cập hoàn toàn vào wallet
- Chỉ export khi thực sự cần (để deploy contract)
- Không chia sẻ với ai
- Không lưu trên cloud

---

## 💧 BƯỚC TIẾP THEO: Lấy Sepolia ETH

Sau khi có Private Key, bạn cần lấy Sepolia ETH (test ETH, miễn phí):

1. **Copy wallet address** từ MetaMask (click vào địa chỉ để copy)
2. **Truy cập faucet:**
   - MetaMask Developer: Click "Vòi nước" (Faucet) ở sidebar
   - Alchemy: https://sepoliafaucet.com
   - Infura: https://www.infura.io/faucet/sepolia
3. **Paste wallet address** vào faucet
4. **Hoàn thành captcha/đăng nhập**
5. **Chờ vài phút** để nhận ETH

**Cần ít nhất:** 0.01 ETH để deploy và test

---

## 🎉 HOÀN THÀNH!

Sau khi hoàn tất tất cả các bước trên, bạn sẽ có:
- ✅ MetaMask wallet
- ✅ Sepolia Testnet network
- ✅ Private Key (đã cập nhật vào `.env`)
- ✅ Sepolia ETH (test ETH, miễn phí)

**Tiếp theo:** Test kết nối blockchain và deploy contract!

Xem hướng dẫn đầy đủ: [NEXT_STEPS.md](./NEXT_STEPS.md)

---

## 🆘 TROUBLESHOOTING

### Q: Tôi quên Secret Recovery Phrase, làm sao?
**A:** Nếu quên Secret Recovery Phrase, không thể khôi phục wallet. Phải tạo wallet mới.

### Q: Tôi quên password, làm sao?
**A:** Có thể reset password bằng Secret Recovery Phrase. Vào Settings → Security & Privacy → Reset Account.

### Q: Tôi không thấy Sepolia trong danh sách networks?
**A:** Thêm network thủ công (Cách 2 ở trên).

### Q: Tôi đã có wallet từ trước, làm sao?
**A:** Click "Tôi đã có ví" → Nhập Secret Recovery Phrase → Tạo password mới.

---

**Bắt đầu: Click "Tạo ví mới" và làm theo các bước trên!** 🚀

