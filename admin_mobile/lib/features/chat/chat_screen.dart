import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:io';
import 'dart:async';
import 'chat_provider.dart';

import '../../widgets/modern_header.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _messageCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
      ref.read(chatMessagesProvider.notifier).refresh();
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _messageCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollCtrl.hasClients) {
      _scrollCtrl.animateTo(
        _scrollCtrl.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final sessionAsync = ref.watch(chatSessionProvider);
    final messagesAsync = ref.watch(chatMessagesProvider);
    final canPop = Navigator.of(context).canPop();

    return Scaffold(
      appBar: ModernDashboardHeader(
        title: 'Franchise Support',
        leadingWidget: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (Navigator.of(context).canPop())
               IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                  child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.white),
                ),
                onPressed: () => Navigator.of(context).pop(),
              )
            else
               const SizedBox(width: 8),
            
            Hero(
              tag: 'app_logo', 
              child: Material(
                color: Colors.transparent,
                child: Image.asset(
                  'assets/images/logo_text.png', 
                  height: 24,
                  color: Colors.white,
                  errorBuilder: (context, error, stackTrace) => const Icon(Icons.support_agent, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
        isHome: false,
        showLeading: false, 
      ),
      backgroundColor: Colors.grey[50],
      body: Column(
        children: [
          Expanded(
            child: sessionAsync.when(
              data: (session) {
                if (session == null) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text('Start a new conversation'),
                        ElevatedButton(
                          onPressed: () {
                             ref.refresh(chatSessionProvider);
                          }, 
                          child: const Text('Connect to Support')
                        )
                      ],
                    ),
                  );
                }
                
                return messagesAsync.when(
                  data: (messages) {
                    // Auto scroll to bottom only if at bottom or first load? 
                    // For now, simpler list view
                    if (messages.isEmpty) return const Center(child: Text('No messages yet.'));
                    
                    return ListView.builder(
                      controller: _scrollCtrl,
                      padding: const EdgeInsets.all(16),
                      itemCount: messages.length,
                      itemBuilder: (context, index) {
                        final msg = messages[index];
                        final isMe = msg.senderType == 'franchise';
                        return Align(
                          alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 12),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            decoration: BoxDecoration(
                              color: isMe ? const Color(0xFF2563EB) : Colors.white,
                              borderRadius: BorderRadius.only(
                                topLeft: const Radius.circular(12),
                                topRight: const Radius.circular(12),
                                bottomLeft: isMe ? const Radius.circular(12) : Radius.zero,
                                bottomRight: isMe ? Radius.zero : const Radius.circular(12),
                              ),
                              boxShadow: const [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))],
                            ),
                            child: Column(
                              crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                              children: [
                                _buildMessageContent(msg, isMe),
                                const SizedBox(height: 4),
                                Text(
                                  _formatTime(msg.createdAt),
                                  style: TextStyle(fontSize: 10, color: isMe ? Colors.white70 : Colors.grey),
                                )
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  },
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, stack) => Center(child: Text('Error loading messages: $err')),
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, stack) => Center(child: Text('Error connecting: $err')),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.add_circle_outline, color: Color(0xFF2563EB), size: 28),
                  onPressed: _showAttachmentOptions,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _messageCtrl,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                      filled: true,
                      fillColor: Colors.grey[100],
                      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FloatingActionButton(
                  onPressed: () async {
                    if (_messageCtrl.text.trim().isEmpty) return;
                    final msg = _messageCtrl.text;
                    _messageCtrl.clear();
                    
                    final success = await ref.read(chatMessagesProvider.notifier).sendMessage(msg);
                    if (success) {
                       _scrollToBottom();
                    } else {
                       ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to send')));
                    }
                  },
                  backgroundColor: const Color(0xFF2563EB),
                  mini: true,
                  child: const Icon(Icons.send, color: Colors.white, size: 18),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Future<void> _showAttachmentOptions() async {
    showModalBottomSheet(
      context: context, 
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Gallery'),
              onTap: () => _pickImage(ImageSource.gallery),
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Camera'),
              onTap: () => _pickImage(ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.attach_file),
              title: const Text('Document'),
              onTap: _pickFile,
            ),
          ],
        ),
      )
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    Navigator.pop(context);
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: source);
    if (pickedFile != null) {
      _uploadAndSend(File(pickedFile.path), 'image');
    }
  }

  Future<void> _pickFile() async {
    Navigator.pop(context);
    final result = await FilePicker.platform.pickFiles();
    if (result != null && result.files.single.path != null) {
      _uploadAndSend(File(result.files.single.path!), 'file');
    }
  }

  Future<void> _uploadAndSend(File file, String type) async {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Uploading...')));
    final url = await ref.read(chatMessagesProvider.notifier).uploadFile(file);
    if (url != null) {
      final success = await ref.read(chatMessagesProvider.notifier).sendMessage(null, attachmentUrl: url, attachmentType: type);
      if (success) {
        _scrollToBottom();
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to send attachment')));
      }
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload failed')));
    }
  }

  Widget _buildMessageContent(ChatMessage msg, bool isMe) {
    if (msg.attachmentUrl != null) {
      if (msg.attachmentType == 'image') {
        return GestureDetector(
          onTap: () => _openAttachment(msg.attachmentUrl!),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Image.network(
              msg.attachmentUrl!,
              width: 200,
              fit: BoxFit.cover,
              errorBuilder: (_,__,___) => const Icon(Icons.broken_image),
            ),
          ),
        );
      } else {
         return InkWell(
           onTap: () => _openAttachment(msg.attachmentUrl!),
           child: Row(
             mainAxisSize: MainAxisSize.min,
             children: [
               Icon(Icons.insert_drive_file, color: isMe ? Colors.white : Colors.blue),
               const SizedBox(width: 8),
               Text('View Attachment', style: TextStyle(color: isMe ? Colors.white : Colors.blue, decoration: TextDecoration.underline)),
             ],
           ),
         );
      }
    }
    return Text(
      msg.message,
      style: GoogleFonts.inter(color: isMe ? Colors.white : Colors.black87),
    );
  }

  void _openAttachment(String url) async {
    Uri uri = Uri.parse(url);
    if (!uri.hasScheme) {
       // If relative URL, prepend production base URL
       if (url.startsWith('/')) {
          uri = Uri.parse('https://franchise.thekada.in$url');
       }
    }
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  String _formatTime(DateTime dateTime) {
    return "${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}";
  }
}
