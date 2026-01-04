import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';
import 'package:intl/intl.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/api_service.dart';
import '../../core/chat_notification_service.dart';
import '../../widgets/modern_header.dart';
import 'chat_provider.dart';
import '../notifications/badge_state_provider.dart';
import '../community/community_tab.dart';
import '../franchises/franchises_tab.dart';

import '../franchises/franchise_profile_screen.dart' hide Center;
import '../requests/requests_provider.dart';

class AdminChatTab extends ConsumerWidget {
  const AdminChatTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(adminChatSessionsProvider);
    
    // Mark as read when viewing chat list
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatNotificationProvider.notifier).markAsRead();
      ref.read(badgeStateProvider).markSectionViewed('chat');
    });

    return Scaffold(
      drawerEnableOpenDragGesture: false,
      backgroundColor: const Color(0xFFF8FAFC),
      body: sessionsAsync.when(
        data: (sessions) {
          if (sessions.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'No active conversations',
                    style: GoogleFonts.outfit(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Start a new chat with a franchise partner',
                    style: GoogleFonts.inter(fontSize: 14, color: Colors.grey[500]),
                  ),
                ],
              ),
            );
          }
          return ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: sessions.length,
            itemBuilder: (context, index) {
              final session = sessions[index];
              return Container(
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF2563EB).withOpacity(0.08),
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => AdminChatScreen(
                            sessionId: session.id,
                            franchiseId: session.franchiseId,
                            franchiseName: session.franchiseName,
                          ),
                        ),
                      );
                    },
                    borderRadius: BorderRadius.circular(20),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          // Gradient Avatar
                          Container(
                            width: 56,
                            height: 56,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF2563EB), Color(0xFF1E40AF)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: Center(
                              child: Text(
                                session.franchiseName.substring(0, 1).toUpperCase(),
                                style: GoogleFonts.outfit(
                                  color: Colors.white,
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 16),
                          
                          // Chat Info
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      session.franchiseName,
                                      style: GoogleFonts.outfit(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: const Color(0xFF0F172A),
                                      ),
                                    ),
                                    if (session.lastMessageTime != null)
                                      Text(
                                        _formatMessageTime(session.lastMessageTime!),
                                        style: GoogleFonts.inter(
                                          fontSize: 12,
                                          color: const Color(0xFF94A3B8),
                                        ),
                                      ),
                                  ],
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  session.lastMessage != null && session.lastMessage!.isNotEmpty
                                      ? session.lastMessage!.length > 40
                                          ? '${session.lastMessage!.substring(0, 40)}...'
                                          : session.lastMessage!
                                      : 'No messages yet',
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    color: const Color(0xFF64748B),
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          
                          // Arrow
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2563EB).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(
                              Icons.arrow_forward_ios_rounded,
                              size: 16,
                              color: Color(0xFF2563EB),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text('Error loading chats', style: GoogleFonts.outfit(fontSize: 16)),
            ],
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      floatingActionButton: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Community Feed Bubble
          FloatingActionButton(
            mini: true,
            heroTag: 'feed_fab',
            onPressed: () {
              // Navigate to community tab
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CommunityTab()),
              );
            },
            backgroundColor: const Color(0xFF8B5CF6),
            child: const Icon(Icons.feed_rounded, size: 20),
          ),
          const SizedBox(height: 12),
          // New Chat Button
          FloatingActionButton.extended(
            heroTag: 'new_chat_fab',
            onPressed: () => _showNewChatDialog(context, ref),
            label: const Text('New Chat'),
            icon: const Icon(Icons.chat),
            backgroundColor: const Color(0xFF2563EB),
          ),
        ],
      ),
    );
  }

  String _formatMessageTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);

    if (difference.inMinutes < 1) return 'now';
    if (difference.inMinutes < 60) return '${difference.inMinutes}m';
    if (difference.inHours < 24) return '${difference.inHours}h';
    if (difference.inDays == 1) return 'Yesterday';
    if (difference.inDays < 7) return '${difference.inDays}d';
    
    return '${time.day}/${time.month}/${time.year}';
  }

  void _showNewChatDialog(BuildContext context, WidgetRef ref) {
    ref.read(requestsProvider.notifier).fetchRequests();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Start New Chat'),
        content: SizedBox(
          width: double.maxFinite,
          child: Consumer(
            builder: (context, ref, _) {
              final requestsAsync = ref.watch(requestsProvider);
              return requestsAsync.when(
                data: (requests) {
                  final active = requests.where((r) => r.status == 'approved').toList();
                  if (active.isEmpty) return const Text('No active franchises available.');
                  
                  return ListView.builder(
                    shrinkWrap: true,
                    itemCount: active.length,
                    itemBuilder: (context, index) {
                      final f = active[index];
                      return ListTile(
                        leading: CircleAvatar(
                          child: Text(f.name.isNotEmpty ? f.name[0].toUpperCase() : '?'),
                        ),
                        title: Text(f.name),
                        subtitle: Text(f.city),
                        onTap: () async {
                           Navigator.pop(context); // Close dialog
                           
                           try {
                             final session = await ref.read(adminChatControllerProvider).startNewChat(f.id, f.email);
                             if (session != null && context.mounted) {
                                await Navigator.push(context, MaterialPageRoute(builder: (_) => AdminChatScreen(
                                   sessionId: session.id,
                                   franchiseId: session.franchiseId,
                                   franchiseName: session.franchiseName
                                )));
                                ref.refresh(adminChatSessionsProvider); // Refresh list on return
                             }
                           } catch (e) {
                             if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                  content: Text(e.toString()),
                                  backgroundColor: Colors.red,
                                  duration: const Duration(seconds: 4),
                                ));
                             }
                           }
                        },
                      );
                    },
                  );
                },
                loading: () => const SizedBox(height: 100, child: Center(child: CircularProgressIndicator())),
                error: (e, s) => Text('Error: $e'),
              );
            },
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ],
      ),
    );
  }
}

