import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http } from '../../../src/api/http';
import { useI18n } from '../../../src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';

interface Party {
  full_name: string;
  phone_number?: string | null;
  address_line?: string | null;
  city?: string | null;
}

interface DeliveryDetail {
  donation: { id: string; title: string; status?: string; quantity?: number; unit?: string; food_type?: string };
  delivery: { status?: string; assigned_at?: string | null; picked_up_at?: string | null; delivered_at?: string | null } | null;
  donor: Party;
  receiver: Party | null;
}

export default function VolunteerDeliveryDetailScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { donationId } = useLocalSearchParams<{ donationId: string }>();

  const [detail, setDetail] = useState<DeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!donationId) return;
    try {
      setError('');
      setLoading(true);
      const res = await http.get(`/food-donations/${donationId}/volunteer-delivery`);
      setDetail(res.data?.data ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('volunteer.deliveryDetail.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [donationId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(locale) : null);

  const callPhone = (phone?: string | null) => {
    if (phone) void Linking.openURL(`tel:${phone}`);
  };

  const renderParty = (label: string, party: Party | null, showAddress = false) => {
    if (!party) return null;
    const address = [party.address_line, party.city].filter(Boolean).join(', ');
    return (
      <View style={styles.card}>
        <Text style={styles.cardLabel}>{label}</Text>
        <View style={styles.partyRow}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={20} color="#999" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.partyName}>{party.full_name}</Text>
            {party.phone_number ? (
              <TouchableOpacity onPress={() => callPhone(party.phone_number)} activeOpacity={0.7}>
                <Text style={styles.partyPhone}>
                  <Ionicons name="call-outline" size={12} color={roleUi.colors.primary} /> {party.phone_number}
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.partyMuted}>{t('volunteer.deliveryDetail.noPhone')}</Text>
            )}
          </View>
        </View>
        {showAddress && (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={14} color="#777" />
            <Text style={styles.addressText}>
              {address || t('volunteer.deliveryDetail.noAddress')}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const timelineRow = (label: string, iso?: string | null) => {
    const time = fmt(iso);
    return (
      <View style={styles.timelineRow}>
        <View style={[styles.timelineDot, time ? styles.timelineDotActive : null]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.timelineLabel}>{label}</Text>
          {time ? <Text style={styles.timelineTime}>{time}</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('volunteer.deliveryDetail.title')}</Text>
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={roleUi.colors.primary} />
        </View>
      ) : error || !detail ? (
        <View style={styles.centerState}>
          <Text style={styles.errorText}>{error || t('volunteer.deliveryDetail.loadFailed')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void load()}>
            <Text style={styles.retryBtnText}>{t('volunteer.history.tryAgain')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.orderTitle}>{detail.donation.title}</Text>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color={roleUi.colors.successText} />
              <Text style={styles.badgeText}>{t('volunteer.deliveryDetail.completed')}</Text>
            </View>
            {detail.donation.quantity != null && (
              <Text style={styles.orderMeta}>
                {t('volunteer.deliveryDetail.quantity')}: {detail.donation.quantity} {detail.donation.unit || ''}
              </Text>
            )}
          </View>

          {renderParty(t('volunteer.deliveryDetail.donor'), detail.donor, true)}
          {renderParty(t('volunteer.deliveryDetail.receiver'), detail.receiver)}

          <View style={styles.card}>
            <Text style={styles.cardLabel}>{t('volunteer.deliveryDetail.timeline')}</Text>
            {timelineRow(t('volunteer.deliveryDetail.assignedAt'), detail.delivery?.assigned_at)}
            {timelineRow(t('volunteer.deliveryDetail.pickedUpAt'), detail.delivery?.picked_up_at)}
            {timelineRow(t('volunteer.deliveryDetail.deliveredAt'), detail.delivery?.delivered_at)}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  headerTitle: { fontSize: 19, fontWeight: '700', color: '#111' },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },
  errorText: { fontSize: 14, color: roleUi.colors.dangerText, textAlign: 'center' },
  retryBtn: { backgroundColor: roleUi.colors.primarySoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  retryBtnText: { color: roleUi.colors.primaryStrong, fontWeight: '600' },
  content: { padding: 18, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 16,
    marginBottom: 14,
  },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#888', marginBottom: 10, textTransform: 'uppercase' },
  orderTitle: { fontSize: 18, fontWeight: '700', color: '#111', marginBottom: 8 },
  orderMeta: { fontSize: 13, color: '#555', marginTop: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: roleUi.colors.successSoft,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '600', color: roleUi.colors.successText },
  partyRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  partyName: { fontSize: 15, fontWeight: '700', color: '#111' },
  partyPhone: { fontSize: 13, color: roleUi.colors.primary, marginTop: 4 },
  partyMuted: { fontSize: 13, color: '#999', marginTop: 4 },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 12 },
  addressText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 14 },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#DDD',
    marginTop: 3,
  },
  timelineDotActive: { backgroundColor: roleUi.colors.primary },
  timelineLabel: { fontSize: 14, color: '#111', fontWeight: '600' },
  timelineTime: { fontSize: 12, color: '#888', marginTop: 2 },
});
