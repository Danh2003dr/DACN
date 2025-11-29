// Stub file for web platform
// Firebase không được khởi tạo trên web để tránh lỗi compilation

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;

/// Stub class for web - Firebase không được sử dụng trên web
class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    // Không bao giờ được gọi vì Firebase không được init trên web
    throw UnsupportedError(
      'Firebase is not supported on web platform. '
      'Please run the app on Android or iOS to use Firebase features.',
    );
  }
}
