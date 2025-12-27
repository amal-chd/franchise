import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'support_provider.dart';

class SupportTab extends ConsumerWidget {
  const SupportTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final supportAsync = ref.watch(supportProvider);

    return RefreshIndicator(
      onRefresh: () => ref.read(supportProvider.notifier).fetchTickets(),
      child: supportAsync.when(
        data: (tickets) {
          if (tickets.isEmpty) return const Center(child: Text('No support tickets.'));
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: tickets.length,
            itemBuilder: (context, index) {
              final t = tickets[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('#${t.id} ${t.subject}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: t.status == 'Resolved' ? Colors.green.withOpacity(0.1) : Colors.orange.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(t.status, style: TextStyle(
                              color: t.status == 'Resolved' ? Colors.green : Colors.orange,
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                            )),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('From: ${t.franchiseName} (${t.zoneName})', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text(t.email, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                      const Divider(),
                      Text(t.message, style: const TextStyle(fontSize: 14)),
                      if (t.reply != null && t.reply!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: Colors.grey[100], borderRadius: BorderRadius.circular(8)),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Admin Reply:', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12)),
                              Text(t.reply!),
                            ],
                          ),
                        ),
                      ] else ...[
                        const SizedBox(height: 12),
                        Align(
                          alignment: Alignment.centerRight,
                          child: ElevatedButton.icon(
                            icon: const Icon(Icons.reply, size: 16),
                            label: const Text('Reply'),
                            onPressed: () => _showReplyDialog(context, ref, t),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  void _showReplyDialog(BuildContext context, WidgetRef ref, SupportTicket ticket) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reply to Ticket'),
        content: TextField(
          controller: controller,
          maxLines: 4,
          decoration: const InputDecoration(hintText: 'Enter your reply...', border: OutlineInputBorder()),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              if (controller.text.isNotEmpty) {
                 final success = await ref.read(supportProvider.notifier).replyToTicket(ticket, controller.text);
                 if (success && context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Reply Sent')));
                 }
              }
            },
            child: const Text('Send Reply'),
          ),
        ],
      ),
    );
  }
}
