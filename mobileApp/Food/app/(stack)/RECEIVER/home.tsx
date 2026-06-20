import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert, AppState,
  ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http } from '../../../src/api/http';
import { getMyStats, type ReceiverStats } from '../../../src/api/user.api';
import { useI18n } from '../../../src/i18n/useI18n';
import { useAuthStore } from '../../../src/store/authStore';
import { roleUi } from '../../../src/theme/roleUi';
import HomeHeader from '../../../src/components/HomeHeader';
import { getCurrentGps } from '../../../src/utils/location';

type DonationItem = {
  _id: string;
  title: string;
  status?: string;
  quantity?: number;
  unit?: string;
  food_type?: string;
  expiration_datetime?: string;
  pickup_distance_km?: number | null;
  pickup_address_line?: string | null;
  pickup_city?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  donor_id?: {
    full_name?: string;
  };
  selected_receiver_id?: string | { _id?: string } | null;
  delivery_type?: 'VIA_AGENT' | 'SELF_PICKUP' | null;
  images?: string[];
  createdAt?: string;
};

function normalizeObjectId(value?: string | { _id?: string } | null): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || '';
}

type RequestItem = {
  _id: string;
  title: string;
  description?: string | null;
  food_type?: 'COOKED' | 'RAW' | 'FROZEN' | 'PACKAGED';
  requested_quantity?: number;
  unit?: string;
  needed_before?: string | null;
  createdAt?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'FULFILLED' | 'CANCELLED';
  linked_donation_id?:
    | string
    | {
        _id?: string;
        title?: string;
        delivery_type?: 'VIA_AGENT' | 'SELF_PICKUP' | null;
        delivery_id?: string | { _id?: string } | null;
      }
    | null;
};

function getRequestStatusMeta(t: (key: any) => string): Record<
  NonNullable<RequestItem['status']>,
  { icon: keyof typeof Ionicons.glyphMap; text: string; bg: string; border: string; color: string }
> {
  return {
    PENDING: {
      icon: 'time-outline',
      text: t('receiver.pending'),
      bg: '#E8DFBF',
      border: '#C4A44A',
      color: '#4D4120',
    },
    ACCEPTED: {
      icon: 'checkmark-circle-outline',
      text: t('receiver.accepted'),
      bg: c.primarySoft,
      border: '#A9C0D6',
      color: c.primaryStrong,
    },
    FULFILLED: {
      icon: 'checkmark-done-outline',
      text: t('receiver.fulfilled'),
      bg: c.successSoft,
      border: '#AEC9B7',
      color: c.successText,
    },
    CANCELLED: {
      icon: 'close-circle-outline',
      text: t('receiver.cancelled'),
      bg: c.dangerSoft,
      border: '#EF9A9A',
      color: c.dangerText,
    },
  };
}

const REQUEST_FOOD_TYPE_LABEL_KEY: Record<NonNullable<RequestItem['food_type']>, any> = {
  COOKED:   'request.cookedFood',
  RAW:      'request.rawVeggies',
  FROZEN:   'request.frozenFood',
  PACKAGED: 'request.packagedFood',
};

function getFoodTypeLabelFromRequest(t: (key: any) => string, foodType?: RequestItem['food_type']) {
  if (!foodType) return t('receiver.foodTypeNotSpecified');
  const key = REQUEST_FOOD_TYPE_LABEL_KEY[foodType];
  return key ? t(key) : t('receiver.foodTypeNotSpecified');
}

// Icon + màu theo loại thực phẩm — dùng cho thumbnail "Bài đăng của tôi" (yêu cầu
// không có ảnh nên hiển thị icon loại thay vì ô ảnh trống).
const FOOD_TYPE_VISUAL: Record<
  NonNullable<RequestItem['food_type']>,
  { icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }
