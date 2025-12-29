import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

final badgeStateProvider = Provider<BadgeStateNotifier>((ref) {
  return BadgeStateNotifier();
});

class BadgeStateNotifier {
  static const String _keyPrefix = 'badge_last_viewed_';
  
  // Mark a section as viewed (clears its badge)
  Future<void> markSectionViewed(String section) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('$_keyPrefix$section', DateTime.now().millisecondsSinceEpoch);
  }
  
  // Get the last time a section was viewed
  Future<DateTime> getLastViewedTime(String section) async {
    final prefs = await SharedPreferences.getInstance();
    final timestamp = prefs.getInt('$_keyPrefix$section');
    
    if (timestamp == null) {
      // Never viewed, return a very old date
      return DateTime(2000);
    }
    
    return DateTime.fromMillisecondsSinceEpoch(timestamp);
  }
  
  // Clear all badges
  Future<void> clearAllBadges() async {
    final prefs = await SharedPreferences.getInstance();
    final now = DateTime.now().millisecondsSinceEpoch;
    
    await prefs.setInt('${_keyPrefix}chat', now);
    await prefs.setInt('${_keyPrefix}orders', now);
    await prefs.setInt('${_keyPrefix}requests', now);
    await prefs.setInt('${_keyPrefix}payouts', now);
  }
  
  // Check if there are new items since last view
  bool hasNewItems(DateTime itemDate, DateTime lastViewedDate) {
    return itemDate.isAfter(lastViewedDate);
  }
}
