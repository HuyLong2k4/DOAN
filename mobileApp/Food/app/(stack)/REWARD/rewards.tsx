import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http } from '../../../src/api/http';
import { getLeaderboard, getMyStats, type DonorStats, type ReceiverStats, type VolunteerStats } from '../../../src/api/user.api';
import { getRewardLevel } from '../../../src/constants/rewardLevels';
import { useI18n } from '../../../src/i18n/useI18n';
import { useAuthStore } from '../../../src/store/authStore';
import { roleUi } from '@/src/theme/roleUi';
import { ScreenHeader } from '@/src/components/ScreenHeader';

interface LeaderEntry { _id: string; full_name: string; points: number; role?: string; }

interface ReceivedMeal {
  _id: string;
  title: string;
  quantity?: number;
  unit?: string;
  food_type?: string;
  donor_name?: string | null;
  received_at?: string;
}

export default function RewardsScreen() {
  const router  = useRouter();
  const { t, locale } = useI18n();
  const user    = useAuthStore((s) => s.user);
  const role    = user?.role;
  const showLevels = role === 'DONOR' || role === 'VOLUNTEER';
  // Receiver không tham gia tích điểm thi đua → ẩn bảng xếp hạng & cấp độ danh hiệu,
  // chỉ hiển thị hoạt động của chính họ (bữa đã nhận, NGO đã kết nối, phản hồi đã gửi).
  const showLeaderboard = role !== 'RECEIVER';
  const leaderboardRole: 'DONOR' | 'VOLUNTEER' = role === 'VOLUNTEER' ? 'VOLUNTEER' : 'DONOR';

  const [top3, setTop3]           = useState<LeaderEntry[]>([]);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<DonorStats | VolunteerStats | ReceiverStats | null>(null);
  const [receivedMeals, setReceivedMeals] = useState<ReceivedMeal[]>([]);

  const points = (stats as { points?: number } | null)?.points ?? user?.points ?? 0;

  const loadData = useCallback(async () => {
    const tasks: Promise<unknown>[] = [];
    if (showLeaderboard) {
      tasks.push(
        getLeaderboard(3, leaderboardRole)
          .then((res) => setTop3((res.data.data ?? []) as LeaderEntry[]))
          .catch(() => setTop3([])),
      );
    }
    if (role) {
      tasks.push(
        getMyStats()
          .then((res) => setStats(res.data.data as DonorStats | VolunteerStats | ReceiverStats))
          .catch(() => setStats(null)),
      );
    }
    if (role === 'RECEIVER') {
      tasks.push(
        http.get('/food-donations/received', { params: { limit: 5 } })
          .then((res) => setReceivedMeals((res.data?.data ?? []) as ReceivedMeal[]))
          .catch(() => setReceivedMeals([])),
      );
    }
    await Promise.all(tasks);
  }, [leaderboardRole, role, showLeaderboard]);

  useFocusEffect(
    useCallback(() => {
      loadData().finally(() => setLoadingBoard(false));
    }, [loadData]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

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
      <ScreenHeader title={showLeaderboard ? t('rewards.title') : t('profile.myActivity')} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={roleUi.colors.primary} colors={[roleUi.colors.primary]} />}
      >

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

        {showLeaderboard && (
          <>
            {/* Leaderboard mini */}
            <View style={styles.lbHeader}>
              <Text style={styles.sectionTitle}>{t('rewards.leaderboard')}</Text>
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
          </>
        )}

        {!showLeaderboard && (
          <>
            <TouchableOpacity
              style={styles.leaderboardBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/(stack)/REWARD/leaderboard' as any)}
            >
              <Ionicons name="trophy-outline" size={18} color="#fff" />
              <Text style={styles.leaderboardBtnText}>{t('rewards.viewLeaderboard')}</Text>
            </TouchableOpacity>

          <View style={styles.mealsSection}>
            <Text style={styles.mealsHeading}>{t('rewards.recentMealsTitle')}</Text>
            {loadingBoard ? (
              <ActivityIndicator color="#111" style={{ marginVertical: 16 }} />
            ) : receivedMeals.length === 0 ? (
              <Text style={styles.mealsEmpty}>{t('rewards.noMealsYet')}</Text>
            ) : (
              receivedMeals.map((m) => {
                const metaParts: string[] = [];
                if (m.donor_name) metaParts.push(`${t('rewards.fromDonor')} ${m.donor_name}`);
                if (m.quantity != null) metaParts.push(`${m.quantity} ${m.unit || ''}`.trim());
                return (
                  <TouchableOpacity
                    key={m._id}
                    style={styles.mealCard}
                    activeOpacity={0.7}
                    onPress={() => router.push({
                      pathname: '/(stack)/RECEIVER/donationDetail',
                      params: { donationId: m._id, title: m.title },
                    } as any)}
                  >
                    <View style={styles.mealIcon}>
                      <Ionicons name="restaurant-outline" size={20} color={roleUi.colors.successText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mealTitle} numberOfLines={1}>{m.title}</Text>
                      {metaParts.length > 0 && (
                        <Text style={styles.mealMeta} numberOfLines={1}>{metaParts.join('  ·  ')}</Text>
                      )}
                      {m.received_at ? (
                        <Text style={styles.mealDate}>{new Date(m.received_at).toLocaleDateString(locale)}</Text>
                      ) : null}
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#BBB" />
                  </TouchableOpacity>
                );
              })
            )}
          </View>
          </>
        )}

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
  statsRow:         { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 18, borderRadius: 8, padding: 14, marginBottom: 16 },
  statItem:         { flex: 1, alignItems: 'center' },
  statLabel:        { fontSize: 10, color: '#888', marginBottom: 4, textAlign: 'center' },
  statValue:        { fontSize: 20, fontWeight: '700', color: '#111' },
  statDiv:          { width: 1, backgroundColor: '#EEE', marginVertical: 4 },
  lbHeader:         { paddingHorizontal: 18, marginBottom: 12 },
  sectionTitle:     { fontSize: 16, fontWeight: '700', color: '#111' },
  podiumRow:        { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', paddingHorizontal: 18, marginBottom: 8, gap: 16 },
  podiumItem:       { alignItems: 'center', flex: 1 },
  podiumCenter:     { marginBottom: 12 },
  podiumRank:       { fontSize: 12, color: '#888', marginBottom: 4 },
  podiumAvatar:     { backgroundColor: '#E0E0E0', justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  podiumName:       { fontSize: 13, fontWeight: '700', color: '#111' },
  podiumPts:        { fontSize: 11, color: '#888' },
  viewAllBtn:       { alignSelf: 'center', marginVertical: 8 },
  viewAllText:      { fontSize: 13, color: roleUi.colors.primary, fontWeight: '600' },
  leaderboardBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: roleUi.colors.primary, marginHorizontal: 18, borderRadius: 10, paddingVertical: 12, marginBottom: 16 },
  leaderboardBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
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
  mealsSection:     { paddingHorizontal: 18, marginTop: 4 },
  mealsHeading:     { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },
  mealsEmpty:       { fontSize: 13, color: '#999', paddingVertical: 12 },
  mealCard:         { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, padding: 12, marginBottom: 10, gap: 12 },
  mealIcon:         { width: 40, height: 40, borderRadius: 20, backgroundColor: roleUi.colors.successSoft, justifyContent: 'center', alignItems: 'center' },
  mealTitle:        { fontSize: 14, fontWeight: '700', color: '#111' },
  mealMeta:         { fontSize: 12, color: '#666', marginTop: 2 },
  mealDate:         { fontSize: 11, color: '#999', marginTop: 2 },
});
