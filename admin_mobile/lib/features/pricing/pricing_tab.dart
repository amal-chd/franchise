import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../cms/cms_provider.dart';

class PricingTab extends ConsumerStatefulWidget {
  const PricingTab({super.key});

  @override
  ConsumerState<PricingTab> createState() => _PricingTabState();
}

class _PricingTabState extends ConsumerState<PricingTab> {
  // Controllers
  final _freePriceCtrl = TextEditingController();
  final _freeShareCtrl = TextEditingController();
  
  final _basicPriceCtrl = TextEditingController();
  final _basicShareCtrl = TextEditingController();
  
  final _premiumPriceCtrl = TextEditingController();
  final _premiumShareCtrl = TextEditingController();
  
  final _elitePriceCtrl = TextEditingController();
  final _eliteShareCtrl = TextEditingController();

  bool _initialized = false;

  @override
  Widget build(BuildContext context) {
    final cmsAsync = ref.watch(cmsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Pricing & Plans', style: GoogleFonts.poppins(color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        actions: [
          IconButton(
            icon: const Icon(Icons.save, color: Color(0xFF0F172A)),
            onPressed: () => _saveSettings(cmsAsync.value?.settings ?? {}),
          )
        ],
      ),
      body: cmsAsync.when(
        data: (state) {
          if (!_initialized) {
            final s = state.settings;
            _freePriceCtrl.text = s['pricing_free_price']?.toString() ?? '';
            _freeShareCtrl.text = s['pricing_free_share']?.toString() ?? '';
            
            _basicPriceCtrl.text = s['pricing_basic_price']?.toString() ?? '';
            _basicShareCtrl.text = s['pricing_basic_share']?.toString() ?? '';
            
            _premiumPriceCtrl.text = s['pricing_premium_price']?.toString() ?? '';
            _premiumShareCtrl.text = s['pricing_premium_share']?.toString() ?? '';
            
            _elitePriceCtrl.text = s['pricing_elite_price']?.toString() ?? '';
            _eliteShareCtrl.text = s['pricing_elite_share']?.toString() ?? '';
            
            _initialized = true;
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              _buildPlanCard('Starter (Free)', Colors.grey, _freePriceCtrl, _freeShareCtrl, 'Doc Fee'),
              _buildPlanCard('Standard', Colors.blue, _basicPriceCtrl, _basicShareCtrl),
              _buildPlanCard('Premium', Colors.purple, _premiumPriceCtrl, _premiumShareCtrl),
              _buildPlanCard('Elite', Colors.orange, _elitePriceCtrl, _eliteShareCtrl),
              const SizedBox(height: 24),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F172A),
                  padding: const EdgeInsets.all(16),
                  foregroundColor: Colors.white,
                ),
                onPressed: () => _saveSettings(state.settings),
                child: const Text('Save All Changes'),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, st) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildPlanCard(String title, Color color, TextEditingController priceCtrl, TextEditingController shareCtrl, [String priceLabel = 'Yearly Price']) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: priceCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(labelText: '$priceLabel (₹)', border: const OutlineInputBorder()),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextField(
                    controller: shareCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Share (%)', border: OutlineInputBorder()),
                  ),
                ),
              ],
            )
          ],
        ),
      ),
    );
  }

  Future<void> _saveSettings(Map<String, dynamic> currentSettings) async {
    final newSettings = {
      ...currentSettings,
      'pricing_free_price': _freePriceCtrl.text,
      'pricing_free_share': _freeShareCtrl.text,
      'pricing_basic_price': _basicPriceCtrl.text,
      'pricing_basic_share': _basicShareCtrl.text,
      'pricing_premium_price': _premiumPriceCtrl.text,
      'pricing_premium_share': _premiumShareCtrl.text,
      'pricing_elite_price': _elitePriceCtrl.text,
      'pricing_elite_share': _eliteShareCtrl.text,
    };

    final success = await ref.read(cmsProvider.notifier).saveSettings(newSettings);
    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pricing Updated Successfully')));
    }
  }
}
