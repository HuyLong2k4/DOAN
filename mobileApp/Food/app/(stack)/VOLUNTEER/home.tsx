import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOrCreateDonationConversation } from '../../../src/api/chat.api';
import { http } from '../../../src/api/http';
import { getMyStats } from '../../../src/api/user.api';
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
  VolunteerDeliveryApiItem,
  VolunteerDeliveryItem,
  VolunteerSummary,
} from './_components/types';
import { roleUi } from '@/src/theme/roleUi';
import HomeHeader from '@/src/components/HomeHeader';

function StatItem({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function VolunteerHomeScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.full_name?.trim() || '';
  const points = user?.points ?? 0;

  const FAQS = [
    { q: t('volunteer.faqQ1') },
    { q: t('volunteer.faqQ2') },
  ];

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [requests, setRequests] = useState<DeliveryRequest[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<VolunteerDeliveryItem[]>([]);
  const [summary, setSummary] = useState<VolunteerSummary>({ delivered_count: 0, feedback_count: 0 });
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [loadingMyDeliveries, setLoadingMyDeliveries] = useState(false);
  const [actingRequestId, setActingRequestId] = useState<string | null>(null);
  const [actingDeliveryId, setActingDeliveryId] = useState<string | null>(null);
  const [releasingDeliveryId, setReleasingDeliveryId] = useState<string | null>(null);
  const [openingChatDonationId, setOpeningChatDonationId] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<DeliveryRequest | null>(null);
  const [pickupCodeTarget, setPickupCodeTarget] = useState<VolunteerDeliveryItem | null>(null);
  const [pickupCodeError, setPickupCodeError] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [togglingActive, setTogglingActive] = useState(false);

  const refreshMyDeliveries = useCallback(async () => {
    const myDeliveryRes = await http.get('/food-donations/volunteer/my-deliveries');
    const myDeliveryData = (myDeliveryRes.data?.data ?? []) as VolunteerDeliveryApiItem[];
    setMyDeliveries(mapVolunteerDeliveries(myDeliveryData, t));
  }, [t]);

  const refreshRequests = useCallback(async () => {
    const requestRes = await http.get('/food-donations');
    const requestData = (requestRes.data?.data ?? []) as FoodDonationApiItem[];
    setRequests(
      requestData.map((item) => ({
        id: item._id,
        title: item.title,
        quantityLabel: `${t('volunteer.foodQtyPrefix')} ${item.quantity} ${item.unit}`,
        address:
          [item.pickup_address_line, item.pickup_city].filter(Boolean).join(', ') ||
          t('volunteer.pickupAddrUnavailable'),
        pickupLatitude: item.pickup_latitude,
        pickupLongitude: item.pickup_longitude,
        isPreferredForYou: Boolean(item.is_preferred_for_you),
      })),
    );
  }, [t]);

  const handleToggleActive = useCallback(async () => {
    try {
      setTogglingActive(true);
      const res = await http.patch('/profile/volunteer/active-status');
      const nowActive = Boolean(res.data?.is_active);
      setIsActive(nowActive);
      if (nowActive) {
        setLoadingRequests(true);
        await refreshRequests().catch(() => {});
        setLoadingRequests(false);
      } else {
        // Offline: backend không trả đơn nào nữa, xoá list để khớp UI.
        setRequests([]);
      }
    } catch {
      Alert.alert(t('volunteer.cannotUpdate'), t('volunteer.somethingWrong'));
    } finally {
      setTogglingActive(false);
    }
  }, [refreshRequests, t]);

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
      setPickupCodeError(null);
      const res = await http.patch(`/food-donations/${item.id}/pickup-start`, { pickup_code: pickupCode });
      setMyDeliveries((prev) => prev.map((d) => (d.id === item.id ? { ...d, deliveryStatus: 'ON_THE_WAY' } : d)));
      setPickupCodeTarget(null);
      Alert.alert(t('volunteer.startPickupTitle'), res.data?.message || t('volunteer.startPickupMsg'));
    } catch (err: any) {
      const status = err?.response?.status;
      const serverMsg = err?.response?.data?.message as string | undefined;
      const fallback = status === 400
        ? t('volunteer.pickupCode.wrongCode')
        : t('volunteer.pickupCode.genericError');
      setPickupCodeError(serverMsg || fallback);
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

          const [requestRes, myDeliveryRes, summaryRes, statsRes, profileRes] = await Promise.all([
            http.get('/food-donations'),
            http.get('/food-donations/volunteer/my-deliveries'),
            http.get('/food-donations/volunteer/summary'),
            getMyStats().catch(() => null),
            http.get('/profile/me').catch(() => null),
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

          if (active) {
            setRequests(mappedRequests);
            setMyDeliveries(mappedMyDeliveries);
            setSummary({
              delivered_count: Number(summaryData.delivered_count || 0),
              feedback_count: Number(summaryData.feedback_count || 0),
            });
            if (statsRes) {
              // Đồng bộ user.points (server cộng điểm khi receiver xác nhận giao);
              // user chỉ set lúc login nên cần làm mới để Stats row hiển thị đúng.
              const freshPoints = (statsRes.data?.data as { points?: number } | undefined)?.points;
              const store = useAuthStore.getState();
              if (freshPoints != null && store.user && store.user.points !== freshPoints) {
                store.setUser({ ...store.user, points: freshPoints });
              }
            }
            if (profileRes) setIsActive(Boolean(profileRes.data?.data?.profile?.is_active));
          }
        } catch {
          // Giữ data cũ khi fetch fail (mạng yếu, Railway cold start...)
          // tránh trường hợp back từ màn khác thì home bị rỗng.
        } finally {
          if (active) {
            setLoadingRequests(false);
            setLoadingMyDeliveries(false);
          }
        }
      })();
      return () => {
        active = false;
      };
    }, [t])
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.contentContainer}>
        <HomeHeader
          greeting={t('volunteer.greeting')}
          displayName={displayName}
          rolePrefix={t('volunteer.rolePrefix')}
          roleLabel={t('volunteer.role')}
          containerStyle={styles.header}
        />

        <View style={[styles.statusCard, isActive ? styles.statusCardOn : styles.statusCardOff]}>
          <View style={[styles.statusIconWrap, { backgroundColor: isActive ? c.successText : '#9E9E9E' }]}>
            <Ionicons name={isActive ? 'bicycle' : 'pause'} size={18} color="#fff" />
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={[styles.statusTitle, { color: isActive ? c.successText : '#666666' }]}>
              {isActive ? t('volunteer.online') : t('volunteer.offline')}
            </Text>
            <Text style={styles.statusSubtitle} numberOfLines={1}>
              {isActive ? t('volunteer.statusOnSubtitle') : t('volunteer.statusOffSubtitle')}
            </Text>
          </View>
          {togglingActive ? (
            <ActivityIndicator color={isActive ? c.successText : '#9E9E9E'} style={styles.statusSwitch} />
          ) : (
            <Switch
              value={isActive}
              onValueChange={handleToggleActive}
              disabled={togglingActive}
              trackColor={{ false: '#CFD8DC', true: '#AEC9B7' }}
              thumbColor={isActive ? c.successText : '#FAFAFA'}
              style={styles.statusSwitch}
            />
          )}
        </View>

        <View style={styles.statsRow}>
          <StatItem value={String(summary.delivered_count)} label={t('volunteer.stats.delivered')} />
          <StatItem value={String(points)} label={t('volunteer.stats.points')} />
        </View>

        <Text style={styles.sectionTitle}>{t('volunteer.requestToDeliver')}</Text>
        {loadingRequests ? (
          <View style={styles.requestStateCard}>
            <ActivityIndicator color={c.primary} />
          </View>
        ) : !isActive ? (
          <View style={styles.requestStateCard}>
            <Text style={styles.requestStateText}>{t('volunteer.offlineRequestsHint')}</Text>
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
                onAccept={() => setConfirmTarget(r)}
                onReject={() => handleRejectRequest(r.id)}
                onOpenMap={() => openPickupOnMaps(r)}
              />
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>{t('volunteer.myDeliveryProgress')}</Text>
        {loadingMyDeliveries ? (
          <View style={styles.requestStateCard}>
            <ActivityIndicator color={c.primary} />
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
        error={pickupCodeError}
        onClose={() => {
          setPickupCodeTarget(null);
          setPickupCodeError(null);
        }}
        onClearError={() => setPickupCodeError(null)}
        onSubmit={(code) => {
          if (!pickupCodeTarget) return;
          void handleStartPickup(pickupCodeTarget, code);
        }}
      />
    </SafeAreaView>
  );
}

const c = roleUi.colors;

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
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 18,
    marginTop: 4,
    marginBottom: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  statusCardOn: { backgroundColor: c.successSoft, borderColor: '#AEC9B7' },
  statusCardOff: { backgroundColor: '#FFFFFF', borderColor: '#E0E0E0' },
  statusIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextWrap: { flex: 1, marginLeft: 12, marginRight: 8 },
  statusTitle: { fontSize: 15, fontWeight: '700' },
  statusSubtitle: { fontSize: 12, color: '#777', marginTop: 1 },
  statusSwitch: { transform: [{ scale: 0.95 }] },

  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 18,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '700', color: '#111' },
  statLabel: { fontSize: 10, color: '#888', textAlign: 'center', marginBottom: 2, paddingHorizontal: 6 },

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
});
