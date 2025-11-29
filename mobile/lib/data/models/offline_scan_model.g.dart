// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'offline_scan_model.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class OfflineScanModelAdapter extends TypeAdapter<OfflineScanModel> {
  @override
  final int typeId = 0;

  @override
  OfflineScanModel read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return OfflineScanModel(
      qrData: fields[0] as String,
      scannedAt: fields[1] as DateTime,
      mockData: (fields[2] as Map?)?.cast<String, dynamic>(),
      synced: fields[3] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, OfflineScanModel obj) {
    writer
      ..writeByte(4)
      ..writeByte(0)
      ..write(obj.qrData)
      ..writeByte(1)
      ..write(obj.scannedAt)
      ..writeByte(2)
      ..write(obj.mockData)
      ..writeByte(3)
      ..write(obj.synced);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is OfflineScanModelAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
