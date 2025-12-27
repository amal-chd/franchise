import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:google_fonts/google_fonts.dart';
import 'notification_provider.dart';
import 'notification_model.dart';
import '../../widgets/premium_widgets.dart';

class NotificationScreen extends ConsumerWidget {
  const NotificationScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationState = ref.watch(notificationProvider);

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: AppBar(
          title: Text('Notifications', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A))),
          backgroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
          leadingWidth: 70,
          leading: Navigator.of(context).canPop() ? IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: const Color(0xFF0F172A).withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Color(0xFF0F172A)),
            ),
            onPressed: () => Navigator.of(context).pop(),
          ) : null,
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh_rounded, color: Color(0xFF0F172A)),
              onPressed: () => ref.read(notificationProvider.notifier).fetchNotifications(),
            ),
            const SizedBox(width: 8),
          ],
        ),
      ),
      body: notificationState.when(
        data: (notifications) {
          if (notifications.isEmpty) {
            return const IllustrativeState(
              icon: Icons.notifications_off_rounded,
              title: 'Quiet for Now',
              subtitle: 'You have no new notifications to display at this time.',
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.read(notificationProvider.notifier).fetchNotifications(),
            child: ListView.separated(
              itemCount: notifications.length,
              separatorBuilder: (context, index) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return NotificationTile(notification: notification);
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }
}

class NotificationTile extends ConsumerWidget {
  final NotificationModel notification;

  const NotificationTile({super.key, required this.notification});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timeFormat = DateFormat('MMM dd, hh:mm a');

    return Container(
      color: notification.isRead ? Colors.transparent : Colors.blue.withOpacity(0.05),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: _getIconColor(notification.type).withOpacity(0.1),
          child: Icon(_getIcon(notification.type), color: _getIconColor(notification.type)),
        ),
        title: Text(
          notification.title,
          style: TextStyle(
            fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(notification.message),
            const SizedBox(height: 4),
            Text(
              timeFormat.format(notification.createdAt),
              style: const TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        onTap: () {
          if (!notification.isRead) {
            ref.read(notificationProvider.notifier).markAsRead(notification.id);
          }
          // Optionally handle deep linking based on type/data
        },
      ),
    );
  }

  IconData _getIcon(String type) {
    switch (type) {
      case 'order': return Icons.shopping_bag_outlined;
      case 'franchise': return Icons.business_outlined;
      case 'payment': return Icons.payments_outlined;
      default: return Icons.notifications_outlined;
    }
  }

  Color _getIconColor(String type) {
    switch (type) {
      case 'order': return Colors.orange;
      case 'franchise': return Colors.blue;
      case 'payment': return Colors.green;
      default: return Colors.blueGrey;
    }
  }
}
