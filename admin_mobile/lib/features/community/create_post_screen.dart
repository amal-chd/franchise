import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'community_provider.dart';
import '../../widgets/modern_header.dart';

class CreatePostScreen extends ConsumerStatefulWidget {
  const CreatePostScreen({super.key});

  @override
  ConsumerState<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends ConsumerState<CreatePostScreen> {
  final _contentController = TextEditingController();
  XFile? _imageFile;
  bool _isLoading = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
        setState(() => _imageFile = picked);
    }
  }

  Future<void> _submit() async {
    if (_contentController.text.isEmpty && _imageFile == null) return;

    setState(() => _isLoading = true);

    String? imageUrl;
    if (_imageFile != null) {
        try {
            imageUrl = await ref.read(communityFeedProvider.notifier).uploadImage(_imageFile!);
        } catch (e) {
            print('Image upload failed: $e');
        }
    }

    final errorMsg = await ref.read(communityFeedProvider.notifier).createPost(
          _contentController.text,
          imageUrl,
        );

    setState(() => _isLoading = false);

    if (errorMsg == null && mounted) {
      if(mounted) Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Posted successfully!'),
          backgroundColor: Color(0xFF10B981),
        ),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(errorMsg ?? 'Failed to post'), backgroundColor: Colors.redAccent),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: ModernDashboardHeader(
        title: 'New Post',
        isHome: false,
        showLeading: true,
        leadingWidget: IconButton(
          icon: Container(
             padding: const EdgeInsets.all(8),
             decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
             child: const Icon(Icons.close, size: 18, color: Colors.white),
          ),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
           Padding(
             padding: const EdgeInsets.only(right: 16),
             child: Center(
               child: Container(
                 height: 36,
                 decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                 ),
                 child: TextButton(
                   onPressed: _isLoading ? null : _submit,
                   child: _isLoading 
                      ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                      : Text('POST', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13, color: const Color(0xFF2563EB))),
                 ),
               ),
             ),
           )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                 // User Avatar Placeholder - Ideally fetch current user image
                 CircleAvatar(
                    radius: 20,
                    backgroundColor: Colors.grey[200],
                    child: const Icon(Icons.person, color: Colors.grey),
                 ),
                 const SizedBox(width: 12),
                 Expanded(
                   child: TextField(
                     controller: _contentController,
                     maxLines: null,
                     minLines: 3,
                     decoration: InputDecoration(
                       hintText: 'Share your thoughts or news...',
                       hintStyle: GoogleFonts.inter(color: Colors.grey[400], fontSize: 18),
                       border: InputBorder.none,
                     ),
                     style: GoogleFonts.inter(fontSize: 18, height: 1.5),
                   ),
                 ),
              ],
            ),
            
            const SizedBox(height: 20),
            
            if (_imageFile != null)
                Stack(
                    children: [
                        ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: kIsWeb 
                                ? Image.network(_imageFile!.path, height: 250, width: double.infinity, fit: BoxFit.cover)
                                : Image.file(File(_imageFile!.path), height: 250, width: double.infinity, fit: BoxFit.cover),
                        ),
                        Positioned(
                            top: 8, right: 8,
                            child: GestureDetector(
                                onTap: () => setState(() => _imageFile = null),
                                child: Container(
                                    padding: const EdgeInsets.all(6),
                                    decoration: BoxDecoration(color: Colors.black.withOpacity(0.6), shape: BoxShape.circle),
                                    child: const Icon(Icons.close, color: Colors.white, size: 18),
                                ),
                            ),
                        )
                    ],
                ),
                
            const SizedBox(height: 20),
            _buildMediaOption('Photo/Video', Icons.image_outlined, _pickImage),
            // Add more options later like Polls, Events etc.
          ],
        ),
      ),
    );
  }

  Widget _buildMediaOption(String label, IconData icon, VoidCallback onTap) {
      return InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Container(
             padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
             decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[200]!),
                borderRadius: BorderRadius.circular(12),
             ),
             child: Row(
               children: [
                   Icon(icon, color: const Color(0xFF2563EB)),
                   const SizedBox(width: 12),
                   Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: Colors.grey[800])),
                   const Spacer(),
                   Icon(Icons.arrow_forward_ios, size: 14, color: Colors.grey[400])
               ],
             ),
          ),
      );
  }
}
