import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNotificationStore } from '../store/notificationStore';
import { roleUi } from '@/src/theme/roleUi';

interface Props {
  size?: number;
  color?: string;
}

export default function NotificationBell({ size = 22, color = '#111' }: Props) {
  const router = useRouter();
  const unread = useNotificationStore((s) => s.unreadCount);

  return (
    <TouchableOpacity
      onPress={() => router.push('/(tabs)/notifications' as any)}
      activeOpacity={0.7}
      style={styles.wrap}
    >
      <Ionicons name="notifications-outline" size={size} color={color} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { minWidth: 28, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: roleUi.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
});
