import 'dart:io';
import 'package:csv/csv.dart' as csv;
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:path_provider/path_provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart';
import '../../domain/entities/verification_history_entity.dart';

class ExportService {
  /// Export verification history to CSV
  Future<void> exportToCSV(
    List<VerificationHistoryEntity> verifications,
  ) async {
    try {
      // Create CSV data
      final List<List<dynamic>> csvData = [
        [
          'Thời gian',
          'Tên thuốc',
          'Số lô',
          'Trạng thái',
          'Ghi chú',
        ],
      ];

      for (final verification in verifications) {
        csvData.add([
          DateFormat('dd/MM/yyyy HH:mm').format(verification.verifiedAt),
          verification.drugName ?? '',
          verification.batchNumber ?? '',
          _getStatusText(verification.status),
          verification.message ?? '',
        ]);
      }

      // Convert to CSV string
      final converter = const csv.ListToCsvConverter();
      final csvString = converter.convert(csvData);

      // Save to file
      final directory = await getApplicationDocumentsDirectory();
      final fileName =
          'verification_history_${DateFormat('yyyyMMdd_HHmmss').format(DateTime.now())}.csv';
      final file = File('${directory.path}/$fileName');
      await file.writeAsString(csvString);

      // Share file
      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'Lịch sử xác minh thuốc',
      );
    } catch (e) {
      throw Exception('Lỗi khi xuất file CSV: $e');
    }
  }

  /// Export verification history to PDF
  Future<void> exportToPDF(
    List<VerificationHistoryEntity> verifications,
  ) async {
    try {
      final pdf = pw.Document();

      // Add page
      pdf.addPage(
        pw.MultiPage(
          pageFormat: PdfPageFormat.a4,
          margin: const pw.EdgeInsets.all(40),
          build: (pw.Context context) {
            return [
              // Header
              pw.Header(
                level: 0,
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      'Lịch sử xác minh thuốc',
                      style: pw.TextStyle(
                        fontSize: 24,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                    pw.Text(
                      DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now()),
                      style: const pw.TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),

              // Summary
              pw.Container(
                padding: const pw.EdgeInsets.all(10),
                decoration: pw.BoxDecoration(
                  color: PdfColors.grey200,
                  borderRadius: pw.BorderRadius.circular(5),
                ),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      'Tổng số: ${verifications.length}',
                      style: const pw.TextStyle(fontSize: 14),
                    ),
                    pw.Text(
                      'Xuất ngày: ${DateFormat('dd/MM/yyyy').format(DateTime.now())}',
                      style: const pw.TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),

              // Table
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey400),
                children: [
                  // Header row
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(
                      color: PdfColors.grey300,
                    ),
                    children: [
                      _buildTableCell('Thời gian', isHeader: true),
                      _buildTableCell('Tên thuốc', isHeader: true),
                      _buildTableCell('Số lô', isHeader: true),
                      _buildTableCell('Trạng thái', isHeader: true),
                      _buildTableCell('Ghi chú', isHeader: true),
                    ],
                  ),
                  // Data rows
                  ...verifications.map((verification) {
                    return pw.TableRow(
                      children: [
                        _buildTableCell(
                          DateFormat('dd/MM/yyyy\nHH:mm')
                              .format(verification.verifiedAt),
                        ),
                        _buildTableCell(verification.drugName ?? ''),
                        _buildTableCell(verification.batchNumber ?? ''),
                        _buildTableCell(
                          _getStatusText(verification.status),
                        ),
                        _buildTableCell(verification.message ?? ''),
                      ],
                    );
                  }).toList(),
                ],
              ),
            ];
          },
        ),
      );

      // Save to file
      final directory = await getApplicationDocumentsDirectory();
      final fileName =
          'verification_history_${DateFormat('yyyyMMdd_HHmmss').format(DateTime.now())}.pdf';
      final file = File('${directory.path}/$fileName');
      await file.writeAsBytes(await pdf.save());

      // Share file
      await Share.shareXFiles(
        [XFile(file.path)],
        text: 'Lịch sử xác minh thuốc',
      );
    } catch (e) {
      throw Exception('Lỗi khi xuất file PDF: $e');
    }
  }

  pw.Widget _buildTableCell(String text, {bool isHeader = false}) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(8),
      child: pw.Text(
        text,
        style: pw.TextStyle(
          fontSize: isHeader ? 10 : 9,
          fontWeight: isHeader ? pw.FontWeight.bold : pw.FontWeight.normal,
        ),
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'valid':
        return 'Hợp lệ';
      case 'expired':
        return 'Hết hạn';
      case 'recalled':
        return 'Thu hồi';
      case 'invalid':
        return 'Không hợp lệ';
      case 'warning':
        return 'Cảnh báo';
      default:
        return status;
    }
  }
}
