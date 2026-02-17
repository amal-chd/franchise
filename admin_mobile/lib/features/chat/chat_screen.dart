import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:intl/intl.dart';
import 'package:flutter/services.dart';

import 'chat_models.dart';
import 'chat_provider.dart';
import '../../widgets/modern_header.dart'; // Ensure this matches your project structure

class ChatScreen extends ConsumerStatefulWidget {
  final bool isEmbedded;
  const ChatScreen({super.key, this.isEmbedded = false});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _messageCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  bool _showScrollButton = false;
  
  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollCtrl.hasClients) {
      final isAtBottom = _scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 100;
      if (isAtBottom != !_showScrollButton) {
        setState(() => _showScrollButton = !isAtBottom);
      }
    }
  }

  @override
  void dispose() {
    _messageCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    if (_scrollCtrl.hasClients) {
      // Small delay to ensure list build is done
      Future.delayed(const Duration(milliseconds: 100), () {
        if (_scrollCtrl.hasClients) {
          _scrollCtrl.animateTo(
            _scrollCtrl.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    // 1. Watch Session
    final sessionAsync = ref.watch(chatSessionProvider);

    final bodyContent = Column(
      children: [
        Expanded(
          child: sessionAsync.when(
            data: (session) {
              if (session == null) {
                return _buildEmptyState('Connecting...', 'Please check your internet connection.');
              }
              
              // 2. Watch Messages for this Session
              final messagesAsync = ref.watch(chatMessagesProvider);

              return messagesAsync.when(
                data: (messages) {
                  if (messages.isEmpty) {
                    return _buildEmptyState('No messages yet', 'Start the conversation!');
                  }

                  // Auto-scroll on new message
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (_scrollCtrl.hasClients && _scrollCtrl.offset >= _scrollCtrl.position.maxScrollExtent - 200) {
                       _scrollToBottom();
                    }
                  });

                  return ListView.builder(
                    controller: _scrollCtrl,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final msg = messages[index];
                      final showDate = _shouldShowDateSeparator(messages, index);
                      return Column(
                        children: [
                          if (showDate) _buildDateSeparator(msg.createdAt),
                          _buildMessageBubble(msg),
                        ],
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
              );
            },
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, stack) => Center(child: Text('Session Error: $err', style: const TextStyle(color: Colors.red))),
          ),
        ),
        _buildInputArea(),
      ],
    );

    if (widget.isEmbedded) {
       return Container(color: const Color(0xFFF8FAFC), child: bodyContent);
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: ModernDashboardHeader(
        title: '',
        isHome: false,
        showLeading: false, 
        // Use standard LeadingWidget approach
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
              tag: 'franchise_app_logo_chat', 
              child: Material(
                color: Colors.transparent,
                child: Image.asset(
                  'assets/images/logo_text.png', 
                   height: 24,
                   fit: BoxFit.contain,
                   errorBuilder: (context, error, stackTrace) => const SizedBox(), // Standard fallback
                ),
              ),
            ),
          ],
        ),
      ),
      body: Stack(
        children: [
          bodyContent,
          if (_showScrollButton)
            Positioned(
              bottom: 90,
              right: 20,
              child: FloatingActionButton.small(
                backgroundColor: const Color(0xFF2563EB),
                onPressed: _scrollToBottom,
                child: const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF2563EB).withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.chat_bubble_outline_rounded, size: 48, color: Color(0xFF2563EB)),
          ),
          const SizedBox(height: 24),
          Text(title, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(subtitle, style: GoogleFonts.inter(color: const Color(0xFF64748B))),
        ],
      ),
    );
  }

  bool _shouldShowDateSeparator(List<ChatMessage> messages, int index) {
    if (index == 0) return true;
    final curr = messages[index].createdAt;
    final prev = messages[index - 1].createdAt;
    return curr.day != prev.day || curr.month != prev.month || curr.year != prev.year;
  }

  Widget _buildDateSeparator(DateTime date) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        children: [
          const Expanded(child: Divider()),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                DateFormat('MMM d, y').format(date),
                style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
              ),
            ),
          ),
          const Expanded(child: Divider()),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    final isMe = msg.isMe;
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? const Color(0xFF2563EB) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isMe ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(16),
          ),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4, offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (msg.attachmentUrl != null) ...[
                _buildAttachment(msg),
                const SizedBox(height: 8),
            ],
            if (msg.message != null && msg.message!.isNotEmpty)
              Text(
                msg.message!,
                style: GoogleFonts.inter(
                  color: isMe ? Colors.white : const Color(0xFF0F172A),
                  fontSize: 15,
                ),
              ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  DateFormat('h:mm a').format(msg.createdAt),
                  style: GoogleFonts.inter(fontSize: 10, color: isMe ? Colors.white70 : const Color(0xFF94A3B8)),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  Icon(
                    msg.status == 'read' ? Icons.done_all : Icons.done,
                    size: 14,
                    color: msg.status == 'read' ? const Color(0xFF67E8F9) : Colors.white70,
                  ),
                ]
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachment(ChatMessage msg) {
      if (msg.attachmentType == 'image') {
          return GestureDetector(
             onTap: () => _launchURL(msg.attachmentUrl!),
             child: ClipRRect(
               borderRadius: BorderRadius.circular(8),
               child: Image.network(
                  msg.attachmentUrl!,
                  width: 200,
                  fit: BoxFit.cover,
                  errorBuilder: (_,__,___) => const Icon(Icons.broken_image, color: Colors.white),
               ),
             ),
          );
      }
      return GestureDetector(
        onTap: () => _launchURL(msg.attachmentUrl!),
        child: Container(
           padding: const EdgeInsets.all(8),
           decoration: BoxDecoration(
             color: Colors.white24,
             borderRadius: BorderRadius.circular(8)
           ),
           child: Row(
             mainAxisSize: MainAxisSize.min,
             children: [
               const Icon(Icons.attach_file, color: Colors.white, size: 20),
               const SizedBox(width: 8),
               Text('Attachment', style: GoogleFonts.inter(color: Colors.white, fontSize: 13, decoration: TextDecoration.underline)),
             ],
           ),
        ),
      );
  }

  Future<void> _launchURL(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline_rounded, color: Color(0xFF2563EB), size: 28),
              onPressed: _showAttachmentSheet,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _messageCtrl,
                decoration: InputDecoration(
                  hintText: 'Type a message...',
                  hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8)),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
              ),
            ),
            const SizedBox(width: 8),
            IconButton(
              icon: const Icon(Icons.send_rounded, color: Color(0xFF2563EB)),
              onPressed: () async {
                 if (_messageCtrl.text.trim().isEmpty) return;
                 final text = _messageCtrl.text;
                 _messageCtrl.clear();
                 // Optimistic UI could happen here, but streaming handles it fast enough usually
                 await ref.read(chatControllerProvider).sendMessage(text);
                 _scrollToBottom();
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showAttachmentSheet() {
    showModalBottomSheet(
      context: context,
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.image),
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
              title: const Text('File'),
              onTap: _pickFile,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    Navigator.pop(context);
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source);
    if (picked != null) _uploadAndSend(picked, 'image');
  }

  Future<void> _pickFile() async {
     Navigator.pop(context);
     final result = await FilePicker.platform.pickFiles();
     if (result != null && result.files.single.path != null) {
        _uploadAndSend(XFile(result.files.single.path!), 'file');
     }
  }

  Future<void> _uploadAndSend(XFile file, String type) async {
     ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Uploading...')));
     final url = await ref.read(chatControllerProvider).uploadFile(file);
     if (url != null) {
        await ref.read(chatControllerProvider).sendMessage(null, attachmentUrl: url, attachmentType: type);
        _scrollToBottom();
     } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload failed')));
     }
  }
}
