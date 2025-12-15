# AI Supply Chain Assistant - Tài Liệu Tính Năng

## Tổng Quan

AI Supply Chain Assistant là một trợ lý AI chuyên biệt được tích hợp vào trang Quản lý Chuỗi Cung ứng, giúp người dùng phân tích, dự đoán và tối ưu hóa các chuỗi cung ứng thuốc một cách thông minh.

## Vị Trí

- **Component**: `frontend/src/components/AISupplyChainAssistant.jsx`
- **Tích hợp vào**: `frontend/src/pages/SupplyChain.js`
- **Hiển thị**: Nút floating ở góc dưới bên phải màn hình

## Tính Năng Chính

### 1. Phân Tích Rủi Ro (Risk Analysis)
- **Phát hiện cảnh báo nhiệt độ**: Tự động phát hiện các chuỗi cung ứng có nhiệt độ vượt quá 25°C
- **Phát hiện thuốc thu hồi**: Thống kê số lượng chuỗi cung ứng đã bị thu hồi
- **Phát hiện trễ**: Xác định các chuỗi có quá nhiều bước (có thể bị trễ)
- **Cảnh báo blockchain**: Phát hiện các chuỗi chưa được ghi lên blockchain

**Ví dụ câu hỏi:**
- "Phân tích rủi ro trong chuỗi cung ứng"
- "Có cảnh báo nào không?"
- "Rủi ro nào đang xảy ra?"

### 2. Phân Tích Hiệu Quả (Efficiency Analysis)
- **Số bước trung bình**: Tính toán và phân tích số bước trung bình trong mỗi chuỗi
- **Tỷ lệ hoàn thành**: Phân tích tỷ lệ chuỗi đã hoàn thành
- **Phạm vi blockchain**: Kiểm tra số chuỗi đã được ghi lên blockchain
- **Gợi ý tối ưu hóa**: Đưa ra các đề xuất cụ thể để cải thiện hiệu quả

**Ví dụ câu hỏi:**
- "Phân tích hiệu quả của các chuỗi cung ứng"
- "Làm thế nào để tối ưu hóa?"
- "Hiệu suất của chuỗi cung ứng như thế nào?"

### 3. Phân Tích Xu Hướng (Trend Analysis)
- **Thống kê tổng quan**: Tổng số chuỗi, số đang hoạt động, đã hoàn thành, đã thu hồi
- **Phân tích số bước**: Tổng số bước và số bước trung bình
- **Biểu đồ trực quan**: Tự động tạo biểu đồ phân bố trạng thái (pie chart)

**Ví dụ câu hỏi:**
- "Thống kê và xu hướng chuỗi cung ứng"
- "Vẽ biểu đồ phân bố trạng thái"
- "Có bao nhiêu chuỗi đang hoạt động?"

### 4. Phân Tích Vị Trí (Location Analysis)
- **Top vị trí**: Liệt kê 5 vị trí có nhiều chuỗi cung ứng nhất
- **Phân bố địa lý**: Phân tích sự phân bố của các chuỗi theo địa điểm

**Ví dụ câu hỏi:**
- "Phân tích vị trí của các chuỗi cung ứng"
- "Chuỗi cung ứng đang ở đâu?"
- "Top địa điểm có nhiều chuỗi nhất"

### 5. Phân Tích Các Bước (Step Analysis)
- **Thống kê hành động**: Phân tích các loại hành động phổ biến nhất
- **Số lần thực hiện**: Đếm số lần mỗi hành động được thực hiện
- **Top 5 hành động**: Liệt kê 5 hành động được thực hiện nhiều nhất

**Ví dụ câu hỏi:**
- "Phân tích các bước trong hành trình"
- "Hành động nào được thực hiện nhiều nhất?"
- "Có bao nhiêu bước trong chuỗi cung ứng?"

### 6. Phân Tích Chuỗi Cụ Thể (Specific Chain Analysis)
- **Phân tích theo ID**: Phân tích một chuỗi cung ứng cụ thể theo ID hoặc batch number
- **Các loại phân tích**: Full (toàn diện), Risks (rủi ro), Efficiency (hiệu quả), Timeline (hành trình)

**Ví dụ câu hỏi:**
- "Phân tích chuỗi cung ứng [ID]"
- "Rủi ro của chuỗi [batch number]"
- "Hiệu quả của chuỗi [ID]"

## Công Nghệ Sử Dụng

### AI Engine
- **OpenAI GPT-4o-mini**: Sử dụng cho phân tích thông minh và trả lời tự nhiên
- **Function Calling**: Hỗ trợ các tools như `plot_chart`, `analyze_supply_chain`, `predict_risks`, `optimize_route`
- **Fallback Mode**: Tự động chuyển sang phân tích local nếu API không khả dụng

### Data Visualization
- **Recharts**: Thư viện vẽ biểu đồ
  - Bar Chart: So sánh dữ liệu
  - Line Chart: Xu hướng theo thời gian
  - Pie Chart: Phân bố trạng thái

### Data Sources
- **Supply Chain API**: Lấy dữ liệu chuỗi cung ứng
- **Drug API**: Lấy thông tin thuốc
- **Order API**: Lấy thông tin đơn hàng
- **Inventory API**: Lấy thông tin kho hàng

## Giao Diện Người Dùng

