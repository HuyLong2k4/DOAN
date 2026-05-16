import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http } from '../../../src/api/http';
import { useI18n } from '../../../src/i18n/useI18n';

type DeliveryType = 'VIA_AGENT' | 'SELF_PICKUP';

export default function ReceiverAddPickupScreen() {
  const router = useRouter();
  const { t }  = useI18n();
  const params = useLocalSearchParams<{ donationId?: string | string[]; title?: string | string[] }>();

  const donationId = useMemo(
    () => (Array.isArray(params.donationId) ? params.donationId[0] : params.donationId) || '',
    [params.donationId],
  );

  const title = useMemo(
    () => (Array.isArray(params.title) ? params.title[0] : params.title) || 'Donation',
    [params.title],
  );

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('VIA_AGENT');
  const [loading, setLoading] = useState(false);

  const onConfirm = async () => {
    if (!donationId) {
      Alert.alert(t('receiver.missingDonationTitle'), t('donationDetail.cannotDetermineMsg'));
      return;
    }

    try {
      setLoading(true);
      // Auto-match: chỉ gửi delivery_type, server tự broadcast cho volunteer
      // gần đơn. Ai accept trước thì thắng.
      const res = await http.patch(`/food-donations/${donationId}/receiver-delivery-choice`, {
        delivery_type: deliveryType,
      });

      const deliveryId = res.data?.delivery?._id || res.data?.delivery?.id || '';
      router.replace({
        pathname: '/(stack)/RECEIVER/tracking',
        params: {
          donationId,
          title,
          deliveryType,
          deliveryId,
        },
      } as any);
    } catch (err: any) {
      Alert.alert(t('addPickup.cannotContinue'), err?.response?.data?.message || t('receiver.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{t('addPickup.title')}</Text>

        <Text style={styles.sectionTitle}>{t('addPickup.selectDeliveryType')}</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.optionBtn, deliveryType === 'VIA_AGENT' && styles.optionBtnActive]}
            onPress={() => setDeliveryType('VIA_AGENT')}
            activeOpacity={0.85}
          >
            <Text style={[styles.optionText, deliveryType === 'VIA_AGENT' && styles.optionTextActive]}>{t('donor.delivery.viaAgent')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionBtn, deliveryType === 'SELF_PICKUP' && styles.optionBtnActive]}
            onPress={() => setDeliveryType('SELF_PICKUP')}
            activeOpacity={0.85}
          >
            <Text style={[styles.optionText, deliveryType === 'SELF_PICKUP' && styles.optionTextActive]}>{t('donor.delivery.selfPickup')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.estimateWrap}>
          <Text style={styles.estimateText}>
            {deliveryType === 'VIA_AGENT' ? t('addPickup.estimateAgent') : t('addPickup.estimateSelf')}
          </Text>
        </View>

        <View style={styles.approvedBox}>
          <View style={styles.approvedIconCircle}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </View>
          <View style={styles.approvedTextWrap}>
            <Text style={styles.approvedMainText}>{t('addPickup.requestApproved')}</Text>
            <Text style={styles.approvedSubText} numberOfLines={2}>{title}</Text>
            <View style={styles.approvedDivider} />
            <Text style={styles.approvedFooterText}>
              {deliveryType === 'VIA_AGENT' ? t('addPickup.selectAgentHint') : t('addPickup.selfPickupHint')}
            </Text>
          </View>
        </View>

        {deliveryType === 'VIA_AGENT' ? (
          <View style={styles.autoMatchCard}>
            <Ionicons name="sparkles-outline" size={20} color="#006666" />
            <View style={{ flex: 1 }}>
              <Text style={styles.autoMatchTitle}>{t('addPickup.autoMatchTitle')}</Text>
              <Text style={styles.autoMatchHint}>{t('addPickup.autoMatchHint')}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.selfPickupCard}>
            <Ionicons name="walk-outline" size={18} color="#006666" />
            <Text style={styles.selfPickupText}>{t('addPickup.selfPickupInfo')}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
          onPress={onConfirm}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>{t('volunteer.confirm')}</Text>}
        </TouchableOpacity>

        <Text style={styles.bottomHint}>{t('addPickup.currentDonation')} {title}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFEFEF' },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    marginBottom: 2,
  },
  headerTitle: { fontSize: 29, color: '#111', fontWeight: '700', marginBottom: 12 },
  sectionTitle: { fontSize: 22, color: '#111', fontWeight: '400', marginBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  optionBtn: {
    flex: 1,
    backgroundColor: '#CFCFD1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  optionBtnActive: { backgroundColor: '#008080' },
  optionText: { fontSize: 18, color: '#222', fontWeight: '500' },
  optionTextActive: { color: '#fff' },
  estimateWrap: {
    borderTopWidth: 1,
    borderTopColor: '#CFCFCF',
    paddingTop: 10,
    marginBottom: 10,
  },
  estimateText: {
    fontSize: 16,
    color: '#606060',
    textAlign: 'center',
  },
  approvedBox: {
    backgroundColor: '#EAF9EB',
    borderWidth: 1,
    borderColor: '#5EC45E',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 14,
  },
  approvedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  approvedTextWrap: { flex: 1, marginLeft: 10 },
  approvedMainText: { fontSize: 14, color: '#1E1E1E', fontWeight: '600' },
  approvedSubText: { fontSize: 14, color: '#1E1E1E', marginTop: 2 },
  approvedDivider: { height: 1, backgroundColor: '#BFDDBF', marginTop: 10, marginBottom: 8 },
  approvedFooterText: { fontSize: 13, color: '#2D2D2D' },
  selfPickupCard: {
    backgroundColor: '#E8F1FF',
    borderWidth: 1,
    borderColor: '#C8DCF9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  selfPickupText: { flex: 1, color: '#006666', fontSize: 13, lineHeight: 18 },
  autoMatchCard: {
    backgroundColor: '#E0F2F1',
    borderWidth: 1,
    borderColor: '#B2DFDB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  autoMatchTitle: { fontSize: 14, color: '#006666', fontWeight: '700', marginBottom: 4 },
  autoMatchHint: { fontSize: 13, color: '#1F2937', lineHeight: 18 },
  confirmBtn: {
    marginTop: 14,
    backgroundColor: '#008080',
    borderRadius: 0,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.65 },
  confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bottomHint: {
    marginTop: 10,
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
});
