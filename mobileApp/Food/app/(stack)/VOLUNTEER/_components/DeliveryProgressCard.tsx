import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { TFn, VolunteerDeliveryItem } from './types';
import { roleUi } from '@/src/theme/roleUi';

type Props = {
  item: VolunteerDeliveryItem;
  busy: boolean;
  chatBusy: boolean;
  releasing: boolean;
  onOpenMap: () => void;
  onAction: () => void;
  onChatDonor: () => void;
  onRelease: () => void;
  t: TFn;
};

export function DeliveryProgressCard({
  item, busy, chatBusy, releasing, onOpenMap, onAction, onChatDonor, onRelease, t,
}: Props) {
  const isOnTheWay = item.deliveryStatus === 'ON_THE_WAY';
  // Chỉ cho release khi chưa pickup. ON_THE_WAY phải hoàn tất hoặc liên hệ hỗ trợ.
  const canRelease = item.deliveryStatus === 'AGENT_ASSIGNED';

  return (
    <View style={styles.deliveryCard}>
      <View style={styles.deliveryHeadRow}>
        <Text style={styles.deliveryTitle} numberOfLines={1}>{item.title}</Text>
        <View style={[styles.deliveryBadge, isOnTheWay ? styles.deliveryBadgeBlue : styles.deliveryBadgeOrange]}>
          <Text style={styles.deliveryBadgeText}>
            {isOnTheWay ? t('volunteer.onTheWay') : t('volunteer.assigned')}
          </Text>
        </View>
      </View>

      <Text style={styles.deliveryMeta}>{item.quantityLabel}</Text>
      <Text style={styles.deliveryMeta}>{t('volunteer.receiverPrefix')} {item.receiverName}</Text>
      <Text style={styles.deliveryMeta} numberOfLines={2}>{t('volunteer.pickupPrefix')} {item.pickupAddress}</Text>

      <View style={styles.deliveryActionRow}>
        <TouchableOpacity style={styles.deliveryMapBtn} onPress={onOpenMap} disabled={busy}>
          <Text style={styles.deliveryMapBtnText}>{t('volunteer.openMap')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.deliveryMainBtn, busy && styles.disabled]}
          onPress={onAction}
          disabled={busy}
        >
          <Text style={styles.deliveryMainBtnText}>
            {isOnTheWay ? t('volunteer.deliverDone') : t('volunteer.pickUp')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.deliveryChatBtn, (busy || chatBusy) && styles.disabled]}
        onPress={onChatDonor}
        disabled={busy || chatBusy}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={14} color={roleUi.colors.primaryStrong} />
        <Text style={styles.deliveryChatBtnText}>
          {chatBusy ? t('volunteer.openingChat') : t('volunteer.chatWithDonor')}
        </Text>
      </TouchableOpacity>

      {canRelease ? (
        <TouchableOpacity
          style={[styles.deliveryReleaseBtn, (busy || releasing) && styles.disabled]}
          onPress={onRelease}
          disabled={busy || releasing}
        >
          {releasing ? (
            <ActivityIndicator size="small" color={roleUi.colors.dangerText} />
          ) : (
            <Ionicons name="return-up-back-outline" size={14} color={roleUi.colors.dangerText} />
          )}
          <Text style={styles.deliveryReleaseBtnText}>
            {releasing ? t('volunteer.release.releasing') : t('volunteer.release.button')}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  deliveryCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  deliveryHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  deliveryTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: '#111', marginRight: 8 },
  deliveryBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  deliveryBadgeBlue: { backgroundColor: roleUi.colors.primarySoft },
  deliveryBadgeOrange: { backgroundColor: roleUi.colors.warningSoft },
  deliveryBadgeText: { fontSize: 10, fontWeight: '700', color: roleUi.colors.primaryStrong },
  deliveryMeta: { fontSize: 12, color: '#444', marginBottom: 3 },
  deliveryActionRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  deliveryMapBtn: {
    flex: 1,
    height: 34,
    borderWidth: 1,
    borderColor: roleUi.colors.primaryStrong,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryMapBtnText: { color: roleUi.colors.primaryStrong, fontSize: 12, fontWeight: '700' },
  deliveryMainBtn: {
    flex: 1.2,
    height: 34,
    borderRadius: 7,
    backgroundColor: roleUi.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryMainBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  deliveryChatBtn: {
    marginTop: 8,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#D5E0EC',
    backgroundColor: roleUi.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  deliveryChatBtnText: { color: roleUi.colors.primaryStrong, fontSize: 12, fontWeight: '700' },
  deliveryReleaseBtn: {
    marginTop: 6,
    height: 34,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#ECD7D4',
    backgroundColor: '#F7EDEC',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  deliveryReleaseBtnText: { color: roleUi.colors.dangerText, fontSize: 12, fontWeight: '700' },
  disabled: { opacity: 0.55 },
});
