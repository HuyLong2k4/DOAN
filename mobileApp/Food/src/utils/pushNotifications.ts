import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { http } from '../api/http';

// Notification hiển thị banner ngay cả khi app đang foreground.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Lấy Expo Push Token và đăng ký với backend.
 * Gọi sau khi user đã đăng nhập thành công (token JWT đã set vào http).
 *
 * Trả về Expo push token (ExponentPushToken[...]) hoặc null nếu thiết bị/quyền không hỗ trợ.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push chỉ chạy trên thiết bị thật, không chạy trên simulator.
  if (!Device.isDevice) {
    return null;
  }

  try {
    // Android cần khai báo channel để hiện notification ở foreground.
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#008080',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;

    // Gửi lên backend. Lỗi không quan trọng — user vẫn dùng app bình thường.
    try {
      await http.post('/users/me/push-token', { token });
    } catch (err) {
      console.warn('[push] failed to register token with backend:', err);
    }

    return token;
  } catch (err) {
    console.warn('[push] registerForPushNotifications error:', err);
    return null;
  }
}

/**
 * Báo backend xoá push token (gọi khi logout) — phòng trường hợp logout không gọi /auth/logout.
 */
export async function unregisterPushNotifications(): Promise<void> {
  try {
    await http.post('/users/me/push-token', { token: '' });
  } catch {
    // im lặng — token sẽ bị clear khi user login lại
  }
}
