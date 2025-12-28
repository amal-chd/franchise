import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../common/zones_provider.dart';

class FranchiseFormSheet extends StatefulWidget {
  final Map<String, dynamic>? initialData;
  final List<Zone> zones;
  final Function(Map<String, dynamic>) onSubmit;
  final bool isEdit;

  const FranchiseFormSheet({
    super.key,
    this.initialData,
    required this.zones,
    required this.onSubmit,
    this.isEdit = false,
  });

  @override
  State<FranchiseFormSheet> createState() => _FranchiseFormSheetState();
}

class _FranchiseFormSheetState extends State<FranchiseFormSheet> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController nameCtrl;
  late TextEditingController emailCtrl;
  late TextEditingController phoneCtrl;
  late TextEditingController cityCtrl;
  late TextEditingController upiCtrl;
  late TextEditingController accountCtrl;
  late TextEditingController ifscCtrl;
  late TextEditingController bankNameCtrl;
  late TextEditingController passCtrl;
  
  String plan = 'free';
  int? selectedZoneId;
  String status = 'pending_verification';

  @override
  void initState() {
    super.initState();
    final d = widget.initialData ?? {};
    nameCtrl = TextEditingController(text: d['name'] ?? '');
    emailCtrl = TextEditingController(text: d['email'] ?? '');
    phoneCtrl = TextEditingController(text: d['phone'] ?? '');
    cityCtrl = TextEditingController(text: d['city'] ?? '');
    upiCtrl = TextEditingController(text: d['upi_id'] ?? '');
    accountCtrl = TextEditingController(text: d['bank_account_number'] ?? '');
    ifscCtrl = TextEditingController(text: d['ifsc_code'] ?? '');
    bankNameCtrl = TextEditingController(text: d['bank_name'] ?? '');
    passCtrl = TextEditingController();

    if (d['plan_selected'] != null) plan = d['plan_selected'];
    if (d['zone_id'] != null) selectedZoneId = d['zone_id'];
    if (d['status'] != null) status = d['status'];
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag Handle
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  widget.isEdit ? 'Edit Franchise' : 'Add New Partner',
                  style: GoogleFonts.outfit(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1E293B),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1),

          Expanded(
            child: Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(24),
                children: [
                  _buildSectionTitle('Basic Information'),
                  _buildInput(nameCtrl, 'Full Name', Icons.person_outline),
                  _buildInput(emailCtrl, 'Email Address', Icons.email_outlined,
                      keyboardType: TextInputType.emailAddress),
                  _buildInput(phoneCtrl, 'Phone Number', Icons.phone_outlined,
                      keyboardType: TextInputType.phone),
                  _buildInput(cityCtrl, 'City', Icons.location_city_outlined),
                  
                  const SizedBox(height: 16),
                  _buildDropdown<String>(
                    value: plan,
                    label: 'Subscription Plan',
                    items: const [
                       DropdownMenuItem(value: 'free', child: Text('Starter (Free)')),
                       DropdownMenuItem(value: 'standard', child: Text('Standard')),
                       DropdownMenuItem(value: 'premium', child: Text('Premium')),
                       DropdownMenuItem(value: 'elite', child: Text('Elite')),
                    ],
                    onChanged: (val) => setState(() => plan = val!),
                  ),
                  
                  const SizedBox(height: 16),
                  _buildDropdown<int>(
                    value: widget.zones.any((z) => z.id == selectedZoneId) ? selectedZoneId : null,
                    label: 'Assigned Zone',
                    items: [
                      const DropdownMenuItem<int>(value: null, child: Text('Select Zone')),
                       ...widget.zones.fold<Map<int, Zone>>({}, (map, zone) {
                          map[zone.id] = zone;
                          return map;
                        }).values.map((z) => DropdownMenuItem<int>(
                          value: z.id,
                          child: Text(z.name),
                        )),
                    ],
                    onChanged: (val) => setState(() => selectedZoneId = val),
                  ),

                  const SizedBox(height: 24),
                  _buildSectionTitle('Banking Details'),
                  _buildInput(upiCtrl, 'UPI ID', Icons.qr_code),
                  _buildInput(accountCtrl, 'Account Number', Icons.account_balance),
                  _buildInput(ifscCtrl, 'IFSC Code', Icons.numbers),
                  _buildInput(bankNameCtrl, 'Bank Name', Icons.account_balance_wallet),

                  if (widget.isEdit) ...[
                    const SizedBox(height: 24),
                    _buildSectionTitle('Security'),
                    _buildInput(passCtrl, 'New Password (Optional)', Icons.lock_outline,
                        obscureText: true, helperText: 'Leave empty to keep current'),
                  ],

                  const SizedBox(height: 100), // Bottom padding for FAB/Button
                ],
              ),
            ),
          ),
          
          // Footer Button
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  offset: const Offset(0, -4),
                  blurRadius: 16,
                ),
              ],
            ),
            child: SafeArea(
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  onPressed: _handleSubmit,
                  child: Text(
                    widget.isEdit ? 'Save Changes' : 'Create Partner',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Text(
        title.toUpperCase(),
        style: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: const Color(0xFF94A3B8),
          letterSpacing: 1.2,
        ),
      ),
    );
  }

  Widget _buildInput(
    TextEditingController controller,
    String label,
    IconData icon, {
    TextInputType? keyboardType,
    bool obscureText = false,
    String? helperText,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        obscureText: obscureText,
        decoration: InputDecoration(
          labelText: label,
          helperText: helperText,
          prefixIcon: Icon(icon, size: 20, color: const Color(0xFF94A3B8)),
          filled: true,
          fillColor: const Color(0xFFF8FAFC),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: const Color(0xFFE2E8F0)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.5),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
        validator: (value) {
          if (label == 'New Password (Optional)') return null;
          if (value == null || value.isEmpty) return 'Required';
          return null;
        },
      ),
    );
  }

  Widget _buildDropdown<T>({
    required T? value,
    required String label,
    required List<DropdownMenuItem<T>> items,
    required Function(T?) onChanged,
  }) {
    return DropdownButtonFormField<T>(
      value: value,
      items: items,
      onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label,
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: const Color(0xFFE2E8F0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF2563EB), width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  void _handleSubmit() {
    if (_formKey.currentState?.validate() ?? false) {
      final data = {
        'name': nameCtrl.text,
        'email': emailCtrl.text,
        'phone': phoneCtrl.text,
        'city': cityCtrl.text,
        'plan_selected': plan,
        'status': status,
        'upi_id': upiCtrl.text,
        'bank_account_number': accountCtrl.text,
        'ifsc_code': ifscCtrl.text,
        'bank_name': bankNameCtrl.text,
        'zone_id': selectedZoneId,
      };

      if (passCtrl.text.isNotEmpty) {
        data['password'] = passCtrl.text;
      }

      widget.onSubmit(data);
    }
  }
}
