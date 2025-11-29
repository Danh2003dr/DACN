import 'package:equatable/equatable.dart';

class UserEntity extends Equatable {
  final String id;
  final String email;
  final String? name;
  final String? phone;
  final String role;
  final String? avatar;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const UserEntity({
    required this.id,
    required this.email,
    this.name,
    this.phone,
    required this.role,
    this.avatar,
    this.isActive = true,
    this.createdAt,
    this.updatedAt,
  });

  @override
  List<Object?> get props => [
    id,
    email,
    name,
    phone,
    role,
    avatar,
    isActive,
    createdAt,
    updatedAt,
  ];
}
