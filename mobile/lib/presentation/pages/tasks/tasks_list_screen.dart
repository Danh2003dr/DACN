import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../core/providers/services_provider.dart';
import '../../../data/models/task_model.dart';
import '../../../data/repositories_impl/task_repository_impl.dart';
import '../../widgets/custom_card.dart';

final taskRepositoryProvider = Provider<TaskRepositoryImpl>((ref) {
  final dioClient = ref.read(dioClientProvider);
  return TaskRepositoryImpl(dioClient);
});

// Sử dụng FutureProvider thay vì autoDispose để tránh rebuild liên tục
final tasksProvider =
    FutureProvider.family<List<TaskModel>, Map<String, dynamic>>((
      ref,
      params,
    ) async {
      print('🔄 [TasksProvider] Fetching tasks with params: $params');

      final repository = ref.read(taskRepositoryProvider);
      final result = await repository.getTasks(
        page: params['page'] as int? ?? 1,
        limit: params['limit'] as int? ?? 10,
        status: params['status'] as String?,
        priority: params['priority'] as String?,
        type: params['type'] as String?,
        search: params['search'] as String?,
      );

      return result.fold(
        (failure) {
          print('❌ [TasksProvider] Failure: $failure');
          return <TaskModel>[];
        },
        (tasks) {
          print('✅ [TasksProvider] Success: ${tasks.length} tasks loaded');
          return tasks.cast<TaskModel>();
        },
      );
    });

// Sử dụng FutureProvider thay vì autoDispose để cache stats
final taskStatsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final repository = ref.read(taskRepositoryProvider);
  final result = await repository.getTaskStats();

  return result.fold(
    (failure) => <String, dynamic>{
      'total': 0,
      'pending': 0,
      'inProgress': 0,
      'completed': 0,
      'overdue': 0,
    },
    (stats) => stats,
  );
});

class TasksListScreen extends ConsumerStatefulWidget {
  const TasksListScreen({super.key});

  @override
  ConsumerState<TasksListScreen> createState() => _TasksListScreenState();
}

class _TasksListScreenState extends ConsumerState<TasksListScreen> {
  int _currentPage = 1;
  String? _selectedStatus;
  String? _selectedPriority;
  String? _selectedType;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  Timer? _searchDebounce;

  @override
  void initState() {
    super.initState();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    _searchController.removeListener(_onSearchChanged);
    _searchController.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    if (_searchDebounce?.isActive ?? false) _searchDebounce!.cancel();
    _searchDebounce = Timer(const Duration(milliseconds: 500), () {
      if (mounted) {
        final newQuery = _searchController.text;
        if (_searchQuery != newQuery) {
          setState(() {
            _searchQuery = newQuery;
            _currentPage = 1;
            _cachedParams = null; // Reset cache khi search thay đổi
          });
          // Invalidate provider với params mới
          ref.invalidate(tasksProvider(_getParams()));
        }
      }
    });
  }

  // Cache params để tránh tạo object mới mỗi lần build
  Map<String, dynamic>? _cachedParams;

