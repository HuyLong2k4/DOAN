import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Alert,
  ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http } from '../../../src/api/http';
import { getMyStats, type ReceiverStats } from '../../../src/api/user.api';
import { useI18n } from '../../../src/i18n/useI18n';
import { useAuthStore } from '../../../src/store/authStore';
import { roleUi } from '../../../src/theme/roleUi';
import NotificationBell from '../../../src/components/NotificationBell';

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
      bg: '#E0F2F1',
      border: '#90CAF9',
      color: '#006666',
    },
    FULFILLED: {
      icon: 'checkmark-done-outline',
      text: t('receiver.fulfilled'),
      bg: '#E8F5E9',
      border: '#A5D6A7',
      color: '#1B5E20',
    },
    CANCELLED: {
      icon: 'close-circle-outline',
      text: t('receiver.cancelled'),
      bg: '#FFEBEE',
      border: '#EF9A9A',
      color: '#B71C1C',
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

const FAQS = [
  'Who will pick up the food?',
  'Can we perform multiple food request at once?',
];

export default function HomeReceiverScreen() {
  const router = useRouter();
  const { t, locale, language, setLanguage } = useI18n();
  const user = useAuthStore((s) => s.user);
  const firstName = user?.full_name?.split(' ')[0] ?? 'Friend';
  const points = user?.points ?? 0;
  const currentUserId = String((user as any)?.id || (user as any)?._id || '');
  const requestStatusMeta = getRequestStatusMeta(t);

  const [activeTab, setActiveTab] = useState<'my' | 'donors'>('my');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [myPosts, setMyPosts] = useState<RequestItem[]>([]);
  const [donorPosts, setDonorPosts] = useState<DonationItem[]>([]);
  const [connectingDonationId, setConnectingDonationId] = useState<string | null>(null);
  const [deletingRequestId, setDeletingRequestId] = useState<string | null>(null);
  const [stats, setStats] = useState<ReceiverStats | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        try {
          setLoading(true);
          const [mineRes, donorsRes, statsRes] = await Promise.all([
            http.get('/food-requests/my'),
            http.get('/food-donations'),
            getMyStats().catch(() => null),
          ]);

          if (!active) return;

          setMyPosts(mineRes.data?.data ?? []);
          setDonorPosts(donorsRes.data?.data ?? []);
          if (statsRes) setStats(statsRes.data.data as ReceiverStats);
        } catch {
          // Giữ nguyên data cũ khi fetch fail (mạng yếu, server cold start...)
          // để user không bị mất giao diện khi back từ màn hình khác.
        } finally {
          if (active) setLoading(false);
        }
      })();

      return () => {
        active = false;
      };
    }, [])
  );

  const nearDonors = donorPosts.slice(0, 2);
  const donorFeedPosts = donorPosts;
  const donorTabCount = donorPosts.length;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentCard}>
          <View style={styles.header}>
            <View>
              <Text style={styles.greeting}>{t('receiver.greeting')} {firstName}</Text>
              <View style={styles.roleRow}>
                <Text style={styles.roleText}>{t('receiver.rolePrefix')} </Text>
                <Text style={styles.roleBold}>{t('receiver.role')}</Text>
                <Ionicons name="chevron-down" size={16} color="#111" style={{ marginLeft: 2 }} />
              </View>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
                style={styles.langPill}
                activeOpacity={0.85}
              >
                <Text style={styles.langPillText}>{language === 'vi' ? 'VI' : 'EN'}</Text>
              </TouchableOpacity>
              <NotificationBell />
            </View>
          </View>

          {stats && stats.mealsReceived > 0 && (
            <View style={styles.impactCard}>
              <View style={styles.impactRow}>
                <View style={styles.impactMetric}>
                  <Text style={styles.impactNumber}>{stats.mealsReceived}</Text>
                  <Text style={styles.impactLabel}>{t('receiver.impact.mealsLabel')}</Text>
                </View>
                <View style={styles.impactDivider} />
                <View style={styles.impactMetric}>
                  <Text style={styles.impactNumber}>{stats.ngosConnected}</Text>
                  <Text style={styles.impactLabel}>{t('receiver.impact.ngosLabel')}</Text>
                </View>
              </View>
              <Text style={styles.impactMessage}>{t('receiver.impact.message')}</Text>
            </View>
          )}

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('receiver.ordersReceived')}</Text>
              <Text style={styles.statValue}>{String(myPosts.length)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>{t('receiver.pointsEarned')}</Text>
              <Text style={styles.statValue}>{String(points)}</Text>
            </View>
          </View>

          <View style={styles.tabsRow}>
            <TouchableOpacity
              onPress={() => setActiveTab('my')}
              style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, activeTab === 'my' && styles.tabTextActive]}>{t('receiver.myPost')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab('donors')}
              style={[styles.tabButton, activeTab === 'donors' && styles.tabButtonActive]}
              activeOpacity={0.8}
            >
              <View style={styles.tabWithBadge}>
                <Text style={[styles.tabText, activeTab === 'donors' && styles.tabTextActive]}>{t('receiver.donorsPosts')}</Text>
                <View style={styles.countBadge}><Text style={styles.countBadgeText}>{String(donorTabCount)}</Text></View>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.requestBox}>
            {loading ? (
              <ActivityIndicator color="#008080" />
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
                {donorFeedPosts.slice(0, 3).map((item) => (
                  <DonorPostItem key={item._id} item={item} t={t} />
                ))}
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
              nearDonors.map((item) => {
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
                        params: {
                          donationId: item._id,
                          title: item.title,
                        },
                      } as any);
                      return;
                    }

                    if (selectedForMe) {
                      router.push({
                        pathname: '/(stack)/RECEIVER/addPickup',
                        params: {
                          donationId: item._id,
                          title: item.title,
                        },
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
                                params: {
                                  donationId: item._id,
                                  title: item.title,
                                },
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
              })
            ) : (
              <Text style={styles.noDonorText}>{t('receiver.noNearbyDonors')}</Text>
            )}
          </View>

          <Text style={styles.sectionTitle}>{t('receiver.faqs')}</Text>
          {FAQS.map((faq, index) => (
            <TouchableOpacity
              key={faq}
              style={styles.faqItem}
              onPress={() => setOpenFaq(openFaq === index ? null : index)}
              activeOpacity={0.75}
            >
              <Text style={styles.faqQuestion}>{faq}</Text>
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

function DonorPostItem({ item, t }: { item: DonationItem; t: (key: any) => string }) {
  return (
    <View style={styles.donorPostCard}>
      <Text style={styles.donorPostTitle} numberOfLines={1}>{item.title}</Text>
      <Text style={styles.donorPostMeta} numberOfLines={1}>
        {item.donor_id?.full_name ?? t('receiver.unknownDonor')}
        {item.pickup_city ? ` • ${item.pickup_city}` : ''}
      </Text>
      <Text style={styles.donorPostSub}>
        {item.quantity ?? '-'} {item.unit ?? t('receiver.portion')}
        {item.food_type ? ` • ${item.food_type}` : ''}
      </Text>
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
            <ActivityIndicator size="small" color="#C62828" />
          ) : (
            <Ionicons name="trash-outline" size={16} color="#C62828" />
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.myRequestContentRow}>
        <View style={styles.myRequestThumb}>
          <Ionicons name="camera-outline" size={22} color="#333" />
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
          <Ionicons name="alert-circle-outline" size={14} color="#B71C1C" />
          <Text style={styles.expiredBadgeText}>{t('receiver.requestExpired')}</Text>
        </View>
      ) : null}

      {canContinueFlow ? (
        <TouchableOpacity style={styles.continuePickupBtn} onPress={onContinueFlow} activeOpacity={0.85}>
          <Ionicons name={linkedDonation?.delivery_type ? 'navigate-outline' : 'cube-outline'} size={16} color="#006666" />
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
  greeting: { fontSize: 16, color: c.textSecondary, fontWeight: '500' },
  roleRow: { flexDirection: 'row', alignItems: 'center' },
  roleText: { fontSize: 20, color: c.textPrimary, fontWeight: '400' },
  roleBold: { fontSize: 20, color: c.textPrimary, fontWeight: '800' },
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
  statItem: { alignItems: 'center' },
  statLabel: { fontSize: 10, color: c.textMuted, marginBottom: 2 },
  statValue: { fontSize: 22, color: c.textPrimary, fontWeight: '700' },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: c.divider,
    marginBottom: 10,
  },
  tabButton: { paddingBottom: 10, marginRight: 22 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: c.textPrimary },
  tabText: { fontSize: 14, color: c.textMuted, fontWeight: '500' },
  tabTextActive: { color: c.textPrimary, fontWeight: '700' },
  tabWithBadge: { flexDirection: 'row', alignItems: 'center' },
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
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#EF9A9A',
  },
  expiredBadgeText: { fontSize: 11, color: '#B71C1C', fontWeight: '700' },
  pendingBadgeCompact: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pendingText: { marginLeft: 8, fontSize: 13, color: '#4D4120', fontWeight: '600' },
  continuePickupBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#BBDEFB',
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
  donorPostCard: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: r.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  donorPostTitle: { fontSize: 14, color: c.textPrimary, fontWeight: '600' },
  donorPostMeta: { fontSize: 12, color: c.textSecondary, marginTop: 4 },
  donorPostSub: { fontSize: 11, color: c.textMuted, marginTop: 4 },
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
  donorActions: { flexDirection: 'row', marginTop: 6, alignItems: 'center' },
  viewButton: {
    borderWidth: 1,
    borderColor: c.divider,
    borderRadius: r.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
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
    backgroundColor: '#2E7D32',
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
  impactCard:    { backgroundColor: c.primarySoft, borderColor: c.primary + '40', borderWidth: 1, borderRadius: r.md, padding: 14, marginBottom: 12 },
  impactRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 8 },
  impactMetric:  { flex: 1, alignItems: 'center' },
  impactNumber:  { fontSize: 22, fontWeight: '800', color: c.primaryStrong },
  impactLabel:   { fontSize: 11, color: c.textSecondary, marginTop: 2, textAlign: 'center' },
  impactDivider: { width: 1, height: 32, backgroundColor: '#DDD', marginHorizontal: 8 },
  impactMessage: { fontSize: 12, color: c.textSecondary, textAlign: 'center', fontStyle: 'italic' },
});
