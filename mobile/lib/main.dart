import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:firebase_core/firebase_core.dart';

import 'config/routes/app_router.dart';
import 'config/theme/app_theme.dart';
import 'presentation/blocs/theme_provider.dart';
import 'core/services/notification_service.dart';
import 'core/utils/notification_navigator.dart';
import 'data/models/offline_scan_model.dart';

// Firebase options - đã được tạo bởi flutterfire configure
// Dùng conditional import để tránh lỗi trên web
import 'firebase_options.dart'
    if (dart.library.html) 'firebase_options_web_stub.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    // Initialize Firebase (chỉ trên mobile, không phải web)
    if (!kIsWeb) {
      try {
        await Firebase.initializeApp(
          options: DefaultFirebaseOptions.currentPlatform,
        );
        print('✅ Firebase initialized');
      } catch (e) {
        print('⚠️ Warning: Could not initialize Firebase: $e');
        print('⚠️ Chạy "flutterfire configure" để setup Firebase');
      }
    } else {
      print(
          '⚠️ Skipping Firebase initialization on web (Firebase Messaging không hoạt động tốt trên web)');
      print(
          '💡 Để test Firebase notifications, hãy chạy app trên Android/iOS emulator');
    }

    // Load environment variables
    try {
      await dotenv.load(fileName: ".env");
      print('✅ Loaded .env file successfully');
    } catch (e) {
      print('⚠️ Warning: Could not load .env file: $e');
      // Try to load with asset path for web
      try {
        await dotenv.load(fileName: "assets/.env");
        print('✅ Loaded .env from assets');
      } catch (e2) {
        print('⚠️ Could not load .env from assets either: $e2');
        // Continue without .env file - will use fallback values
      }
    }

    // Initialize Hive for local storage (skip on web)
    if (!kIsWeb) {
      try {
        await Hive.initFlutter();

        // Register Hive adapters
        if (!Hive.isAdapterRegistered(0)) {
          Hive.registerAdapter(OfflineScanModelAdapter());
        }

        print('✅ Hive initialized with adapters');
      } catch (e) {
        print('Warning: Could not initialize Hive: $e');
        // Continue without Hive
      }
    } else {
      print('Skipping Hive initialization on web');
    }

    // Set preferred orientations (optional)
    try {
      await SystemChrome.setPreferredOrientations([
        DeviceOrientation.portraitUp,
        DeviceOrientation.portraitDown,
      ]);
    } catch (e) {
      print('Warning: Could not set preferred orientations: $e');
    }

    // Initialize services (only on mobile, not web)
    // Note: Services are initialized lazily via Riverpod providers
    // This is just for early initialization if needed
    if (!kIsWeb) {
      try {
        // Initialize Notification Service (Firebase) - only on mobile
        try {
          final notificationService = NotificationService();
          await notificationService.init();
          print('✅ NotificationService initialized');
        } catch (e) {
          print('⚠️ Warning: Could not initialize NotificationService: $e');
          // Continue without notifications (Firebase might not be configured)
        }
      } catch (e) {
        print('Warning: Error initializing services: $e');
      }
    } else {
      print('⚠️ Skipping NotificationService initialization on web');
    }
  } catch (e) {
    print('Error during initialization: $e');
  }

  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Get app name safely
    String appName = 'Drug Traceability System';
    try {
      appName = dotenv.env['APP_NAME'] ?? 'Drug Traceability System';
    } catch (e) {
      // dotenv not initialized, use default
    }

    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeProvider);

    // Set router for notification navigation
    NotificationNavigator.setRouter(router);

    return MaterialApp.router(
      title: appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
      localizationsDelegates: const [
        // Add localization delegates here if needed
      ],
      supportedLocales: const [Locale('en', 'US'), Locale('vi', 'VN')],
    );
  }
}
