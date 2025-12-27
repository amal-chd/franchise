import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'training_provider.dart';
import 'module_details_screen.dart';

class TrainingTab extends ConsumerWidget {
  const TrainingTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trainingAsync = ref.watch(trainingProvider);

    return Scaffold(
      drawerEnableOpenDragGesture: false,
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(trainingProvider.future),
        child: trainingAsync.when(
          data: (modules) {
            if (modules.isEmpty) return const Center(child: Text('No training modules.'));
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: modules.length,
              itemBuilder: (context, index) {
                final m = modules[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    onTap: () {
                       Navigator.push(context, MaterialPageRoute(builder: (_) => ModuleDetailsScreen(module: m)));
                    },
                    leading: CircleAvatar(
                      backgroundColor: const Color(0xFF0F172A),
                      child: const Icon(Icons.school, color: Colors.white, size: 20),
                    ),
                    title: Text(m.title, style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                    subtitle: Text('${m.role} • ${m.category}\n${m.description}', maxLines: 2, overflow: TextOverflow.ellipsis),
                    isThreeLine: true,
                    trailing: PopupMenuButton(
                      onSelected: (value) {
                        if (value == 'edit') {
                          _showModuleDialog(context, ref, module: m);
                        } else if (value == 'delete') {
                          _confirmDelete(context, ref, m.id);
                        }
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(value: 'edit', child: Text('Edit')),
                        const PopupMenuItem(value: 'delete', child: Text('Delete', style: TextStyle(color: Colors.red))),
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
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showModuleDialog(context, ref),
        backgroundColor: const Color(0xFF0F172A),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  void _showModuleDialog(BuildContext context, WidgetRef ref, {TrainingModule? module}) {
    final titleCtrl = TextEditingController(text: module?.title);
    final descCtrl = TextEditingController(text: module?.description);
    final categoryCtrl = TextEditingController(text: module?.category ?? 'General');
    String role = module?.role ?? 'franchise';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(module == null ? 'Add Module' : 'Edit Module'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title')),
                TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description'), maxLines: 3),
                TextField(controller: categoryCtrl, decoration: const InputDecoration(labelText: 'Category')),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: role,
                  decoration: const InputDecoration(labelText: 'Role'),
                  items: const [
                    DropdownMenuItem(value: 'franchise', child: Text('Franchise')),
                    DropdownMenuItem(value: 'delivery_partner', child: Text('Delivery Partner')),
                    DropdownMenuItem(value: 'vendor', child: Text('Vendor')),
                  ],
                  onChanged: (val) => setState(() => role = val!),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                final data = {
                  'title': titleCtrl.text,
                  'description': descCtrl.text,
                  'category': categoryCtrl.text,
                  'role': role,
                  'thumbnail_url': '', // Optional
                };

                bool success;
                if (module != null) {
                  success = await ref.read(trainingProvider.notifier).updateModule(module.id, data);
                } else {
                  success = await ref.read(trainingProvider.notifier).createModule(data);
                }
                
                if (!context.mounted) return;
                
                if (success) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(module == null ? 'Module Added' : 'Module Updated')));
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Operation Failed')));
                }
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, int id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Module'),
        content: const Text('Are you sure you want to delete this module?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
              final success = await ref.read(trainingProvider.notifier).deleteModule(id);
              if (success && context.mounted) {
                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Module Deleted')));
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }
}
