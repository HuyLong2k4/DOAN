import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
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

type DonationDetailParams = {
  donationId?: string | string[];
  title?: string | string[];
  donorName?: string | string[];
  pickupAddressLine?: string | string[];
  pickupCity?: string | string[];
  pickupLatitude?: string | string[];
  pickupLongitude?: string | string[];
  foodType?: 'COOKED' | 'RAW' | 'FROZEN' | 'PACKAGED' | string | string[];
  foodPreference?: 'VEG' | 'NON_VEG' | 'BOTH' | string | string[];
  quantity?: string | string[];
  unit?: string | string[];
  expirationDatetime?: string | string[];
  distanceKm?: string | string[];
  imageUrl?: string | string[];
  status?: string | string[];
  selectedForMe?: string | string[];
  pickupChosen?: string | string[];
  deliveryType?: 'VIA_AGENT' | 'SELF_PICKUP' | string | string[];
};

function firstParam(value?: string | string[]): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function parseNumber(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseFlag(value: string): boolean {
  return value === '1' || value.toLowerCase() === 'true';
}

const FOOD_TYPE_KEY: Record<string, TranslationKey> = {
  COOKED:   'request.cookedFood',
  RAW:      'request.rawVeggies',
  FROZEN:   'request.frozenFood',
  PACKAGED: 'request.packagedFood',
};

const FOOD_PREF_KEY: Record<string, TranslationKey> = {
  VEG:     'receiver.veg',
  NON_VEG: 'receiver.nonVeg',
  BOTH:    'receiver.vegAndNonVeg',
};

export default function ReceiverDonationDetailScreen() {
  const router = useRouter();
  const { t }  = useI18n();
  const params = useLocalSearchParams<DonationDetailParams>();

  const donationId = firstParam(params.donationId);
  const title = firstParam(params.title) || 'Donation';
  const donorName = firstParam(params.donorName) || t('receiver.unknownDonor');
  const pickupAddressLine = firstParam(params.pickupAddressLine);
  const pickupCity = firstParam(params.pickupCity);
  const pickupLatitude = parseNumber(firstParam(params.pickupLatitude));
  const pickupLongitude = parseNumber(firstParam(params.pickupLongitude));
  const foodType = firstParam(params.foodType);
  const foodPreference = firstParam(params.foodPreference);
  const quantity = parseNumber(firstParam(params.quantity));
  const unit = firstParam(params.unit) || 'meals';
  const expirationDatetime = firstParam(params.expirationDatetime);
  const distanceKm = parseNumber(firstParam(params.distanceKm));
  const imageUrl = firstParam(params.imageUrl);
  const status = firstParam(params.status);
  const selectedForMe = parseFlag(firstParam(params.selectedForMe));
  const pickupChosen = parseFlag(firstParam(params.pickupChosen));
  const deliveryType = firstParam(params.deliveryType);

  const [connecting, setConnecting] = useState(false);

  const addressText = [pickupAddressLine, pickupCity].filter(Boolean).join(', ') || t('donorList.addressNotAvailable');
  const foodTypeText = FOOD_TYPE_KEY[foodType] ? t(FOOD_TYPE_KEY[foodType]) : t('receiver.foodTypeNotSpecified');
  const foodPreferenceText = FOOD_PREF_KEY[foodPreference] ? t(FOOD_PREF_KEY[foodPreference]) : t('receiver.preferenceNotSpecified');
  const quantityText = `${quantity ?? 0} ${unit}`;

  const expirationText = useMemo(() => {
    if (!expirationDatetime) return t('receiver.notSpecified');
    const date = new Date(expirationDatetime);
    if (Number.isNaN(date.getTime())) return t('receiver.notSpecified');
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [expirationDatetime, t]);

  const primaryActionLabel = pickupChosen
    ? t('receiver.openTracking')
    : selectedForMe
      ? t('receiver.choosePickup')
      : connecting
        ? t('receiver.connecting')
        : t('donationDetail.connectDonation');

  const onOpenMap = async () => {
    try {
      if (typeof pickupLatitude === 'number' && typeof pickupLongitude === 'number') {
        const url = `https://www.google.com/maps/search/?api=1&query=${pickupLatitude},${pickupLongitude}`;
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

  const deliveryTypeLabel = deliveryType === 'VIA_AGENT'
    ? t('donor.delivery.viaAgent')
    : deliveryType === 'SELF_PICKUP'
      ? t('donor.delivery.selfPickup')
      : deliveryType;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('donationDetail.title')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.heroCard}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.heroImage} />
          ) : (
            <View style={[styles.heroImage, styles.heroImagePlaceholder]}>
              <Ionicons name="image-outline" size={64} color="#B8B8B8" />
            </View>
          )}

          <View style={styles.heroBody}>
            <Text style={styles.donationTitle}>{title}</Text>
            <Text style={styles.donorText}>{t('donationDetail.from')} {donorName}</Text>

            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{foodTypeText}</Text>
              </View>
              <View style={[styles.badge, styles.badgeMuted]}>
                <Text style={styles.badgeText}>{foodPreferenceText}</Text>
              </View>
              {distanceKm != null ? (
                <View style={[styles.badge, styles.badgeDistance]}>
                  <Text style={styles.badgeText}>{distanceKm.toFixed(1)} {t('donorList.kmAway')}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoRow icon="restaurant-outline" label={t('donationDetail.quantity')} value={quantityText} />
          <InfoRow icon="time-outline" label={t('donationDetail.expires')} value={expirationText} />
          <InfoRow icon="location-outline" label={t('donationDetail.pickupAddress')} value={addressText} />
          {status ? <InfoRow icon="flag-outline" label={t('donationDetail.status')} value={status} /> : null}
          {deliveryType ? (
            <InfoRow icon="navigate-outline" label={t('donationDetail.deliveryType')} value={deliveryTypeLabel} />
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
            ]}
            disabled={connecting}
            onPress={onPrimaryAction}
          >
            <Text style={styles.primaryBtnText}>{primaryActionLabel}</Text>
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
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color="#555" style={{ marginTop: 1 }} />
      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 28 },

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
  heroImage: { width: '100%', height: 180, backgroundColor: '#E8E8E8' },
  heroImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  heroBody: { paddingHorizontal: 12, paddingVertical: 12 },
  donationTitle: { fontSize: 17, color: '#111', fontWeight: '700' },
  donorText: { fontSize: 13, color: '#444', marginTop: 4, marginBottom: 8 },
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

  infoCard: {
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E2E2',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontSize: 12, color: '#666' },
  infoValue: { fontSize: 14, color: '#111', marginTop: 2, fontWeight: '600' },

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
});
