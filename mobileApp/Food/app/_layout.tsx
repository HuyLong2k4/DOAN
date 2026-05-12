import { Stack, useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getMyProfile } from '../src/api/profile.api';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationStore } from '../src/store/notificationStore';
import { registerForPushNotifications } from '../src/utils/pushNotifications';

type AuthUser = { role?: string; onboarding_step?: number; profile_completed?: boolean };

function homeRouteByRole(role?: string): string {
  switch (role) {
    case 'DONOR':     return '/(tabs)/DONOR/home';
    case 'RECEIVER':  return '/(tabs)/RECEIVER/home';
    case 'VOLUNTEER': return '/(tabs)/VOLUNTEER/home';
    default:          return '/(auth)/selectRole';
  }
}

/** Route an authenticated user to onboarding flow or role-specific home. */
function authEntryRoute(user: AuthUser): string {
  if (user.profile_completed) return homeRouteByRole(user.role);

  switch (user.role) {
    case 'DONOR':     return '/(auth)/donorDetails';
    case 'RECEIVER':  return '/(auth)/receiverDetails';
    case 'VOLUNTEER': return '/(auth)/volunteerDetails';
    default:          return '/(auth)/selectRole';
  }
}

export default function RootLayout() {
  const router   = useRouter();
  const segments = useSegments();

  const { token, user, isReady, hydrate, setUser, clear } = useAuthStore();
  const [profileError, setProfileError] = useState<string | null>(null);

  // Hydrate token from SecureStore on first mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { hydrate(); }, []);

  // Once hydrated: if we have a token but no user, fetch profile to know onboarding state
  const loadProfile = useCallback(async () => {
    setProfileError(null);
    try {
      const res = await getMyProfile();
      setUser(res.data.data.user);
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 401 || status === 403) {
        // 401/403 đã được http interceptor xử lý (clear session). Không cần làm gì thêm.
        return;
      }
      // Lỗi mạng / server lỗi — giữ token, hiển thị retry để user không bị stuck.
      setProfileError(e?.message || 'Không kết nối được máy chủ.');
    }
  }, [setUser]);

  useEffect(() => {
    if (!isReady) return;
    if (!token)   return;
    if (user)     return;
    void loadProfile();
  }, [isReady, token, user, loadProfile]);

  // Đăng ký Expo Push Token với backend + load số notification chưa đọc.
  // Chỉ chạy khi user đã hoàn tất onboarding (role + profile) để tránh
  // can thiệp vào flow signup/select-role.
  useEffect(() => {
    if (!isReady || !token || !user) return;
    if (!user.profile_completed) return;
    void registerForPushNotifications();
    void useNotificationStore.getState().refresh();
  }, [isReady, token, user]);

  // Mỗi khi có push notification tới (foreground/background), tăng badge.
  useEffect(() => {
    if (!token) return;
    const sub = Notifications.addNotificationReceivedListener(() => {
      useNotificationStore.getState().increment();
    });
    return () => sub.remove();
  }, [token]);

  // Deep-link khi user tap vào notification (ngoài foreground hoặc trong foreground).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data as Record<string, string> | undefined;
      const type = data?.type;
      const role = useAuthStore.getState().user?.role;
      if (!type) return;

      switch (type) {
        case 'NEW_MESSAGE': {
          const chatId = data?.chat_id;
          if (chatId) router.push(`/(stack)/chat/${chatId}` as any);
          else router.push('/(tabs)/message' as any);
          break;
        }
        case 'NEW_FOOD':
        case 'ORDER_REJECTED':
          if (role === 'RECEIVER') router.push('/(tabs)/RECEIVER/home' as any);
          break;
        case 'NEW_ORDER':
        case 'FOOD_EXPIRING':
          if (role === 'DONOR') router.push('/(tabs)/DONOR/home' as any);
          break;
        case 'ORDER_CONFIRMED':
        case 'PICKUP_REMINDER':
          if (role === 'RECEIVER') router.push('/(tabs)/RECEIVER/home' as any);
          break;
        default:
          router.push('/(tabs)/notifications' as any);
      }
    });
    return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guard routing: run whenever auth state is fully known
  useEffect(() => {
    if (!isReady)       return;
    if (token && !user) return;

    const inAuthGroup  = segments[0] === '(auth)';
    const inTabsGroup  = segments[0] === '(tabs)';
    const inStackGroup = segments[0] === '(stack)';
    const stackNamespace = segments[1] ?? '';

    if (!token) {
      // Not authenticated → force login
      if (!inAuthGroup) router.replace('/(auth)/login');
      return;
    }

    if (inAuthGroup) {
      const target = authEntryRoute(user!);
      const currentScreen = segments[1] ?? '';
      const targetScreen  = target.replace('/(auth)/', '').replace('/(tabs)/', '').replace('/(stack)/', '');
      if (currentScreen !== targetScreen) {
        router.replace(target as any);
      }
    }

    if (inTabsGroup && user && !user.profile_completed) {
      router.replace(authEntryRoute(user) as any);
      return;
    }

    if (user?.profile_completed) {
      // Volunteer should use VOLUNTEER/home tab entry, not donor home tab entries.
      if (inTabsGroup && user.role === 'VOLUNTEER' && (segments[1] ?? '') === 'DONOR') {
        router.replace('/(tabs)/VOLUNTEER/home' as any);
        return;
      }

      // Donor should use donor home tab entry, not volunteer home tab.
      if (inTabsGroup && user.role === 'DONOR' && (segments[1] ?? '') === 'VOLUNTEER') {
        router.replace('/(tabs)/DONOR/home' as any);
        return;
      }
      const roleNamespaces = ['DONOR', 'RECEIVER', 'VOLUNTEER'];
      if (inStackGroup && roleNamespaces.includes(stackNamespace) && stackNamespace !== user.role) {
        router.replace('(tabs)/RECEIVER/home' as any);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, isReady, segments]);

  if (!isReady) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#008080" />
      </View>
    );
  }

  // Có token nhưng chưa load được profile và lỗi không phải auth → hiển thị retry,
  // tránh để user bị kẹt vĩnh viễn ở loader.
  if (token && !user && profileError) {
    return (
      <View style={styles.loaderWrap}>
        <Text style={styles.errorTitle}>Không tải được thông tin tài khoản</Text>
        <Text style={styles.errorMsg}>{profileError}</Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => void loadProfile()}>
            <Text style={styles.btnText}>Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.btnGhost]}
            onPress={async () => {
              await clear();
            }}
          >
            <Text style={[styles.btnText, styles.btnGhostText]}>Đăng nhập lại</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (token && !user) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#008080" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(stack)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loaderWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 24,
  },
  errorTitle: { fontSize: 17, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' },
  errorMsg: { fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' },
  errorActions: { flexDirection: 'row', gap: 12 },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  btnPrimary: { backgroundColor: '#008080' },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#999' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnGhostText: { color: '#333' },
});
