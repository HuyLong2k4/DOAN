import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getNearbyNgos, NearbyNgoItem } from '../../../src/api/profile.api';
import { useI18n } from '../../../src/i18n/useI18n';

type Tab = 'near' | 'popular';

export default function NgoListScreen() {
  const router = useRouter();
  const { t }  = useI18n();
  const [tab, setTab]       = useState<Tab>('near');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [ngos, setNgos] = useState<NearbyNgoItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        try {
          setLoading(true);
          const res = await getNearbyNgos(50);
          if (!active) return;
          setNgos(res.data.data.ngos ?? []);
        } catch {
          if (active) setNgos([]);
        } finally {
          if (active) setLoading(false);
        }
      })();

      return () => { active = false; };
    }, [])
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    const searched = ngos.filter((n) =>
      n.name.toLowerCase().includes(query) ||
      n.city.toLowerCase().includes(query) ||
      n.address_line.toLowerCase().includes(query),
    );

    if (tab === 'popular') {
      return [...searched].sort((a, b) => (b.points ?? 0) - (a.points ?? 0));
    }

    return [...searched].sort((a, b) => {
      if (a.distance_km == null && b.distance_km == null) return a.name.localeCompare(b.name);
      if (a.distance_km == null) return 1;
      if (b.distance_km == null) return -1;
      return a.distance_km - b.distance_km;
    });
  }, [ngos, search, tab]);

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('ngoList.title')}</Text>
      </View>

      {/* ── Search Bar ── */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('ngoList.searchPlaceholder')}
          placeholderTextColor="#aaa"
          value={search}
          onChangeText={setSearch}
        />
        <Ionicons name="search-outline" size={20} color="#aaa" />
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'near' && styles.tabActive]}
          onPress={() => setTab('near')}
        >
          <Text style={[styles.tabText, tab === 'near' && styles.tabTextActive]}>{t('ngoList.nearMe')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'popular' && styles.tabActive]}
          onPress={() => setTab('popular')}
        >
          <Text style={[styles.tabText, tab === 'popular' && styles.tabTextActive]}>{t('ngoList.byPopularity')}</Text>
        </TouchableOpacity>
      </View>

      {/* ── NGO Cards ── */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#008080" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{t('ngoList.noNgos')}</Text>
            </View>
          ) : (
            filtered.map((ngo) => (
              <View key={ngo.id} style={styles.card}>
                <View style={styles.imgPlaceholder}>
                  <Ionicons name="image-outline" size={44} color="#bbb" />
                </View>

                <Text style={styles.ngoName}>{ngo.name}</Text>

                <View style={styles.infoRow}>
                  <View style={styles.infoLeft}>
                    <Ionicons name="location-outline" size={13} color="#888" />
                    <Text style={styles.infoText} numberOfLines={1}>
                      {[ngo.address_line, ngo.city].filter(Boolean).join(', ') || t('ngoList.addressNotAvailable')}
                    </Text>
                  </View>
                  <Text style={styles.requireText}>
                    {tab === 'popular'
                      ? `${ngo.points ?? 0} pts`
                      : ngo.distance_km != null
                        ? `${ngo.distance_km.toFixed(1)} km`
                        : t('ngoList.unknownDistance')}
                  </Text>
                </View>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.detailsBtn}>
                    <Text style={styles.detailsBtnText}>{t('ngoList.viewDetails')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.donateBtn}>
                    <Text style={styles.donateBtnText}>{t('ngoList.donate')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  header:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 10, gap: 12 },
  backBtn:        { padding: 2 },
  headerTitle:    { fontSize: 22, fontWeight: '800', color: '#111' },
  searchWrapper:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, paddingHorizontal: 14, height: 44 },
  searchInput:    { flex: 1, fontSize: 14, color: '#111' },
  tabs:           { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', marginHorizontal: 16, marginBottom: 12 },
  tab:            { paddingVertical: 10, marginRight: 24 },
  tabActive:      { borderBottomWidth: 2, borderBottomColor: '#111' },
  tabText:        { fontSize: 14, color: '#999' },
  tabTextActive:  { color: '#111', fontWeight: '700' },
  loadingWrap:     { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list:           { paddingHorizontal: 16, paddingBottom: 32 },
  emptyWrap:      { paddingVertical: 36, alignItems: 'center' },
  emptyText:      { fontSize: 14, color: '#999' },
  card:           { marginBottom: 24 },
  imgPlaceholder: { width: '100%', height: 150, backgroundColor: '#E0E0E0', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  ngoName:        { fontSize: 18, fontWeight: '800', color: '#111', marginBottom: 8 },
  infoRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  infoLeft:       { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  infoText:       { fontSize: 12, color: '#888', marginLeft: 3, flex: 1 },
  requireText:    { fontSize: 12, color: '#888', textAlign: 'right', marginLeft: 8 },
  btnRow:         { flexDirection: 'row', gap: 10 },
  detailsBtn:     { flex: 1, height: 40, borderWidth: 1, borderColor: '#bbb', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  detailsBtnText: { fontSize: 14, color: '#333', fontWeight: '500' },
  donateBtn:      { flex: 1, height: 40, backgroundColor: '#008080', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  donateBtnText:  { fontSize: 14, color: '#fff', fontWeight: '600' },
  notifyBtn:      { flex: 1, height: 40, borderWidth: 1, borderColor: '#bbb', borderRadius: 6, justifyContent: 'center', alignItems: 'center' },
  notifyBtnText:  { fontSize: 14, color: '#333', fontWeight: '500' },
});
