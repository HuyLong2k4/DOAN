import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getOrCreateDonationConversation } from '../../../src/api/chat.api';
import { http } from '../../../src/api/http';
import type { TranslationKey } from '../../../src/i18n/translations';
import { useI18n } from '../../../src/i18n/useI18n';
import { useAuthStore } from '../../../src/store/authStore';

type DonationDetailParams = {
  donationId?: string | string[];
  title?: string | string[];
};

type DonorInfo = {
  _id?: string;
  full_name?: string;
  avatar_url?: string | null;
  phone_number?: string | null;
};

type DonationDetail = {
  _id: string;
  title: string;
  description?: string | null;
  food_type?: string;
  quantity?: number;
  unit?: string;
  expiration_datetime?: string | null;
  images?: string[];
  status?: string;
  delivery_type?: string | null;
  selected_receiver_id?: string | { _id?: string } | null;
  donor_id?: DonorInfo | null;
  pickup_address_line?: string | null;
  pickup_city?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  pickup_distance_km?: number | null;
};

function firstParam(value?: string | string[]): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function normalizeObjectId(value?: string | { _id?: string } | null): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || '';
}

const FOOD_TYPE_KEY: Record<string, TranslationKey> = {
  COOKED:   'request.cookedFood',
  RAW:      'request.rawVeggies',
  FROZEN:   'request.frozenFood',
  PACKAGED: 'request.packagedFood',
};

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  PENDING:   { bg: '#FFF7E0', fg: '#9A6B00' },
  ACCEPTED:  { bg: '#E0F2F1', fg: '#006666' },
  PICKED_UP: { bg: '#E3F2FD', fg: '#1565C0' },
  COMPLETED: { bg: '#E8F5E9', fg: '#2E7D32' },
  EXPIRED:   { bg: '#F3F4F6', fg: '#616161' },
  CANCELLED: { bg: '#FCE8E8', fg: '#B71C1C' },
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function ReceiverDonationDetailScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<DonationDetailParams>();
  const user = useAuthStore((s) => s.user);
  const currentUserId = String((user as any)?.id || (user as any)?._id || '');

  const donationId = firstParam(params.donationId);
  const fallbackTitle = firstParam(params.title) || 'Donation';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [openingChat, setOpeningChat] = useState(false);
  const [data, setData] = useState<DonationDetail | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

  const loadDetail = useCallback(async () => {
    if (!donationId) return;
    try {
      const res = await http.get(`/food-donations/${donationId}`);
      setData(res.data?.data || null);
    } catch (err: any) {
      Alert.alert(t('donationDetail.loadFailed'), err?.response?.data?.message || '');
    }
  }, [donationId, t]);

  useFocusEffect(
    useCallback(() => {
      if (!donationId) {
        setLoading(false);
        return;
      }
      void loadDetail().finally(() => setLoading(false));
    }, [donationId, loadDetail]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDetail();
    setRefreshing(false);
  }, [loadDetail]);

  const selectedForMe = useMemo(() => {
    const selectedId = normalizeObjectId(data?.selected_receiver_id);
    return selectedId !== '' && selectedId === currentUserId;
  }, [data?.selected_receiver_id, currentUserId]);

  const pickupChosen = selectedForMe && Boolean(data?.delivery_type);

  const images = useMemo(
    () => (Array.isArray(data?.images) ? data!.images.filter((u) => typeof u === 'string' && u.length > 0) : []),
    [data?.images],
  );

  const title = data?.title || fallbackTitle;
  const donor = data?.donor_id || null;
  const donorName = donor?.full_name || t('receiver.unknownDonor');
  const donorAvatar = donor?.avatar_url || null;
  const donorPhone = donor?.phone_number || null;

  const addressText = [data?.pickup_address_line, data?.pickup_city].filter(Boolean).join(', ') || t('donorList.addressNotAvailable');
  const foodTypeText = data?.food_type && FOOD_TYPE_KEY[data.food_type] ? t(FOOD_TYPE_KEY[data.food_type]) : t('receiver.foodTypeNotSpecified');
  const quantityText = `${data?.quantity ?? 0} ${data?.unit || 'meals'}`;
  const distanceKmValue = typeof data?.pickup_distance_km === 'number' ? data.pickup_distance_km : null;

  const expirationInfo = useMemo(() => {
    if (!data?.expiration_datetime) {
      return { label: t('receiver.notSpecified'), urgency: 'normal' as const, remaining: '' };
    }
    const date = new Date(data.expiration_datetime);
    if (Number.isNaN(date.getTime())) {
      return { label: t('receiver.notSpecified'), urgency: 'normal' as const, remaining: '' };
    }

    const absoluteLabel = date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const now = Date.now();
    const diffMs = date.getTime() - now;
    if (diffMs <= 0) {
      return { label: absoluteLabel, urgency: 'expired' as const, remaining: t('donationDetail.expired') };
    }

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    let remainingText = '';
    if (days >= 1) {
      remainingText = `${days}d ${remainingHours}h`;
    } else if (hours >= 1) {
      remainingText = `${hours}h ${minutes}m`;
    } else {
      remainingText = `${minutes}m`;
    }

    const urgency: 'soon' | 'normal' = hours < 4 ? 'soon' : 'normal';
    return { label: absoluteLabel, urgency, remaining: remainingText };
  }, [data?.expiration_datetime, t]);

  const statusKey = (data?.status || '').toUpperCase();
  const statusStyle = STATUS_STYLES[statusKey] || { bg: '#F3F4F6', fg: '#374151' };

  const primaryActionLabel = pickupChosen
    ? t('receiver.openTracking')
    : selectedForMe
      ? t('receiver.choosePickup')
      : connecting
        ? t('receiver.connecting')
        : t('donationDetail.connectDonation');

  const deliveryTypeLabel = data?.delivery_type === 'VIA_AGENT'
    ? t('donor.delivery.viaAgent')
    : data?.delivery_type === 'SELF_PICKUP'
      ? t('donor.delivery.selfPickup')
      : data?.delivery_type || '';

  const onOpenMap = async () => {
    try {
      if (typeof data?.pickup_latitude === 'number' && typeof data?.pickup_longitude === 'number') {
        const url = `https://www.google.com/maps/search/?api=1&query=${data.pickup_latitude},${data.pickup_longitude}`;
        await Linking.openURL(url);
        return;
      }

      if (!addressText || addressText === t('donorList.addressNotAvailable')) {
        Alert.alert(t('donationDetail.noAddress'), t('donationDetail.noAddressMsg'));
        return;
      }

      const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('donationDetail.cannotOpenMap'), t('receiver.tryAgain'));
    }
  };

  const onCallDonor = async () => {
    if (!donorPhone) {
      Alert.alert(t('tracking.noPhone'), t('tracking.noPhoneMsg'));
      return;
    }
    try {
      await Linking.openURL(`tel:${donorPhone}`);
    } catch {
      Alert.alert(t('tracking.cannotCallTitle'), t('tracking.cannotCallMsg'));
    }
  };

  const onChatDonor = async () => {
    if (!donationId || openingChat) return;
    try {
      setOpeningChat(true);
      const res = await getOrCreateDonationConversation(donationId, 'DONOR');
      const conversation = res.data?.data;
      if (!conversation?.id) throw new Error(t('donationDetail.cannotOpenChat'));

      router.push({
        pathname: '/(stack)/chat/[conversationId]',
        params: {
          conversationId: conversation.id,
          title: conversation.counterpart?.full_name || donorName,
        },
      } as any);
    } catch (err: any) {
      Alert.alert(t('donationDetail.cannotOpenChat'), err?.response?.data?.message || err?.message || '');
    } finally {
      setOpeningChat(false);
    }
  };

  const onPrimaryAction = async () => {
    if (!donationId) {
      Alert.alert(t('receiver.missingDonationTitle'), t('donationDetail.cannotDetermineMsg'));
      return;
    }

    if (pickupChosen) {
      router.push({
        pathname: '/(stack)/RECEIVER/tracking',
        params: { donationId, title },
      } as any);
      return;
    }

    if (selectedForMe) {
      router.push({
        pathname: '/(stack)/RECEIVER/addPickup',
        params: { donationId, title },
      } as any);
      return;
    }

    try {
      setConnecting(true);
      const res = await http.patch(`/food-donations/${donationId}/connect`);
      const connectMessage = res.data?.message || t('receiver.connectSuccessDefault');

      Alert.alert(t('receiver.connectSuccessTitle'), connectMessage, [
        {
          text: t('receiver.choosePickup'),
          onPress: () => {
            router.push({
              pathname: '/(stack)/RECEIVER/addPickup',
              params: { donationId, title },
            } as any);
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert(t('receiver.connectFailedTitle'), err?.response?.data?.message || t('receiver.connectFailedDefault'));
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <ActivityIndicator color="#008080" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#008080" />}
      >
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('donationDetail.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.heroCard}>
          {images.length > 0 ? (
            <View>
              <FlatList
                data={images}
                keyExtractor={(uri, idx) => `${idx}:${uri}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const idx = Math.round(e.nativeEvent.contentOffset.x / (screenWidth - 32));
                  setActiveImageIndex(idx);
                }}
                renderItem={({ item, index }) => (
                  <Pressable onPress={() => setFullscreenIndex(index)}>
                    <Image source={{ uri: item }} style={[styles.heroImage, { width: screenWidth - 32 }]} />
                  </Pressable>
                )}
              />
              {images.length > 1 ? (
                <View style={styles.pagerDots} pointerEvents="none">
                  {images.map((_, idx) => (
                    <View
                      key={idx}
                      style={[styles.pagerDot, idx === activeImageIndex && styles.pagerDotActive]}
                    />
                  ))}
                </View>
              ) : null}
              {images.length > 1 ? (
                <View style={styles.photoCountBadge} pointerEvents="none">
                  <Ionicons name="images-outline" size={12} color="#fff" />
                  <Text style={styles.photoCountText}>{activeImageIndex + 1}/{images.length}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder, { width: screenWidth - 32 }]}>
              <Ionicons name="image-outline" size={64} color="#B8B8B8" />
            </View>
          )}

          <View style={styles.heroBody}>
            <View style={styles.titleRow}>
              <Text style={styles.donationTitle} numberOfLines={2}>{title}</Text>
              {statusKey ? (
                <View style={[styles.statusPill, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusPillText, { color: statusStyle.fg }]}>{statusKey}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{foodTypeText}</Text>
              </View>
              {distanceKmValue != null ? (
                <View style={[styles.badge, styles.badgeDistance]}>
                  <Text style={styles.badgeText}>{distanceKmValue.toFixed(1)} {t('donorList.kmAway')}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* Donor info card */}
        <View style={styles.donorCard}>
          <Text style={styles.sectionLabel}>{t('donationDetail.donorInfo')}</Text>
          <View style={styles.donorRow}>
            {donorAvatar ? (
              <Image source={{ uri: donorAvatar }} style={styles.donorAvatar} />
            ) : (
              <View style={[styles.donorAvatar, styles.donorAvatarPlaceholder]}>
                <Ionicons name="person" size={22} color="#9CA3AF" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.donorName} numberOfLines={1}>{donorName}</Text>
              {donorPhone ? (
                <Text style={styles.donorPhone} numberOfLines={1}>{donorPhone}</Text>
              ) : null}
            </View>
          </View>
          <View style={styles.donorActions}>
            <TouchableOpacity
              style={[styles.donorActionBtn, !donorPhone && styles.donorActionBtnDisabled]}
              onPress={onCallDonor}
              disabled={!donorPhone}
            >
              <Ionicons name="call-outline" size={15} color={donorPhone ? '#006666' : '#9CA3AF'} />
              <Text style={[styles.donorActionText, !donorPhone && { color: '#9CA3AF' }]}>
                {t('donationDetail.callDonor')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.donorActionBtn}
              onPress={onChatDonor}
              disabled={openingChat}
            >
              {openingChat ? (
                <ActivityIndicator size="small" color="#006666" />
              ) : (
                <>
                  <Ionicons name="chatbubble-outline" size={15} color="#006666" />
                  <Text style={styles.donorActionText}>{t('donationDetail.chatDonor')}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {data?.description ? (
          <View style={styles.descriptionCard}>
            <Text style={styles.sectionLabel}>{t('donationDetail.description')}</Text>
            <Text style={styles.descriptionText}>{data.description}</Text>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <InfoRow icon="restaurant-outline" label={t('donationDetail.quantity')} value={quantityText} />
          <ExpirationRow
            label={t('donationDetail.expires')}
            value={expirationInfo.label}
            remaining={expirationInfo.remaining}
            urgency={expirationInfo.urgency}
            t={t}
          />
          <InfoRow icon="location-outline" label={t('donationDetail.pickupAddress')} value={addressText} />
          {data?.delivery_type ? (
            <InfoRow icon="navigate-outline" label={t('donationDetail.deliveryType')} value={deliveryTypeLabel} isLast />
          ) : null}
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onOpenMap}>
            <Ionicons name="map-outline" size={16} color="#006666" />
            <Text style={styles.secondaryBtnText}>{t('volunteer.openMap')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryBtn,
              selectedForMe && styles.primaryBtnApproved,
              pickupChosen && styles.primaryBtnMuted,
              connecting && { opacity: 0.7 },
            ]}
            disabled={connecting}
            onPress={onPrimaryAction}
          >
            <Text style={styles.primaryBtnText}>{primaryActionLabel}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Fullscreen image viewer */}
      <Modal
        visible={fullscreenIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setFullscreenIndex(null)}
      >
        <View style={styles.fullscreenBackdrop}>
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setFullscreenIndex(null)}
          >
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {fullscreenIndex !== null && images.length > 0 ? (
            <FlatList
              data={images}
              keyExtractor={(uri, idx) => `fs:${idx}:${uri}`}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              initialScrollIndex={fullscreenIndex}
              getItemLayout={(_, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
              renderItem={({ item }) => (
                <View style={[styles.fullscreenImageWrap, { width: screenWidth, height: screenHeight }]}>
                  <Image source={{ uri: item }} style={styles.fullscreenImage} resizeMode="contain" />
                </View>
              )}
            />
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isLast,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View style={[styles.infoRow, isLast && { borderBottomWidth: 0 }]}>
      <Ionicons name={icon} size={16} color="#555" style={{ marginTop: 1 }} />
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function ExpirationRow({
  label,
  value,
  remaining,
  urgency,
  t,
}: {
  label: string;
  value: string;
  remaining: string;
  urgency: 'normal' | 'soon' | 'expired';
  t: (key: TranslationKey) => string;
}) {
  const remainingStyle =
    urgency === 'expired'
      ? styles.expiredPill
      : urgency === 'soon'
        ? styles.soonPill
        : styles.normalPill;

  const prefix = urgency === 'expired'
    ? ''
    : urgency === 'soon'
      ? `${t('donationDetail.aboutToExpire')} • `
      : `${t('donationDetail.expiresIn')} `;

  return (
    <View style={styles.infoRow}>
      <Ionicons name="time-outline" size={16} color="#555" style={{ marginTop: 1 }} />
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
        {remaining ? (
          <View style={[styles.timeRemainingPill, remainingStyle]}>
            <Text style={[styles.timeRemainingText, urgency === 'expired' && { color: '#fff' }]}>
              {urgency === 'expired' ? remaining : `${prefix}${remaining}`}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  headerRow: {
    paddingTop: 8,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 16, color: '#111', fontWeight: '700' },

  heroCard: {
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    overflow: 'hidden',
    marginBottom: 12,
  },
  heroImage: { height: 220, backgroundColor: '#E8E8E8' },
  heroImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroBody: { paddingHorizontal: 12, paddingVertical: 12 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  donationTitle: { flex: 1, fontSize: 17, color: '#111', fontWeight: '700' },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E8F5E9',
  },
  badgeMuted: { backgroundColor: '#ECEFF1' },
  badgeDistance: { backgroundColor: '#E0F2F1' },
  badgeText: { fontSize: 11, color: '#222', fontWeight: '600' },

  pagerDots: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  pagerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  pagerDotActive: {
    backgroundColor: '#FFF',
    width: 18,
  },
  photoCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  photoCountText: { color: '#fff', fontSize: 11, fontWeight: '600' },

  donorCard: {
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 8,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  donorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  donorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },
  donorAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorName: { fontSize: 14, color: '#111', fontWeight: '700' },
  donorPhone: { fontSize: 12, color: '#4B5563', marginTop: 2 },
  donorActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  donorActionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    backgroundColor: '#E0F2F1',
  },
  donorActionBtnDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  donorActionText: { fontSize: 12, color: '#006666', fontWeight: '700' },

  descriptionCard: {
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  descriptionText: { fontSize: 14, color: '#111', lineHeight: 20 },

  infoCard: {
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#666' },
  infoValue: { fontSize: 14, color: '#111', marginTop: 2, fontWeight: '600' },

  timeRemainingPill: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  timeRemainingText: { fontSize: 11, fontWeight: '700' },
  normalPill: { backgroundColor: '#E8F5E9' },
  soonPill: { backgroundColor: '#FFF3E0' },
  expiredPill: { backgroundColor: '#9CA3AF' },

  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBDEFB',
    backgroundColor: '#E0F2F1',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  secondaryBtnText: { color: '#006666', fontSize: 13, fontWeight: '700' },
  primaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#008080',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnApproved: { backgroundColor: '#2E7D32' },
  primaryBtnMuted: { backgroundColor: '#546E7A' },
  primaryBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  fullscreenBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 48,
    right: 16,
    zIndex: 2,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImageWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenImage: {
    width: '100%',
    height: '85%',
  },
});