> = {
  COOKED:   { icon: 'restaurant-outline', color: '#E07B39', bg: '#FBEEE2' },
  RAW:      { icon: 'leaf-outline',       color: '#43A047', bg: '#E8F5E9' },
  FROZEN:   { icon: 'snow-outline',       color: '#1E88E5', bg: '#E3F2FD' },
  PACKAGED: { icon: 'cube-outline',       color: '#8D6E63', bg: '#EFEBE9' },
};

function getFoodTypeVisual(foodType?: RequestItem['food_type']) {
  return (foodType && FOOD_TYPE_VISUAL[foodType])
    || { icon: 'fast-food-outline' as keyof typeof Ionicons.glyphMap, color: '#9E9E9E', bg: '#F0F0F0' };
}

const FAQ_KEYS = ['receiver.faq.pickup', 'receiver.faq.multiple'] as const;

export default function HomeReceiverScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const user = useAuthStore((s) => s.user);
  const displayName = user?.full_name?.trim() || 'Friend';
  const currentUserId = String((user as any)?.id || (user as any)?._id || '');
  const requestStatusMeta = getRequestStatusMeta(t);

  const [activeTab, setActiveTab] = useState<'my' | 'donors'>('my');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myPosts, setMyPosts] = useState<RequestItem[]>([]);
  const [donorPosts, setDonorPosts] = useState<DonationItem[]>([]);
  const [connectingDonationId, setConnectingDonationId] = useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [stats, setStats] = useState<ReceiverStats | null>(null);

  const fetchData = useCallback(async () => {
    const gps = await getCurrentGps();
    const donationsParams = gps ? { params: { lat: gps.latitude, lon: gps.longitude } } : undefined;

    const [mineRes, donorsRes, statsRes] = await Promise.all([
      http.get('/food-requests/my'),
      http.get('/food-donations', donationsParams),
      getMyStats().catch(() => null),
    ]);

    return {
      myPosts: (mineRes.data?.data ?? []) as RequestItem[],
      donorPosts: (donorsRes.data?.data ?? []) as DonationItem[],
      stats: statsRes ? (statsRes.data.data as ReceiverStats) : null,
    };
  }, []);

  const applyData = useCallback((data: Awaited<ReturnType<typeof fetchData>>) => {
    setMyPosts(data.myPosts);
    setDonorPosts(data.donorPosts);
    if (data.stats) setStats(data.stats);
  }, []);

  // Focus: load 1 lần (có spinner) + polling 20s im lặng để bắt donation mới
  // donor vừa đăng mà không cần rời màn. Giữ data cũ nếu fetch lỗi.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async (initial: boolean) => {
        if (initial) setLoading(true);
        try {
          const data = await fetchData();
          if (active) applyData(data);
        } catch {
          // Giữ nguyên data cũ khi fetch fail (mạng yếu, server cold start...).
        } finally {
          if (active && initial) setLoading(false);
        }
      };

      void run(true);
      const intervalId = setInterval(() => { void run(false); }, 20_000);

      return () => {
        active = false;
        clearInterval(intervalId);
      };
    }, [fetchData, applyData])
  );

  // Khi app quay lại foreground (vd: vừa tap notification từ background), useFocusEffect
  // KHÔNG tự chạy lại vì màn hình chưa từng mất focus. Tự refetch im lặng để dữ liệu
  // luôn mới sau khi rời app rồi quay lại.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      void (async () => {
        try {
          applyData(await fetchData());
        } catch {
          // Giữ nguyên data cũ khi fetch fail.
        }
      })();
    });
    return () => sub.remove();
  }, [fetchData, applyData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      applyData(await fetchData());
    } catch {
      // Giữ nguyên data cũ khi fetch fail.
    } finally {
      setRefreshing(false);
    }
  }, [fetchData, applyData]);

  const isConnectedToMe = (d: DonationItem) =>
    normalizeObjectId(d.selected_receiver_id) !== '' &&
    normalizeObjectId(d.selected_receiver_id) === currentUserId;
  const nearDonors = donorPosts.slice(0, 2);
  const donorFeedPosts = donorPosts
    .slice()
    .sort((a, b) => {
      // Ghim đơn đang kết nối với mình lên đầu, sau đó mới tới mới nhất.
      const am = isConnectedToMe(a);
      const bm = isConnectedToMe(b);
      if (am !== bm) return am ? -1 : 1;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    })
    .slice(0, 3);
  const donorTabCount = donorPosts.length;

  const renderDonorCard = (item: DonationItem) => {
    const selectedForMe =
      normalizeObjectId(item.selected_receiver_id) !== '' &&
      normalizeObjectId(item.selected_receiver_id) === currentUserId;
    const pickupChosen = selectedForMe && Boolean(item.delivery_type);

    return (
      <DonorCard
        key={item._id}
        title={item.title}
        imageUri={item.images?.[0]}
        distanceKm={item.pickup_distance_km}
        onViewDetails={() => {
          router.push({
            pathname: '/(stack)/RECEIVER/donationDetail',
            params: {
              donationId: item._id,
              title: item.title,
              donorName: item.donor_id?.full_name || t('receiver.unknownDonor'),
              pickupAddressLine: item.pickup_address_line || '',
              pickupCity: item.pickup_city || '',
              pickupLatitude: item.pickup_latitude != null ? String(item.pickup_latitude) : '',
              pickupLongitude: item.pickup_longitude != null ? String(item.pickup_longitude) : '',
              foodType: item.food_type || '',
              quantity: item.quantity != null ? String(item.quantity) : '',
              unit: item.unit || '',
              expirationDatetime: item.expiration_datetime || '',
              distanceKm: item.pickup_distance_km != null ? String(item.pickup_distance_km) : '',
              imageUrl: item.images?.[0] || '',
              status: item.status || '',
              selectedForMe: selectedForMe ? '1' : '0',
              pickupChosen: pickupChosen ? '1' : '0',
              deliveryType: item.delivery_type || '',
            },
          } as any);
        }}
        selectedForMe={selectedForMe}
        pickupChosen={pickupChosen}
        deliveryType={item.delivery_type || null}
        t={t}
        onConnect={() => {
          if (pickupChosen) {
            router.push({
              pathname: '/(stack)/RECEIVER/tracking',
              params: { donationId: item._id, title: item.title },
            } as any);
            return;
          }

          if (selectedForMe) {
            router.push({
              pathname: '/(stack)/RECEIVER/addPickup',
              params: { donationId: item._id, title: item.title },
            } as any);
            return;
          }
          void (async () => {
            try {
              setConnectingDonationId(item._id);
              const res = await http.patch(`/food-donations/${item._id}/connect`);
              const connectMessage = res.data?.message || t('receiver.connectSuccessDefault');
              Alert.alert(t('receiver.connectSuccessTitle'), connectMessage, [
                {
                  text: t('receiver.choosePickup'),
                  onPress: () => {
                    router.push({
                      pathname: '/(stack)/RECEIVER/addPickup',
                      params: { donationId: item._id, title: item.title },
                    } as any);
                  },
                },
              ]);
            } catch (err: any) {
              Alert.alert(t('receiver.connectFailedTitle'), err?.response?.data?.message || t('receiver.connectFailedDefault'));
            } finally {
              setConnectingDonationId(null);
            }
          })();
        }}
        connecting={connectingDonationId === item._id}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} colors={[c.primary]} />}
      >
        <View style={styles.contentCard}>
          <HomeHeader
            greeting={t('receiver.greeting')}
            displayName={displayName}
            rolePrefix={t('receiver.rolePrefix')}
            roleLabel={t('receiver.role')}
            bellSize={22}
            containerStyle={styles.header}
          />

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('receiver.ordersReceived')}</Text>
              <Text style={styles.statValue}>{String(stats?.mealsReceived ?? 0)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('receiver.impact.ngosLabel')}</Text>
              <Text style={styles.statValue}>{String(stats?.ngosConnected ?? 0)}</Text>
            </View>
          </View>

          <View style={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('my')}
              style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]} numberOfLines={1}>{t('receiver.myPost')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('donors')}
              style={[styles.tabButton, activeTab === 'donors' && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <View style={styles.tabWithBadge}>
                <Text style={[styles.tabText, activeTab === 'donors' && styles.tabTextActive]} numberOfLines={1}>{t('receiver.donorsPosts')}</Text>
                <View style={styles.countBadge}><Text style={styles.countBadgeText}>{String(donorTabCount)}</Text></View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.requestBox}>
            {loading ? (
              <ActivityIndicator color={c.primary} />
            ) : activeTab === 'my' ? (
              <View style={styles.myPostWrap}>
                {myPosts.length > 0 ? (
                  myPosts.slice(0, 2).map((item) => (
                    <MyRequestCard
                      key={item._id}
                      item={item}
                      locale={locale}
                      t={t}
                      requestStatusMeta={requestStatusMeta}
                      deleting={deletingRequestId === item._id}
                      onContinueFlow={() => {
                        const linkedDonation =
                          item.linked_donation_id && typeof item.linked_donation_id === 'object'
                            ? item.linked_donation_id
                            : null;
                        const donationId = normalizeObjectId(item.linked_donation_id as any);

                        if (!donationId) {
                          Alert.alert(t('receiver.missingDonationTitle'), t('receiver.missingDonationBody'));
                          return;
                        }

                        if (linkedDonation?.delivery_type) {
                          router.push({
                            pathname: '/(stack)/RECEIVER/tracking',
                            params: {
                              donationId,
                              title: linkedDonation.title || item.title,
                              deliveryType: linkedDonation.delivery_type,
                            },
                          } as any);
                          return;
                        }

                        router.push({
                          pathname: '/(stack)/RECEIVER/addPickup',
                          params: {
                            donationId,
                            title: linkedDonation?.title || item.title,
                          },
                        } as any);
                      }}
                      onDelete={() => {
                        Alert.alert(t('receiver.deleteRequestTitle'), t('receiver.deleteRequestBody'), [
                          { text: t('common.cancel'), style: 'cancel' },
                          {
                            text: t('receiver.deletePermanently'),
                            style: 'destructive',
                            onPress: () => {
                              void (async () => {
                                try {
                                  setDeletingRequestId(item._id);
                                  await http.delete(`/food-requests/${item._id}`);
                                  setMyPosts((prev) => prev.filter((request) => request._id !== item._id));
                                } catch (err: any) {
                                  Alert.alert(t('receiver.deleteFailed'), err?.response?.data?.message || t('receiver.tryAgain'));
                                } finally {
                                  setDeletingRequestId(null);
                                }
                              })();
                            },
                          },
                        ]);
                      }}
                    />
                  ))
                ) : (
                  <>
                    <View style={styles.placeholderLine} />
                    <Text style={styles.placeholderTitle}>{t('receiver.nothingTillNow')}</Text>
                  </>
                )}
                <Text style={styles.requestQuestion}>{t('receiver.requireFood')}</Text>
                <TouchableOpacity
                  style={styles.createButton}
                  onPress={() => router.push('/(stack)/RECEIVER/request' as any)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.createButtonText}>{t('receiver.createFoodRequest')}</Text>
                </TouchableOpacity>
              </View>
            ) : donorFeedPosts.length > 0 ? (
              <View style={styles.donorPostList}>
                {donorFeedPosts.map(renderDonorCard)}
              </View>
            ) : (
              <Text style={styles.placeholderTitle}>{t('receiver.noDonorPosts')}</Text>
            )}
          </View>

          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t('receiver.foodDonorsNearYou')}</Text>
            <TouchableOpacity onPress={() => router.push('/(stack)/RECEIVER/donorList' as any)}>
              <Text style={styles.sectionAction}>{t('receiver.seeMore')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.donorList}>
            {nearDonors.length > 0 ? (
              nearDonors.map(renderDonorCard)
            ) : (
              <Text style={styles.noDonorText}>{t('receiver.noNearbyDonors')}</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>{t('receiver.faqs')}</Text>
          {FAQ_KEYS.map((faqKey, index) => (
            <TouchableOpacity
              key={faqKey}
              style={styles.faqItem}
              onPress={() => setOpenFaq(openFaq === index ? null : index)}
              activeOpacity={0.75}
            >
              <Text style={styles.faqQuestion}>{t(faqKey)}</Text>
              <Ionicons name={openFaq === index ? 'chevron-up' : 'chevron-down'} size={20} color="#333" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DonorCard({
  title,
  imageUri,
  distanceKm,
  onViewDetails,
  selectedForMe,
  pickupChosen,
  deliveryType,
  t,
  onConnect,
  connecting,
}: {
  title: string;
  imageUri?: string;
  distanceKm?: number | null;
  onViewDetails: () => void;
  selectedForMe: boolean;
  pickupChosen: boolean;
  deliveryType: DonationItem['delivery_type'];
  t: (key: any) => string;
  onConnect: () => void;
  connecting: boolean;
}) {
  return (
    <View style={styles.donorCard}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.donorImage} />
      ) : (
        <View style={[styles.donorImage, styles.donorImageFallback]}>
          <Ionicons name="image-outline" size={26} color="#111" />
        </View>
      )}

      <View style={styles.donorContent}>
        <Text style={styles.donorName}>{title}</Text>
        <Text style={styles.donorDistance}>
          {distanceKm != null ? `${distanceKm.toFixed(1)} km` : t('receiver.unknownDistance')}
        </Text>

        <View style={styles.donorActions}>
          <TouchableOpacity style={styles.viewButton} activeOpacity={0.8} onPress={onViewDetails}>
            <Text style={styles.viewButtonText}>{t('receiver.viewDetails')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.connectButton,
              selectedForMe && styles.connectButtonApproved,
              pickupChosen && styles.connectButtonMuted,
            ]}
            activeOpacity={0.8}
            onPress={onConnect}
            disabled={connecting}
          >
            <Text style={styles.connectButtonText}>
              {pickupChosen
                ? deliveryType === 'VIA_AGENT'
                  ? t('receiver.waitingAgent')
                  : t('receiver.selfPickupReady')
                : selectedForMe
                  ? t('receiver.choosePickup')
                  : connecting
                    ? t('receiver.connecting')
                    : t('receiver.connect')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function MyRequestCard({
  item,
  locale,
  t,
  requestStatusMeta,
  onContinueFlow,
  onDelete,
  deleting,
}: {
  item: RequestItem;
  locale: string;
  t: (key: any) => string;
  requestStatusMeta: ReturnType<typeof getRequestStatusMeta>;
  onContinueFlow: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const status = item.status ?? 'PENDING';
  const linkedDonation =
    item.linked_donation_id && typeof item.linked_donation_id === 'object'
      ? item.linked_donation_id
      : null;
  const linkedDonationId = normalizeObjectId(item.linked_donation_id as any);
  const canContinueFlow = status === 'ACCEPTED' && Boolean(linkedDonationId);
  const canDelete = !canContinueFlow;
  const qty = item.requested_quantity ?? 0;
  const unit = item.unit || t('receiver.portion');
  const neededBefore = item.needed_before
    ? new Date(item.needed_before).toLocaleDateString(locale)
    : t('receiver.notSpecified');
  const foodTypeLabel = getFoodTypeLabelFromRequest(t, item.food_type);
  const foodVisual = getFoodTypeVisual(item.food_type);
  const statusMeta = requestStatusMeta[status] || requestStatusMeta.PENDING;
  const isAccepted = status === 'ACCEPTED';
  const isExpired = status === 'PENDING'
    && item.needed_before != null
    && new Date(item.needed_before).getTime() < Date.now();

  return (
    <View style={styles.myRequestCard}>
      <View style={styles.myRequestHead}>
        <Text style={styles.myRequestTitle} numberOfLines={1}>{item.title}</Text>
        <TouchableOpacity
          style={[styles.deleteRequestBtn, (!canDelete || deleting) && styles.deleteRequestBtnDisabled]}
          onPress={onDelete}
          disabled={!canDelete || deleting}
          activeOpacity={0.85}
        >
          {deleting ? (
            <ActivityIndicator size="small" color={c.dangerText} />
          ) : (
            <Ionicons name="trash-outline" size={16} color={c.dangerText} />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.myRequestContentRow}>
        <View style={[styles.myRequestThumb, { backgroundColor: foodVisual.bg, borderColor: foodVisual.bg }]}>
          <Ionicons name={foodVisual.icon} size={26} color={foodVisual.color} />
        </View>
        <View style={styles.myRequestCenter}>
          <Text style={styles.myRequestType}>{foodTypeLabel}</Text>
          <Text style={styles.myRequestDate}>{t('receiver.neededBefore')}: {neededBefore}</Text>
        </View>
      </View>
      <Text style={styles.myRequestQtyLine}>{t('receiver.foodQuantity')}: <Text style={{ fontWeight: '400' }}>{qty} {unit}</Text></Text>
      <View
        style={[
          styles.pendingBadge,
          isAccepted && styles.pendingBadgeCompact,
          { backgroundColor: statusMeta.bg, borderColor: statusMeta.border },
        ]}
      >
        <Ionicons name={statusMeta.icon} size={isAccepted ? 14 : 18} color={statusMeta.color} />
        <Text style={[styles.pendingText, { color: statusMeta.color }]}>{statusMeta.text}</Text>
      </View>

      {isExpired ? (
        <View style={styles.expiredBadge}>
          <Ionicons name="alert-circle-outline" size={14} color={c.dangerText} />
          <Text style={styles.expiredBadgeText}>{t('receiver.requestExpired')}</Text>
        </View>
      ) : null}

      {canContinueFlow ? (
        <TouchableOpacity style={styles.continuePickupBtn} onPress={onContinueFlow} activeOpacity={0.85}>
          <Ionicons name={linkedDonation?.delivery_type ? 'navigate-outline' : 'cube-outline'} size={16} color={c.primaryStrong} />
          <Text style={styles.continuePickupBtnText}>
            {linkedDonation?.delivery_type ? t('receiver.openTracking') : t('receiver.choosePickupMethod')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const c = roleUi.colors;
const r = roleUi.radius;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.pageBg },
  scrollContent: { paddingBottom: 26 },
  contentCard: {
    backgroundColor: c.pageBg,
    marginHorizontal: 0,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statsCard: {
    backgroundColor: c.surface,
    flexDirection: 'row',
    paddingVertical: 12,
    justifyContent: 'space-around',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: r.lg,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 10, color: c.textMuted, marginBottom: 2, textAlign: 'center', paddingHorizontal: 4 },
  statValue: { fontSize: 22, color: c.textPrimary, fontWeight: '700' },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
    marginBottom: 10,
  },
  tabButton: { paddingBottom: 10, marginRight: 16, flexShrink: 1 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: c.textPrimary },
  tabText: { fontSize: 14, color: c.textMuted, fontWeight: '500', flexShrink: 1 },
  tabTextActive: { color: c.textPrimary, fontWeight: '700' },
  tabWithBadge: { flexDirection: 'row', alignItems: 'center', flexShrink: 1 },
  countBadge: {
    marginLeft: 6,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 10, fontWeight: '600', color: c.textPrimary },
  requestBox: {
    backgroundColor: c.surface,
    borderRadius: r.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  myPostWrap: { width: '100%', alignItems: 'center' },
  myRequestCard: {
    width: '100%',
    backgroundColor: c.surfaceAlt,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: c.border,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 12,
    marginBottom: 8,
  },
  myRequestHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 8,
  },
  myRequestTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, flex: 1 },
  deleteRequestBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F5D6D6',
    backgroundColor: c.dangerSoft,
    borderRadius: 999,
  },
  deleteRequestBtnDisabled: { opacity: 0.45 },
  myRequestContentRow: { flexDirection: 'row', alignItems: 'flex-start' },
  myRequestThumb: {
    width: 52,
    height: 52,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: c.divider,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F6F6',
  },
  myRequestCenter: { flex: 1, marginLeft: 10 },
  myRequestType: { fontSize: 14, color: c.textPrimary, lineHeight: 18 },
  myRequestDate: { fontSize: 12, color: c.textSecondary, marginTop: 8 },
  myRequestQtyLine: { marginTop: 10, fontSize: 14, color: c.textPrimary, fontWeight: '600' },
  pendingBadge: {
    marginTop: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiredBadge: {
    marginTop: 8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: c.dangerSoft,
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  expiredBadgeText: { fontSize: 11, color: c.dangerText, fontWeight: '700' },
  pendingBadgeCompact: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pendingText: { marginLeft: 8, fontSize: 13, color: '#4D4120', fontWeight: '600', flexShrink: 1 },
  continuePickupBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#D5E0EC',
    backgroundColor: c.primarySoft,
    borderRadius: r.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  continuePickupBtnText: {
    fontSize: 13,
    color: c.primaryStrong,
    fontWeight: '700',
  },
  donorPostList: {
    width: '100%',
  },
  placeholderLine: { width: '70%', height: 1, backgroundColor: '#D8D8D8', marginBottom: 8 },
  placeholderTitle: { fontSize: 14, color: '#B5B5B5', marginBottom: 10 },
  requestQuestion: { fontSize: 14, color: c.textPrimary, marginBottom: 14 },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: c.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: r.sm,
  },
  createButtonText: { color: '#fff', fontSize: 14, fontWeight: '700', marginLeft: 8 },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 6,
  },
  sectionTitle: { fontSize: 15, color: c.textPrimary, fontWeight: '700' },
  sectionAction: { fontSize: 13, color: c.primary, fontWeight: '500' },
  donorList: {
    borderTopWidth: 1,
    borderTopColor: c.divider,
    marginBottom: 14,
  },
  noDonorText: {
    fontSize: 13,
    color: c.textMuted,
    paddingVertical: 10,
  },
  donorCard: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: r.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    marginTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  donorImage: { width: 54, height: 54, borderWidth: 1, borderColor: c.divider, borderRadius: r.sm },
  donorImageFallback: {
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorContent: { flex: 1, marginLeft: 10 },
  donorName: { fontSize: 15, color: c.textPrimary, fontWeight: '600' },
  donorDistance: { fontSize: 13, color: c.textSecondary, marginTop: 2 },
  donorActions: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6, alignItems: 'center', gap: 8 },
  viewButton: {
    borderWidth: 1,
    borderColor: c.divider,
    borderRadius: r.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: c.surfaceAlt,
  },
  viewButtonText: { fontSize: 11, color: c.textPrimary },
  connectButton: {
    backgroundColor: c.primary,
    borderRadius: r.full,
    paddingHorizontal: 16,
    paddingVertical: 5,
  },
  connectButtonApproved: {
    backgroundColor: c.successText,
  },
  connectButtonMuted: {
    backgroundColor: '#546E7A',
  },
  connectButtonText: { fontSize: 11, color: '#fff', fontWeight: '600' },
  faqItem: {
    backgroundColor: c.surface,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: c.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
  },
  faqQuestion: { fontSize: 14, color: c.textPrimary, flex: 1, marginRight: 8 },
});