  Map<String, dynamic> _getParams() {
    final newParams = {
      'page': _currentPage,
      'limit': 10,
      'status': _selectedStatus,
      'priority': _selectedPriority,
      'type': _selectedType,
      'search': _searchQuery.isEmpty ? null : _searchQuery,
    };

    // Chỉ tạo params mới nếu có thay đổi
    if (_cachedParams == null ||
        _cachedParams!['page'] != newParams['page'] ||
        _cachedParams!['status'] != newParams['status'] ||
        _cachedParams!['priority'] != newParams['priority'] ||
        _cachedParams!['type'] != newParams['type'] ||
        _cachedParams!['search'] != newParams['search']) {
      _cachedParams = newParams;
    }

    return _cachedParams!;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    // Sử dụng method để tạo params ổn định - chỉ thay đổi khi cần
    final params = _getParams();

    // Sử dụng ref.read cho stats để tránh rebuild không cần thiết
    final statsAsync = ref.watch(taskStatsProvider);
    final tasksAsync = ref.watch(tasksProvider(params));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quản lý Nhiệm vụ'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/tasks/create'),
            tooltip: 'Tạo nhiệm vụ mới',
          ),
        ],
      ),
      body: Column(
        children: [
          // Stats Cards
          statsAsync.when(
            data: (stats) => Container(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      context,
                      'Tổng',
                      '${stats['total'] ?? 0}',
                      Icons.assignment,
                      colorScheme.primary,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildStatCard(
                      context,
                      'Đang làm',
                      '${stats['inProgress'] ?? 0}',
                      Icons.play_arrow,
                      Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildStatCard(
                      context,
                      'Hoàn thành',
                      '${stats['completed'] ?? 0}',
                      Icons.check_circle,
                      Colors.green,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _buildStatCard(
                      context,
                      'Quá hạn',
                      '${stats['overdue'] ?? 0}',
                      Icons.warning,
                      Colors.red,
                    ),
                  ),
                ],
              ),
            ),
            loading: () => const SizedBox(
              height: 100,
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (_, __) => const SizedBox.shrink(),
          ),

          // Filters
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Tìm kiếm nhiệm vụ...',
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () {
                              _searchController.clear();
                              setState(() {
                                _searchQuery = '';
                                _currentPage = 1;
                                _cachedParams = null;
                              });
                              ref.invalidate(tasksProvider(_getParams()));
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip(
                        context,
                        'Tất cả',
                        _selectedStatus == null,
                        () {
                          if (_selectedStatus != null) {
                            setState(() {
                              _selectedStatus = null;
                              _currentPage = 1;
                              _cachedParams = null;
                            });
                            ref.invalidate(tasksProvider(_getParams()));
                          }
                        },
                      ),
                      _buildFilterChip(
                        context,
                        'Chờ xử lý',
                        _selectedStatus == 'pending',
                        () {
                          if (_selectedStatus != 'pending') {
                            setState(() {
                              _selectedStatus = 'pending';
                              _currentPage = 1;
                              _cachedParams = null;
                            });
                            ref.invalidate(tasksProvider(_getParams()));
                          }
                        },
                      ),
                      _buildFilterChip(
                        context,
                        'Đang làm',
                        _selectedStatus == 'in_progress',
                        () {
                          if (_selectedStatus != 'in_progress') {
                            setState(() {
                              _selectedStatus = 'in_progress';
                              _currentPage = 1;
                              _cachedParams = null;
                            });
                            ref.invalidate(tasksProvider(_getParams()));
                          }
                        },
                      ),
                      _buildFilterChip(
                        context,
                        'Hoàn thành',
                        _selectedStatus == 'completed',
                        () {
                          if (_selectedStatus != 'completed') {
                            setState(() {
                              _selectedStatus = 'completed';
                              _currentPage = 1;
                              _cachedParams = null;
                            });
                            ref.invalidate(tasksProvider(_getParams()));
                          }
                        },
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // Tasks List
          Expanded(
            child: tasksAsync.when(
              data: (tasks) {
                if (tasks.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.assignment_outlined,
                          size: 64,
                          color: colorScheme.onSurfaceVariant,
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Chưa có nhiệm vụ nào',
                          style: theme.textTheme.titleMedium?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    // Invalidate providers để force refresh
                    setState(() {
                      _currentPage = 1;
                      _cachedParams = null;
                    });
                    ref.invalidate(tasksProvider(_getParams()));
                    ref.invalidate(taskStatsProvider);
                    // Đợi một chút để provider refresh
                    await Future.delayed(const Duration(milliseconds: 100));
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: tasks.length,
                    // Sử dụng addAutomaticKeepAlives và addRepaintBoundaries để optimize
                    addAutomaticKeepAlives: false,
                    addRepaintBoundaries: true,
                    cacheExtent: 500, // Cache items ngoài viewport
                    itemBuilder: (context, index) {
                      final task = tasks[index];
                      // Wrap trong RepaintBoundary để optimize repaint
                      return RepaintBoundary(
                        child: _buildTaskCard(
                          context,
                          task,
                          theme,
                          colorScheme,
                        ),
                      );
                    },
                  ),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stack) {
                // Log error để debug
                print('❌ Error loading tasks: $error');
                print('❌ Stack trace: $stack');

                return Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.error_outline,
                        size: 64,
                        color: colorScheme.error,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Lỗi khi tải danh sách nhiệm vụ',
                        style: TextStyle(color: colorScheme.error),
                      ),
                      const SizedBox(height: 8),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 32),
                        child: Text(
                          error.toString(),
                          style: TextStyle(
                            color: colorScheme.onSurfaceVariant,
                            fontSize: 12,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () {
                          setState(() {
                            _currentPage = 1;
                          });
                        },
                        child: const Text('Thử lại'),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    BuildContext context,
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    final theme = Theme.of(context);
    return CustomCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          Text(
            label,
            style: theme.textTheme.bodySmall,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(
    BuildContext context,
    String label,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) => onTap(),
      ),
    );
  }

  Widget _buildTaskCard(
    BuildContext context,
    TaskModel task,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    final dateFormat = DateFormat('dd/MM/yyyy');
    Color statusColor;
    IconData statusIcon;
    String statusText;

    switch (task.status) {
      case 'pending':
        statusColor = Colors.grey;
        statusIcon = Icons.schedule;
        statusText = 'Chờ xử lý';
        break;
      case 'in_progress':
        statusColor = Colors.blue;
        statusIcon = Icons.play_arrow;
        statusText = 'Đang làm';
        break;
      case 'completed':
        statusColor = Colors.green;
        statusIcon = Icons.check_circle;
        statusText = 'Hoàn thành';
        break;
      case 'cancelled':
        statusColor = Colors.red;
        statusIcon = Icons.cancel;
        statusText = 'Đã hủy';
        break;
      case 'on_hold':
        statusColor = Colors.orange;
        statusIcon = Icons.pause;
        statusText = 'Tạm dừng';
        break;
      default:
        statusColor = Colors.grey;
        statusIcon = Icons.help;
        statusText = task.status;
    }

    Color priorityColor;
    switch (task.priority) {
      case 'low':
        priorityColor = Colors.green;
        break;
      case 'medium':
        priorityColor = Colors.yellow;
        break;
      case 'high':
        priorityColor = Colors.orange;
        break;
      case 'urgent':
        priorityColor = Colors.red;
        break;
      default:
        priorityColor = Colors.grey;
    }

    return CustomCard(
      margin: const EdgeInsets.only(bottom: 12),
      onTap: () => context.push('/tasks/${task.id}'),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  task.title,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(statusIcon, size: 16, color: statusColor),
                    const SizedBox(width: 4),
                    Text(
                      statusText,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            task.description,
            style: theme.textTheme.bodySmall,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.person, size: 16, color: colorScheme.onSurfaceVariant),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  'Giao cho: ${task.assignedToName ?? 'N/A'}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
              Icon(
                Icons.calendar_today,
                size: 16,
                color: colorScheme.onSurfaceVariant,
              ),
              const SizedBox(width: 4),
              Text(
                dateFormat.format(task.dueDate),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: task.isOverdue
                      ? Colors.red
                      : colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Container(
                width: 4,
                height: 16,
                decoration: BoxDecoration(
                  color: priorityColor,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'Ưu tiên: ${task.priority}',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
              const Spacer(),
              Text(
                'Tiến độ: ${task.progress}%',
                style: theme.textTheme.bodySmall?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          if (task.progress > 0)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: LinearProgressIndicator(
                value: task.progress / 100,
                backgroundColor: colorScheme.surfaceContainerHighest,
                valueColor: AlwaysStoppedAnimation<Color>(statusColor),
              ),
            ),
        ],
      ),
    );
  }
}
