import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_service.dart';

class Testimonial {
  String name;
  String role;
  String company;
  String message;
  int rating;
  String? avatar;

  Testimonial({
    required this.name,
    required this.role,
    this.company = '',
    required this.message,
    this.rating = 5,
    this.avatar,
  });

  factory Testimonial.fromJson(Map<String, dynamic> json) {
    return Testimonial(
      name: json['name'] ?? '',
      role: json['role'] ?? '',
      company: json['company'] ?? '',
      message: json['message'] ?? json['content'] ?? '', // Handle both keys
      rating: json['rating'] ?? 5,
      avatar: json['avatar'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'role': role,
      'company': company,
      'message': message,
      'rating': rating,
      'avatar': avatar,
    };
  }
}

final cmsProvider = AsyncNotifierProvider<CmsNotifier, CmsState>(() {
  return CmsNotifier();
});

class CmsState {
  final List<Testimonial> testimonials;
  final Map<String, dynamic> settings;
  final Map<String, dynamic> hero;
  final Map<String, dynamic> about;
  final Map<String, dynamic> stats;
  final bool isLoading;

  CmsState({
    this.testimonials = const [],
    this.settings = const {},
    this.hero = const {},
    this.about = const {},
    this.stats = const {},
    this.isLoading = false,
  });

  CmsState copyWith({
    List<Testimonial>? testimonials,
    Map<String, dynamic>? settings,
    Map<String, dynamic>? hero,
    Map<String, dynamic>? about,
    Map<String, dynamic>? stats,
    bool? isLoading,
  }) {
    return CmsState(
      testimonials: testimonials ?? this.testimonials,
      settings: settings ?? this.settings,
      hero: hero ?? this.hero,
      about: about ?? this.about,
      stats: stats ?? this.stats,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

class CmsNotifier extends AsyncNotifier<CmsState> {
  final ApiService _apiService = ApiService();

  @override
  Future<CmsState> build() async {
    return _fetchData();
  }

  Future<CmsState> _fetchData() async {
    final results = await Future.wait([
       _apiService.client.get('admin/cms'),
       _apiService.client.get('admin/settings'),
    ]);

    final cmsData = results[0].data as Map<String, dynamic>;
    
    // API returns { "testimonials": { "testimonials": "[...]" } }
    // We need to access the inner value.
    var testimonialsSection = cmsData['testimonials'];
    var testimonialsData = testimonialsSection != null ? testimonialsSection['testimonials'] : null;
    
    List<Testimonial> loadedList = [];
    if (testimonialsData != null) {
      try {
        if (testimonialsData is String) {
          if (testimonialsData.toString().contains('[object Object]')) {
             testimonialsData = []; // Handle corrupted data
          } else {
             testimonialsData = jsonDecode(testimonialsData);
          }
        }
        if (testimonialsData is List) {
          loadedList = (testimonialsData as List).map((e) => Testimonial.fromJson(e)).toList();
        }
      } catch (e) {
        print('Error parsing testimonials: $e');
        loadedList = [];
      }
    }

    final settings = results[1].data as Map<String, dynamic>;

    return CmsState(
      testimonials: loadedList,
      settings: settings,
      hero: cmsData['hero'] ?? {},
      about: cmsData['about'] ?? {},
      stats: cmsData['stats'] ?? {},
    );
  }

  Future<void> fetchTestimonials() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchData());
  }

  Future<bool> saveSettings(Map<String, dynamic> newSettings) async {
    try {
      final response = await _apiService.client.post('admin/settings', data: {'settings': newSettings});
      if (response.statusCode == 200) {
        final current = state.asData?.value;
        if (current != null) {
          state = AsyncValue.data(current.copyWith(settings: newSettings));
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> saveCmsSection(String section, Map<String, dynamic> content) async {
    try {
      final response = await _apiService.client.post('admin/cms', data: {
        'section': section,
        'content': content
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        final current = state.asData?.value;
        if (current != null) {
          if (section == 'hero') state = AsyncValue.data(current.copyWith(hero: content));
          if (section == 'about') state = AsyncValue.data(current.copyWith(about: content));
          if (section == 'stats') state = AsyncValue.data(current.copyWith(stats: content));
        }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> saveTestimonials(List<Testimonial> testimonials) async {
    try {
      final response = await _apiService.client.post('admin/cms', data: {
        'section': 'testimonials',
        'content': {'testimonials': testimonials.map((e) => e.toJson()).toList()}
      });
      
      if (response.statusCode == 200 || response.statusCode == 201) {
         final current = state.asData?.value;
         if (current != null) {
            state = AsyncValue.data(current.copyWith(testimonials: testimonials));
         }
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  void addTestimonial(Testimonial t) {
    final current = state.asData?.value;
    if (current != null) {
       state = AsyncValue.data(current.copyWith(testimonials: [...current.testimonials, t]));
    }
  }

  void removeTestimonial(int index) {
    final current = state.asData?.value;
    if (current != null) {
      final newList = [...current.testimonials];
      newList.removeAt(index);
      state = AsyncValue.data(current.copyWith(testimonials: newList));
    }
  }
  
  void updateTestimonial(int index, Testimonial t) {
     final current = state.asData?.value;
     if (current != null) {
      final newList = [...current.testimonials];
      newList[index] = t;
      state = AsyncValue.data(current.copyWith(testimonials: newList));
     }
  }
}
