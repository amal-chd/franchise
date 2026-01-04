
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'newsletter_provider.dart';

class ComposeEmailScreen extends ConsumerStatefulWidget {
  const ComposeEmailScreen({super.key});

  @override
  ConsumerState<ComposeEmailScreen> createState() => _ComposeEmailScreenState();
}

class _ComposeEmailScreenState extends ConsumerState<ComposeEmailScreen> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _bodyController = TextEditingController();
  final _customRecipientsController = TextEditingController();

  String _recipientType = 'all_franchises';
  bool _isLoading = false;

  final List<Map<String, String>> _recipientOptions = [
    {'value': 'all_franchises', 'label': 'All Franchise Partners'},
    {'value': 'subscribers', 'label': 'Newsletter Subscribers'},
    {'value': 'custom', 'label': 'Custom List (Comma separated)'},
  ];

  @override
  void dispose() {
    _subjectController.dispose();
    _bodyController.dispose();
    _customRecipientsController.dispose();
    super.dispose();
  }

  Future<void> _sendEmail() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    List<String>? customRecipients;
    if (_recipientType == 'custom') {
      customRecipients = _customRecipientsController.text
          .split(',')
          .map((e) => e.trim())
          .where((e) => e.isNotEmpty)
          .toList();
    }

    final success = await ref.read(newsletterProvider.notifier).sendBulkEmail(
          subject: _subjectController.text,
          html: _bodyController.text.replaceAll('\n', '<br>'), // Simple new line to br
          recipientType: _recipientType,
          customRecipients: customRecipients,
        );

    setState(() => _isLoading = false);

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Emails sent successfully!')),
        );
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to send emails. Check server logs.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Compose Email', style: GoogleFonts.outfit(color: Colors.black)),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Recipient', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _recipientType,
                    isExpanded: true,
                    items: _recipientOptions.map((opt) {
                      return DropdownMenuItem(
                        value: opt['value'],
                        child: Text(opt['label']!, style: GoogleFonts.inter()),
                      );
                    }).toList(),
                    onChanged: (val) {
                      setState(() => _recipientType = val!);
                    },
                  ),
                ),
              ),
              
              if (_recipientType == 'custom') ...[
                const SizedBox(height: 16),
                Text('Emails (comma separated)', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _customRecipientsController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    hintText: 'admin@example.com, user@example.com',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  validator: (val) {
                    if (_recipientType == 'custom' && (val == null || val.isEmpty)) {
                      return 'Please enter emails';
                    }
                    return null;
                  },
                ),
              ],

              const SizedBox(height: 20),
              Text('Subject', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _subjectController,
                decoration: InputDecoration(
                  hintText: 'Email Subject',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Subject is required' : null,
              ),

              const SizedBox(height: 20),
              Text('Message', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _bodyController,
                maxLines: 10,
                decoration: InputDecoration(
                  hintText: 'Write your message here...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                validator: (val) => val == null || val.isEmpty ? 'Message is required' : null,
              ),

              const SizedBox(height: 30),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _sendEmail,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1E293B),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isLoading 
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text('Send Email', style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
