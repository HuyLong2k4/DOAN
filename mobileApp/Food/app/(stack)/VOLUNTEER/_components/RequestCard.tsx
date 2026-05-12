import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DeliveryRequest, TFn } from './types';

type Props = {
  item: DeliveryRequest;
  busy: boolean;
  chatBusy: boolean;
  onAccept: () => void;
  onReject: () => void;
  onOpenMap: () => void;
  onChatDonor: () => void;
  t: TFn;
};

export function RequestCard({ item, busy, chatBusy, onAccept, onReject, onOpenMap, onChatDonor, t }: Props) {
  return (
    <View style={styles.requestCard}>
      <Text style={styles.requestTitle}>{item.title}</Text>
      {item.isPreferredForYou ? (
        <View style={styles.preferredBadge}>
          <Ionicons name="sparkles" size={10} color="#008080" />
          <Text style={styles.preferredBadgeText}>{t('volunteer.preferredForYou')}</Text>
        </View>
      ) : null}
      <View style={styles.requestDivider} />

      <View style={styles.requestMetaRow}>
        <Ionicons name="restaurant-outline" size={13} color="#666" />
        <Text style={styles.requestMetaText}>{item.quantityLabel}</Text>
      </View>

      <View style={styles.requestMetaRow}>
        <Ionicons name="location-outline" size={13} color="#666" />
        <Text style={styles.requestAddress} numberOfLines={2}>{item.address}</Text>
      </View>

      <TouchableOpacity onPress={onOpenMap}>
        <Text style={styles.requestLink}>{t('volunteer.viewMore')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        disabled={chatBusy || busy}
        onPress={onChatDonor}
        style={[styles.requestChatBtn, (chatBusy || busy) && styles.disabled]}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={14} color="#006666" />
        <Text style={styles.requestChatBtnText}>
          {chatBusy ? t('volunteer.openingChat') : t('volunteer.chatWithDonor')}
        </Text>
      </TouchableOpacity>

      <View style={styles.requestActionsRow}>
        <TouchableOpacity
          disabled={busy}
          onPress={onReject}
          style={[styles.requestActionBtn, styles.rejectBtn, busy && styles.disabled]}
        >
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          disabled={busy}
          onPress={onAccept}
          style={[styles.requestActionBtn, styles.acceptBtn, busy && styles.disabled]}
        >
          <Ionicons name="checkmark" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  requestCard: {
    width: 240,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#EAEAEA',
  },
  requestTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 6 },
  preferredBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E7F1FF',
    borderColor: '#B6D4FE',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    marginBottom: 6,
  },
  preferredBadgeText: { fontSize: 10, color: '#008080', fontWeight: '700' },
  requestDivider: { height: 1, backgroundColor: '#EFEFEF', marginVertical: 6 },
  requestMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  requestMetaText: { fontSize: 12, color: '#444' },
  requestAddress: { flex: 1, fontSize: 12, color: '#444' },
  requestLink: { color: '#006666', fontSize: 12, fontWeight: '600', marginTop: 4, marginBottom: 8 },
  requestChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#E0F2F1',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  requestChatBtnText: { color: '#006666', fontSize: 12, fontWeight: '700' },
  requestActionsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  requestActionBtn: {
    flex: 1,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: { backgroundColor: '#E53935' },
  acceptBtn: { backgroundColor: '#43A047' },
  disabled: { opacity: 0.55 },
});
