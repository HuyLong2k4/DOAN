import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../i18n/useI18n';

export type Donation = {
  _id: string;
  title: string;
  food_type: string;
  food_preference: string;
  quantity: number;
  unit: string;
  status: string;
  images: string[];
  expiration_datetime: string;
  createdAt: string;
  // VIA_AGENT only — donor đọc code cho volunteer khi gặp mặt
  pickup_code?: string | null;
  delivery_status?: string | null;
};

export function useStatusConfig() {
  const { t } = useI18n();

  return {
    PENDING:   { bg: '#FFF8E1', color: '#F9A825', label: t('receiver.pending'),         icon: 'time-outline'             },
    ACCEPTED:  { bg: '#E0F2F1', color: '#006666', label: t('donation.status.volunteerOnWay'),        icon: 'bicycle-outline'          },
    PICKED_UP: { bg: '#EDE7F6', color: '#4527A0', label: t('donation.status.inTransit'),     icon: 'car-outline'              },
    COMPLETED: { bg: '#E8F5E9', color: '#2E7D32', label: t('donation.status.completed'),          icon: 'checkmark-circle-outline' },
    EXPIRED:   { bg: '#F5F5F5', color: '#757575', label: t('donation.status.expired'),    icon: 'alert-circle-outline'     },
    CANCELLED: { bg: '#FFEBEE', color: '#C62828', label: t('receiver.cancelled'),                       icon: 'close-circle-outline'     },
  };
}

export const STATUS_CFG: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  PENDING:   { bg: '#FFF8E1', color: '#F9A825', label: 'Your request is pending',         icon: 'time-outline'             },
  ACCEPTED:  { bg: '#E0F2F1', color: '#006666', label: 'Volunteer is on the way!',        icon: 'bicycle-outline'          },
  PICKED_UP: { bg: '#EDE7F6', color: '#4527A0', label: 'Food picked up — in transit',     icon: 'car-outline'              },
  COMPLETED: { bg: '#E8F5E9', color: '#2E7D32', label: 'Completed — thank you!',          icon: 'checkmark-circle-outline' },
  EXPIRED:   { bg: '#F5F5F5', color: '#757575', label: 'Expired — no one claimed it',    icon: 'alert-circle-outline'     },
  CANCELLED: { bg: '#FFEBEE', color: '#C62828', label: 'Cancelled',                       icon: 'close-circle-outline'     },
};

function getFoodTypeLabel(t: any, foodType: string): string {
  const labels: Record<string, string> = {
    COOKED:   t('donor.donate.cookedFood'),
    RAW:      t('donor.donate.fruitsVegetables'),
    FROZEN:   t('donor.donate.frozenFood'),
    PACKAGED: t('donor.donate.packagedFood'),
  };
  return labels[foodType] ?? foodType;
}

function getPreferenceLabel(t: any, pref: string): string {
  if (pref === 'VEG') return t('donor.foodPreference.veg');
  if (pref === 'NON_VEG') return t('donor.foodPreference.nonVeg');
  if (pref === 'BOTH') return t('donor.foodPreference.vegAndNonVeg');
  return pref;
}

type DonationPostCardProps = {
  d: Donation;
  onCancel?: (donationId: string) => void;
  cancelling?: boolean;
};

export default function DonationPostCard({ d, onCancel, cancelling }: DonationPostCardProps) {
  const { t } = useI18n();
  const statusConfig = useStatusConfig();
  const cfg = statusConfig[d.status as keyof typeof statusConfig] ?? statusConfig.PENDING;
  const expDate = d.expiration_datetime
    ? new Date(d.expiration_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const foodTypeLabel = getFoodTypeLabel(t, d.food_type);
  const preferenceLabel = getPreferenceLabel(t, d.food_preference);
  // Donor chỉ huỷ được khi đơn còn PENDING (chưa có ai pickup).
  const canCancel = Boolean(onCancel) && d.status === 'PENDING';

  return (
    <View style={styles.postCard}>
      <Text style={styles.postCardName}>{d.title}</Text>
      <View style={styles.postCardRow}>
        {d.images[0] ? (
          <Image source={{ uri: d.images[0] }} style={styles.postCardImg} />
        ) : (
          <View style={[styles.postCardImg, styles.postCardImgEmpty]}>
            <Ionicons name="camera-outline" size={24} color="#bbb" />
          </View>
        )}

        <View style={styles.infoMiddle}>
          <Text style={styles.postCardFoodType}>{foodTypeLabel}</Text>
        </View>
        <View style={styles.postCardQtyBox}>
          <Text style={styles.postCardQty}>{preferenceLabel}: <Text style={styles.qtyNumber}>{d.quantity}</Text></Text>
        </View>
      </View>
      <Text style={styles.postCardExpiry}>{t('receiver.neededBefore')}: {expDate} </Text>
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={16} color={cfg.color} style={{ marginRight: 8 }} />
        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      {d.pickup_code && d.delivery_status === 'AGENT_ASSIGNED' ? (
        <View style={styles.pickupCodeBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickupCodeLabel}>{t('donor.pickupCode.title')}</Text>
            <Text style={styles.pickupCodeHint}>{t('donor.pickupCode.hint')}</Text>
          </View>
          <Text style={styles.pickupCodeValue}>{d.pickup_code}</Text>
        </View>
      ) : null}

      {canCancel ? (
        <TouchableOpacity
          style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
          onPress={() => onCancel?.(d._id)}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color="#C62828" size="small" />
          ) : (
            <Ionicons name="close-circle-outline" size={16} color="#C62828" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.cancelBtnText}>
            {cancelling ? t('donor.cancel.cancelling') : t('donor.cancel.button')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  postCard:         { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#F0F0F0' },
  postCardName:     { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 12 },
  postCardRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postCardImg:      { width: 62, height: 62, borderRadius: 6, borderWidth: 1, borderColor: '#E0E0E0' },
  infoMiddle:       { flex: 1, marginLeft: 12, justifyContent: 'center' },
  postCardImgEmpty: { backgroundColor: '#F5F5F5', justifyContent: 'center' as const, alignItems: 'center' as const },
  postCardFoodType: { fontSize: 15, fontWeight: '400', color: '#333' },
  postCardQtyBox:   { paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#333', justifyContent: 'center', flex: 1 },
  postCardQty:      { fontSize: 15, color: '#555', fontWeight: '500', paddingLeft: 'auto' },
  qtyNumber:        { fontWeight: '500', marginLeft: 'auto' },
  postCardExpiry:   { fontSize: 12, color: '#555', marginBottom: 10 },
  statusBadge:      { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 16 },
  statusText:       { fontSize: 13, fontWeight: '600' },
  cancelBtn:        {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    backgroundColor: '#FFF5F5',
  },
  cancelBtnDisabled: { opacity: 0.55 },
  cancelBtnText:    { color: '#C62828', fontSize: 13, fontWeight: '600' },
  pickupCodeBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    backgroundColor: '#FFF8E1',
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupCodeLabel: { fontSize: 12, fontWeight: '700', color: '#E65100', textTransform: 'uppercase', letterSpacing: 0.4 },
  pickupCodeHint:  { fontSize: 11, color: '#7C5300', marginTop: 2 },
  pickupCodeValue: { fontSize: 26, fontWeight: '800', color: '#E65100', letterSpacing: 4, fontVariant: ['tabular-nums'] },
});
