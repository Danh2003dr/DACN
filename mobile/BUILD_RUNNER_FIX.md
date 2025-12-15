# Sửa lỗi Build Runner cho Task Model

## Vấn đề
Build runner không thể generate code cho `TaskModel` vì field `updates` có type `List<TaskUpdateEntity>` trong parent class `TaskEntity`, nhưng json_serializable cần `TaskUpdateModel`.

## Giải pháp đã áp dụng

### 1. Override field `updates` trong `TaskModel`
- `TaskModel` giờ có field `updates` với type `List<TaskUpdateModel>` thay vì `List<TaskUpdateEntity>`
- Field này override từ parent class

### 2. Không dùng `@JsonSerializable` cho `TaskModel`
- `TaskModel` không dùng `@JsonSerializable` vì đã có custom `fromJson` factory
- `toJson()` được implement thủ công

### 3. Chỉ dùng `@JsonSerializable` cho `TaskUpdateModel`
- `TaskUpdateModel` vẫn dùng `@JsonSerializable` và sẽ được generate bình thường

## Chạy Build Runner

Bây giờ có thể chạy build_runner:

```bash
cd mobile
flutter pub run build_runner build --delete-conflicting-outputs
```

Hoặc:

```bash
mobile\fix_task_models.bat
```

## Kết quả mong đợi

Sau khi chạy build_runner:
- ✅ File `task_model.g.dart` sẽ được generate
- ✅ Chỉ chứa code cho `TaskUpdateModel` (không có `TaskModel`)
- ✅ Các lỗi về missing generated methods sẽ được giải quyết

## Lưu ý

- `TaskModel.fromJson()` vẫn là custom factory (không dùng generated code)
- `TaskModel.toJson()` là manual implementation
- `TaskUpdateModel` sử dụng generated code từ json_serializable

