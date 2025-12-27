class NotificationModel {
  final int id;
  final int? userId;
  final int? franchiseId;
  final String title;
  final String message;
  final String type;
  final Map<String, dynamic>? data;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    this.userId,
    this.franchiseId,
    required this.title,
    required this.message,
    required this.type,
    this.data,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'],
      userId: json['user_id'],
      franchiseId: json['franchise_id'],
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? 'general',
      data: json['data'] != null ? Map<String, dynamic>.from(json['data']) : null,
      isRead: json['is_read'] == 1 || json['is_read'] == true,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
