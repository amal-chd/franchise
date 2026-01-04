import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import 'dart:async';
import 'package:intl/intl.dart';
import 'chat_provider.dart';
import '../../widgets/modern_header.dart';

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
  int _previousMessageCount = 0;

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(_onScroll);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _scrollToBottom(animated: false);
    });
  }

  void _onScroll() {
    if (_scrollCtrl.hasClients) {
      final isAtBottom = _scrollCtrl.position.pixels >= _scrollCtrl.position.maxScrollExtent - 50;
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

  void _scrollToBottom({bool animated = true}) {
    if (_scrollCtrl.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
          if (_scrollCtrl.hasClients) {
              if (animated) {
                _scrollCtrl.animateTo(
                  _scrollCtrl.position.maxScrollExtent,
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOut,
                );
              } else {
                _scrollCtrl.jumpTo(_scrollCtrl.position.maxScrollExtent);
              }
          }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final sessionAsync = ref.watch(chatSessionProvider);
    final messagesAsync = ref.watch(chatMessagesProvider);

    messagesAsync.whenData((messages) {
      if (messages.length > _previousMessageCount) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToBottom();
        });
      }
      _previousMessageCount = messages.length;
    });

    final bodyContent = Stack(
        children: [
          Column(
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
                        if (messages.isEmpty) {
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
                                Text('No messages yet', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                                const SizedBox(height: 8),
                                Text('Start the conversation!', style: GoogleFonts.inter(color: Color(0xFF64748B))),
                              ],
                            ),
                          );
                        }
                        
                        return ListView.builder(
                          controller: _scrollCtrl,
                          padding: const EdgeInsets.all(16),
                          itemCount: messages.length,
                          itemBuilder: (context, index) {
                            final msg = messages[index];
                            final isMe = msg.senderType == 'franchise';
                            final showDateSeparator = _shouldShowDateSeparator(messages, index);
                            
                            return Column(
                              children: [
                                if (showDateSeparator) _buildDateSeparator(msg.createdAt),
                                _buildMessageBubble(msg, isMe),
                              ],
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
              _buildMessageInput(),
            ],
          ),
          
          if (_showScrollButton)
            Positioned(
              bottom: 90,
              right: 20,
              child: FloatingActionButton.small(
                backgroundColor: const Color(0xFF2563EB),
                onPressed: () => _scrollToBottom(),
                child: const Icon(Icons.keyboard_arrow_down_rounded, color: Colors.white),
              ),
            ),
        ],
      );

    if (widget.isEmbedded) {
        return Container(
            color: const Color(0xFFF8FAFC),
            child: bodyContent
        );
    }

    return Scaffold(
      appBar: ModernDashboardHeader(
        title: '',
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
                  'assets/images/header_logo_new.png', 
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
      backgroundColor: const Color(0xFFF8FAFC),
      body: bodyContent,
    );
  }

  DateTime _toIST(DateTime date) {
    return date.toUtc().add(const Duration(hours: 5, minutes: 30));
  }

  bool _shouldShowDateSeparator(List<ChatMessage> messages, int index) {
    if (index == 0) return true;
    
    final currentDate = _toIST(messages[index].createdAt);
    final previousDate = _toIST(messages[index - 1].createdAt);
    
    return currentDate.day != previousDate.day ||
           currentDate.month != previousDate.month ||
           currentDate.year != previousDate.year;
  }

  Widget _buildDateSeparator(DateTime date) {
    final dateInIst = _toIST(date);
    final nowInIst = _toIST(DateTime.now());
    String label;
    
    if (dateInIst.year == nowInIst.year && dateInIst.month == nowInIst.month && dateInIst.day == nowInIst.day) {
      label = 'Today';
    } else if (dateInIst.year == nowInIst.year && dateInIst.month == nowInIst.month && dateInIst.day == nowInIst.day - 1) {
      label = 'Yesterday';
    } else {
      label = DateFormat('MMM d, y').format(dateInIst);
    }
    
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
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: const Color(0xFF64748B),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          const Expanded(child: Divider()),
        ],
      ),
    );
  }

  // ... (keeping _buildMessageBubble roughly same place, or just edit formatTime separately if easier)
  
  // NOTE: replace_file_content replaces a contiguous block. 
  // I must include _buildMessageBubble and others if they are in between.
  // The block in the file is: _shouldShowDateSeparator -> _buildDateSeparator -> _buildMessageBubble -> _buildMessageInput -> ... -> _formatTime
  // That's too large. I should do multiple edits.
  
  // Edit 1: Helpers and Separators


  Widget _buildMessageBubble(ChatMessage msg, bool isMe) {
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
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            _buildMessageContent(msg, isMe),
            const SizedBox(height: 4),
            Text(
              _formatTime(msg.createdAt),
              style: GoogleFonts.inter(
                fontSize: 10,
                color: isMe ? Colors.white.withOpacity(0.7) : const Color(0xFF94A3B8),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.add_circle_outline_rounded, color: Color(0xFF2563EB), size: 28),
              onPressed: _showAttachmentOptions,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: TextField(
                  controller: _messageCtrl,
                  style: GoogleFonts.inter(fontSize: 15),
                  decoration: InputDecoration(
                    hintText: 'Type a message...',
                    hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 14),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                  maxLines: 4,
                  minLines: 1,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Container(
              decoration: const BoxDecoration(
                color: Color(0xFF2563EB),
                shape: BoxShape.circle,
              ),
              child: IconButton(
                onPressed: () async {
                  if (_messageCtrl.text.trim().isEmpty) return;
                  final msg = _messageCtrl.text;
                  _messageCtrl.clear();
                  
                  // Use updated controller
                  final success = await ref.read(chatControllerProvider).sendMessage(msg);
                  if (success) {
                     _scrollToBottom();
                  } else {
                     if (mounted) {
                       ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to send')));
                     }
                  }
                },
                icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _showAttachmentOptions() async {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B5CF6).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.photo_library_rounded, color: Color(0xFF8B5CF6)),
                ),
                title: Text('Gallery', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                onTap: () => _pickImage(ImageSource.gallery),
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.camera_alt_rounded, color: Color(0xFF10B981)),
                ),
                title: Text('Camera', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                onTap: () => _pickImage(ImageSource.camera),
              ),
              ListTile(
                leading: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF59E0B).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(Icons.attach_file_rounded, color: Color(0xFFF59E0B)),
                ),
                title: Text('Document', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                onTap: _pickFile,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _pickImage(ImageSource source) async {
    Navigator.pop(context);
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: source);
    if (pickedFile != null) {
      _uploadAndSend(pickedFile, 'image');
    }
  }

  Future<void> _pickFile() async {
    Navigator.pop(context);
    final result = await FilePicker.platform.pickFiles(withData: true);
    if (result != null && result.files.single.path != null) {
       _uploadAndSend(XFile(result.files.single.path!), 'file');
    } else if (result != null && result.files.single.bytes != null) {
      _uploadAndSend(XFile.fromData(result.files.single.bytes!, name: result.files.single.name), 'file');
    }
  }

  Future<void> _uploadAndSend(XFile file, String type) async {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Uploading...')));
    }
    // Use updated controller
    final url = await ref.read(chatControllerProvider).uploadFile(file);
    if (url != null) {
      final success = await ref.read(chatControllerProvider).sendMessage(null, attachmentUrl: url, attachmentType: type);
      if (success) {
        _scrollToBottom();
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to send attachment')));
      }
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload failed')));
    }
  }

  Widget _buildMessageContent(ChatMessage msg, bool isMe) {
    if (msg.attachmentUrl != null) {
      if (msg.attachmentType == 'image') {
        return GestureDetector(
          onTap: () => _openAttachment(msg.attachmentUrl!),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(12),
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
           child: Container(
             padding: const EdgeInsets.all(12),
             decoration: BoxDecoration(
               color: isMe ? Colors.white.withOpacity(0.2) : const Color(0xFFF8FAFC),
               borderRadius: BorderRadius.circular(12),
             ),
             child: Row(
               mainAxisSize: MainAxisSize.min,
               children: [
                 Icon(Icons.insert_drive_file_rounded, color: isMe ? Colors.white : const Color(0xFF2563EB), size: 20),
                 const SizedBox(width: 8),
                 Text(
                   'View Attachment',
                   style: GoogleFonts.inter(
                     color: isMe ? Colors.white : const Color(0xFF2563EB),
                     fontWeight: FontWeight.w600,
                     fontSize: 13,
                   ),
                 ),
               ],
             ),
           ),
         );
      }
    }
    return Text(
      msg.message,
      style: GoogleFonts.inter(
        color: isMe ? Colors.white : const Color(0xFF0F172A),
        fontSize: 15,
      ),
    );
  }

  void _openAttachment(String url) async {
    Uri uri = Uri.parse(url);
    if (!uri.hasScheme) {
       if (url.startsWith('/')) {
          uri = Uri.parse('https://franchise.thekada.in$url'); // Ideally use config
       }
    }
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  String _formatTime(DateTime dateTime) {
    return DateFormat('h:mm a').format(_toIST(dateTime));
  }
}
