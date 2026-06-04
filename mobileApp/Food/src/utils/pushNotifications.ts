import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { http } from '../api/http';
import { roleUi } from '@/src/theme/roleUi';
import { useLanguageStore } from '../store/languageStore';

// Expo Go (SDK 53+) đã bỏ hỗ trợ remote push.
// Phải lazy-require expo-notifications: chỉ import top-level đã trigger side-effect
// DevicePushTokenAutoRegistration → warning trong Expo Go.
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let cachedNotifications: typeof import('expo-notifications') | null = null;
export function loadNotifications(): typeof import('expo-notifications') | null {
  if (isExpoGo) return null;
  if (cachedNotifications) return cachedNotifications;
  const mod = require('expo-notifications') as typeof import('expo-notifications');
  mod.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  cachedNotifications = mod;
  return mod;
}

/**
 * Lấy Expo Push Token và đăng ký với backend.
 * Gọi sau khi user đã đăng nhập thành công (token JWT đã set vào http).
 *
 * Trả về Expo push token (ExponentPushToken[...]) hoặc null nếu thiết bị/quyền không hỗ trợ.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push chỉ chạy trên thiết bị thật + APK/dev-build (Expo Go SDK 53+ không hỗ trợ remote push).
  if (isExpoGo) return null;
  if (!Device.isDevice) return null;

  const N = loadNotifications();
  if (!N) return null;

  try {
    // Android cần khai báo channel để hiện notification ở foreground.
    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: N.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: roleUi.colors.primary,
      });
    }

    const { status: existingStatus } = await N.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;

    const tokenData = await N.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    const token = tokenData.data;

    // Gửi lên backend kèm ngôn ngữ hiện tại để render thông báo đúng ngôn ngữ.
    // Lỗi không quan trọng — user vẫn dùng app bình thường.
    try {
      const language = useLanguageStore.getState().language;
      await http.post('/users/me/push-token', { token, language });
    } catch (err) {
      console.warn('[push] failed to register token with backend:', err);
    }

    return token;
  } catch (err) {
    console.warn('[push] registerForPushNotifications error:', err);
    return null;
  }
}

