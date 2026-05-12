import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

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
};

export const STATUS_CFG: Record<string, { bg: string; color: string; label: string; icon: string }> = {
  PENDING:   { bg: '#FFF8E1', color: '#F9A825', label: 'Your request is pending',         icon: 'time-outline'             },
  ACCEPTED:  { bg: '#E0F2F1', color: '#006666', label: 'Volunteer is on the way!',        icon: 'bicycle-outline'          },
  PICKED_UP: { bg: '#EDE7F6', color: '#4527A0', label: 'Food picked up — in transit',     icon: 'car-outline'              },
  COMPLETED: { bg: '#E8F5E9', color: '#2E7D32', label: 'Completed — thank you!',          icon: 'checkmark-circle-outline' },
  EXPIRED:   { bg: '#F5F5F5', color: '#757575', label: 'Expired — no one claimed it',    icon: 'alert-circle-outline'     },
  CANCELLED: { bg: '#FFEBEE', color: '#C62828', label: 'Cancelled',                       icon: 'close-circle-outline'     },
};

export const FOOD_TYPE_LABEL: Record<string, string> = {
  COOKED:   'Cooked Food',
  RAW:      'Fruits & Vegetables',
  FROZEN:   'Frozen food',
  PACKAGED: 'Packaged Food',
};

export default function DonationPostCard({ d }: { d: Donation }) {
  const cfg = STATUS_CFG[d.status] ?? STATUS_CFG.PENDING;
  const expDate = d.expiration_datetime
    ? new Date(d.expiration_datetime).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
  const foodTypeLabel = FOOD_TYPE_LABEL[d.food_type] ?? d.food_type;

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
          {(d.food_preference === 'VEG') && (
            <Text style={styles.postCardQty}>Veg: <Text style={styles.qtyNumber}>{d.quantity}</Text></Text>
          )}
          {(d.food_preference === 'NON_VEG') && (
            <Text style={styles.postCardQty}>Non-Veg: <Text style={styles.qtyNumber}>{d.quantity}</Text></Text>
          )}
        </View>
      </View>
      <Text style={styles.postCardExpiry}>Expiration Date: {expDate} </Text>
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        <Ionicons name={cfg.icon as any} size={16} color={cfg.color} style={{ marginRight: 8 }} />
        <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
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
});
