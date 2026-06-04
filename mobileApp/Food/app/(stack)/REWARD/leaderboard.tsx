import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLeaderboard } from '../../../src/api/user.api';
import { useI18n } from '../../../src/i18n/useI18n';
import { useAuthStore } from '../../../src/store/authStore';
import { roleUi } from '@/src/theme/roleUi';
import { ScreenHeader } from '@/src/components/ScreenHeader';

type RoleTab = 'DONOR' | 'VOLUNTEER';

interface LeaderEntry {
  _id: string;
  full_name: string;
  points: number;
  role: string;
}

export default function LeaderboardScreen() {
  const { t }   = useI18n();
  const me      = useAuthStore((s) => s.user);

  const initialRoleTab: RoleTab = me?.role === 'VOLUNTEER' ? 'VOLUNTEER' : 'DONOR';
  const [roleTab, setRoleTab] = useState<RoleTab>(initialRoleTab);
  const [list, setList]       = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getLeaderboard(50, roleTab);
      setList(res.data.data ?? []);
    } catch {
      setList([]);
    }
  }, [roleTab]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load().finally(() => setLoading(false));
    }, [load]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const top3 = list.slice(0, 3);
  const rest  = list.slice(3);
  const pod   = [top3[1], top3[0], top3[2]]; // 2nd · 1st · 3rd

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('leaderboard.title')} />

      {/* Role tabs */}
      <View style={styles.roleTabs}>
        {(['DONOR', 'VOLUNTEER'] as RoleTab[]).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.roleTab, roleTab === r && styles.roleTabActive]}
            onPress={() => setRoleTab(r)}
          >
            <Text style={[styles.roleTabText, roleTab === r && styles.roleTabTextActive]}>
              {r === 'DONOR' ? t('leaderboard.donors') : t('leaderboard.volunteers')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color="#111" style={{ marginTop: 40 }} />
      ) : list.length === 0 ? (
        <Text style={styles.emptyText}>
          {roleTab === 'DONOR' ? t('leaderboard.emptyDonors') : t('leaderboard.emptyVolunteers')}
        </Text>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={roleUi.colors.primary} colors={[roleUi.colors.primary]} />}
        >
          {/* Podium top 3 */}
          <View style={styles.podiumRow}>
            {pod.map((entry, i) => {
              const rank = i === 0 ? 2 : i === 1 ? 1 : 3;
              const size = rank === 1 ? 72 : 58;
              const labels = ['1', '2', '3'];
              const isMe   = entry?._id === (me as any)?._id;
              return (
                <View key={entry?._id ?? i} style={[styles.podiumItem, rank === 1 && styles.podiumFirst]}>
                  <Text style={styles.podiumRankNum}>{labels[rank - 1]}</Text>
                  <View style={[
                    styles.podiumAvatar,
                    { width: size, height: size, borderRadius: size / 2 },
                    isMe && styles.podiumAvatarMe,
                  ]}>
                    <Ionicons name="person" size={size * 0.48} color={isMe ? '#fff' : '#999'} />
                  </View>
                  <Text style={styles.podiumName} numberOfLines={1}>{entry?.full_name?.split(' ').slice(-1)[0] ?? '—'}</Text>
                  <Text style={styles.podiumPts}>{entry?.points ?? 0}{t('rewards.pt')}</Text>
                </View>
              );
            })}
          </View>

          {/* Rank list 4+ */}
          <View style={styles.listSection}>
            {rest.map((entry, i) => {
              const rank = i + 4;
              const isMe = entry._id === (me as any)?._id;
              return (
                <View key={entry._id} style={[styles.listItem, isMe && styles.listItemMe]}>
                  <View style={styles.rankCol}>
                    <Text style={[styles.rankNum, isMe && styles.rankNumMe]}>{rank}</Text>
                  </View>
                  <View style={[styles.listAvatar, isMe && styles.listAvatarMe]}>
                    <Ionicons name="person" size={20} color={isMe ? '#fff' : '#999'} />
                  </View>
                  <Text style={[styles.listName, isMe && styles.listNameMe]} numberOfLines={1}>
                    {entry.full_name}
                  </Text>
                  <Text style={[styles.listPts, isMe && styles.listPtsMe]}>{entry.points}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#F5F5F5' },
  roleTabs:       { flexDirection: 'row', alignSelf: 'center', backgroundColor: '#EEE', borderRadius: 24, padding: 4, marginBottom: 20 },
  roleTab:        { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  roleTabActive:  { backgroundColor: '#111' },
  roleTabText:    { fontSize: 13, color: '#666', fontWeight: '600' },
  roleTabTextActive: { color: '#fff' },
  podiumRow:      { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 24, marginBottom: 24, gap: 12 },
  podiumItem:     { alignItems: 'center', flex: 1 },
  podiumFirst:    { marginBottom: 16 },
  podiumRankNum:  { fontSize: 13, fontWeight: '700', color: '#888', marginBottom: 6 },
  podiumAvatar:   { backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  podiumAvatarMe: { backgroundColor: '#555' },
  podiumName:     { fontSize: 13, fontWeight: '700', color: '#111', maxWidth: 80, textAlign: 'center' },
  podiumPts:      { fontSize: 12, color: '#888', marginTop: 2 },
  listSection:    { paddingHorizontal: 18, gap: 8 },
  listItem:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 28, paddingHorizontal: 14, paddingVertical: 10, gap: 12 },
  listItemMe:     { backgroundColor: roleUi.colors.successSoft },
  rankCol:        { width: 24, alignItems: 'center' },
  rankNum:        { fontSize: 14, fontWeight: '700', color: '#555' },
  rankNumMe:      { color: roleUi.colors.successText },
  listAvatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  listAvatarMe:   { backgroundColor: '#555' },
  listName:       { flex: 1, fontSize: 15, color: '#111', fontWeight: '500' },
  listNameMe:     { fontWeight: '700' },
  listPts:        { fontSize: 15, fontWeight: '700', color: '#555' },
  listPtsMe:      { color: roleUi.colors.successText },
  emptyText:      { textAlign: 'center', marginTop: 40, fontSize: 14, color: '#888', paddingHorizontal: 24 },
});
