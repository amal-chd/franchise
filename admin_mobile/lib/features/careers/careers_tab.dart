import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'careers_provider.dart';

class CareersTab extends ConsumerWidget {
  const CareersTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final careersAsync = ref.watch(careersProvider);

    return Scaffold(
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddJobDialog(context, ref),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(careersProvider.notifier).fetchJobs(),
        child: careersAsync.when(
          data: (jobs) {
            if (jobs.isEmpty) return const Center(child: Text('No job postings.'));
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: jobs.length,
              itemBuilder: (context, index) {
                final job = jobs[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                   shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    title: Text(job.title, style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                    subtitle: Text('${job.department} • ${job.location} • ${job.type}'),
                    trailing: Container(
                       padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                       decoration: BoxDecoration(
                         color: job.status == 'Active' ? Colors.green.withOpacity(0.1) : Colors.grey.withOpacity(0.1),
                         borderRadius: BorderRadius.circular(8),
                       ),
                       child: Text(job.status, style: TextStyle(color: job.status == 'Active' ? Colors.green : Colors.grey)),
                    ),
                  ),
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

  void _showAddJobDialog(BuildContext context, WidgetRef ref) {
    final titleController = TextEditingController();
    final deptController = TextEditingController();
    final locController = TextEditingController();
    String type = 'Full-time';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Add Job Posting'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: titleController, decoration: const InputDecoration(labelText: 'Job Title')),
                TextField(controller: deptController, decoration: const InputDecoration(labelText: 'Department')),
                TextField(controller: locController, decoration: const InputDecoration(labelText: 'Location')),
                const SizedBox(height: 16),
                DropdownButton<String>(
                  value: type,
                  isExpanded: true,
                  items: ['Full-time', 'Part-time', 'Contract', 'Remote'].map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
                  onChanged: (val) => setState(() => type = val!),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                final success = await ref.read(careersProvider.notifier).addJob({
                  'title': titleController.text,
                  'department': deptController.text,
                  'location': locController.text,
                  'type': type,
                  'status': 1, // Active by default
                });
                 if (success && context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Job Added')));
                 }
              },
              child: const Text('Post Job'),
            ),
          ],
        ),
      ),
    );
  }
}
