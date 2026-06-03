import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http } from '../../../src/api/http';
import { useI18n } from '../../../src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';

interface DeliveredOrder {
  _id: string;
  title: string;
  quantity?: number;
  unit?: string;
  status?: string;
  receiver_name?: string | null;
  delivered_at?: string;
}

export default function VolunteerDeliveryHistoryScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [search, setSearch] = useState('');
  const [orders, setOrders] = useState<DeliveredOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadOrders = useCallback(async (isPullToRefresh = false) => {
    try {
      setError('');
      if (isPullToRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await http.get('/food-donations/volunteer/delivered');
      const list: DeliveredOrder[] = Array.isArray(res.data?.data) ? res.data.data : [];
      setOrders(list);
    } catch (err: any) {
      setError(err?.response?.data?.message || t('volunteer.history.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return orders;
    return orders.filter((d) => {
      const idPart = d._id ? d._id.slice(-6).toLowerCase() : '';
      return (
        (d.title || '').toLowerCase().includes(keyword)
        || (d.receiver_name || '').toLowerCase().includes(keyword)
        || idPart.includes(keyword)
      );
    });
  }, [orders, search]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('volunteer.history.title')}</Text>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search-outline" size={18} color="#777" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder={t('volunteer.history.searchPlaceholder')}
          placeholderTextColor="#9e9e9e"
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={roleUi.colors.primary} />
          <Text style={styles.stateText}>{t('volunteer.history.loading')}</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadOrders(true)} tintColor={roleUi.colors.primary} />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {error ? (
            <View style={styles.messageCard}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => loadOrders()}>
                <Text style={styles.retryBtnText}>{t('volunteer.history.tryAgain')}</Text>
              </TouchableOpacity>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.messageCard}>
              <Text style={styles.emptyText}>
                {search.trim() ? t('volunteer.history.noMatch') : t('volunteer.history.noYet')}
              </Text>
            </View>
          ) : (
            filtered.map((d) => {
              const metaParts: string[] = [];
              if (d.receiver_name) metaParts.push(`${t('volunteer.history.toReceiver')} ${d.receiver_name}`);
              if (d.quantity != null) metaParts.push(`${d.quantity} ${d.unit || ''}`.trim());
              return (
                <TouchableOpacity
                  key={d._id}
                  style={styles.card}
                  activeOpacity={0.7}
                  onPress={() => router.push({
                    pathname: '/(stack)/VOLUNTEER/deliveryDetail',
                    params: { donationId: d._id },
                  } as any)}
                >
                  <View style={styles.cardIcon}>
                    <Ionicons name="bicycle-outline" size={20} color={roleUi.colors.info} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{d.title}</Text>
                    {metaParts.length > 0 && (
                      <Text style={styles.cardMeta} numberOfLines={1}>{metaParts.join('  ·  ')}</Text>
                    )}
                    {d.delivered_at ? (
                      <Text style={styles.cardDate}>{new Date(d.delivered_at).toLocaleDateString(locale)}</Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#BBB" />
                </TouchableOpacity>
              );
            })
          )}
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
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 18,
    marginTop: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },
  list: { flex: 1 },
  listContent: { paddingTop: 6, paddingBottom: 20 },
  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  stateText: { color: '#666', fontSize: 13 },
  messageCard: {
    marginHorizontal: 18,
    marginTop: 18,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: '#555', textAlign: 'center' },
  errorText: { fontSize: 14, color: roleUi.colors.dangerText, textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: roleUi.colors.primarySoft, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  retryBtnText: { color: roleUi.colors.primaryStrong, fontWeight: '600' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    padding: 12,
    marginHorizontal: 18,
    marginBottom: 10,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: roleUi.colors.infoSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  cardMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  cardDate: { fontSize: 11, color: '#999', marginTop: 2 },
});
