import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'activity_logs_provider.dart';
import '../../widgets/premium_widgets.dart';

class ActivityLogsScreen extends ConsumerStatefulWidget {
  const ActivityLogsScreen({super.key});

  @override
  ConsumerState<ActivityLogsScreen> createState() => _ActivityLogsScreenState();
}

class _ActivityLogsScreenState extends ConsumerState<ActivityLogsScreen> {
  final ScrollController _scrollController = ScrollController();
  String? _selectedAction;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= 
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(activityLogsProvider.notifier).loadMore();
    }
  }

  @override
  Widget build(BuildContext context) {
    final logsState = ref.watch(activityLogsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Activity Logs', 
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A))),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172A), size: 18),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list_rounded, color: Color(0xFF2563EB)),
            onPressed: () => _showFilterSheet(context),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          _buildFilterChips(),
          
          // Logs List
          Expanded(
            child: logsState.isLoading && logsState.logs.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : logsState.error != null && logsState.logs.isEmpty
                    ? IllustrativeState(
                        icon: Icons.error_outline_rounded,
                        title: 'Unable to Load Logs',
                        subtitle: logsState.error!,
                        onRetry: () => ref.read(activityLogsProvider.notifier).refresh(),
                      )
                    : logsState.logs.isEmpty
                        ? IllustrativeState(
                            icon: Icons.history_rounded,
                            title: 'No Activity Yet',
                            subtitle: 'Your activity will appear here once you start using the app.',
                          )
                        : RefreshIndicator(
                            onRefresh: () => ref.read(activityLogsProvider.notifier).refresh(),
                            child: ListView.builder(
                              controller: _scrollController,
                              padding: const EdgeInsets.all(16),
                              itemCount: logsState.logs.length + 1,
                              itemBuilder: (context, index) {
                                if (index == logsState.logs.length) {
                                  return logsState.currentPage < logsState.totalPages
                                      ? const Padding(
                                          padding: EdgeInsets.all(16),
                                          child: Center(child: CircularProgressIndicator()),
                                        )
                                      : const SizedBox(height: 80);
                                }
                                
                                final log = logsState.logs[index];
                                final showDateHeader = index == 0 || 
                                    !_isSameDay(log.createdAt, logsState.logs[index - 1].createdAt);
                                
                                return Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (showDateHeader) _buildDateHeader(log.createdAt),
                                    _buildLogItem(log),
                                  ],
                                );
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    final selectedAction = ref.watch(activityLogsProvider).actionFilter;
    
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        children: [
          _buildChip('All', null, selectedAction == null),
          _buildChip('Login', 'LOGIN', selectedAction == 'LOGIN'),
          _buildChip('Orders', 'ORDER_CREATED', selectedAction == 'ORDER_CREATED'),
          _buildChip('Payouts', 'PAYOUT_PROCESSED', selectedAction == 'PAYOUT_PROCESSED'),
          _buildChip('Profile', 'PROFILE_UPDATED', selectedAction == 'PROFILE_UPDATED'),
          _buildChip('Security', 'PASSWORD_CHANGED', selectedAction == 'PASSWORD_CHANGED'),
        ],
      ),
    );
  }

  Widget _buildChip(String label, String? action, bool isSelected) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (_) {
          ref.read(activityLogsProvider.notifier).setActionFilter(action);
        },
        backgroundColor: Colors.white,
        selectedColor: const Color(0xFF2563EB),
        labelStyle: GoogleFonts.inter(
          color: isSelected ? Colors.white : const Color(0xFF64748B),
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(
            color: isSelected ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0),
          ),
        ),
      ),
    );
  }

  Widget _buildDateHeader(DateTime date) {
    final now = DateTime.now();
    final yesterday = now.subtract(const Duration(days: 1));
    
    String label;
    if (_isSameDay(date, now)) {
      label = 'Today';
    } else if (_isSameDay(date, yesterday)) {
      label = 'Yesterday';
    } else {
      label = DateFormat('EEEE, MMM d').format(date);
    }
    
    return Padding(
      padding: const EdgeInsets.only(top: 16, bottom: 8),
      child: Text(
        label.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w800,
          color: const Color(0xFF94A3B8),
          letterSpacing: 1,
        ),
      ),
    );
  }

  Widget _buildLogItem(ActivityLog log) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: _getActionColor(log.action).withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              _getActionIcon(log.action),
              color: _getActionColor(log.action),
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  log.actionLabel,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  _formatLogDetails(log),
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF64748B),
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                DateFormat('h:mm a').format(log.createdAt),
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF94A3B8),
                ),
              ),
              if (log.ipAddress != null && log.ipAddress != 'unknown')
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Text(
                    log.ipAddress!.split(',').first,
                    style: GoogleFonts.robotoMono(
                      fontSize: 9,
                      color: const Color(0xFFCBD5E1),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  IconData _getActionIcon(String action) {
    switch (action) {
      case 'LOGIN': return Icons.login_rounded;
      case 'LOGOUT': return Icons.logout_rounded;
      case 'ORDER_CREATED': return Icons.shopping_bag_rounded;
      case 'ORDER_STATUS_CHANGED': return Icons.sync_alt_rounded;
      case 'PAYOUT_PROCESSED': return Icons.payments_rounded;
      case 'PROFILE_UPDATED': return Icons.person_rounded;
      case 'PASSWORD_CHANGED': return Icons.lock_rounded;
      case 'SUPPORT_TICKET': return Icons.support_agent_rounded;
      case 'FRANCHISE_APPROVED': return Icons.verified_rounded;
      case 'FRANCHISE_REJECTED': return Icons.cancel_rounded;
      case 'PRODUCT_ADDED': return Icons.add_box_rounded;
      case 'PRODUCT_UPDATED': return Icons.edit_rounded;
      default: return Icons.history_rounded;
    }
  }

  Color _getActionColor(String action) {
    switch (action) {
      case 'LOGIN': return const Color(0xFF10B981);
      case 'LOGOUT': return const Color(0xFF64748B);
      case 'ORDER_CREATED': return const Color(0xFF2563EB);
      case 'ORDER_STATUS_CHANGED': return const Color(0xFF8B5CF6);
      case 'PAYOUT_PROCESSED': return const Color(0xFF059669);
      case 'PROFILE_UPDATED': return const Color(0xFF0EA5E9);
      case 'PASSWORD_CHANGED': return const Color(0xFFF59E0B);
      case 'SUPPORT_TICKET': return const Color(0xFFEC4899);
      case 'FRANCHISE_APPROVED': return const Color(0xFF10B981);
      case 'FRANCHISE_REJECTED': return const Color(0xFFEF4444);
      case 'PRODUCT_ADDED': return const Color(0xFF6366F1);
      case 'PRODUCT_UPDATED': return const Color(0xFF14B8A6);
      default: return const Color(0xFF64748B);
    }
  }

  String _formatLogDetails(ActivityLog log) {
    if (log.entityType != null && log.entityId != null) {
      return '${log.entityType} #${log.entityId}';
    }
    if (log.details != null && log.details!.isNotEmpty) {
      return log.details!.entries.take(2).map((e) => '${e.key}: ${e.value}').join(' • ');
    }
    return log.actorType == 'admin' ? 'Admin action' : 'Franchise action';
  }

  bool _isSameDay(DateTime a, DateTime b) {
    return a.year == b.year && a.month == b.month && a.day == b.day;
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: const Color(0xFFE2E8F0),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text('Filter Logs', 
              style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            Text('ACTION TYPE', 
              style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFF94A3B8), letterSpacing: 1)),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: activityActionTypes.map((action) {
                return FilterChip(
                  label: Text(action.replaceAll('_', ' ')),
                  selected: _selectedAction == action,
                  onSelected: (selected) {
                    setState(() => _selectedAction = selected ? action : null);
                  },
                  backgroundColor: Colors.white,
                  selectedColor: const Color(0xFF2563EB),
                  labelStyle: GoogleFonts.inter(
                    color: _selectedAction == action ? Colors.white : const Color(0xFF64748B),
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 32),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      ref.read(activityLogsProvider.notifier).clearFilters();
                      Navigator.pop(context);
                    },
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('Clear All', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      ref.read(activityLogsProvider.notifier).setActionFilter(_selectedAction);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text('Apply Filter', 
                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
