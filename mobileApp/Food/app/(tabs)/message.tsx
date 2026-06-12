import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useChatStore } from '../../src/store/chatStore';
import { useI18n } from '../../src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';

function timeAgo(dateStr?: string | null): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function MessageInboxScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const conversations = useChatStore((s) => s.conversations);
  const unreadTotal = useChatStore((s) => s.unreadTotal);
  const loading = useChatStore((s) => s.loading);
  const refreshConversations = useChatStore((s) => s.refreshConversations);
  const markConversationReadLocal = useChatStore((s) => s.markConversationReadLocal);

  const [refreshing, setRefreshing] = useState(false);

  // Refetch mỗi lần vào tab — hội thoại tạo sau lần tải đầu (vd. vừa chat với
  // donor khác) phải hiện ngay, không chỉ tải đúng một lần.
  useFocusEffect(
    useCallback(() => {
      void refreshConversations();
    }, [refreshConversations]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshConversations();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('message.title')}</Text>
        {unreadTotal > 0 ? (
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>{unreadTotal}</Text>
          </View>
        ) : null}
      </View>

      {loading && <ActivityIndicator color={roleUi.colors.primary} style={{ marginTop: 40 }} />}

      {!loading && conversations.length === 0 && (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>💬</Text>
          <Text style={styles.emptyText}>{t('message.empty')}</Text>
        </View>
      )}

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[roleUi.colors.primary]} />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              markConversationReadLocal(item.id);
              router.push({
                pathname: '/(stack)/chat/[conversationId]',
                params: {
                  conversationId: item.id,
                  title: item.counterpart?.full_name || 'Chat',
                },
              } as any);
            }}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.avatar, { backgroundColor: item.unread_count ? roleUi.colors.primary : '#8A8A8A' }]}>
                <Text style={styles.avatarLetter}>{item.counterpart?.full_name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.author}>{item.counterpart?.full_name ?? t('message.unknownUser')}</Text>
                <Text style={styles.preview} numberOfLines={1}>{item.last_message_text || t('message.startConversation')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', minWidth: 52 }}>
                <Text style={styles.time}>{timeAgo(item.last_message_at)}</Text>
                {(item.unread_count || 0) > 0 ? (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread_count}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: '#F5F5F5' },
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  title:      { fontSize: 22, fontWeight: '700', color: '#111' },
  totalBadge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 7,
    backgroundColor: roleUi.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty:      { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyIcon:  { fontSize: 40, marginBottom: 12 },
  emptyText:  { color: '#888', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  card:       { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar:     { width: 38, height: 38, borderRadius: 19, backgroundColor: roleUi.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarLetter: { color: '#fff', fontWeight: '700', fontSize: 16 },
  author:     { fontWeight: '700', color: '#111', fontSize: 14, marginBottom: 2 },
  preview:    { color: '#666666', fontSize: 13 },
  time:       { color: '#8A8A8A', fontSize: 10, marginTop: 1 },
  unreadBadge: {
    marginTop: 6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    backgroundColor: roleUi.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
