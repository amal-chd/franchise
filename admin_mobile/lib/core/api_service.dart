import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class ApiService {
  final Dio _dio = Dio();
  
  // Update this to your local IP if testing on physical device
  // For iOS Simulator: http://localhost:3000
  // For Android Emulator: http://10.0.2.2:3000
  static String get baseUrl {
    // if (kDebugMode) {
    //   if (kIsWeb) return 'http://localhost:3001';
    //   if (Platform.isAndroid) return 'http://10.0.2.2:3001';
    //   return 'http://localhost:3001';
    // }
    return 'https://franchise.thekada.in';
  }

  ApiService() {
    _dio.options.baseUrl = baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);
    _dio.options.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
      ));
    }
  }

  Dio get client => _dio;
}
