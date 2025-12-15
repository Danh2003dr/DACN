import 'package:flutter/material.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chính sách bảo mật'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Chính sách bảo mật',
              style: theme.textTheme.headlineMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Cập nhật lần cuối: ${DateTime.now().toString().split(' ')[0]}',
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant,
              ),
            ),
            const SizedBox(height: 24),
            _buildSection(
              context,
              '1. Thu thập thông tin',
              'Chúng tôi thu thập thông tin cá nhân của bạn khi bạn sử dụng ứng dụng, bao gồm:\n\n'
              '• Thông tin đăng nhập (email, mật khẩu)\n'
              '• Thông tin quét QR code\n'
              '• Thông tin vị trí (nếu được cấp quyền)\n'
              '• Thông tin thiết bị và log sử dụng',
            ),
            _buildSection(
              context,
              '2. Sử dụng thông tin',
              'Thông tin của bạn được sử dụng để:\n\n'
              '• Xác thực và bảo mật tài khoản\n'
              '• Cung cấp dịch vụ tra cứu thuốc\n'
              '• Cải thiện chất lượng dịch vụ\n'
              '• Tuân thủ các quy định pháp luật',
            ),
            _buildSection(
              context,
              '3. Bảo mật thông tin',
              'Chúng tôi cam kết bảo vệ thông tin của bạn bằng:\n\n'
              '• Mã hóa dữ liệu trong quá trình truyền tải\n'
              '• Lưu trữ an toàn trên server\n'
              '• Kiểm soát truy cập nghiêm ngặt\n'
              '• Tuân thủ các tiêu chuẩn bảo mật quốc tế',
            ),
            _buildSection(
              context,
              '4. Chia sẻ thông tin',
              'Chúng tôi không bán hoặc chia sẻ thông tin cá nhân của bạn với bên thứ ba, trừ khi:\n\n'
              '• Được yêu cầu bởi pháp luật\n'
              '• Có sự đồng ý của bạn\n'
              '• Cần thiết để cung cấp dịch vụ',
            ),
            _buildSection(
              context,
              '5. Quyền của bạn',
              'Bạn có quyền:\n\n'
              '• Truy cập thông tin cá nhân\n'
              '• Yêu cầu chỉnh sửa hoặc xóa thông tin\n'
              '• Từ chối cung cấp thông tin\n'
              '• Khiếu nại về việc xử lý thông tin',
            ),
            const SizedBox(height: 24),
            Text(
              'Liên hệ',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Nếu bạn có câu hỏi về chính sách bảo mật, vui lòng liên hệ:\n\n'
              'Email: privacy@drugtraceability.com\n'
              'Điện thoại: 1900-xxxx',
              style: theme.textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(BuildContext context, String title, String content) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: theme.textTheme.bodyMedium,
          ),
        ],
      ),
    );
  }
}

