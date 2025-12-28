import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'training_provider.dart';
import '../../widgets/premium_widgets.dart';

import '../../widgets/modern_header.dart'; // Add import

// Local provider for selected training role
final trainingRoleProvider = NotifierProvider<TrainingRoleNotifier, String>(TrainingRoleNotifier.new);

class TrainingRoleNotifier extends Notifier<String> {
  @override
  String build() => 'franchise';

  void setRole(String role) => state = role;
}

final lastAccessedModuleProvider = FutureProvider<int?>((ref) async{
   final prefs = await SharedPreferences.getInstance(); 
   return prefs.getInt('last_accessed_module');
});

class FranchiseTrainingTab extends ConsumerWidget {
  const FranchiseTrainingTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final trainingAsync = ref.watch(trainingProvider);
    final selectedRole = ref.watch(trainingRoleProvider);

    return Scaffold(
      appBar: ModernDashboardHeader(
        title: 'Franchise Academy',
        leadingWidget: Padding(
          padding: const EdgeInsets.only(left: 8.0),
          child: Hero(
            tag: 'app_logo', 
            child: Material(
              color: Colors.transparent,
              child: Image.asset(
                'assets/images/logo_text.png', 
                height: 24,
                color: Colors.white,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.school, color: Colors.white),
              ),
            ),
          ),
        ),
        isHome: false,
        showLeading: false, 
      ),
      backgroundColor: Colors.grey[50],
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(trainingProvider.future),
        child: trainingAsync.when(
          data: (allModules) {
            // Filter modules based on selected role
            final modules = allModules.where((m) => m.role.toLowerCase() == selectedRole.toLowerCase()).toList();

            // Calculate Stats
            final completedCount = modules.where((m) => m.progress >= 0.99).length;
            final totalMinutes = modules.fold(0.0, (sum, m) {
              final durationStr = m.duration.toLowerCase().replaceAll(' min', '').replaceAll('m', '');
              final duration = int.tryParse(durationStr) ?? 0;
              return sum + (duration * m.progress);
            });
            final hoursSpent = (totalMinutes / 60).toStringAsFixed(1);

            final categories = ['All', ...modules.map((m) => m.category).toSet().toList()];
            final recentModule = modules.isNotEmpty ? modules.first : null;

            return CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                // 1. Welcome & Stats Section
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _getWelcomeMessage(selectedRole), 
                          style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))
                        ),
                         const SizedBox(height: 4),
                        Text('Continue your learning journey.', style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[600])),
                        const SizedBox(height: 20),
                        
                        // Roles Selector
                        Container(
                          width: double.infinity,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.grey[200]!),
                          ),
                          child: Row(
                            children: [
                              _buildRoleTab(ref, 'Franchise', 'franchise', selectedRole),
                              _buildContainerDivider(),
                              _buildRoleTab(ref, 'Vendor', 'vendor', selectedRole),
                              _buildContainerDivider(),
                              _buildRoleTab(ref, 'Delivery', 'delivery', selectedRole),
                            ],
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Stats Cards
                        Row(
                          children: [
                            Expanded(
                              child: _buildStatCard(
                                icon: Icons.check_circle_rounded,
                                label: 'Completed',
                                value: '$completedCount',
                                color: const Color(0xFF10B981),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: _buildStatCard(
                                icon: Icons.timer_rounded,
                                label: 'Hours Spent',
                                value: hoursSpent, 
                                color: const Color(0xFFF59E0B),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                if (modules.isEmpty)
                  SliverFillRemaining(
                    child: Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.school_outlined, size: 48, color: Colors.grey[300]),
                          const SizedBox(height: 16),
                          Text(
                            'No ${selectedRole.toUpperCase()} training available.',
                            style: GoogleFonts.inter(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  )
                else ...[
                  // 2. Recent / Continue Learning
                  if (recentModule != null)
                  SliverToBoxAdapter(
                     child: Padding(
                       padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                       child: Column(
                         crossAxisAlignment: CrossAxisAlignment.start,
                         children: [
                          Text('Continue Learning', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 12),
                          GestureDetector(
                            onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => TrainingMaterialsScreen(moduleId: recentModule.id, moduleTitle: recentModule.title))),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: const Color(0xFF2563EB),
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.3), blurRadius: 10, offset: const Offset(0, 4))
                                ],
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(10),
                                    decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                                    child: const Icon(Icons.play_circle_fill_rounded, color: Colors.white, size: 24),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(recentModule.title, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
                                        const SizedBox(height: 4),
                                        Text('${(recentModule.progress * 100).toInt()}% Completed', style: GoogleFonts.inter(color: Colors.white.withOpacity(0.9), fontSize: 12)),
                                        const SizedBox(height: 8),
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(4),
                                          child: LinearProgressIndicator(
                                            value: recentModule.progress,
                                            backgroundColor: Colors.white.withOpacity(0.2),
                                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                                            minHeight: 4,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                         ],
                       ),
                     )
                  ),

                  // 3. Category Chips
                  SliverToBoxAdapter(
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                      child: Row(
                        children: categories.map((cat) => Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: Chip(
                            label: Text(cat),
                            backgroundColor: Colors.white,
                            labelStyle: const TextStyle(fontWeight: FontWeight.w600, color: Colors.black87),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: Colors.grey[300]!)),
                          ),
                        )).toList(),
                      ),
                    ),
                  ),

                  // 4. All Courses List
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverList(
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final m = modules[index];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                              ),
                              child: InkWell(
                                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => TrainingMaterialsScreen(moduleId: m.id, moduleTitle: m.title))),
                                borderRadius: BorderRadius.circular(16),
                                child: Padding(
                                  padding: const EdgeInsets.all(16),
                                  child: Row(
                                    children: [
                                       Container(
                                         width: 60,
                                         height: 60,
                                         decoration: BoxDecoration(
                                           color: Colors.blue[50],
                                           borderRadius: BorderRadius.circular(12),
                                         ),
                                         child: const Icon(Icons.school, color: Color(0xFF2563EB), size: 28),
                                       ),
                                       const SizedBox(width: 16),
                                       Expanded(
                                         child: Column(
                                           crossAxisAlignment: CrossAxisAlignment.start,
                                           children: [
                                             Text(m.title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                                             const SizedBox(height: 4),
                                             Row(
                                               children: [
                                                 const Icon(Icons.schedule, size: 14, color: Colors.grey),
                                                 const SizedBox(width: 4),
                                                 Text(m.duration, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                                 const SizedBox(width: 12),
                                                 Text(m.category.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blue)),
                                               ],
                                             ),
                                           ],
                                         ),
                                       ),
                                       CircularProgressIndicator(
                                         value: m.progress,
                                         backgroundColor: Colors.grey[200],
                                         strokeWidth: 3,
                                         key: ValueKey(m.id),
                                       ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                        childCount: modules.length,
                      ),
                    ),
                  ),
                  // Bottom Padding
                  const SliverToBoxAdapter(child: SizedBox(height: 40)),
                ]
              ],
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      ),
    );
  }

  String _getWelcomeMessage(String role) {
    if (role == 'vendor') return 'Vendor Training';
    if (role == 'delivery') return 'Delivery Fleet';
    return 'Franchise Academy';
  }

  Widget _buildRoleTab(WidgetRef ref, String label, String roleKey, String selectedRole) {
    final isSelected = selectedRole == roleKey;
    return Expanded(
      child: GestureDetector(
        onTap: () => ref.read(trainingRoleProvider.notifier).setRole(roleKey),
        behavior: HitTestBehavior.opaque,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFF2563EB) : Colors.transparent,
            borderRadius: BorderRadius.circular(11),
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              fontWeight: FontWeight.w600,
              fontSize: 13,
              color: isSelected ? Colors.white : Colors.grey[600],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContainerDivider() {
    return Container(width: 1, height: 20, color: Colors.grey[200]);
  }

  Widget _buildStatCard({required IconData icon, required String label, required String value, required Color color}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(value, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
          Text(label, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
        ],
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
      appBar: ModernDashboardHeader(
        title: moduleTitle,
        leadingWidget: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.white),
              ),
              onPressed: () => Navigator.of(context).pop(),
            ),
             Hero(
              tag: 'app_logo', 
              child: Material(
                color: Colors.transparent,
                child: Image.asset(
                  'assets/images/logo_text.png', 
                  height: 24,
                  color: Colors.white,
                  errorBuilder: (context, error, stackTrace) => const SizedBox(),
                ),
              ),
            ),
          ],
        ),
        showLeading: true,
      ),
      backgroundColor: Colors.white,
      body: materialsAsync.when(
        data: (materials) {
          if (materials.isEmpty) return const Center(child: Text('No materials found.'));

          return ListView.builder(
            padding: const EdgeInsets.all(24),
            itemCount: materials.length,
            itemBuilder: (context, index) {
              final material = materials[index];
              final isLast = index == materials.length - 1;

              return IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Timeline
                    Column(
                      children: [
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            border: Border.all(color: const Color(0xFF2563EB), width: 2),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '${index + 1}',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF2563EB)),
                            ),
                          ),
                        ),
                        if (!isLast)
                          Expanded(
                            child: Container(
                              width: 2,
                              color: Colors.grey[200],
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(width: 20),
                    
                    // Content Card
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(bottom: 32),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              material.title,
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(16),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withOpacity(0.06),
                                    blurRadius: 15,
                                    offset: const Offset(0, 4),
                                  ),
                                ],
                                border: Border.all(color: Colors.grey[100]!),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Content Type Badge
                                   Row(
                                    children: [
                                      Icon(_getMaterialIcon(material.type), size: 16, color: _getMaterialColor(material.type)),
                                      const SizedBox(width: 8),
                                      Text(
                                        material.type.toUpperCase(),
                                        style: TextStyle(
                                          color: _getMaterialColor(material.type),
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold,
                                          letterSpacing: 1,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  
                                  // Content Body
                                  if (material.type == 'text')
                                    Html(data: material.contentText),
                                  
                                  if (material.type != 'text') ...[
                                    Text('Access the ${material.type} material below.', style: const TextStyle(color: Colors.grey)),
                                    const SizedBox(height: 16),
                                    SizedBox(
                                      width: double.infinity,
                                      child: Row(
                                        children: [
                                          Expanded(
                                            child: ElevatedButton.icon(
                                              onPressed: () async {
                                                 final uri = Uri.parse(material.contentUrl);
                                                 if (await canLaunchUrl(uri)) {
                                                   await launchUrl(uri);
                                                 } else {
                                                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not open URL')));
                                                 }
                                              },
                                              icon: const Icon(Icons.open_in_new, size: 18),
                                              label: Text('Open', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFFF1F5F9),
                                                foregroundColor: const Color(0xFF0F172A),
                                                padding: const EdgeInsets.symmetric(vertical: 12),
                                                elevation: 0,
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          // Mark as Done Button
                                          Expanded(
                                            child: ElevatedButton.icon(
                                              onPressed: () {
                                                 // Mark this specific item as done
                                                 // Since we are not tracking individual item persistence in UI local state yet without full refactor,
                                                 // we will simulate progress increment.
                                                 // In a real app, 'materials' list should have 'isCompleted' status.
                                                 
                                                 final currentCount = (index + 1);
                                                 final progress = currentCount / materials.length;
                                                 
                                                 ref.read(trainingProvider.notifier).updateProgress(moduleId, progress, completedMaterials: [material.id]); // We send current material ID
                                                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marked as Completed')));
                                              },
                                              icon: const Icon(Icons.check_circle_outline, size: 18),
                                              label: Text('Done', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                                              style: ElevatedButton.styleFrom(
                                                backgroundColor: const Color(0xFF2563EB).withOpacity(0.1),
                                                foregroundColor: const Color(0xFF2563EB),
                                                padding: const EdgeInsets.symmetric(vertical: 12),
                                                elevation: 0,
                                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ]
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
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

  IconData _getMaterialIcon(String type) {
    switch (type) {
      case 'video': return Icons.play_circle_outline;
      case 'pdf': return Icons.picture_as_pdf;
      case 'text': return Icons.article;
      default: return Icons.link;
    }
  }

  Color _getMaterialColor(String type) {
    switch (type) {
      case 'video': return Colors.red;
      case 'pdf': return Colors.orange;
      case 'text': return Colors.blue;
      default: return Colors.grey;
    }
  }
}
