# 🧪 Test API & FCM Token Flow

## 📱 Luồng hoạt động trong Mobile App

```
1. User mở app lần đầu
   ↓
2. Firebase SDK khởi tạo và lấy FCM token
   ↓
3. User đăng ký/đăng nhập
   ↓
4. Sau khi login thành công, gửi FCM token lên server
   ↓
5. Server lưu token vào database
   ↓
6. Khi có sự kiện (đồ ăn mới, đơn hàng, etc.)
   ↓
7. Server gửi notification qua Firebase
   ↓
8. User nhận notification trên điện thoại
```

---

## 🚀 Test API với Postman/Thunder Client

### 1. Đăng ký tài khoản
```http
POST http://172.17.35.164:5000/api/auth/register
Content-Type: application/json

{
  "full_name": "Nguyễn Văn A",
  "email": "nguyenvana@gmail.com",
  "password": "123456",
  "role": "RECEIVER"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng ký thành công",
  "data": {
    "id": "67abcd1234567890abcdef12",
    "full_name": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "phone_number": null,
    "role": "RECEIVER"
  }
}
```

---

### 2. Đăng nhập
```http
POST http://172.17.35.164:5000/api/auth/login
Content-Type: application/json

{
  "email": "nguyenvana@gmail.com",
  "password": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "67abcd1234567890abcdef12",
      "full_name": "Nguyễn Văn A",
      "email": "nguyenvana@gmail.com",
      "phone_number": null,
      "avatar_url": "https://api.dicebear.com/8.x/initials/png?seed=Nguyễn Văn A",
      "role": "RECEIVER"
    }
  }
}
```

**⚠️ Lưu lại `token` để sử dụng cho các request tiếp theo!**

---

### 3. Cập nhật FCM Token
```http
POST http://172.17.35.164:5000/api/auth/update-fcm-token
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "fcm_token": "dH6xY9Z:APA91bF..."
}
```

**Cách lấy FCM token từ mobile app:**

#### Flutter:
```dart
import 'package:firebase_messaging/firebase_messaging.dart';

final fcmToken = await FirebaseMessaging.instance.getToken();
print('FCM Token: $fcmToken');
```

#### React Native:
```javascript
import messaging from '@react-native-firebase/messaging';

const fcmToken = await messaging().getToken();
console.log('FCM Token:', fcmToken);
```

**Response:**
```json
{
  "success": true,
  "message": "FCM token đã được cập nhật"
}
```

---

### 4. Test gửi thông báo cho chính mình
```http
POST http://172.17.35.164:5000/api/notifications/test
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

{
  "title": "Test Notification",
  "body": "Đây là thông báo test từ FoodRescue!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thông báo đã được gửi",
  "messageId": "projects/food-482bb/messages/0:1234567890123456%abcdef"
}
```

**📱 Kiểm tra điện thoại → Notification sẽ xuất hiện!**

---

### 5. Lấy thông tin profile
```http
GET http://172.17.35.164:5000/api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "67abcd1234567890abcdef12",
    "full_name": "Nguyễn Văn A",
    "email": "nguyenvana@gmail.com",
    "avatar_url": "https://api.dicebear.com/8.x/initials/png?seed=Nguyễn Văn A",
    "role": "RECEIVER",
    "earned_badges": [],
    "fcm_token": "dH6xY9Z:APA91bF...",
    "createdAt": "2026-02-13T10:00:00.000Z",
    "updatedAt": "2026-02-13T10:05:00.000Z"
  }
}
```

---

### 6. Đăng xuất (xóa FCM token)
```http
POST http://172.17.35.164:5000/api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response:**
```json
{
  "success": true,
  "message": "Đăng xuất thành công"
}
```

**Sau khi logout, user sẽ KHÔNG nhận được notification nữa.**

---

## 🔥 Test với file testFCM.js

### Cách 1: Lấy FCM token từ mobile app
1. Mở mobile app (Flutter/React Native)
2. Log FCM token ra console
3. Copy token

### Cách 2: Lấy từ database
```javascript
// Trong MongoDB Compass hoặc query:
db.users.findOne({ email: "nguyenvana@gmail.com" })
// Copy giá trị fcm_token
```

### Chạy test:
```bash
# Sửa TEST_TOKEN trong file src/test/testFCM.js
# Rồi chạy:
node src/test/testFCM.js
```

---

## 📊 Use Cases trong FoodRescue

### 1. Thông báo đồ ăn mới gần user
```javascript
// Backend code (trong FoodController khi donor đăng món)
const NotificationService = require('../services/notificationService');

