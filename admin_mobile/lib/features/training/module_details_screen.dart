import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'training_provider.dart';

class ModuleDetailsScreen extends ConsumerWidget {
  final TrainingModule module;

  const ModuleDetailsScreen({super.key, required this.module});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final materialsAsync = ref.watch(trainingMaterialsProvider(module.id));

    return Scaffold(
      appBar: AppBar(
        title: Text(module.title, style: const TextStyle(color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(trainingMaterialsProvider(module.id).future),
        child: materialsAsync.when(
          data: (materials) {
            if (materials.isEmpty) return const Center(child: Text('No learning materials added yet.'));
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: materials.length,
              itemBuilder: (context, index) {
                final m = materials[index];
                IconData icon = Icons.article;
                if (m.type == 'video') icon = Icons.play_circle_fill;
                if (m.type == 'pdf') icon = Icons.picture_as_pdf;
                
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: Colors.blue.withOpacity(0.1),
                      child: Icon(icon, color: Colors.blue),
                    ),
                    title: Text(m.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(m.type.toUpperCase()),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                           icon: const Icon(Icons.edit, color: Colors.grey),
                           onPressed: () => _showMaterialDialog(context, ref, material: m),
                        ),
                        IconButton(
                           icon: const Icon(Icons.delete, color: Colors.red),
                           onPressed: () => _confirmDelete(context, ref, m.id),
                        )
                      ],
                    ),
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error loading materials: $err')),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showMaterialDialog(context, ref),
        backgroundColor: const Color(0xFF0F172A),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  void _showMaterialDialog(BuildContext context, WidgetRef ref, {TrainingMaterial? material}) {
    final titleCtrl = TextEditingController(text: material?.title);
    final urlCtrl = TextEditingController(text: material?.contentUrl);
    final textCtrl = TextEditingController(text: material?.contentText);
    String type = material?.type ?? 'video';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(material == null ? 'Add Material' : 'Edit Material'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title')),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: type,
                  decoration: const InputDecoration(labelText: 'Type'),
                  items: const [
                    DropdownMenuItem(value: 'video', child: Text('Video Link')),
                    DropdownMenuItem(value: 'pdf', child: Text('PDF Link')),
                    DropdownMenuItem(value: 'text', child: Text('Text Content')),
                  ],
                  onChanged: (val) => setState(() => type = val!),
                ),
                const SizedBox(height: 16),
                if (type == 'video' || type == 'pdf')
                   TextField(controller: urlCtrl, decoration: const InputDecoration(labelText: 'Content URL')),
                if (type == 'text')
                   TextField(controller: textCtrl, decoration: const InputDecoration(labelText: 'Content Text'), maxLines: 4),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () async {
                final data = {
                  'module_id': module.id,
                  'title': titleCtrl.text,
                  'type': type,
                  'content_url': urlCtrl.text,
                  'content_text': textCtrl.text,
                  'order_index': 0,
                };

                bool success;
                if (material != null) {
                  success = await ref.read(trainingProvider.notifier).updateMaterial(material.id, data);
                } else {
                  success = await ref.read(trainingProvider.notifier).createMaterial(data);
                }

                if (context.mounted) {
                   Navigator.pop(context);
                   if (success) {
                     ref.invalidate(trainingMaterialsProvider(module.id));
                     ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Saved Successfully')));
                   } else {
                     ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed')));
                   }
                }
              },
              child: const Text('Save'),
            )
          ],
        ),
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, int id) {
    showDialog(
      context: context, 
      builder: (context) => AlertDialog(
        title: const Text('Delete Material'),
        content: const Text('Are you sure?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
           TextButton(
            onPressed: () async {
               Navigator.pop(context);
               final success = await ref.read(trainingProvider.notifier).deleteMaterial(id);
               if (success && context.mounted) {
                 ref.invalidate(trainingMaterialsProvider(module.id));
               }
            }, 
            child: const Text('Delete', style: TextStyle(color: Colors.red))
          )
        ],
      )
    );
  }
}
