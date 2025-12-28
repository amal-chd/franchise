import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import 'community_provider.dart';

class CreatePostScreen extends ConsumerStatefulWidget {
  const CreatePostScreen({super.key});

  @override
  ConsumerState<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends ConsumerState<CreatePostScreen> {
  final _contentController = TextEditingController();
  File? _imageFile;
  bool _isLoading = false;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) {
        setState(() => _imageFile = File(picked.path));
    }
  }

  Future<void> _submit() async {
    if (_contentController.text.isEmpty && _imageFile == null) return;

    setState(() => _isLoading = true);

    String? imageUrl;
    if (_imageFile != null) {
        try {
            print('Uploading image...');
            imageUrl = await ref.read(communityFeedProvider.notifier).uploadImage(_imageFile!);
            print('Image uploaded: $imageUrl');
        } catch (e) {
            print('Image upload failed: $e');
        }
    }

    print('Creating post with content: ${_contentController.text}, image: $imageUrl');
    final errorMsg = await ref.read(communityFeedProvider.notifier).createPost(
          _contentController.text,
          imageUrl,
        );

    setState(() => _isLoading = false);

    if (errorMsg == null && mounted) {
      Navigator.pop(context);
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(errorMsg ?? 'Failed to post')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text('Create Post', style: GoogleFonts.outfit(color: Colors.black, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          TextButton(
            onPressed: _isLoading ? null : _submit,
            child: _isLoading 
                ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                : Text('Post', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _contentController,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: 'Share your experience...',
                hintStyle: GoogleFonts.inter(color: Colors.grey),
                border: InputBorder.none,
              ),
              style: GoogleFonts.inter(),
            ),
            const SizedBox(height: 20),
            if (_imageFile != null)
                Stack(
                    children: [
                        ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.file(_imageFile!, height: 200, width: double.infinity, fit: BoxFit.cover),
                        ),
                        Positioned(
                            top: 8, right: 8,
                            child: GestureDetector(
                                onTap: () => setState(() => _imageFile = null),
                                child: Container(
                                    padding: const EdgeInsets.all(4),
                                    decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                                    child: const Icon(Icons.close, color: Colors.white, size: 20),
                                ),
                            ),
                        )
                    ],
                ),
            const Spacer(),
            Divider(color: Colors.grey[200]),
            ListTile(
                leading: const Icon(Icons.photo_library, color: Colors.blue),
                title: Text('Add Photo', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                onTap: _pickImage,
            ),
          ],
        ),
      ),
    );
  }
}