class AdminChatScreen extends ConsumerStatefulWidget {
  final int sessionId;
  final int franchiseId;
  final String franchiseName;

  const AdminChatScreen({
    super.key, 
    required this.sessionId,
    required this.franchiseId,
    required this.franchiseName,
  });

  @override
  ConsumerState<AdminChatScreen> createState() => _AdminChatScreenState();
}

class _AdminChatScreenState extends ConsumerState<AdminChatScreen> {
  final TextEditingController _msgCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  Timer? _timer;
  bool _showScrollButton = false;
  int _previousMessageCount = 0;

  @override
  void initState() {
    super.initState();
    // Mark notifications as read and set current session
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatNotificationProvider.notifier).setCurrentSession(widget.sessionId);
      ref.read(chatNotificationProvider.notifier).markAsRead();
      _scrollToBottom(animated: false);
    });
    
    // Listen to scroll position
    _scrollCtrl.addListener(_onScroll);
    
    _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
      ref.invalidate(adminChatMessagesFamilyProvider(widget.sessionId));
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
    ref.read(chatNotificationProvider.notifier).setCurrentSession(null);
    _timer?.cancel();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _scrollToBottom({bool animated = true}) {
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
  }

  Future<void> _pickAndUploadFile() async {
    try {
      final ImagePicker picker = ImagePicker();
      
      // Show options: Image or Document
      final choice = await showDialog<String>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Choose File Type', style: GoogleFonts.outfit()),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.image, color: Color(0xFF2563EB)),
                title: const Text('Image'),
                onTap: () => Navigator.pop(context, 'image'),
              ),
              ListTile(
                leading: const Icon(Icons.attach_file, color: Color(0xFF2563EB)),
                title: const Text('Document'),
                onTap: () => Navigator.pop(context, 'document'),
              ),
            ],
          ),
        ),
      );

      if (choice == null) return;

      XFile? file;
      if (choice == 'image') {
        file = await picker.pickImage(source: ImageSource.gallery);
      } else {
        // For documents, we'll use image picker as fallback (or add file_picker package)
        file = await picker.pickImage(source: ImageSource.gallery);
      }

      if (file == null) return;

      // Show uploading indicator
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Uploading file...'), duration: Duration(seconds: 1)),
        );
      }

      // Upload to Vercel Blob
      final api = ApiService();
      final bytes = await file.readAsBytes();
      final fileName = file.name;
      
      final formData = FormData.fromMap({
        'file': MultipartFile.fromBytes(bytes, filename: fileName),
      });

      final uploadResponse = await api.client.post('mobile/upload-blob', data: formData);
      
      if (uploadResponse.data['url'] != null) {
        final fileUrl = uploadResponse.data['url'];
        
        // Send message with attachment - use filename as message if no text
        await _sendMessage(
          message: fileName, // Use filename as message text
          attachmentUrl: fileUrl,
          attachmentType: choice == 'image' ? 'image' : 'file',
        );

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('File sent!'), backgroundColor: Colors.green),
          );
        }
      } else {
        throw 'Upload failed - no URL returned';
      }
    } catch (e) {
      print('File upload error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Upload failed: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _sendMessage({String? message, String? attachmentUrl, String? attachmentType}) async {
    final success = await ref.read(adminChatControllerProvider).sendMessage(
      widget.sessionId, 
      message,
      attachmentUrl: attachmentUrl,
      attachmentType: attachmentType,
    );
    if (success) {
      _scrollToBottom();
    }
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(adminChatMessagesFamilyProvider(widget.sessionId));

    // Auto-scroll when new messages arrive
    messagesAsync.whenData((messages) {
      if (messages.length > _previousMessageCount) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          _scrollToBottom();
        });
      }
      _previousMessageCount = messages.length;
    });

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: AppBar(
          title: Text(widget.franchiseName, style: GoogleFonts.outfit(fontSize: 18, color: const Color(0xFF0F172A), fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          elevation: 1,
          centerTitle: true,
          leading: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: const Color(0xFF0F172A).withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Color(0xFF0F172A)),
            ),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.info_outline_rounded, color: Color(0xFF0F172A)),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => FranchiseProfileScreen(
                  franchiseId: widget.franchiseId,
                  franchiseName: widget.franchiseName
                )));
              },
            )
          ],
        ),
      ),
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          Column(
            children: [
              Expanded(
                child: messagesAsync.when(
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
                        final isMe = msg.senderType == 'admin';
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
                  error: (e,s) => const Center(child: Text('Error loading messages')),
                ),
              ),
              _buildMessageInput(),
            ],
          ),
          
          // Scroll to bottom button
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
      ),
    );
  }

  bool _shouldShowDateSeparator(List<ChatMessage> messages, int index) {
    if (index == 0) return true;
    
    final currentDate = messages[index].createdAt;
    final previousDate = messages[index - 1].createdAt;
    
    return currentDate.day != previousDate.day ||
           currentDate.month != previousDate.month ||
           currentDate.year != previousDate.year;
  }

  Widget _buildDateSeparator(DateTime date) {
    final now = DateTime.now();
    String label;
    
    if (date.year == now.year && date.month == now.month && date.day == now.day) {
      label = 'Today';
    } else if (date.year == now.year && date.month == now.month && date.day == now.day - 1) {
      label = 'Yesterday';
    } else {
      label = DateFormat('MMM d, y').format(date);
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

  Widget _buildMessageBubble(ChatMessage msg, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: msg.attachmentUrl != null ? EdgeInsets.zero : const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? const Color(0xFF2563EB) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Show attachment if exists
            if (msg.attachmentUrl != null) ...[
              if (msg.attachmentType == 'image')
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: CachedNetworkImage(
                    imageUrl: msg.attachmentUrl!,
                    width: MediaQuery.of(context).size.width * 0.65,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      height: 200,
                      color: Colors.grey[300],
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (context, url, error) => Container(
                      height: 200,
                      color: Colors.grey[300],
                      child: const Icon(Icons.broken_image),
                    ),
                  ),
                )
              else
                // File attachment
                Container(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.insert_drive_file, color: isMe ? Colors.white : const Color(0xFF2563EB)),
                      const SizedBox(width: 8),
                      Flexible(
                        child: Text(
                          msg.message,
                          style: GoogleFonts.inter(
                            color: isMe ? Colors.white : Colors.black,
                            fontSize: 14,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ),
              if (msg.message.isNotEmpty && msg.attachmentType == 'image')
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Text(
                    msg.message,
                    style: GoogleFonts.inter(
                      color: isMe ? Colors.white : const Color(0xFF1E293B),
                      fontSize: 15,
                    ),
                  ),
                ),
            ] else
              // Text only message
              Text(
                msg.message,
                style: GoogleFonts.inter(
                  color: isMe ? Colors.white : const Color(0xFF1E293B),
                  fontSize: 15,
                ),
              ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  DateFormat('h:mm a').format(msg.createdAt),
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: isMe ? Colors.white70 : const Color(0xFF94A3B8),
                  ),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  // Read receipt ticks - always visible with proper contrast
                  Icon(
                    msg.status == 'read' ? Icons.done_all : Icons.done,
                    size: 16,
                    color: msg.status == 'read' 
                        ? const Color(0xFF06B6D4) // Bright cyan for read
                        : isMe 
                            ? Colors.white.withOpacity(0.7) // White for blue bubble
                            : const Color(0xFF94A3B8), // Gray for white bubble
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(12),
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
            // Attachment button
            IconButton(
              icon: const Icon(Icons.attach_file, color: Color(0xFF2563EB)),
              onPressed: () => _pickAndUploadFile(),
            ),
            Expanded(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: TextField(
                  controller: _msgCtrl,
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
                  if (_msgCtrl.text.trim().isEmpty) return;
                  final success = await ref.read(adminChatControllerProvider).sendMessage(widget.sessionId, _msgCtrl.text.trim());
                  if (success) {
                    _msgCtrl.clear();
                    _scrollToBottom();
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
}
