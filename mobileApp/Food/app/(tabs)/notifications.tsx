import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http } from '../../src/api/http';
import { useI18n } from '../../src/i18n/useI18n';
import { useAuthStore } from '../../src/store/authStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import { roleUi } from '@/src/theme/roleUi';

interface Notification {
  _id: string;
  title: string;
  message?: string;
  body?: string;
  type?: string | null;
  related_entity_id?: string | null;
  related_entity_type?: string | null;
  is_read: boolean;
  createdAt: string;
}

function useTimeAgo() {
  const { t } = useI18n();
  return (dateStr: string): string => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return t('notifications.timeJustNow');
    if (mins < 60) return t('notifications.timeMinutes').replace('{n}', String(mins));
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('notifications.timeHours').replace('{n}', String(hrs));
    return t('notifications.timeDays').replace('{n}', String(Math.floor(hrs / 24)));
  };
}

function routeForNotification(type?: string | null, role?: string): string | null {
  if (!type) return null;
  switch (type) {
    case 'NEW_FOOD':
    case 'ORDER_CONFIRMED':
    case 'PICKUP_REMINDER':
    case 'ORDER_REJECTED':
      if (role === 'RECEIVER') return '/(tabs)/RECEIVER/home';
      return null;
    case 'NEW_ORDER':
    case 'FOOD_EXPIRING':
      if (role === 'DONOR') return '/(tabs)/DONOR/home';
      return null;
    case 'NEW_MESSAGE':
      return '/(tabs)/message';
    case 'FEEDBACK_RECEIVED':
      // Donor/volunteer xem đánh giá → màn Achievement (có mục "Feedback received").
      return '/(stack)/REWARD/rewards';
    default:
      return null;
  }
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const timeAgo = useTimeAgo();
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState('');

  const loadNotifications = useCallback(async () => {
    try {
      setErr('');
      const res = await http.get('/notifications');
      setItems(res.data?.data ?? []);
    } catch {
      setErr(t('notifications.errorLoad'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadNotifications();
      // Mark all read khi user mở màn hình → đồng bộ badge.
      void markAllRead();
    }, [loadNotifications, markAllRead]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    void loadNotifications();
  };

  const onItemPress = (item: Notification) => {
    // Optimistic mark read local nếu chưa.
    if (!item.is_read) {
      http.patch(`/notifications/${item._id}/read`).catch(() => {});
      setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, is_read: true } : n)));
    }
    // Deep-link nếu có route phù hợp.
    const role = useAuthStore.getState().user?.role;
    const target = routeForNotification(item.type, role);
    // navigate thay vì push: tránh mount lại tab đích với state rỗng (mất dữ liệu).
    if (target) router.navigate(target as any);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.panel}>
        <View style={styles.panelHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.panelTitle}>{t('notifications.title')}</Text>
        </View>

        {loading && <ActivityIndicator color={roleUi.colors.primary} style={{ marginTop: 28 }} />}
        {err ? <Text style={styles.err}>{err}</Text> : null}

        {!loading && !err && items.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={42} color="#B8BCC5" />
            <Text style={styles.emptyText}>{t('notifications.empty')}</Text>
          </View>
        )}

        <FlatList
          data={items}
          keyExtractor={(n) => n._id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[roleUi.colors.primary]} />}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.7} onPress={() => onItemPress(item)} style={styles.itemWrap}>
              <View style={styles.metaRow}>
                <View style={styles.metaLeft}>
                  <View style={[styles.dot, item.is_read && styles.dotRead]} />
                  <Text style={[styles.titleText, item.is_read && styles.titleRead]} numberOfLines={1}>
                    {item.title}
                  </Text>
                </View>
                <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
              </View>

              <Text style={[styles.messageText, item.is_read && styles.messageRead]}>
                {item.message || item.body || ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F4', paddingHorizontal: 16, paddingTop: 8 },
  panel: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECECF0',
    overflow: 'hidden',
    marginVertical: 8,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E6E6EA',
    height: 56,
    paddingHorizontal: 12,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  panelTitle: { fontSize: 20, fontWeight: '700', color: '#111' },
  err: { color: roleUi.colors.danger, textAlign: 'center', marginTop: 20 },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 8 },
  emptyText: { color: '#888', fontSize: 15 },
  listContent: { paddingHorizontal: 12, paddingVertical: 8 },
  itemWrap: { paddingVertical: 12 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: roleUi.colors.primary },
  dotRead: { backgroundColor: '#B8BCC5' },
  titleText: { fontSize: 15, color: '#111', fontWeight: '700', flex: 1 },
  titleRead: { color: '#4A4A4A', fontWeight: '500' },
  timeText: { fontSize: 12, color: '#8A8A8A', marginLeft: 8 },
  messageText: { marginTop: 6, marginLeft: 18, color: '#23252A', fontSize: 14, lineHeight: 20 },
  messageRead: { color: '#666666' },
  separator: { height: 1, backgroundColor: '#E9E9ED' },
});
