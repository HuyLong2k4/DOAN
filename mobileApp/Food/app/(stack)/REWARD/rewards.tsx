import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getLeaderboard, getMyStats, type DonorStats, type ReceiverStats, type VolunteerStats } from '../../../src/api/user.api';
import { getRewardLevel } from '../../../src/constants/rewardLevels';
import { useI18n } from '../../../src/i18n/useI18n';
import { useAuthStore } from '../../../src/store/authStore';

interface LeaderEntry { _id: string; full_name: string; points: number; role?: string; }

export default function RewardsScreen() {
  const router  = useRouter();
  const { t }   = useI18n();
  const user    = useAuthStore((s) => s.user);
  const points  = user?.points ?? 0;
  const role    = user?.role;
  const showLevels = role === 'DONOR' || role === 'VOLUNTEER';
  const leaderboardRole: 'DONOR' | 'VOLUNTEER' = role === 'VOLUNTEER' ? 'VOLUNTEER' : 'DONOR';

  const [lbTab, setLbTab]         = useState<'Week' | 'Yearly'>('Week');
  const [top3, setTop3]           = useState<LeaderEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [stats, setStats] = useState<DonorStats | VolunteerStats | ReceiverStats | null>(null);

  useEffect(() => {
    getLeaderboard(3, leaderboardRole)
      .then((res) => setTop3((res.data.data ?? []) as LeaderEntry[]))
      .catch(() => setTop3([]))
      .finally(() => setLoadingBoard(false));
  }, [leaderboardRole]);

  useEffect(() => {
    if (!role) return;
    getMyStats()
      .then((res) => setStats(res.data.data as DonorStats | VolunteerStats | ReceiverStats))
      .catch(() => setStats(null));
  }, [role]);

  const { level: currentLevel, index: levelIndex, levels } = getRewardLevel(points, role);
  const nextLevel   = levels[levelIndex + 1] ?? null;
  const rangeStart  = currentLevel.min;
  const rangeEnd    = nextLevel ? nextLevel.min : currentLevel.min + 1;
  const barPct      = nextLevel
    ? Math.min(((points - rangeStart) / (rangeEnd - rangeStart)) * 100, 100)
    : 100;

  const pod = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('rewards.title')}</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {role === 'DONOR' && (() => {
            const s = stats as DonorStats | null;
            return (
              <>
                <StatItem value={String(s?.donations ?? 0)} label={t('rewards.donations')} />
                <View style={styles.statDiv} />
                <StatItem value={String(s?.feedbackReceived ?? 0)} label={t('rewards.feedbackReceived')} />
                <View style={styles.statDiv} />
                <StatItem value={String(s?.points ?? points)} label={t('rewards.pointsEarned')} />
              </>
            );
          })()}
          {role === 'VOLUNTEER' && (() => {
            const s = stats as VolunteerStats | null;
            return (
              <>
                <StatItem value={String(s?.deliveries ?? 0)} label={t('rewards.donations')} />
                <View style={styles.statDiv} />
                <StatItem value={String(s?.feedbackReceived ?? 0)} label={t('rewards.feedbackReceived')} />
                <View style={styles.statDiv} />
                <StatItem value={String(s?.points ?? points)} label={t('rewards.pointsEarned')} />
              </>
            );
          })()}
          {role === 'RECEIVER' && (() => {
            const s = stats as ReceiverStats | null;
            return (
              <>
                <StatItem value={String(s?.mealsReceived ?? 0)} label={t('rewards.mealsReceived')} />
                <View style={styles.statDiv} />
                <StatItem value={String(s?.ngosConnected ?? 0)} label={t('rewards.ngosConnected')} />
                <View style={styles.statDiv} />
                <StatItem value={String(s?.feedbackSent ?? 0)} label={t('rewards.feedbackSent')} />
              </>
            );
          })()}
        </View>

        {/* Leaderboard mini */}
        <View style={styles.lbHeader}>
          <Text style={styles.sectionTitle}>{t('rewards.leaderboard')}</Text>
          <View style={styles.lbTabs}>
            {(['Week', 'Yearly'] as const).map((tabKey) => (
              <TouchableOpacity key={tabKey} style={[styles.lbTab, lbTab === tabKey && styles.lbTabActive]} onPress={() => setLbTab(tabKey)}>
                <Text style={[styles.lbTabText, lbTab === tabKey && styles.lbTabTextActive]}>
                  {tabKey === 'Week' ? t('rewards.week') : t('rewards.yearly')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {loadingBoard
          ? <ActivityIndicator color="#111" style={{ marginVertical: 16 }} />
          : (
            <View style={styles.podiumRow}>
              {pod.map((entry, i) => {
                const rank  = i === 0 ? 2 : i === 1 ? 1 : 3;
                const label = [t('rewards.rank1'), t('rewards.rank2'), t('rewards.rank3')][rank - 1];
                const size  = rank === 1 ? 64 : 52;
                return (
                  <View key={entry?._id ?? i} style={[styles.podiumItem, rank === 1 && styles.podiumCenter]}>
                    <Text style={styles.podiumRank}>{label}</Text>
                    <View style={[styles.podiumAvatar, { width: size, height: size, borderRadius: size / 2 }]}>
                      <Ionicons name="person" size={size * 0.5} color="#999" />
                    </View>
                    <Text style={styles.podiumName}>{entry?.full_name?.split(' ')[0] ?? '—'}</Text>
                    <Text style={styles.podiumPts}>{entry?.points ?? 0}{t('rewards.pt')}</Text>
                  </View>
                );
              })}
            </View>
          )
        }

        <TouchableOpacity style={styles.viewAllBtn} onPress={() => router.push('/(stack)/REWARD/leaderboard' as any)}>
          <Text style={styles.viewAllText}>{t('rewards.viewFull')}</Text>
        </TouchableOpacity>

        {showLevels && (
          <>
            {/* Badge — current title */}
            <View style={styles.badgeRow}>
              <View style={[styles.badgeIconWrap, { backgroundColor: currentLevel.color + '22' }]}>
                <Ionicons name={currentLevel.icon} size={32} color={currentLevel.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.badgeMsg}>
                  {t('rewards.currentTitle')}{' '}
                  <Text style={[styles.badgeName, { color: currentLevel.color }]}>{currentLevel.title}</Text>
                </Text>
                {nextLevel && (
                  <Text style={styles.badgeHint}>
                    {nextLevel.min - points} {t('rewards.ptsToReach')} <Text style={{ fontWeight: '700' }}>{nextLevel.title}</Text>
                  </Text>
                )}
                {!nextLevel && <Text style={styles.badgeHint}>{t('rewards.maxTitleMsg')}</Text>}
              </View>
            </View>

            {/* Points bar */}
            <View style={styles.pointsCard}>
              <View style={styles.pointsLeft}>
                <Text style={styles.pointsLabel}>
                  {t('rewards.progressTo')}{' '}
                  <Text style={{ fontWeight: '700', color: '#111' }}>
                    {nextLevel ? nextLevel.title : t('rewards.maxLevel')}
                  </Text>
                </Text>
                <Text style={styles.pointsVal}>
                  {points}
                  <Text style={styles.pointsMax}>/{nextLevel ? nextLevel.min : '∞'} pts</Text>
                </Text>
                <View style={styles.bar}>
                  <View style={[styles.barFill, { width: `${barPct}%` as any, backgroundColor: currentLevel.color }]} />
                </View>
              </View>
              <View style={styles.pointsTip}>
                <Text style={styles.tipText}>
                  {nextLevel
                    ? `${nextLevel.min - points} ${t('rewards.needMorePts')} ${nextLevel.title}.`
                    : t('rewards.maxReached')}
                </Text>
              </View>
            </View>

            {/* Title Levels */}
            <Text style={[styles.sectionTitle, { paddingHorizontal: 18, marginBottom: 10 }]}>{t('rewards.titleLevels')}</Text>
            <View style={styles.levelsCard}>
              {levels.map((lv, i) => {
                const unlocked = points >= lv.min;
                const isCurrent = i === levelIndex;
                return (
                  <View key={lv.title} style={[styles.levelRow, isCurrent && styles.levelRowActive]}>
                    <View style={[styles.levelIcon, { backgroundColor: lv.color + (unlocked ? 'FF' : '44') }]}>
                      <Ionicons name={lv.icon} size={16} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.levelTitle, !unlocked && { color: '#BBB' }]}>{lv.title}</Text>
                      <Text style={styles.levelRange}>
                        {lv.max === Infinity ? `${lv.min}+ pts` : `${lv.min} – ${lv.max} pts`}
                      </Text>
                    </View>
                    {isCurrent && <View style={[styles.currentBadge, { backgroundColor: lv.color }]}><Text style={styles.currentBadgeText}>{t('rewards.current')}</Text></View>}
                    {!isCurrent && unlocked && <Ionicons name="checkmark-circle" size={18} color={lv.color} />}
                    {!unlocked && <Ionicons name="lock-closed-outline" size={16} color="#CCC" />}
                  </View>
                );
              })}
            </View>
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F5F5F5' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  headerTitle:      { fontSize: 16, fontWeight: '700', color: '#111' },
  statsRow:         { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 18, borderRadius: 8, padding: 14, marginBottom: 16 },
  statItem:         { flex: 1, alignItems: 'center' },
  statLabel:        { fontSize: 10, color: '#888', marginBottom: 4, textAlign: 'center' },
  statValue:        { fontSize: 20, fontWeight: '700', color: '#111' },
  statDiv:          { width: 1, backgroundColor: '#EEE', marginVertical: 4 },
  lbHeader:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginBottom: 12 },
  sectionTitle:     { fontSize: 16, fontWeight: '700', color: '#111' },
  lbTabs:           { flexDirection: 'row', gap: 6 },
  lbTab:            { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#DDD' },
  lbTabActive:      { backgroundColor: '#fff', borderColor: '#111' },
  lbTabText:        { fontSize: 12, color: '#999' },
  lbTabTextActive:  { color: '#111', fontWeight: '700' },
  podiumRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 18, marginBottom: 8, gap: 16 },
  podiumItem:       { alignItems: 'center', flex: 1 },
  podiumCenter:     { marginBottom: 12 },
  podiumRank:       { fontSize: 12, color: '#888', marginBottom: 4 },
  podiumAvatar:     { backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  podiumName:       { fontSize: 13, fontWeight: '700', color: '#111' },
  podiumPts:        { fontSize: 11, color: '#888' },
  viewAllBtn:       { alignSelf: 'center', marginVertical: 8 },
  viewAllText:      { fontSize: 13, color: '#008080', fontWeight: '600' },
  badgeRow:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 18, borderRadius: 8, padding: 16, marginBottom: 16, gap: 12 },
  badgeIconWrap:    { width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center' },
  badgeMsg:         { fontSize: 14, color: '#333', marginBottom: 4 },
  badgeName:        { fontWeight: '800' },
  badgeHint:        { fontSize: 12, color: '#888' },
  pointsCard:       { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 18, borderRadius: 8, padding: 14, marginBottom: 16, gap: 12 },
  pointsLeft:       { flex: 1 },
  pointsLabel:      { fontSize: 11, color: '#888', marginBottom: 4 },
  pointsVal:        { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  pointsMax:        { fontSize: 13, fontWeight: '400', color: '#888' },
  bar:              { height: 6, backgroundColor: '#EEE', borderRadius: 3 },
  barFill:          { height: 6, borderRadius: 3 },
  pointsTip:        { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 6, padding: 8, justifyContent: 'center' },
  tipText:          { fontSize: 11, color: '#666', lineHeight: 16 },
  levelsCard:       { backgroundColor: '#fff', marginHorizontal: 18, borderRadius: 8, marginBottom: 20, overflow: 'hidden' },
  levelRow:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  levelRowActive:   { backgroundColor: '#FAFAFA' },
  levelIcon:        { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  levelTitle:       { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 2 },
  levelRange:       { fontSize: 11, color: '#999' },
  currentBadge:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  currentBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },
});
