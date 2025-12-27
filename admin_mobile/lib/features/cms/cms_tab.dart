import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'cms_provider.dart';

class CmsTab extends ConsumerStatefulWidget {
  const CmsTab({super.key});

  @override
  ConsumerState<CmsTab> createState() => _CmsTabState();
}

class _CmsTabState extends ConsumerState<CmsTab> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  
  // Site Settings Controllers
  final _platformFeeController = TextEditingController();
  final _basicShareController = TextEditingController();
  final _premiumShareController = TextEditingController();
  final _eliteShareController = TextEditingController();

  // Hero Controllers
  final _heroTitleCtrl = TextEditingController();
  final _heroSubtitleCtrl = TextEditingController();
  final _heroImageCtrl = TextEditingController();
  final _card1TitleCtrl = TextEditingController();
  final _card1DescCtrl = TextEditingController();
  final _card1IconCtrl = TextEditingController();
  final _card2TitleCtrl = TextEditingController();
  final _card2DescCtrl = TextEditingController();
  final _card2IconCtrl = TextEditingController();
  final _card3TitleCtrl = TextEditingController();
  final _card3DescCtrl = TextEditingController();
  final _card3IconCtrl = TextEditingController();

  // About Controllers
  final _aboutTitleCtrl = TextEditingController();
  final _aboutDescCtrl = TextEditingController();

  // Stats Controllers
  final _statsActiveCtrl = TextEditingController();
  final _statsOrdersCtrl = TextEditingController();
  final _statsVendorsCtrl = TextEditingController();
  final _statsRevenueCtrl = TextEditingController();

  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  void _initControllers(CmsState state) {
    if (_initialized) return;
    
    // Settings
    _platformFeeController.text = state.settings['payout_platform_charge']?.toString() ?? '1';
    _basicShareController.text = state.settings['pricing_basic_share']?.toString() ?? '60';
    _premiumShareController.text = state.settings['pricing_premium_share']?.toString() ?? '70';
    _eliteShareController.text = state.settings['pricing_elite_share']?.toString() ?? '80';

    // Hero
    _heroTitleCtrl.text = state.hero['title'] ?? '';
    _heroSubtitleCtrl.text = state.hero['subtitle'] ?? '';
    _heroImageCtrl.text = state.hero['image'] ?? '';
    _card1TitleCtrl.text = state.hero['card1_title'] ?? '';
    _card1DescCtrl.text = state.hero['card1_description'] ?? '';
    _card1IconCtrl.text = state.hero['card1_icon'] ?? '';
    _card2TitleCtrl.text = state.hero['card2_title'] ?? '';
    _card2DescCtrl.text = state.hero['card2_description'] ?? '';
    _card2IconCtrl.text = state.hero['card2_icon'] ?? '';
    _card3TitleCtrl.text = state.hero['card3_title'] ?? '';
    _card3DescCtrl.text = state.hero['card3_description'] ?? '';
    _card3IconCtrl.text = state.hero['card3_icon'] ?? '';

    // About
    _aboutTitleCtrl.text = state.about['title'] ?? '';
    _aboutDescCtrl.text = state.about['description'] ?? '';

    // Stats
    _statsActiveCtrl.text = state.stats['active_franchises']?.toString() ?? '';
    _statsOrdersCtrl.text = state.stats['daily_orders']?.toString() ?? '';
    _statsVendorsCtrl.text = state.stats['partner_vendors']?.toString() ?? '';
    _statsRevenueCtrl.text = state.stats['partner_revenue']?.toString() ?? '';

    _initialized = true;
  }

  @override
  Widget build(BuildContext context) {
    final cmsAsync = ref.watch(cmsProvider);

    return Scaffold(
      drawerEnableOpenDragGesture: false,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(kToolbarHeight),
        child: Container(
          color: Colors.white,
          child: Material(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: const Color(0xFF0F172A),
              unselectedLabelColor: Colors.grey,
              indicatorColor: const Color(0xFF0F172A),
              isScrollable: true,
              tabs: const [
                Tab(text: 'Testimonials'),
                Tab(text: 'Hero'),
                Tab(text: 'About'),
                Tab(text: 'Stats'),
                Tab(text: 'Settings'),
              ],
            ),
          ),
        ),
      ),
      floatingActionButton: _tabController.index == 0 ? FloatingActionButton(
        onPressed: () => _showEditDialog(context, ref),
        child: const Icon(Icons.add),
      ) : null,
      body: cmsAsync.when(
        data: (cmsState) {
          _initControllers(cmsState);
          
          return TabBarView(
            controller: _tabController,
            children: [
              _buildTestimonialsTab(cmsState),
              _buildHeroTab(cmsState),
              _buildAboutTab(cmsState),
              _buildStatsTab(cmsState),
              _buildSettingsTab(cmsState),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildTestimonialsTab(CmsState cmsState) {
    return RefreshIndicator(
        onRefresh: () => ref.read(cmsProvider.notifier).fetchTestimonials(),
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: cmsState.testimonials.length + 1,
          itemBuilder: (context, index) {
            if (index == cmsState.testimonials.length) {
               return Padding(
                 padding: const EdgeInsets.symmetric(vertical: 24),
                 child: ElevatedButton(
                   style: ElevatedButton.styleFrom(
                     padding: const EdgeInsets.all(16),
                     backgroundColor: Colors.green,
                     foregroundColor: Colors.white,
                   ),
                   onPressed: () async {
                       final success = await ref.read(cmsProvider.notifier).saveTestimonials(cmsState.testimonials);
                       if (!context.mounted) return;
                       if (success) {
                         ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Testimonials Saved Successfully!')));
                       }
                   },
                   child: const Text('Save All Testimonials'),
                 ),
               );
            }
            final t = cmsState.testimonials[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                title: Text(t.name, style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                subtitle: Text('${t.role}\n${t.message}', maxLines: 2, overflow: TextOverflow.ellipsis),
                isThreeLine: true,
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                     IconButton(icon: const Icon(Icons.edit, color: Colors.blue), onPressed: () => _showEditDialog(context, ref, testimonial: t, index: index)),
                     IconButton(icon: const Icon(Icons.delete, color: Colors.red), onPressed: () => ref.read(cmsProvider.notifier).removeTestimonial(index)),
                  ],
                ),
              ),
            );
          },
        ),
      );
  }

  Widget _buildHeroTab(CmsState state) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildTextField(_heroTitleCtrl, 'Hero Title'),
        _buildTextField(_heroSubtitleCtrl, 'Hero Subtitle', maxLines: 3),
        _buildTextField(_heroImageCtrl, 'Hero Image Path'),
        const Divider(height: 32),
        Text('Card 1', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        _buildTextField(_card1TitleCtrl, 'Title'),
        _buildTextField(_card1IconCtrl, 'FontAwesome Icon Class'),
        _buildTextField(_card1DescCtrl, 'Description', maxLines: 2),
         const Divider(height: 32),
        Text('Card 2', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        _buildTextField(_card2TitleCtrl, 'Title'),
        _buildTextField(_card2IconCtrl, 'FontAwesome Icon Class'),
        _buildTextField(_card2DescCtrl, 'Description', maxLines: 2),
         const Divider(height: 32),
        Text('Card 3', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        _buildTextField(_card3TitleCtrl, 'Title'),
        _buildTextField(_card3IconCtrl, 'FontAwesome Icon Class'),
        _buildTextField(_card3DescCtrl, 'Description', maxLines: 2),
        const SizedBox(height: 24),
        ElevatedButton(
          onPressed: () async {
            final content = {
              'title': _heroTitleCtrl.text,
              'subtitle': _heroSubtitleCtrl.text,
              'image': _heroImageCtrl.text,
              'card1_title': _card1TitleCtrl.text,
              'card1_icon': _card1IconCtrl.text,
              'card1_description': _card1DescCtrl.text,
              'card2_title': _card2TitleCtrl.text,
              'card2_icon': _card2IconCtrl.text,
              'card2_description': _card2DescCtrl.text,
              'card3_title': _card3TitleCtrl.text,
              'card3_icon': _card3IconCtrl.text,
              'card3_description': _card3DescCtrl.text,
            };
            if (await ref.read(cmsProvider.notifier).saveCmsSection('hero', content)) {
               if (!context.mounted) return;
               ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Hero Section Saved!')));
            }
          },
          child: const Text('Save Hero Section'),
        )
      ],
    );
  }

  Widget _buildAboutTab(CmsState state) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildTextField(_aboutTitleCtrl, 'About Title'),
          _buildTextField(_aboutDescCtrl, 'About Description', maxLines: 5),
          const SizedBox(height: 24),
           ElevatedButton(
            onPressed: () async {
              final content = {
                'title': _aboutTitleCtrl.text,
                'description': _aboutDescCtrl.text,
              };
              if (await ref.read(cmsProvider.notifier).saveCmsSection('about', content)) {
                 if (!context.mounted) return;
                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('About Section Saved!')));
              }
            },
            child: const Text('Save About Section'),
          )
        ],
      ),
    );
  }

  Widget _buildStatsTab(CmsState state) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          _buildTextField(_statsActiveCtrl, 'Active Franchises'),
          _buildTextField(_statsOrdersCtrl, 'Daily Orders'),
          _buildTextField(_statsVendorsCtrl, 'Partner Vendors'),
          _buildTextField(_statsRevenueCtrl, 'Partner Revenue'),
          const SizedBox(height: 24),
           ElevatedButton(
            onPressed: () async {
              final content = {
                'active_franchises': _statsActiveCtrl.text,
                'daily_orders': _statsOrdersCtrl.text,
                'partner_vendors': _statsVendorsCtrl.text,
                'partner_revenue': _statsRevenueCtrl.text,
              };
              if (await ref.read(cmsProvider.notifier).saveCmsSection('stats', content)) {
                 if (!context.mounted) return;
                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Stats Section Saved!')));
              }
            },
            child: const Text('Save Stats Section'),
          )
        ],
      ),
    );
  }

  Widget _buildSettingsTab(CmsState state) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
           Text('Payout Configuration', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
           const SizedBox(height: 16),
           TextField(
             controller: _platformFeeController,
             keyboardType: TextInputType.number,
             decoration: const InputDecoration(labelText: 'Platform Fee per Order (₹)', border: OutlineInputBorder()),
           ),
           const SizedBox(height: 32),
           ElevatedButton(
             style: ElevatedButton.styleFrom(
               padding: const EdgeInsets.all(16),
               backgroundColor: const Color(0xFF0F172A),
               foregroundColor: Colors.white,
             ),
             onPressed: () async {
                final newSettings = {
                  ...state.settings,
                  'payout_platform_charge': double.tryParse(_platformFeeController.text) ?? 0,
                };
                final success = await ref.read(cmsProvider.notifier).saveSettings(newSettings);
                if (!context.mounted) return;
                if (success) {
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Settings Saved Successfully!')));
                }
             },
             child: const Text('Save Settings'),
           ),
        ],
      ),
    );
  }

  Widget _buildTextField(TextEditingController ctrl, String label, {int maxLines = 1}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextField(
        controller: ctrl,
        decoration: InputDecoration(labelText: label, border: const OutlineInputBorder()),
        maxLines: maxLines,
      ),
    );
  }

  void _showEditDialog(BuildContext context, WidgetRef ref, {Testimonial? testimonial, int? index}) {
    final nameController = TextEditingController(text: testimonial?.name);
    final roleController = TextEditingController(text: testimonial?.role);
    final messageController = TextEditingController(text: testimonial?.message);
    int rating = testimonial?.rating ?? 5;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(testimonial == null ? 'Add Testimonial' : 'Edit Testimonial'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameController, decoration: const InputDecoration(labelText: 'Name')),
                TextField(controller: roleController, decoration: const InputDecoration(labelText: 'Role')),
                const SizedBox(height: 16),
                TextField(controller: messageController, decoration: const InputDecoration(labelText: 'Message'), maxLines: 3),
                 const SizedBox(height: 16),
                Row(
                  children: [
                    const Text('Rating: '),
                    DropdownButton<int>(
                      value: rating,
                      items: [1,2,3,4,5].map((e) => DropdownMenuItem(value: e, child: Text('$e Stars'))).toList(),
                      onChanged: (val) => setState(() => rating = val!),
                    ),
                  ],
                )
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              onPressed: () {
                final newT = Testimonial(
                    name: nameController.text,
                    role: roleController.text,
                    message: messageController.text,
                    rating: rating,
                    company: '', // Simplified
                    avatar: testimonial?.avatar
                );
                if (index != null) {
                   ref.read(cmsProvider.notifier).updateTestimonial(index, newT);
                } else {
                   ref.read(cmsProvider.notifier).addTestimonial(newT);
                }
                Navigator.pop(context);
              },
              child: const Text('OK'),
            ),
          ],
        ),
      ),
    );
  }
}
