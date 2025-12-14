import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'newsletter_provider.dart';

class NewsletterTab extends ConsumerWidget {
  const NewsletterTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final newsletterAsync = ref.watch(newsletterProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Newsletter Subscribers', style: GoogleFonts.poppins(color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(newsletterProvider.notifier).refresh(),
        child: newsletterAsync.when(
          data: (subscribers) {
            if (subscribers.isEmpty) {
              return const Center(child: Text('No subscribers yet.'));
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: subscribers.length,
              separatorBuilder: (context, index) => const Divider(),
              itemBuilder: (context, index) {
                final sub = subscribers[index];
                return ListTile(
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFF0F172A),
                    child: Text('#${sub.id}', style: const TextStyle(color: Colors.white, fontSize: 12)),
                  ),
                  title: Text(sub.email, style: GoogleFonts.inter(fontWeight: FontWeight.w500)),
                  subtitle: Text('Subscribed: ${DateFormat.yMMMd().add_jm().format(sub.subscribedAt)}', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      ),
    );
  }
}
