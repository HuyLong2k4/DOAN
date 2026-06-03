import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useI18n } from '../i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';

export type Donation = {
  _id: string;
  title: string;
  food_type: string;
  quantity: number;
  unit: string;
  status: string;
  images: string[];
  expiration_datetime: string;
  createdAt: string;
  // VIA_AGENT only — donor đọc code cho volunteer khi gặp mặt
  pickup_code?: string | null;
  delivery_status?: string | null;
  // Release-receiver eligibility (computed server-side). selected_at = thời điểm
  // receiver connect; sau 30 phút mà chưa pickup, donor có thể release.
  selected_at?: string | null;
  release_eligible_at?: string | null;
  can_release_receiver?: boolean;
  release_state?: 'waiting' | 'stale' | 'in_progress' | 'finalized' | 'no_receiver' | null;
  // True nếu donation được tạo từ FoodRequest (donor accept) — UI hiển thị
  // text "Huỷ đơn & mở lại request" thay vì "Giải phóng receiver".
  from_food_request?: boolean;
};

export function useStatusConfig() {
  const { t } = useI18n();

  return {
    PENDING:   { bg: roleUi.colors.warningSoft, color: roleUi.colors.warning, label: t('receiver.pending'),         icon: 'time-outline'             },
    ACCEPTED:  { bg: roleUi.colors.primarySoft, color: roleUi.colors.primaryStrong, label: t('donation.status.volunteerOnWay'),        icon: 'bicycle-outline'          },
    PICKED_UP: { bg: '#EDE7F6', color: '#4527A0', label: t('donation.status.inTransit'),     icon: 'car-outline'              },
    COMPLETED: { bg: roleUi.colors.successSoft, color: roleUi.colors.successText, label: t('donation.status.completed'),          icon: 'checkmark-circle-outline' },
    EXPIRED:   { bg: '#F5F5F5', color: '#666666', label: t('donation.status.expired'),    icon: 'alert-circle-outline'     },
    CANCELLED: { bg: roleUi.colors.dangerSoft, color: roleUi.colors.dangerText, label: t('receiver.cancelled'),                       icon: 'close-circle-outline'     },
  };
}

export const STATUS_CFG: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  PENDING:   { bg: roleUi.colors.warningSoft, color: roleUi.colors.warning, label: 'Your request is pending',         icon: 'time-outline'             },
  ACCEPTED:  { bg: roleUi.colors.primarySoft, color: roleUi.colors.primaryStrong, label: 'Volunteer is on the way!',        icon: 'bicycle-outline'          },
  PICKED_UP: { bg: '#EDE7F6', color: '#4527A0', label: 'Food picked up — in transit',     icon: 'car-outline'              },
  COMPLETED: { bg: roleUi.colors.successSoft, color: roleUi.colors.successText, label: 'Completed — thank you!',          icon: 'checkmark-circle-outline' },
  EXPIRED:   { bg: '#F5F5F5', color: '#666666', label: 'Expired — no one claimed it',    icon: 'alert-circle-outline'     },
  CANCELLED: { bg: roleUi.colors.dangerSoft, color: roleUi.colors.dangerText, label: 'Cancelled',                       icon: 'close-circle-outline'     },
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

type DonationPostCardProps = {
  d: Donation;
  onCancel?: (donationId: string) => void;
  cancelling?: boolean;
  onReleaseReceiver?: (donationId: string) => void;
  releasing?: boolean;
};

