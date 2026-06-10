import { Stack, useRouter, useSegments } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getMyProfile } from '../src/api/profile.api';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationStore } from '../src/store/notificationStore';
import { loadNotifications, registerForPushNotifications } from '../src/utils/pushNotifications';
import { roleUi } from '@/src/theme/roleUi';

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
  // Expo Go SDK 53+ không hỗ trợ → skip.
  useEffect(() => {
    if (!token) return;
    const N = loadNotifications();
    if (!N) return;
    const sub = N.addNotificationReceivedListener(() => {
      useNotificationStore.getState().increment();
    });
    return () => sub.remove();
  }, [token]);

  // Deep-link khi user tap vào notification (ngoài foreground hoặc trong foreground).
  useEffect(() => {
    const N = loadNotifications();
    if (!N) return;
    const sub = N.addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data as Record<string, string> | undefined;
      const type = data?.type;
      const role = useAuthStore.getState().user?.role;
      if (!type) return;

      // navigate (không phải push) để không stack thêm 1 instance tab mới trống rỗng
      // đè lên màn hình hiện có — push tab đang mở sẽ mount lại tab với state rỗng,
      // khiến dữ liệu "biến mất" cho tới khi reload app.
      switch (type) {
        case 'NEW_MESSAGE': {
          const chatId = data?.chat_id;
          if (chatId) router.navigate(`/(stack)/chat/${chatId}` as any);
          else router.navigate('/(tabs)/message' as any);
          break;
        }
        case 'FEEDBACK_RECEIVED':
          // Donor/volunteer xem đánh giá → màn Achievement.
          router.navigate('/(stack)/REWARD/rewards' as any);
          break;
        default:
          // Mọi noti yêu cầu/đơn còn lại → về home theo role (nơi xem & tiếp tục luồng).
          // Chưa xác định được role (vd: cold start chưa load profile) → mở danh sách noti.
          if (role === 'DONOR' || role === 'RECEIVER' || role === 'VOLUNTEER') {
            router.navigate(homeRouteByRole(role) as any);
          } else {
            router.navigate('/(tabs)/notifications' as any);
          }
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
      const roleNamespaces = ['DONOR', 'RECEIVER', 'VOLUNTEER'];
      const tabsNamespace = segments[1] ?? '';

      // Tabs group: nếu đang ở tab home của role KHÁC role hiện tại, đưa về đúng home.
      // Xảy ra khi tab navigator fallback về screen khai báo đầu tiên (DONOR/home) —
      // vd: receiver back ra khỏi tab ẩn (notifications) thì lạc sang home của donor.
      // Bao phủ mọi cặp role lệch nhau (trước đây chỉ xử lý VOLUNTEER↔DONOR, bỏ sót RECEIVER).
      if (inTabsGroup && roleNamespaces.includes(tabsNamespace) && tabsNamespace !== user.role) {
        router.replace(homeRouteByRole(user.role) as any);
        return;
      }

      // Stack group: tương tự cho các màn (stack)/<ROLE>/...
      if (inStackGroup && roleNamespaces.includes(stackNamespace) && stackNamespace !== user.role) {
        router.replace(homeRouteByRole(user.role) as any);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user, isReady, segments]);

  if (!isReady) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="large" color={roleUi.colors.primary} />
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
        <ActivityIndicator size="large" color={roleUi.colors.primary} />
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
  btnPrimary: { backgroundColor: roleUi.colors.primary },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#999' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  btnGhostText: { color: '#333' },
});
