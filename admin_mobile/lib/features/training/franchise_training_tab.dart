import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_html/flutter_html.dart';
import 'training_provider.dart';

class FranchiseTrainingTab extends ConsumerWidget {
  const FranchiseTrainingTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trainingAsync = ref.watch(trainingProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('My Training', style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      backgroundColor: Colors.grey[50],
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(trainingProvider.future),
        child: trainingAsync.when(
          data: (allModules) {
            final modules = allModules.where((m) => m.role == 'franchise').toList();

            if (modules.isEmpty) return Center(child: Text('No training modules assigned.', style: GoogleFonts.inter(color: Colors.grey)));
            
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: modules.length,
              itemBuilder: (context, index) {
                final m = modules[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 2,
                  child: InkWell(
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(builder: (_) => TrainingMaterialsScreen(moduleId: m.id, moduleTitle: m.title)));
                    },
                    borderRadius: BorderRadius.circular(12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: const Color(0xFFE0F2FE), borderRadius: BorderRadius.circular(12)),
                            child: const Icon(Icons.school, color: Color(0xFF2563EB), size: 24),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(m.title, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                                const SizedBox(height: 4),
                                Text(m.category, style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w600)),
                                const SizedBox(height: 4),
                                Text(m.description, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right, color: Colors.grey),
                        ],
                      ),
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
}

class TrainingMaterialsScreen extends ConsumerWidget {
  final int moduleId;
  final String moduleTitle;

  const TrainingMaterialsScreen({super.key, required this.moduleId, required this.moduleTitle});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final materialsAsync = ref.watch(trainingMaterialsProvider(moduleId));

    return Scaffold(
      appBar: AppBar(
        title: Text(moduleTitle, style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
      ),
      backgroundColor: Colors.grey[50],
      body: materialsAsync.when(
        data: (materials) {
          if (materials.isEmpty) return const Center(child: Text('No materials found.'));

          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: materials.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) {
              final material = materials[index];
              return Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: ExpansionTile(
                  leading: const Icon(Icons.description, color: Color(0xFF2563EB)),
                  title: Text(material.title, style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                  subtitle: Text(material.type.toUpperCase(), style: const TextStyle(fontSize: 10, color: Colors.grey)),
                  childrenPadding: const EdgeInsets.all(16),
                  children: [
                    if (material.type == 'text')
                      Html(data: material.contentText),
                    
                    if (material.type != 'text' && material.contentUrl.isNotEmpty)
                      ElevatedButton.icon(
                        onPressed: () async {
                           final uri = Uri.parse(material.contentUrl);
                           if (await canLaunchUrl(uri)) {
                             await launchUrl(uri);
                           } else {
                             ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open URL')));
                           }
                        },
                        icon: const Icon(Icons.open_in_new, size: 16),
                        label: Text('Open ${material.type}'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2563EB),
                          foregroundColor: Colors.white
                        ),
                      )
                  ],
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
}
