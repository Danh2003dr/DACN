import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  MobileScannerController controller = MobileScannerController();
  bool _isPermissionGranted = false;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _requestCameraPermission();
  }

  Future<void> _requestCameraPermission() async {
    final status = await Permission.camera.request();
    setState(() {
      _isPermissionGranted = status.isGranted;
      if (!_isPermissionGranted) {
        _errorMessage = 'Cần quyền truy cập camera để quét QR code';
      }
    });
  }

  void _handleQRCode(BarcodeCapture barcodeCapture) {
    if (_isLoading) return;

    final barcodes = barcodeCapture.barcodes;
    if (barcodes.isEmpty) return;

    final qrCode = barcodes.first;
    if (qrCode.rawValue == null) return;

    setState(() {
      _isLoading = true;
    });

    // Stop scanner
    controller.stop();

    // Navigate to verification screen
    if (mounted) {
      context.pushNamed(
        'drug-verification',
        extra: {
          'qrData': qrCode.rawValue!,
        },
      );
    }

    // Reset loading after navigation
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    });
  }

  @override
  void dispose() {
    controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isPermissionGranted) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Quét QR Code'),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(
                  Icons.camera_alt_outlined,
                  size: 80,
                  color: Colors.grey,
                ),
                const SizedBox(height: 24),
                Text(
                  _errorMessage ?? 'Cần quyền truy cập camera',
                  style: Theme.of(context).textTheme.titleLarge,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _requestCameraPermission,
                  child: const Text('Cấp quyền'),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quét QR Code'),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: () => controller.toggleTorch(),
            tooltip: 'Bật/Tắt đèn flash',
          ),
          IconButton(
            icon: const Icon(Icons.cameraswitch),
            onPressed: () => controller.switchCamera(),
            tooltip: 'Đổi camera',
          ),
        ],
      ),
      body: Stack(
        children: [
          // Camera Scanner
          MobileScanner(
            controller: controller,
            onDetect: _handleQRCode,
          ),
          // Overlay
          _buildOverlay(),
          // Loading indicator
          if (_isLoading)
            Container(
              color: Colors.black54,
              child: const Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildOverlay() {
    return Container(
      decoration: ShapeDecoration(
        shape: QrScannerOverlayShape(
          borderColor: Theme.of(context).primaryColor,
          borderRadius: 16,
          borderLength: 30,
          borderWidth: 4,
          cutOutSize: 250,
        ),
      ),
    );
  }
}

class QrScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final Color overlayColor;
  final double borderRadius;
  final double borderLength;
  final double cutOutSize;

  const QrScannerOverlayShape({
    this.borderColor = Colors.red,
    this.borderWidth = 3.0,
    this.overlayColor = const Color.fromRGBO(0, 0, 0, 80),
    this.borderRadius = 0,
    this.borderLength = 40,
    this.cutOutSize = 250,
  });

  @override
  EdgeInsetsGeometry get dimensions => const EdgeInsets.all(10);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) {
    return Path()
      ..fillType = PathFillType.evenOdd
      ..addPath(getOuterPath(rect), Offset.zero);
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final height = rect.height;
    final borderOffset = borderWidth / 2;
    final cutOutSize = this.cutOutSize < width || this.cutOutSize < height
        ? this.cutOutSize
        : width - borderOffset;

    final left = (width / 2) - (cutOutSize / 2);
    final top = (height / 2) - (cutOutSize / 2);
    final right = left + cutOutSize;
    final bottom = top + cutOutSize;

    final cutOutRect = Rect.fromLTRB(left, top, right, bottom);

    return Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Rect.fromLTWH(0, 0, width, height))
      ..addRRect(
        RRect.fromRectAndRadius(
          cutOutRect,
          Radius.circular(borderRadius),
        ),
      );
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final height = rect.height;
    final borderOffset = borderWidth / 2;
    final cutOutSize = this.cutOutSize < width || this.cutOutSize < height
        ? this.cutOutSize
        : width - borderOffset;

    final left = (width / 2) - (cutOutSize / 2);
    final top = (height / 2) - (cutOutSize / 2);
    final right = left + cutOutSize;
    final bottom = top + cutOutSize;

    final cutOutRect = Rect.fromLTRB(left, top, right, bottom);

    // Draw overlay
    final backgroundPath = Path()
      ..fillType = PathFillType.evenOdd
      ..addRect(Rect.fromLTWH(0, 0, width, height))
      ..addRRect(
        RRect.fromRectAndRadius(
          cutOutRect,
          Radius.circular(borderRadius),
        ),
      );

    canvas.drawPath(backgroundPath, Paint()..color = overlayColor);

    // Draw border
    final borderPath = _getBorderPath(cutOutRect);
    canvas.drawPath(
      borderPath,
      Paint()
        ..color = borderColor
        ..style = PaintingStyle.stroke
        ..strokeWidth = borderWidth,
    );
  }

  Path _getBorderPath(Rect cutOutRect) {
    return Path()
      ..moveTo(cutOutRect.left, cutOutRect.top + borderRadius)
      ..lineTo(cutOutRect.left, cutOutRect.top + borderLength)
      ..moveTo(cutOutRect.left, cutOutRect.top)
      ..lineTo(cutOutRect.left + borderLength, cutOutRect.top)
      ..moveTo(cutOutRect.right - borderLength, cutOutRect.top)
      ..lineTo(cutOutRect.right, cutOutRect.top)
      ..lineTo(cutOutRect.right, cutOutRect.top + borderRadius)
      ..moveTo(cutOutRect.right, cutOutRect.top + borderLength)
      ..lineTo(cutOutRect.right, cutOutRect.bottom - borderLength)
      ..moveTo(cutOutRect.right, cutOutRect.bottom - borderRadius)
      ..lineTo(cutOutRect.right, cutOutRect.bottom)
      ..lineTo(cutOutRect.right - borderLength, cutOutRect.bottom)
      ..moveTo(cutOutRect.left + borderLength, cutOutRect.bottom)
      ..lineTo(cutOutRect.left, cutOutRect.bottom)
      ..lineTo(cutOutRect.left, cutOutRect.bottom - borderRadius)
      ..moveTo(cutOutRect.left, cutOutRect.bottom - borderLength)
      ..lineTo(cutOutRect.left, cutOutRect.top + borderLength);
  }

  @override
  ShapeBorder scale(double t) {
    return QrScannerOverlayShape(
      borderColor: borderColor,
      borderWidth: borderWidth,
      overlayColor: overlayColor,
    );
  }
}
