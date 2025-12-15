import 'package:flutter/material.dart';

class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Điều khoản sử dụng'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Điều khoản sử dụng',
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
              '1. Chấp nhận điều khoản',
              'Bằng việc sử dụng ứng dụng này, bạn đồng ý với các điều khoản và điều kiện sau đây. Nếu bạn không đồng ý, vui lòng không sử dụng ứng dụng.',
            ),
            _buildSection(
              context,
              '2. Sử dụng dịch vụ',
              'Bạn cam kết:\n\n'
              '• Sử dụng ứng dụng đúng mục đích\n'
              '• Không sử dụng để mục đích bất hợp pháp\n'
              '• Không can thiệp vào hệ thống\n'
              '• Bảo mật thông tin đăng nhập',
            ),
            _buildSection(
              context,
              '3. Quyền sở hữu trí tuệ',
              'Tất cả nội dung trong ứng dụng, bao gồm logo, giao diện, mã nguồn, đều thuộc quyền sở hữu của chúng tôi và được bảo vệ bởi luật bản quyền.',
            ),
            _buildSection(
              context,
              '4. Trách nhiệm',
              'Chúng tôi không chịu trách nhiệm về:\n\n'
              '• Thiệt hại do sử dụng sai mục đích\n'
              '• Mất mát dữ liệu do lỗi người dùng\n'
              '• Gián đoạn dịch vụ do lý do khách quan\n'
              '• Thông tin từ bên thứ ba',
            ),
            _buildSection(
              context,
              '5. Thay đổi dịch vụ',
              'Chúng tôi có quyền thay đổi, tạm ngưng hoặc chấm dứt dịch vụ bất cứ lúc nào mà không cần thông báo trước.',
            ),
            _buildSection(
              context,
              '6. Chấm dứt sử dụng',
              'Chúng tôi có quyền chấm dứt quyền sử dụng của bạn nếu bạn vi phạm các điều khoản này.',
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
              'Nếu bạn có câu hỏi về điều khoản sử dụng, vui lòng liên hệ:\n\n'
              'Email: support@drugtraceability.com\n'
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

