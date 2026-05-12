import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOrCreateDonationConversation } from '../../../src/api/chat.api';
import { http } from '../../../src/api/http';
import { getNearbyNgos, type NearbyNgoItem } from '../../../src/api/profile.api';
import { getMyStats, type VolunteerStats } from '../../../src/api/user.api';
import { getRewardLevel } from '../../../src/constants/rewardLevels';
import { useI18n } from '../../../src/i18n/useI18n';
import { useAuthStore } from '../../../src/store/authStore';
import PickupCodeModal from '../../../src/components/PickupCodeModal';
import { RequestCard } from './_components/RequestCard';
import { DeliveryProgressCard } from './_components/DeliveryProgressCard';
import { ConfirmAcceptModal } from './_components/ConfirmAcceptModal';
import { mapVolunteerDeliveries } from './_components/mappers';
import type {
  DeliveryRequest,
  FoodDonationApiItem,
  NearbyNgo,
  VolunteerDeliveryApiItem,
  VolunteerDeliveryItem,
  VolunteerSummary,
} from './_components/types';
import { roleUi } from '@/src/theme/roleUi';
import NotificationBell from '@/src/components/NotificationBell';

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function VolunteerHomeScreen() {
  const router = useRouter();
  const { t, locale, language, setLanguage } = useI18n();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(' ')[0] ?? '';
  const points = user?.points ?? 200;
  const { level: volunteerLevel } = getRewardLevel(points, 'VOLUNTEER');

  const FAQS = [
    { q: t('volunteer.faqQ1') },
    { q: t('volunteer.faqQ2') },
  ];

  const [ngoTab, setNgoTab] = useState<'near' | 'popular'>('near');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<VolunteerDeliveryItem[]>([]);
  const [nearbyNgos, setNearbyNgos] = useState<NearbyNgo[]>([]);
  const [summary, setSummary] = useState<VolunteerSummary>({ delivered_count: 0, feedback_count: 0 });
  const [stats, setStats] = useState<VolunteerStats | null>(null);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingMyDeliveries, setLoadingMyDeliveries] = useState(false);
  const [loadingNgos, setLoadingNgos] = useState(false);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [actingDeliveryId, setActingDeliveryId] = useState<string | null>(null);
  const [releasingDeliveryId, setReleasingDeliveryId] = useState<string | null>(null);
  const [openingChatDonationId, setOpeningChatDonationId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<DeliveryRequest | null>(null);
  const [pickupCodeTarget, setPickupCodeTarget] = useState<VolunteerDeliveryItem | null>(null);

  const refreshMyDeliveries = useCallback(async () => {
    const myDeliveryRes = await http.get('/food-donations/volunteer/my-deliveries');
    const myDeliveryData = (myDeliveryRes.data?.data ?? []) as VolunteerDeliveryApiItem[];
    setMyDeliveries(mapVolunteerDeliveries(myDeliveryData, t));
  }, [t]);

  const removeRequestFromList = useCallback((id: string) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const openPickupOnMaps = useCallback(async (item: { pickupLatitude?: number | null; pickupLongitude?: number | null; address: string }) => {
    try {
      const destination =
        item.pickupLatitude != null && item.pickupLongitude != null
          ? `${item.pickupLatitude},${item.pickupLongitude}`
          : encodeURIComponent(item.address);

      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('volunteer.cannotOpenMaps'), t('volunteer.unableToOpenMaps'));
    }
  }, [t]);

  const handleStartPickup = useCallback(async (item: VolunteerDeliveryItem, pickupCode: string) => {
    try {
      setActingDeliveryId(item.id);
      const res = await http.patch(`/food-donations/${item.id}/pickup-start`, { pickup_code: pickupCode });
      setMyDeliveries((prev) => prev.map((d) => (d.id === item.id ? { ...d, deliveryStatus: 'ON_THE_WAY' } : d)));
      setPickupCodeTarget(null);
      Alert.alert(t('volunteer.startPickupTitle'), res.data?.message || t('volunteer.startPickupMsg'));
    } catch (err: any) {
      Alert.alert(t('volunteer.cannotUpdate'), err?.response?.data?.message || t('volunteer.cannotOpenChatMsg'));
    } finally {
      setActingDeliveryId(null);
    }
  }, [t]);

  const handleCompleteDelivery = useCallback(async (item: VolunteerDeliveryItem) => {
    Alert.alert(t('volunteer.confirmDeliveryTitle'), t('volunteer.confirmDeliveryMsg'), [
      { text: t('volunteer.cancel'), style: 'cancel' },
      {
        text: t('volunteer.confirm'),
        onPress: () => {
          void (async () => {
            try {
              setActingDeliveryId(item.id);
              const res = await http.patch(`/food-donations/${item.id}/delivered`);
              setMyDeliveries((prev) => prev.filter((d) => d.id !== item.id));
              const pointsAwarded = Number(res.data?.points_awarded_to_donor || 0);
              const volunteerPointsAwarded = Number(res.data?.points_awarded_to_volunteer || 0);
              const completeMessage = res.data?.message || t('volunteer.startPickupMsg');
              const volunteerPointsMessage = volunteerPointsAwarded > 0
                ? `\n\n${t('volunteer.youEarned')}${volunteerPointsAwarded} points.`
                : '';
              const donorPointsMessage = pointsAwarded > 0
                ? `\n\n${t('volunteer.donorEarned')}${pointsAwarded} points.`
                : '';

              Alert.alert(t('volunteer.deliveredTitle'), `${completeMessage}${volunteerPointsMessage}${donorPointsMessage}`);
            } catch (err: any) {
              Alert.alert(t('volunteer.cannotUpdate'), err?.response?.data?.message || t('volunteer.cannotOpenChatMsg'));
            } finally {
              setActingDeliveryId(null);
            }
          })();
        },
      },
    ]);
  }, [t]);

  const handleReleaseDelivery = useCallback((item: VolunteerDeliveryItem) => {
    Alert.alert(
      t('volunteer.release.confirmTitle'),
      t('volunteer.release.confirmMessage'),
      [
        { text: t('volunteer.release.confirmNo'), style: 'cancel' },
        {
          text: t('volunteer.release.confirmYes'),
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setReleasingDeliveryId(item.id);
                const res = await http.patch(`/food-donations/${item.id}/release`);
                setMyDeliveries((prev) => prev.filter((d) => d.id !== item.id));
                Alert.alert(
                  t('volunteer.release.successTitle'),
                  res.data?.message || t('volunteer.release.successBody'),
                );
              } catch (err: any) {
                Alert.alert(
                  t('volunteer.release.failedTitle'),
                  err?.response?.data?.message || t('volunteer.release.failedBody'),
                );
              } finally {
                setReleasingDeliveryId(null);
              }
            })();
          },
        },
      ],
    );
  }, [t]);

  const handleAcceptRequest = useCallback(
    async (item: DeliveryRequest) => {
      try {
        setActingRequestId(item.id);
        await http.patch(`/food-donations/${item.id}/accept`);
        removeRequestFromList(item.id);
        setConfirmTarget(null);
        setLoadingMyDeliveries(true);
        await refreshMyDeliveries();
        Alert.alert(t('volunteer.accepted'), t('volunteer.acceptedMsg'));
      } catch (err: any) {
        Alert.alert(t('volunteer.cannotAccept'), err?.response?.data?.message ?? t('volunteer.somethingWrong'));
      } finally {
        setLoadingMyDeliveries(false);
        setActingRequestId(null);
      }
    },
    [refreshMyDeliveries, removeRequestFromList, t]
  );

  const handleRejectRequest = useCallback(
    async (requestId: string) => {
      try {
        setActingRequestId(requestId);
        await http.patch(`/food-donations/${requestId}/reject`);
        removeRequestFromList(requestId);
      } catch (err: any) {
        Alert.alert(t('volunteer.cannotReject'), err?.response?.data?.message ?? t('volunteer.somethingWrong'));
      } finally {
        setActingRequestId(null);
      }
    },
    [removeRequestFromList, t]
  );

  const openChatWithDonor = useCallback(async (donationId: string, fallbackTitle?: string) => {
    try {
      setOpeningChatDonationId(donationId);
      const res = await getOrCreateDonationConversation(donationId, 'DONOR');
      const conversation = res.data?.data;

      if (!conversation?.id) {
        throw new Error(t('volunteer.cannotCreateConversation'));
      }

      router.push({
        pathname: '/(stack)/chat/[conversationId]',
        params: {
          conversationId: conversation.id,
          title: conversation.counterpart?.full_name || fallbackTitle || 'Chat',
        },
      } as any);
    } catch (err: any) {
      Alert.alert(t('volunteer.cannotOpenChat'), err?.response?.data?.message || err?.message || t('volunteer.cannotOpenChatMsg'));
    } finally {
      setOpeningChatDonationId(null);
    }
  }, [router, t]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        try {
          setLoadingRequests(true);
          setLoadingMyDeliveries(true);
          setLoadingNgos(true);

          const [requestRes, myDeliveryRes, summaryRes, ngoRes, statsRes] = await Promise.all([
            http.get('/food-donations'),
            http.get('/food-donations/volunteer/my-deliveries'),
            http.get('/food-donations/volunteer/summary'),
            getNearbyNgos(12),
            getMyStats().catch(() => null),
          ]);

          const requestData = (requestRes.data?.data ?? []) as FoodDonationApiItem[];
          const mappedRequests = requestData.map((item) => ({
            id: item._id,
            title: item.title,
            quantityLabel: `${t('volunteer.foodQtyPrefix')} ${item.quantity} ${item.unit}`,
            address:
              [item.pickup_address_line, item.pickup_city].filter(Boolean).join(', ') ||
              t('volunteer.pickupAddrUnavailable'),
            pickupLatitude: item.pickup_latitude,
            pickupLongitude: item.pickup_longitude,
            isPreferredForYou: Boolean(item.is_preferred_for_you),
          }));

          const myDeliveryData = (myDeliveryRes.data?.data ?? []) as VolunteerDeliveryApiItem[];
          const mappedMyDeliveries = mapVolunteerDeliveries(myDeliveryData, t);

          const summaryData = (summaryRes.data?.data ?? {}) as Partial<VolunteerSummary>;

          const ngoData = (ngoRes.data?.data?.ngos ?? []) as NearbyNgoItem[];
          const maxPoints = ngoData.reduce((max, item) => Math.max(max, item.points || 0), 0);
          const popularThreshold = maxPoints > 0 ? Math.max(1, Math.floor(maxPoints * 0.6)) : 0;

          const mappedNgos: NearbyNgo[] = ngoData.map((item) => {
            const pointsValue = Number(item.points || 0);
            return {
              id: String(item.id),
              name: String(item.name || 'NGO'),
              distanceKm: item.distance_km != null ? Number(item.distance_km) : null,
              points: pointsValue,
              address: [item.address_line, item.city].filter(Boolean).join(', ') || 'Address unavailable',
              popular: popularThreshold > 0 && pointsValue >= popularThreshold,
            };
          });

          if (active) {
            setRequests(mappedRequests);
            setMyDeliveries(mappedMyDeliveries);
            setSummary({
              delivered_count: Number(summaryData.delivered_count || 0),
              feedback_count: Number(summaryData.feedback_count || 0),
            });
            setNearbyNgos(mappedNgos);
            if (statsRes) setStats(statsRes.data.data as VolunteerStats);
          }
        } catch {
          // Giữ data cũ khi fetch fail (mạng yếu, Railway cold start...)
          // tránh trường hợp back từ màn khác thì home bị rỗng.
        } finally {
          if (active) {
            setLoadingRequests(false);
            setLoadingMyDeliveries(false);
            setLoadingNgos(false);
          }
        }
      })();
      return () => {
        active = false;
      };
    }, [t])
  );

  const visibleNgos = useMemo(
    () => {
      if (ngoTab === 'near') {
        return [...nearbyNgos].sort((a, b) => {
          if (a.distanceKm == null && b.distanceKm == null) return b.points - a.points;
          if (a.distanceKm == null) return 1;
          if (b.distanceKm == null) return -1;
          return a.distanceKm - b.distanceKm;
        });
      }

      const popularOnly = nearbyNgos.filter((n) => n.popular);
      const source = popularOnly.length > 0 ? popularOnly : nearbyNgos;
      return [...source].sort((a, b) => b.points - a.points);
    },
    [nearbyNgos, ngoTab]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('volunteer.greeting')} {firstName}</Text>
            <View style={styles.roleRow}>
              <Text style={styles.roleText}>{t('volunteer.rolePrefix')} </Text>
              <Text style={styles.roleBold}>{t('volunteer.role')}</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity 
            onPress={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
            style={styles.langPill}
            activeOpacity={0.85}>
              <Text style={styles.langPillText}>{language === 'vi' ? 'VI' : 'EN'}</Text>
            </TouchableOpacity>
            <NotificationBell size={26} />
          </View>
        </View>

        {stats && stats.deliveries > 0 && (
          <View style={[styles.impactCard, { backgroundColor: volunteerLevel.color + '15', borderColor: volunteerLevel.color + '40' }]}>
            <View style={styles.impactRow}>
              <View style={styles.impactMetric}>
                <Text style={[styles.impactNumber, { color: volunteerLevel.color }]}>{stats.deliveries}</Text>
                <Text style={styles.impactLabel}>{t('volunteer.impact.deliveriesLabel')}</Text>
              </View>
              <View style={styles.impactDivider} />
              <View style={styles.impactMetric}>
                <Text style={[styles.impactNumber, { color: volunteerLevel.color }]}>{stats.totalPortions}</Text>
                <Text style={styles.impactLabel}>{t('volunteer.impact.portionsLabel')}</Text>
              </View>
            </View>
            <Text style={styles.impactMessage}>{t('volunteer.impact.message')}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <StatItem value={String(summary.delivered_count)} label={t('volunteer.stats.delivered')} />
          <View style={styles.statDivider} />
          <StatItem value={String(summary.feedback_count)} label={t('volunteer.stats.feedback')} />
          <View style={styles.statDivider} />
          <StatItem value={String(points)} label={t('volunteer.stats.points')} />
        </View>

        <TouchableOpacity style={styles.goalButton}>
          <Text style={styles.goalButtonText}>{t('volunteer.goal')}</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>{t('volunteer.requestToDeliver')}</Text>
        {loadingRequests ? (
          <View style={styles.requestStateCard}>
            <ActivityIndicator color="#008080" />
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.requestStateCard}>
            <Text style={styles.requestStateText}>{t('volunteer.noPendingRequests')}</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.requestList}
          >
            {requests.map((r) => (
              <RequestCard
                key={r.id}
                item={r}
                t={t}
                busy={actingRequestId === r.id}
                chatBusy={openingChatDonationId === r.id}
                onAccept={() => setConfirmTarget(r)}
                onReject={() => handleRejectRequest(r.id)}
                onOpenMap={() => openPickupOnMaps(r)}
                onChatDonor={() => void openChatWithDonor(r.id, r.title)}
              />
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>{t('volunteer.myDeliveryProgress')}</Text>
        {loadingMyDeliveries ? (
          <View style={styles.requestStateCard}>
            <ActivityIndicator color="#008080" />
          </View>
        ) : myDeliveries.length === 0 ? (
          <View style={styles.requestStateCard}>
            <Text style={styles.requestStateText}>{t('volunteer.noActiveDeliveries')}</Text>
          </View>
        ) : (
          <View style={styles.deliveryListWrap}>
            {myDeliveries.map((item) => (
              <DeliveryProgressCard
                key={item.id}
                item={item}
                t={t}
                busy={actingDeliveryId === item.id}
                chatBusy={openingChatDonationId === item.id}
                releasing={releasingDeliveryId === item.id}
                onOpenMap={() =>
                  void openPickupOnMaps({
                    pickupLatitude: item.pickupLatitude,
                    pickupLongitude: item.pickupLongitude,
                    address: item.pickupAddress,
                  })
                }
                onChatDonor={() => void openChatWithDonor(item.id, item.title)}
                onRelease={() => handleReleaseDelivery(item)}
                onAction={() => {
                  if (item.deliveryStatus === 'AGENT_ASSIGNED') {
                    // Mở modal nhập pickup_code thay vì gọi pickup-start ngay.
                    setPickupCodeTarget(item);
                    return;
                  }
                  void handleCompleteDelivery(item);
                }}
              />
            ))}
          </View>
        )}

        <View style={styles.tabsRow}>
          <View style={styles.tabsLeft}>
            {(['near', 'popular'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, ngoTab === tab && styles.tabActive]}
                onPress={() => setNgoTab(tab)}
              >
                <Text style={[styles.tabText, ngoTab === tab && styles.tabTextActive]}>
                  {tab === 'near' ? t('volunteer.nearMe') : t('volunteer.byPopularity')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity onPress={() => router.push('/(stack)/NGO/ngoList' as never)}>
            <Text style={styles.seeMoreText}>{t('volunteer.seeMore')}</Text>
          </TouchableOpacity>
        </View>

        {loadingNgos ? (
          <View style={styles.requestStateCard}>
            <ActivityIndicator color="#008080" />
          </View>
        ) : visibleNgos.length === 0 ? (
          <View style={styles.requestStateCard}>
            <Text style={styles.requestStateText}>{t('volunteer.noNearbyNgos')}</Text>
          </View>
        ) : (
          visibleNgos.map((ngo) => (
            <View key={ngo.id} style={styles.ngoCard}>
              <View style={styles.ngoImage}>
                <Ionicons name="business-outline" size={30} color="#888" />
              </View>
              <View style={styles.ngoBody}>
                <Text style={styles.ngoName}>{ngo.name}</Text>
                <Text style={styles.ngoDistance}>
                  {ngo.distanceKm != null ? `${ngo.distanceKm.toFixed(1)} km` : t('volunteer.distanceUnavailable')}
                </Text>
                <Text style={styles.ngoDistance}>{t('volunteer.pointsLabel')} {ngo.points}</Text>
                <Text style={styles.ngoAddress} numberOfLines={1}>{ngo.address}</Text>
                <View style={styles.ngoActionRow}>
                  <TouchableOpacity style={styles.outlineButton}>
                    <Text style={styles.outlineButtonText}>{t('volunteer.viewDetails')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>{t('volunteer.connect')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionTitle}>{t('volunteer.faqs')}</Text>
        {FAQS.map((faq, i) => (
          <TouchableOpacity
            key={i}
            style={styles.faqItem}
            onPress={() => setOpenFaq(openFaq === i ? null : i)}
            activeOpacity={0.7}
          >
            <Text style={styles.faqQuestion}>{faq.q}</Text>
            <Ionicons name={openFaq === i ? 'chevron-up' : 'chevron-down'} size={20} color="#666" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ConfirmAcceptModal
        target={confirmTarget}
        busy={Boolean(actingRequestId)}
        onClose={() => setConfirmTarget(null)}
        onConfirm={(target) => void handleAcceptRequest(target)}
        t={t}
      />

      <PickupCodeModal
        visible={Boolean(pickupCodeTarget)}
        busy={pickupCodeTarget ? actingDeliveryId === pickupCodeTarget.id : false}
        donationTitle={pickupCodeTarget?.title}
        onClose={() => setPickupCodeTarget(null)}
        onSubmit={(code) => {
          if (!pickupCodeTarget) return;
          void handleStartPickup(pickupCodeTarget, code);
        }}
      />
    </SafeAreaView>
  );
}

const c = roleUi.colors;
const r = roleUi.radius; 

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  contentContainer: { paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langPill: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: c.surface,
  },
  langPillText: { fontSize: 12, fontWeight: '700', color: c.textPrimary },
  greeting: { fontSize: 16, color: '#555' },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  roleText: { fontSize: 20, color: '#111' },
  roleBold: { fontSize: 20, fontWeight: '800', color: '#111' },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 10, color: '#888', textAlign: 'center', marginTop: 2, paddingHorizontal: 6 },
  statDivider: { width: 1, backgroundColor: '#E4E4E4', marginVertical: 6 },

  goalButton: {
    marginHorizontal: 18,
    backgroundColor: '#808080',
    borderRadius: 8,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 18,
  },
  goalButtonText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111',
    paddingHorizontal: 18,
    marginBottom: 10,
    marginTop: 2,
  },

  requestList: { paddingHorizontal: 18, paddingBottom: 14 },
  requestStateCard: {
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginBottom: 14,
    borderRadius: 10,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestStateText: { fontSize: 13, color: '#777' },

  deliveryListWrap: { paddingHorizontal: 18, gap: 10, marginBottom: 10 },

  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 12,
  },
  tabsLeft: { flexDirection: 'row', flex: 1 },
  tab: { paddingVertical: 10, marginRight: 20 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#111' },
  tabText: { fontSize: 13, color: '#9A9A9A' },
  tabTextActive: { color: '#111', fontWeight: '700' },
  seeMoreText: { fontSize: 13, color: '#008080', fontWeight: '700' },

  ngoCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 18,
    marginBottom: 10,
    overflow: 'hidden',
  },
  ngoImage: {
    width: 90,
    height: 90,
    backgroundColor: '#ECECEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ngoBody: { flex: 1, padding: 10 },
  ngoName: { fontSize: 14, fontWeight: '700', color: '#111' },
  ngoDistance: { fontSize: 12, color: '#777', marginTop: 2, marginBottom: 8 },
  ngoAddress: { fontSize: 11, color: '#8B8B8B', marginBottom: 8 },
  ngoActionRow: { flexDirection: 'row', gap: 8 },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#111',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  outlineButtonText: { fontSize: 11, color: '#111', fontWeight: '600' },
  primaryButton: {
    backgroundColor: '#008080',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  primaryButtonText: { fontSize: 11, color: '#fff', fontWeight: '700' },

  faqItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginBottom: 8,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  faqQuestion: { fontSize: 14, color: '#111', flex: 1, marginRight: 8 },
  impactCard:    { marginHorizontal: 18, marginBottom: 14, borderRadius: 8, padding: 14, borderWidth: 1 },
  impactRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 8 },
  impactMetric:  { flex: 1, alignItems: 'center' },
  impactNumber:  { fontSize: 22, fontWeight: '800' },
  impactLabel:   { fontSize: 11, color: '#666', marginTop: 2, textAlign: 'center' },
  impactDivider: { width: 1, height: 32, backgroundColor: '#DDD', marginHorizontal: 8 },
  impactMessage: { fontSize: 12, color: '#444', textAlign: 'center', fontStyle: 'italic' },
});
