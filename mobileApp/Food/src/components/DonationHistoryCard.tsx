import { Ionicons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Donation } from './DonationPostCard';
import { useStatusConfig } from './DonationPostCard';
import { useI18n } from '../i18n/useI18n';

function timeAgo(iso: string, t: any) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  if (days === 0) {
    if (hours === 0) return t('donation.justNow') || 'Just now';
    return `${hours}h ago`;
  }
  if (days === 1) return t('donation.oneDay') || '1 day ago';
  return `${days}d ago`;
}

export default function DonationHistoryCard({ d }: { d: Donation }) {
  const { t } = useI18n();
  const statusConfig = useStatusConfig();
  const cfg = statusConfig[d.status as keyof typeof statusConfig] ?? statusConfig.PENDING;

  const preferenceLabel =
    d.food_preference === 'BOTH'
      ? t('donor.foodPreference.vegAndNonVeg')
      : d.food_preference === 'VEG'
        ? t('donor.foodPreference.veg')
        : t('donor.foodPreference.nonVeg');

  return (
    <View style={styles.historyCard}>
      <View style={styles.historyInfo}>
        <View style={styles.historyTop}>
          <Text style={styles.historyId}>ID: {d._id.slice(-6).toUpperCase()}</Text>
          <Text style={styles.historyDate}>{timeAgo(d.createdAt, t)}</Text>
        </View>
        <Text style={styles.historyTitle}>{d.title}</Text>
        <View style={styles.historyTags}>
          <Text style={styles.historyTag}>{d.quantity} {d.unit}</Text>
          <Text style={styles.historyTag}>{preferenceLabel}</Text>
        </View>
        <View style={styles.historyBottom}>
          <View style={[styles.completedBadge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.completedText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <View style={styles.historyActions}>
            <Ionicons name="share-outline" size={18} color="#999" style={{ marginRight: 12 }} />
            <Ionicons name="trash-outline" size={18} color="#999" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  historyCard: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 18, borderRadius: 8, overflow: 'hidden', marginBottom: 20,  },
  historyImg: { backgroundColor: '#E0E0E0' },
  historyInfo: { flex: 1, padding: 10 },
  historyTop: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 6 },
  historyId: { fontSize: 12, color: '#888' },
  historyDate: { fontSize: 11, color: '#aaa' },
  historyTitle: { fontSize: 13, fontWeight: '600', color: '#111', marginTop: 4, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 6 },
  historyTags: { flexDirection: 'row', justifyContent:'space-between', marginTop: 6, borderBottomWidth: 1, borderBottomColor: '#ccc', paddingBottom: 6 },
  historyTag: { fontSize: 11, backgroundColor: '#F5F5F5', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, color: '#555' },
  historyBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  completedBadge: { backgroundColor: '#E8F5E9', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  completedText: { fontSize: 11, color: '#388E3C', fontWeight: '600' },
  historyActions: { flexDirection: 'row' },
});