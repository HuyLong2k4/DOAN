import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import { http } from '../../../src/api/http';
import type { TranslationKey } from '../../../src/i18n/translations';
import { useI18n } from '../../../src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';
import { ScreenHeader } from '@/src/components/ScreenHeader';

type DonationDetailParams = {
  donationId?: string | string[];
  title?: string | string[];
};

type ReceiverInfo = {
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
  pickup_address_line?: string | null;
  pickup_city?: string | null;
  selected_receiver?: ReceiverInfo | null;
  pickup_code?: string | null;
};

function firstParam(value?: string | string[]): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

const FOOD_TYPE_KEY: Record<string, TranslationKey> = {
  COOKED:   'request.cookedFood',
  RAW:      'request.rawVeggies',
  FROZEN:   'request.frozenFood',
  PACKAGED: 'request.packagedFood',
};

const STATUS_STYLES: Record<string, { bg: string; fg: string }> = {
  PENDING:   { bg: roleUi.colors.warningSoft, fg: roleUi.colors.warningText },
  ACCEPTED:  { bg: roleUi.colors.primarySoft, fg: roleUi.colors.primaryStrong },
  PICKED_UP: { bg: roleUi.colors.infoSoft, fg: roleUi.colors.info },
  COMPLETED: { bg: roleUi.colors.successSoft, fg: roleUi.colors.successText },
  EXPIRED:   { bg: '#F5F5F5', fg: '#616161' },
  CANCELLED: { bg: roleUi.colors.dangerSoft, fg: roleUi.colors.dangerText },
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

export default function DonorDonationDetailScreen() {
  const { t } = useI18n();
  const params = useLocalSearchParams<DonationDetailParams>();

  const donationId = firstParam(params.donationId);
  const fallbackTitle = firstParam(params.title) || 'Donation';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  const images = useMemo(
    () => (Array.isArray(data?.images) ? data!.images.filter((u) => typeof u === 'string' && u.length > 0) : []),
    [data?.images],
  );

  const title = data?.title || fallbackTitle;
  const receiver = data?.selected_receiver || null;
  const receiverName = receiver?.full_name || '';
  const receiverAvatar = receiver?.avatar_url || null;
  const receiverPhone = receiver?.phone_number || null;

  const addressText = [data?.pickup_address_line, data?.pickup_city].filter(Boolean).join(', ') || t('donorList.addressNotAvailable');
  const foodTypeText = data?.food_type && FOOD_TYPE_KEY[data.food_type] ? t(FOOD_TYPE_KEY[data.food_type]) : t('receiver.foodTypeNotSpecified');
  const quantityText = `${data?.quantity ?? 0} ${data?.unit || 'meals'}`;

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
  const statusStyle = STATUS_STYLES[statusKey] || { bg: '#F5F5F5', fg: '#4A4A4A' };

  const deliveryTypeLabel = data?.delivery_type === 'VIA_AGENT'
    ? t('donor.delivery.viaAgent')
    : data?.delivery_type === 'SELF_PICKUP'
      ? t('donor.delivery.selfPickup')
      : data?.delivery_type || '';

  const onCallReceiver = async () => {
    if (!receiverPhone) {
      Alert.alert(t('tracking.noPhone'), t('tracking.noPhoneMsg'));
      return;
    }
    try {
      await Linking.openURL(`tel:${receiverPhone}`);
    } catch {
      Alert.alert(t('tracking.cannotCallTitle'), t('tracking.cannotCallMsg'));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerWrap}>
          <ActivityIndicator color={roleUi.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('donationDetail.title')} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={roleUi.colors.primary} />}
      >
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
              <View style={[styles.badge, styles.badgeDistance]}>
                <Text style={styles.badgeText}>{quantityText}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Receiver info card */}
        <View style={styles.donorCard}>
          <Text style={styles.sectionLabel}>{t('donationDetail.receiverInfo')}</Text>
          {receiver ? (
            <>
              <View style={styles.donorRow}>
                {receiverAvatar ? (
                  <Image source={{ uri: receiverAvatar }} style={styles.donorAvatar} />
                ) : (
                  <View style={[styles.donorAvatar, styles.donorAvatarPlaceholder]}>
                    <Ionicons name="person" size={22} color="#8A8A8A" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.donorName} numberOfLines={1}>{receiverName}</Text>
                  {receiverPhone ? (
                    <Text style={styles.donorPhone} numberOfLines={1}>{receiverPhone}</Text>
                  ) : null}
                </View>
              </View>
              <View style={styles.donorActions}>
                <TouchableOpacity
                  style={[styles.donorActionBtn, !receiverPhone && styles.donorActionBtnDisabled]}
                  onPress={onCallReceiver}
                  disabled={!receiverPhone}
                >
                  <Ionicons name="call-outline" size={15} color={receiverPhone ? roleUi.colors.primaryStrong : '#8A8A8A'} />
                  <Text style={[styles.donorActionText, !receiverPhone && { color: '#8A8A8A' }]}>
                    {t('donationDetail.callReceiver')}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.emptyReceiverText}>{t('donationDetail.noReceiverYet')}</Text>
          )}
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
            <InfoRow icon="navigate-outline" label={t('donationDetail.deliveryType')} value={deliveryTypeLabel} />
          ) : null}
          {data?.pickup_code ? (
            <InfoRow icon="key-outline" label={t('donationDetail.pickupCode')} value={data.pickup_code} isLast />
          ) : null}
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

  heroCard: {
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
    backgroundColor: roleUi.colors.successSoft,
  },
  badgeDistance: { backgroundColor: roleUi.colors.primarySoft },
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
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    color: '#666666',
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
    backgroundColor: '#E6E6E6',
  },
  donorAvatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  donorName: { fontSize: 14, color: '#111', fontWeight: '700' },
  donorPhone: { fontSize: 12, color: '#4A4A4A', marginTop: 2 },
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
    borderColor: '#D5E0EC',
    backgroundColor: roleUi.colors.primarySoft,
  },
  donorActionBtnDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E6E6E6',
  },
  donorActionText: { fontSize: 12, color: roleUi.colors.primaryStrong, fontWeight: '700' },
  emptyReceiverText: { fontSize: 13, color: '#666666' },

  descriptionCard: {
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  descriptionText: { fontSize: 14, color: '#111', lineHeight: 20 },

  infoCard: {
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
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
  normalPill: { backgroundColor: roleUi.colors.successSoft },
  soonPill: { backgroundColor: roleUi.colors.warningSoft },
  expiredPill: { backgroundColor: '#8A8A8A' },

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
