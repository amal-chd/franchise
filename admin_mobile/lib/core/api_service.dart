// import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';
import 'package:path_provider/path_provider.dart';

class ApiService {
  final Dio _dio = Dio();
  
  // Production base URL
  static String get baseUrl {
    // return 'https://franchise.thekada.in/api/';
    // return 'http://localhost:3001/api/';
    return 'http://192.168.31.247:3001/api/';
  }

  ApiService() {
    _dio.options.baseUrl = baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 10);
    _dio.options.receiveTimeout = const Duration(seconds: 10);
    _dio.options.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (kIsWeb) {
      _dio.options.extra['withCredentials'] = true;
    }
    
    if (kDebugMode) {
      _dio.interceptors.add(LogInterceptor(
        requestBody: true,
        responseBody: true,
      ));
    }

    _initCookies();
  }

  void _initCookies() async {
    // Cookie persistence temporarily disabled for Web compatibility
    /*
    if (!kIsWeb) {
      try {
        final appDocDir = await getApplicationDocumentsDirectory();
        final cj = PersistCookieJar(storage: FileStorage("${appDocDir.path}/.cookies/"));
        _dio.interceptors.add(CookieManager(cj));
      } catch (e) {
        if (kDebugMode) print('Cookie initialization failed: $e');
      }
    }
    */
  }

  Dio get client => _dio;

  Future<String?> uploadFile(XFile file, {String folder = 'uploads'}) async {
    try {
      String fileName = file.name;
      FormData formData;

      if (kIsWeb) {
        final bytes = await file.readAsBytes();
        formData = FormData.fromMap({
          'file': MultipartFile.fromBytes(bytes, filename: fileName),
          'folder': folder,
        });
      } else {
        formData = FormData.fromMap({
          'file': await MultipartFile.fromFile(file.path, filename: fileName),
          'folder': folder,
        });
      }

      final response = await _dio.post('mobile/upload', data: formData);
      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data['url'];
      }
      return null;
    } catch (e) {
      if (kDebugMode) print('Upload failed: $e');
      return null;
    }
  }
}