export default function DonationPostCard({ d, onCancel, cancelling, onReleaseReceiver, releasing }: DonationPostCardProps) {
  const { t } = useI18n();
  const statusConfig = useStatusConfig();
  const cfg = statusConfig[d.status as keyof typeof statusConfig] ?? statusConfig.PENDING;
  const expDate = d.expiration_datetime
    ? new Date(d.expiration_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const foodTypeLabel = getFoodTypeLabel(t, d.food_type);

  // Tick mỗi 30s để remaining-time tự update khi đang đếm ngược.
  const [, forceTick] = useState(0);
  useEffect(() => {
    if (d.release_state !== 'waiting') return;
    const id = setInterval(() => forceTick((n) => n + 1), 30 * 1000);
    return () => clearInterval(id);
  }, [d.release_state]);

  // Donor huỷ cả đơn: chỉ khi PENDING + chưa có receiver connect.
  const canCancel = Boolean(onCancel) && d.status === 'PENDING' && !d.selected_at;
  const showWaitingHint = d.release_state === 'waiting' && d.release_eligible_at;
  const showStaleHint = d.release_state === 'stale' && d.can_release_receiver;
  const canRelease = Boolean(onReleaseReceiver) && Boolean(d.can_release_receiver);

  const minutesSinceSelected = d.selected_at
    ? Math.max(0, Math.floor((Date.now() - new Date(d.selected_at).getTime()) / 60000))
    : null;
  const minutesUntilEligible = d.release_eligible_at
    ? Math.max(0, Math.ceil((new Date(d.release_eligible_at).getTime() - Date.now()) / 60000))
    : null;

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
          <Text style={styles.postCardQty}>{t('donor.qty.label')}: <Text style={styles.qtyNumber}>{d.quantity} {d.unit || t('donor.portion')}</Text></Text>
        </View>
      </View>
      <Text style={styles.postCardExpiry}>{t('receiver.neededBefore')}: {expDate} </Text>
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={16} color={cfg.color} style={{ marginRight: 8 }} />
        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      {d.pickup_code && (d.delivery_status === 'AGENT_ASSIGNED' || d.delivery_status === 'SELF_PICKUP_READY') ? (
        <View style={styles.pickupCodeBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pickupCodeLabel}>{t('donor.pickupCode.title')}</Text>
            <Text style={styles.pickupCodeHint}>
              {d.delivery_status === 'SELF_PICKUP_READY'
                ? t('donor.pickupCode.hintSelfPickup')
                : t('donor.pickupCode.hint')}
            </Text>
          </View>
          <Text style={styles.pickupCodeValue}>{d.pickup_code}</Text>
        </View>
      ) : null}

      {showWaitingHint ? (
        <View style={styles.waitingHintBox}>
          <Ionicons name="hourglass-outline" size={16} color="#7C5300" />
          <View style={{ flex: 1 }}>
            <Text style={styles.waitingHintTitle}>{t('donor.releaseReceiver.waitingTitle')}</Text>
            <Text style={styles.waitingHintBody}>
              {minutesSinceSelected != null
                ? `${t('donor.releaseReceiver.connectedAtPrefix')} ${minutesSinceSelected} ${t('donor.releaseReceiver.minutesShort')} • `
                : ''}
              {minutesUntilEligible != null
                ? `${t('donor.releaseReceiver.eligibleInPrefix')} ${minutesUntilEligible} ${t('donor.releaseReceiver.minutesShort')}`
                : ''}
            </Text>
          </View>
        </View>
      ) : null}

      {showStaleHint ? (
        <View style={styles.staleHintBox}>
          <Ionicons name="alert-circle" size={16} color={roleUi.colors.dangerText} />
          <View style={{ flex: 1 }}>
            <Text style={styles.staleHintTitle}>{t('donor.releaseReceiver.staleTitle')}</Text>
            <Text style={styles.staleHintBody}>
              {d.from_food_request
                ? t('donor.releaseReceiver.fromRequestStaleMessage')
                : t('donor.releaseReceiver.staleMessage')}
            </Text>
          </View>
        </View>
      ) : null}

      {canRelease ? (
        <TouchableOpacity
          style={[styles.releaseBtn, releasing && styles.cancelBtnDisabled]}
          onPress={() => onReleaseReceiver?.(d._id)}
          disabled={releasing}
        >
          {releasing ? (
            <ActivityIndicator color="#A9772E" size="small" />
          ) : (
            <Ionicons
              name={d.from_food_request ? 'close-circle-outline' : 'person-remove-outline'}
              size={16}
              color="#A9772E"
              style={{ marginRight: 6 }}
            />
          )}
          <Text style={styles.releaseBtnText}>
            {releasing
              ? t('donor.releaseReceiver.releasing')
              : d.from_food_request
                ? t('donor.releaseReceiver.fromRequestButton')
                : t('donor.releaseReceiver.button')}
          </Text>
        </TouchableOpacity>
      ) : null}

      {canCancel ? (
        <TouchableOpacity
          style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
          onPress={() => onCancel?.(d._id)}
          disabled={cancelling}
        >
          {cancelling ? (
            <ActivityIndicator color={roleUi.colors.dangerText} size="small" />
          ) : (
            <Ionicons name="close-circle-outline" size={16} color={roleUi.colors.dangerText} style={{ marginRight: 6 }} />
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
    borderColor: '#ECD7D4',
    backgroundColor: '#F7EDEC',
  },
  cancelBtnDisabled: { opacity: 0.55 },
  cancelBtnText:    { color: roleUi.colors.dangerText, fontSize: 13, fontWeight: '600' },
  releaseBtn:       {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECDCC0',
    backgroundColor: roleUi.colors.warningSoft,
  },
  releaseBtnText:   { color: '#A9772E', fontSize: 13, fontWeight: '700' },
  pickupCodeBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECDCC0',
    backgroundColor: roleUi.colors.warningSoft,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickupCodeLabel: { fontSize: 12, fontWeight: '700', color: '#A9772E', textTransform: 'uppercase', letterSpacing: 0.4 },
  pickupCodeHint:  { fontSize: 11, color: '#7C5300', marginTop: 2 },
  pickupCodeValue: { fontSize: 26, fontWeight: '800', color: '#A9772E', letterSpacing: 4, fontVariant: ['tabular-nums'] },

  waitingHintBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECDCC0',
    backgroundColor: roleUi.colors.warningSoft,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  waitingHintTitle: { fontSize: 12, fontWeight: '700', color: '#7C5300' },
  waitingHintBody:  { fontSize: 11, color: '#7C5300', marginTop: 2, lineHeight: 15 },

  staleHintBox: {
    marginTop: 10,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ECD7D4',
    backgroundColor: '#F7EDEC',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  staleHintTitle: { fontSize: 12, fontWeight: '700', color: roleUi.colors.dangerText },
  staleHintBody:  { fontSize: 11, color: roleUi.colors.dangerText, marginTop: 2, lineHeight: 15 },
});