// Tìm user trong bán kính 2km
const nearbyUsers = await User.find({
  location: {
    $near: {
      $geometry: donorLocation,
      $maxDistance: 2000
    }
  }
});

// Gửi notification
await NotificationService.notifyNewFoodNearby(
  nearbyUsers.map(u => u._id),
  {
    food_name: "Cơm gà",
    quantity: 50,
    distance: 500,
    location: { lat: 10.762622, lng: 106.660172 },
    food_id: "67abc123...",
    image_url: "https://example.com/com-ga.jpg"
  }
);
```

### 2. Thông báo đơn hàng được xác nhận
```javascript
// Khi donor xác nhận đơn
await NotificationService.notifyOrderConfirmed(receiverId, {
  order_id: orderId,
  donor_name: "Nhà hàng ABC",
  pickup_time: "12:00 PM"
});
```

### 3. Nhắc nhở lấy đồ
```javascript
// Cron job chạy mỗi 5 phút
const ordersNeedReminder = await Order.find({
  pickup_time: { $lte: new Date(Date.now() + 30 * 60 * 1000) },
  status: 'CONFIRMED',
  reminded: false
});

for (const order of ordersNeedReminder) {
  await NotificationService.notifyPickupReminder(order.receiver_id, {
    order_id: order._id,
    order_code: order.code,
    pickup_time: order.pickup_time
  });
}
```

---

## 🎯 Debug Checklist

### ❌ Không nhận được notification?

1. **Kiểm tra FCM token có trong database chưa:**
   ```javascript
   db.users.findOne({ _id: ObjectId("...") })
   // Xem field fcm_token có giá trị không
   ```

2. **Kiểm tra Firebase project ID đúng chưa:**
   - File serviceAccountKey.json → `project_id`
   - Firebase Console → Settings → General → Project ID

3. **Kiểm tra app mobile đã request permission chưa:**
   ```dart
   // Flutter
   final permission = await FirebaseMessaging.instance.requestPermission();
   if (permission.authorizationStatus == AuthorizationStatus.authorized) {
     print('Permission granted!');
   }
   ```

4. **Kiểm tra token có hợp lệ không:**
   - Chạy `node src/test/testFCM.js`
   - Xem lỗi return từ Firebase

5. **Background vs Foreground:**
   - iOS: Cần config APNs certificate trong Firebase
   - Android: Cần handle notification trong `AndroidManifest.xml`

---

## 📱 Mobile App Integration Code

### Flutter Complete Example
```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class FCMService {
  static Future<void> initialize(String authToken) async {
    // Request permission
    await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    // Get token
    final fcmToken = await FirebaseMessaging.instance.getToken();
    
    // Send to server
    await http.post(
      Uri.parse('http://172.17.35.164:5000/api/auth/update-fcm-token'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
      body: jsonEncode({
        'fcm_token': fcmToken,
      }),
    );

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Received: ${message.notification?.title}');
      // Show local notification
    });

    // Handle notification click
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('Opened: ${message.data}');
      // Navigate to screen
      if (message.data['type'] == 'NEW_FOOD') {
        // Navigator.push to FoodDetailScreen
      }
    });
  }
}
```

---

## ✅ Tóm tắt các API endpoints

| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|-------|
| POST | `/api/auth/register` | ❌ | Đăng ký tài khoản |
| POST | `/api/auth/login` | ❌ | Đăng nhập |
| POST | `/api/auth/update-fcm-token` | ✅ | Cập nhật FCM token |
| POST | `/api/auth/logout` | ✅ | Đăng xuất |
| GET | `/api/auth/me` | ✅ | Lấy thông tin user |
| PUT | `/api/auth/me` | ✅ | Cập nhật profile |
| POST | `/api/notifications/test` | ✅ | Test gửi notification |
| POST | `/api/notifications/system-announcement` | ✅ (Admin) | Thông báo hệ thống |

---

🎉 **Chúc bạn test thành công!**
