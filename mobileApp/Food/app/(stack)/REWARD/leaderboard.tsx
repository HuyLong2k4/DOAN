import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLeaderboard } from '../../../src/api/user.api';
import type { TranslationKey } from '../../../src/i18n/translations';
import { useI18n } from '../../../src/i18n/useI18n';
import { useAuthStore } from '../../../src/store/authStore';

type Period = 'Today' | 'Week' | 'Month' | 'Yearly';
type RoleTab = 'DONOR' | 'VOLUNTEER';

interface LeaderEntry {
  _id: string;
  full_name: string;
  points: number;
  role: string;
}

const PERIOD_KEY: Record<Period, TranslationKey> = {
  Today:  'leaderboard.today',
  Week:   'leaderboard.week',
  Month:  'leaderboard.month',
  Yearly: 'leaderboard.yearly',
};

export default function LeaderboardScreen() {
  const router  = useRouter();
  const { t }   = useI18n();
  const me      = useAuthStore((s) => s.user);

  const initialRoleTab: RoleTab = me?.role === 'VOLUNTEER' ? 'VOLUNTEER' : 'DONOR';
  const [roleTab, setRoleTab] = useState<RoleTab>(initialRoleTab);
  const [period, setPeriod]   = useState<Period>('Week');
  const [list, setList]       = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLeaderboard(50, roleTab)
      .then((res) => setList(res.data.data ?? []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [period, roleTab]);

  const top3 = list.slice(0, 3);
  const rest  = list.slice(3);
  const pod   = [top3[1], top3[0], top3[2]]; // 2nd · 1st · 3rd

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('leaderboard.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

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

      {/* Period tabs */}
      <View style={styles.tabs}>
        {(['Today', 'Week', 'Month', 'Yearly'] as Period[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.tab, period === p && styles.tabActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.tabText, period === p && styles.tabTextActive]}>{t(PERIOD_KEY[p])}</Text>
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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
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
              const trending = i % 3 !== 2; // placeholder up/down
              return (
                <View key={entry._id} style={[styles.listItem, isMe && styles.listItemMe]}>
                  <View style={styles.rankCol}>
                    <Text style={[styles.rankNum, isMe && styles.rankNumMe]}>{rank}</Text>
                    <Ionicons
                      name={trending ? 'caret-up' : 'caret-down'}
                      size={10}
                      color={trending ? '#4CAF50' : '#F44336'}
                    />
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
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  headerTitle:    { fontSize: 18, fontWeight: '700', color: '#111' },
  roleTabs:       { flexDirection: 'row', alignSelf: 'center', backgroundColor: '#EEE', borderRadius: 24, padding: 4, marginBottom: 14 },
  roleTab:        { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20 },
  roleTabActive:  { backgroundColor: '#111' },
  roleTabText:    { fontSize: 13, color: '#666', fontWeight: '600' },
  roleTabTextActive: { color: '#fff' },
  tabs:           { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingHorizontal: 18, marginBottom: 20 },
  tab:            { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#DDD', backgroundColor: '#fff' },
  tabActive:      { backgroundColor: '#fff', borderColor: '#111' },
  tabText:        { fontSize: 13, color: '#999' },
  tabTextActive:  { color: '#111', fontWeight: '700' },
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
  listItemMe:     { backgroundColor: '#E8F5E9' },
  rankCol:        { width: 24, alignItems: 'center' },
  rankNum:        { fontSize: 14, fontWeight: '700', color: '#555' },
  rankNumMe:      { color: '#2E7D32' },
  listAvatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center' },
  listAvatarMe:   { backgroundColor: '#555' },
  listName:       { flex: 1, fontSize: 15, color: '#111', fontWeight: '500' },
  listNameMe:     { fontWeight: '700' },
  listPts:        { fontSize: 15, fontWeight: '700', color: '#555' },
  listPtsMe:      { color: '#2E7D32' },
  emptyText:      { textAlign: 'center', marginTop: 40, fontSize: 14, color: '#888', paddingHorizontal: 24 },
});