### Quick Actions
Khi mở chat lần đầu, người dùng sẽ thấy các nút "Câu hỏi nhanh":
- **Phân tích rủi ro**: Click để tự động hỏi về rủi ro
- **Hiệu quả**: Click để phân tích hiệu quả
- **Thống kê**: Click để xem thống kê
- **Biểu đồ**: Click để tạo biểu đồ

### Chat Interface
- **Floating Button**: Nút tròn ở góc dưới bên phải
- **Chat Window**: Cửa sổ chat với header gradient xanh
- **Message Bubbles**: 
  - User: Màu xanh, bên phải
  - Assistant: Màu trắng, bên trái với icon Bot
- **Typing Indicator**: Hiển thị khi AI đang xử lý
- **Tool Results**: Hiển thị kết quả từ các tools (charts, analysis, predictions)

### Visual Elements
- **Charts**: Biểu đồ được render trực tiếp trong chat
- **Analysis Cards**: Kết quả phân tích được hiển thị trong cards có màu sắc:
  - Xanh dương: Phân tích chuỗi
  - Cam: Dự đoán rủi ro
  - Xanh lá: Gợi ý tối ưu hóa

## Cách Sử Dụng

### 1. Mở AI Assistant
- Click vào nút floating ở góc dưới bên phải màn hình

### 2. Đặt Câu Hỏi
- Gõ câu hỏi vào ô input
- Hoặc click vào các "Câu hỏi nhanh" để tự động điền

### 3. Xem Kết Quả
- AI sẽ phân tích và trả lời
- Nếu có biểu đồ, sẽ tự động hiển thị
- Các phân tích chi tiết sẽ hiển thị trong cards

### 4. Tiếp Tục Trò Chuyện
- Có thể hỏi tiếp các câu hỏi liên quan
- AI sẽ nhớ context của cuộc trò chuyện

## Cấu Hình

### Environment Variables
Cần cấu hình trong file `.env`:
```env
REACT_APP_OPENAI_API_KEY=your-openai-api-key-here
```

### API Endpoints Sử Dụng
- `GET /api/supply-chain?limit=100` - Lấy danh sách chuỗi cung ứng
- `GET /api/drugs?limit=100` - Lấy danh sách thuốc
- `GET /api/orders?limit=100` - Lấy danh sách đơn hàng
- `GET /api/inventory?limit=100` - Lấy danh sách kho hàng

## Tính Năng Nâng Cao

### 1. Context Awareness
AI Assistant tự động lấy dữ liệu mới nhất từ hệ thống mỗi khi trả lời câu hỏi, đảm bảo thông tin luôn cập nhật.

### 2. Smart Fallback
Nếu OpenAI API không khả dụng, hệ thống tự động chuyển sang chế độ phân tích local với các thuật toán được tích hợp sẵn.

### 3. Real-time Analysis
Phân tích được thực hiện real-time dựa trên dữ liệu hiện tại, không cần cache hay pre-processing.

### 4. Multi-modal Responses
AI có thể trả lời bằng:
- Text: Câu trả lời dạng văn bản
- Charts: Biểu đồ trực quan
- Analysis Cards: Cards phân tích chi tiết
- Combined: Kết hợp nhiều loại

## Ví Dụ Sử Dụng

### Ví dụ 1: Phân tích rủi ro
**User**: "Phân tích rủi ro trong chuỗi cung ứng"

**AI Response**:
```
⚠️ Phân tích rủi ro:

• 5 chuỗi cung ứng có cảnh báo nhiệt độ vượt quá 25°C
• 2 chuỗi cung ứng đã bị thu hồi
• 3 chuỗi cung ứng có nhiều bước (có thể bị trễ)

Tổng cộng: 3 loại rủi ro được phát hiện.
```

### Ví dụ 2: Tạo biểu đồ
**User**: "Vẽ biểu đồ phân bố trạng thái"

**AI Response**:
- Text: Thống kê tổng quan
- Chart: Pie chart hiển thị phân bố trạng thái (Hoạt động, Hoàn thành, Thu hồi, Khác)

### Ví dụ 3: Phân tích hiệu quả
**User**: "Phân tích hiệu quả của các chuỗi cung ứng"

**AI Response**:
```
📊 Phân tích hiệu quả:

• Số bước trung bình: 6.5
• Tỷ lệ hoàn thành: 75.5%
• Tổng số chuỗi: 20

💡 Gợi ý tối ưu hóa:
• Giảm số bước trung bình trong chuỗi cung ứng (hiện tại: 6.5 bước)
• 5 chuỗi cung ứng chưa được ghi lên blockchain
```

## Lưu Ý

1. **API Key**: Cần cấu hình OpenAI API key để sử dụng đầy đủ tính năng AI
2. **Fallback Mode**: Nếu không có API key, hệ thống vẫn hoạt động với chế độ phân tích local
3. **Performance**: Phân tích có thể mất vài giây tùy thuộc vào lượng dữ liệu
4. **Data Limit**: Hiện tại lấy tối đa 100 records mỗi loại để đảm bảo performance

## Tương Lai

Các tính năng có thể mở rộng:
- [ ] Phân tích dự đoán bằng Machine Learning
- [ ] Tích hợp với hệ thống cảnh báo real-time
- [ ] Export báo cáo tự động
- [ ] Phân tích so sánh giữa các kỳ
- [ ] Gợi ý tối ưu hóa tự động dựa trên lịch sử
- [ ] Tích hợp với bản đồ để hiển thị vị trí trực quan
