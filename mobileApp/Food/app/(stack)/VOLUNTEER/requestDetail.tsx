import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Linking,
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
import { getCurrentGps } from '../../../src/utils/location';
import { roleUi } from '@/src/theme/roleUi';
import { ScreenHeader } from '@/src/components/ScreenHeader';

type RequestDetailParams = {
  donationId?: string | string[];
  title?: string | string[];
};

type DonorInfo = {
  _id?: string;
  full_name?: string;
  avatar_url?: string | null;
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

const FOOD_TYPE_KEY: Record<string, TranslationKey> = {
  COOKED:   'request.cookedFood',
  RAW:      'request.rawVeggies',
  FROZEN:   'request.frozenFood',
  PACKAGED: 'request.packagedFood',
};

const screenWidth = Dimensions.get('window').width;

export default function VolunteerRequestDetailScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<RequestDetailParams>();

  const donationId = firstParam(params.donationId);
  const fallbackTitle = firstParam(params.title) || 'Donation';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DonationDetail | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!donationId) return;
    try {
      // Gửi GPS thật để khoảng cách khớp với màn home (cùng một mốc).
      const gps = await getCurrentGps();
      const opts = gps ? { params: { lat: gps.latitude, lon: gps.longitude } } : undefined;
      const res = await http.get(`/food-donations/${donationId}`, opts);
      setData(res.data?.data || null);
    } catch (err: any) {
      Alert.alert(t('donationDetail.loadFailed'), err?.response?.data?.message || '');
    }
  }, [donationId, t]);

  useEffect(() => {
    if (!donationId) {
      setLoading(false);
      return;
    }
    void loadDetail().finally(() => setLoading(false));
  }, [donationId, loadDetail]);

  const images = useMemo(
    () => (Array.isArray(data?.images) ? data!.images.filter((u) => typeof u === 'string' && u.length > 0) : []),
    [data?.images],
  );

  const title = data?.title || fallbackTitle;
  const donor = data?.donor_id || null;
  const donorName = donor?.full_name || t('receiver.unknownDonor');
  const donorAvatar = donor?.avatar_url || null;

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

    const diffMs = date.getTime() - Date.now();
    if (diffMs <= 0) {
      return { label: absoluteLabel, urgency: 'expired' as const, remaining: t('donationDetail.expired') };
    }

    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    let remainingText = '';
    if (days >= 1) remainingText = `${days}d ${remainingHours}h`;
    else if (hours >= 1) remainingText = `${hours}h ${minutes}m`;
    else remainingText = `${minutes}m`;

    const urgency: 'soon' | 'normal' = hours < 4 ? 'soon' : 'normal';
    return { label: absoluteLabel, urgency, remaining: remainingText };
  }, [data?.expiration_datetime, t]);

  const deliveryTypeLabel = data?.delivery_type === 'VIA_AGENT'
    ? t('donor.delivery.viaAgent')
    : data?.delivery_type === 'SELF_PICKUP'
      ? t('donor.delivery.selfPickup')
      : data?.delivery_type || '';

  const onOpenMap = async () => {
    try {
      if (typeof data?.pickup_latitude === 'number' && typeof data?.pickup_longitude === 'number') {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${data.pickup_latitude},${data.pickup_longitude}&travelmode=driving`;
        await Linking.openURL(url);
        return;
      }
      if (!addressText || addressText === t('donorList.addressNotAvailable')) {
        Alert.alert(t('donationDetail.noAddress'), t('donationDetail.noAddressMsg'));
        return;
      }
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressText)}&travelmode=driving`;
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('donationDetail.cannotOpenMap'), t('receiver.tryAgain'));
    }
  };

  const onAccept = useCallback(() => {
    if (!donationId || accepting) return;
    Alert.alert(t('volunteer.requestDetail.acceptConfirmTitle'), t('volunteer.requestDetail.acceptConfirmMsg'), [
      { text: t('volunteer.cancel'), style: 'cancel' },
      {
        text: t('volunteer.requestDetail.accept'),
        onPress: () => {
          void (async () => {
            try {
              setAccepting(true);
              await http.patch(`/food-donations/${donationId}/accept`);
              Alert.alert(t('volunteer.accepted'), t('volunteer.acceptedMsg'));
              router.back();
            } catch (err: any) {
              Alert.alert(t('volunteer.cannotAccept'), err?.response?.data?.message ?? t('volunteer.somethingWrong'));
            } finally {
              setAccepting(false);
            }
          })();
        },
      },
    ]);
  }, [donationId, accepting, router, t]);

  const onReject = useCallback(() => {
    if (!donationId || rejecting) return;
    Alert.alert(t('volunteer.requestDetail.rejectConfirmTitle'), t('volunteer.requestDetail.rejectConfirmMsg'), [
      { text: t('volunteer.cancel'), style: 'cancel' },
      {
        text: t('volunteer.requestDetail.reject'),
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              setRejecting(true);
              await http.patch(`/food-donations/${donationId}/reject`);
              router.back();
            } catch (err: any) {
              Alert.alert(t('volunteer.cannotReject'), err?.response?.data?.message ?? t('volunteer.somethingWrong'));
            } finally {
              setRejecting(false);
            }
          })();
        },
      },
    ]);
  }, [donationId, rejecting, router, t]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title={t('volunteer.requestDetail.title')} />
        <View style={styles.centerWrap}>
          <ActivityIndicator color={roleUi.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const busy = accepting || rejecting;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('volunteer.requestDetail.title')} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
                renderItem={({ item }) => (
                  <Image source={{ uri: item }} style={[styles.heroImage, { width: screenWidth - 32 }]} />
                )}
              />
              {images.length > 1 ? (
                <View style={styles.pagerDots} pointerEvents="none">
                  {images.map((_, idx) => (
                    <View key={idx} style={[styles.pagerDot, idx === activeImageIndex && styles.pagerDotActive]} />
                  ))}
                </View>
              ) : null}
            </View>
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder, { width: screenWidth - 32 }]}>
              <Ionicons name="image-outline" size={64} color="#B8B8B8" />
            </View>
          )}

          <View style={styles.heroBody}>
            <Text style={styles.donationTitle} numberOfLines={2}>{title}</Text>
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

        {/* Donor info */}
        <View style={styles.donorCard}>
          <Text style={styles.sectionLabel}>{t('donationDetail.donorInfo')}</Text>
          <View style={styles.donorRow}>
            {donorAvatar ? (
              <Image source={{ uri: donorAvatar }} style={styles.donorAvatar} />
            ) : (
              <View style={[styles.donorAvatar, styles.donorAvatarPlaceholder]}>
                <Ionicons name="person" size={22} color="#8A8A8A" />
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.donorName} numberOfLines={1}>{donorName}</Text>
            </View>
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

        <TouchableOpacity style={styles.mapBtn} onPress={onOpenMap}>
          <Ionicons name="map-outline" size={16} color={roleUi.colors.primaryStrong} />
          <Text style={styles.mapBtnText} numberOfLines={1}>{t('volunteer.openMap')}</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, busy && styles.disabled]}
            onPress={onReject}
            disabled={busy}
          >
            <Ionicons name="close" size={18} color={roleUi.colors.dangerText} />
            <Text style={styles.rejectBtnText} numberOfLines={1}>{t('volunteer.requestDetail.reject')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.acceptBtn, busy && styles.disabled]}
            onPress={onAccept}
            disabled={busy}
          >
            {accepting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color="#fff" />
                <Text style={styles.acceptBtnText} numberOfLines={1}>{t('volunteer.requestDetail.accept')}</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    urgency === 'expired' ? styles.expiredPill : urgency === 'soon' ? styles.soonPill : styles.normalPill;

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
  donationTitle: { fontSize: 17, color: '#111', fontWeight: '700', marginBottom: 8 },
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
  pagerDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.55)' },
  pagerDotActive: { backgroundColor: '#FFF', width: 18 },

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
  donorRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  donorAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E6E6E6' },
  donorAvatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  donorName: { fontSize: 14, color: '#111', fontWeight: '700' },

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

  mapBtn: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5E0EC',
    backgroundColor: roleUi.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  mapBtnText: { color: roleUi.colors.primaryStrong, fontSize: 13, fontWeight: '700' },

  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  rejectBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: roleUi.colors.dangerText,
    backgroundColor: roleUi.colors.dangerSoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  rejectBtnText: { color: roleUi.colors.dangerText, fontSize: 14, fontWeight: '700' },
  acceptBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: roleUi.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  acceptBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  disabled: { opacity: 0.55 },
});
