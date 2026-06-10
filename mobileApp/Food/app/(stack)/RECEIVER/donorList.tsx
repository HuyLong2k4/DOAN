import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Image,
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
import type { TranslationKey } from '../../../src/i18n/translations';
import { useI18n } from '../../../src/i18n/useI18n';
import { useAuthStore } from '../../../src/store/authStore';
import { getCurrentGps } from '../../../src/utils/location';
import { roleUi } from '@/src/theme/roleUi';
import { ScreenHeader } from '@/src/components/ScreenHeader';

type TFn = (key: TranslationKey) => string;

type CategoryTab = 'all' | 'near';

type FoodType = 'COOKED' | 'RAW' | 'FROZEN' | 'PACKAGED';

type DonationItem = {
  _id: string;
  title: string;
  status?: string;
  quantity?: number;
  unit?: string;
  food_type?: FoodType;
  expiration_datetime?: string;
  pickup_distance_km?: number | null;
  pickup_address_line?: string | null;
  pickup_city?: string | null;
  pickup_latitude?: number | null;
  pickup_longitude?: number | null;
  donor_id?: {
    full_name?: string;
  };
  selected_receiver_id?: string | { _id?: string } | null;
  delivery_type?: 'VIA_AGENT' | 'SELF_PICKUP' | null;
  images?: string[];
};

function normalizeObjectId(value?: string | { _id?: string } | null): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value._id || '';
}

export default function ReceiverDonorListScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const user = useAuthStore((s) => s.user);
  const currentUserId = String((user as any)?.id || (user as any)?._id || '');

  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<CategoryTab>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedFoodTypes, setSelectedFoodTypes] = useState<FoodType[]>([]);
  const [donors, setDonors] = useState<DonationItem[]>([]);
  const [connectingDonationId, setConnectingDonationId] = useState<string | null>(null);

  const FILTER_OPTIONS: { key: FoodType; label: string }[] = [
    { key: 'COOKED',    label: t('request.cookedFood') },
    { key: 'RAW',       label: t('request.rawVeggies') },
    { key: 'FROZEN',    label: t('request.frozenFood') },
    { key: 'PACKAGED',  label: t('request.packagedFood') },
  ];

  const fetchDonors = useCallback(async () => {
    // Gửi GPS thật giống màn home để khoảng cách của cùng một đơn nhất quán
    // (nếu không truyền, backend fallback về toạ độ địa chỉ hồ sơ → số km lệch).
    const gps = await getCurrentGps();
    const params = gps ? { params: { lat: gps.latitude, lon: gps.longitude } } : undefined;
    const res = await http.get('/food-donations', params);
    return (res.data?.data ?? []) as DonationItem[];
  }, []);

  // Focus: load 1 lần (có spinner) + polling 20s im lặng để bắt donation mới.
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const run = async (initial: boolean) => {
        if (initial) setLoading(true);
        try {
          const data = await fetchDonors();
          if (active) setDonors(data);
        } catch {
          if (active && initial) setDonors([]);
        } finally {
          if (active && initial) setLoading(false);
        }
      };

      void run(true);
      const intervalId = setInterval(() => { void run(false); }, 20_000);

      return () => {
        active = false;
        clearInterval(intervalId);
      };
    }, [fetchDonors])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      setDonors(await fetchDonors());
    } catch {
      // Giữ nguyên data cũ khi fetch fail.
    } finally {
      setRefreshing(false);
    }
  }, [fetchDonors]);

  const filteredDonors = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return donors.filter((item) => {
      const donorName = item.donor_id?.full_name?.toLowerCase() ?? '';
      const title = item.title?.toLowerCase() ?? '';
      const isSearchMatch = keyword.length === 0 || donorName.includes(keyword) || title.includes(keyword);

      if (!isSearchMatch) return false;

      if (tab === 'near' && item.pickup_distance_km == null) return false;

      if (selectedFoodTypes.length > 0 && item.food_type && !selectedFoodTypes.includes(item.food_type)) return false;

      return true;
    });
  }, [donors, search, tab, selectedFoodTypes]);

  const toggleFoodType = (foodType: FoodType) => {
    setSelectedFoodTypes((prev) =>
      prev.includes(foodType) ? prev.filter((f) => f !== foodType) : [...prev, foodType]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('donorList.title')} />

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder={t('donorList.searchPlaceholder')}
            placeholderTextColor="#8A8A8A"
            style={styles.searchInput}
          />
          <Ionicons name="search-outline" size={18} color="#666" />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilter((v) => !v)}>
          <Ionicons name="options-outline" size={20} color="#111" />
        </TouchableOpacity>
      </View>

      {showFilter && (
        <View style={styles.filterDropdown}>
          <View style={styles.filterHeader}>
            <Text style={styles.filterTitle}>{t('donorList.filter')}</Text>
            <TouchableOpacity onPress={() => setShowFilter(false)}>
              <Ionicons name="close" size={24} color="#111" />
            </TouchableOpacity>
          </View>
          {FILTER_OPTIONS.map((option) => {
            const checked = selectedFoodTypes.includes(option.key);
            return (
              <TouchableOpacity
                key={option.key}
                style={styles.filterOptionRow}
                onPress={() => toggleFoodType(option.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked && <Ionicons name="checkmark" size={16} color="#111" />}
                </View>
                <Text style={styles.filterOptionText}>{option.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      <Text style={styles.categoryTitle}>{t('donorList.foodCategories')}</Text>
      <View style={styles.tabsRow}>
        <CategoryTabButton label={t('donorList.all')}    active={tab === 'all'}     onPress={() => setTab('all')} />
        <CategoryTabButton label={t('donorList.nearMe')} active={tab === 'near'}    onPress={() => setTab('near')} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={roleUi.colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={roleUi.colors.primary} colors={[roleUi.colors.primary]} />}
        >
          {filteredDonors.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>{t('donorList.noDonors')}</Text>
            </View>
          ) : (
            filteredDonors.map((item) => {
              const selectedForMe =
                normalizeObjectId(item.selected_receiver_id) !== '' &&
                normalizeObjectId(item.selected_receiver_id) === currentUserId;

              const pickupChosen = selectedForMe && Boolean(item.delivery_type);

              return (
                <DonorListCard
                  key={item._id}
                  item={item}
                  t={t}
                  onViewDetails={() => {
                    router.push({
                      pathname: '/(stack)/RECEIVER/donationDetail',
                      params: {
                        donationId: item._id,
                        title: item.title,
                      },
                    } as any);
                  }}
                  onConnect={() => {
                    if (pickupChosen) {
                      router.push({
                        pathname: '/(stack)/RECEIVER/tracking',
                        params: {
                          donationId: item._id,
                          title: item.title,
                        },
                      } as any);
                      return;
                    }

                    if (selectedForMe) {
                      router.push({
                        pathname: '/(stack)/RECEIVER/addPickup',
                        params: {
                          donationId: item._id,
                          title: item.title,
                        },
                      } as any);
                      return;
                    }
                    void (async () => {
                      try {
                        setConnectingDonationId(item._id);
                        const res = await http.patch(`/food-donations/${item._id}/connect`);
                        const connectMessage = res.data?.message || t('receiver.connectSuccessDefault');
                        Alert.alert(t('receiver.connectSuccessTitle'), connectMessage, [
                          {
                            text: t('receiver.choosePickup'),
                            onPress: () => {
                              router.push({
                                pathname: '/(stack)/RECEIVER/addPickup',
                                params: {
                                  donationId: item._id,
                                  title: item.title,
                                },
                              } as any);
                            },
                          },
                        ]);
                      } catch (err: any) {
                        Alert.alert(t('receiver.connectFailedTitle'), err?.response?.data?.message || t('receiver.connectFailedDefault'));
                      } finally {
                        setConnectingDonationId(null);
                      }
                    })();
                  }}
                  connecting={connectingDonationId === item._id}
                  selectedForMe={selectedForMe}
                  pickupChosen={pickupChosen}
                  deliveryType={item.delivery_type || null}
                />
              );
            })
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function CategoryTabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={[styles.tabButton, active && styles.tabButtonActive]} onPress={onPress}>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const FOOD_TYPE_KEY: Record<FoodType, TranslationKey> = {
  COOKED:   'request.cookedFood',
  RAW:      'request.rawVeggies',
  FROZEN:   'request.frozenFood',
  PACKAGED: 'request.packagedFood',
};

function DonorListCard({
  item,
  onViewDetails,
  onConnect,
  connecting,
  selectedForMe,
  pickupChosen,
  deliveryType,
  t,
}: {
  item: DonationItem;
  onViewDetails: () => void;
  onConnect: () => void;
  connecting: boolean;
  selectedForMe: boolean;
  pickupChosen: boolean;
  deliveryType: DonationItem['delivery_type'];
  t: TFn;
}) {
  const donorName = item.donor_id?.full_name || t('receiver.unknownDonor');
  const address = [item.pickup_address_line, item.pickup_city].filter(Boolean).join(', ');
  const foodTypeText = item.food_type ? t(FOOD_TYPE_KEY[item.food_type]) : t('receiver.foodTypeNotSpecified');
  const quantityText = `${item.quantity ?? 0} ${item.unit || 'meals'}`;
  const distanceText = item.pickup_distance_km != null
    ? `${item.pickup_distance_km.toFixed(1)} ${t('donorList.kmAway')}`
    : null;
  const expiryText = item.expiration_datetime
    ? new Date(item.expiration_datetime).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
    : t('receiver.notSpecified');

  return (
    <View style={styles.cardWrap}>
      <View style={styles.cardTopRow}>
        <Text style={styles.cardTitle}>{donorName}</Text>
        {distanceText ? <Text style={styles.distancePill}>{distanceText}</Text> : null}
      </View>

      <View style={styles.cardBox}>
        {item.images?.[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Ionicons name="image-outline" size={56} color="#B1B1B1" />
          </View>
        )}

        <View style={styles.cardBody}>
          <Text style={styles.donationTitle} numberOfLines={2}>{item.title}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeText}>{foodTypeText}</Text>
            </View>
          </View>

          <View style={styles.quickInfoRow}>
            <Text style={styles.quickInfoText}>{t('pantry.qty')} {quantityText}</Text>
            <Text style={styles.quickInfoText}>{t('donorList.exp')} {expiryText}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.addressWrap}>
            <Ionicons name="location-outline" size={12} color="#656565" />
            <Text style={styles.addressText} numberOfLines={1}>{address || t('donorList.addressNotAvailable')}</Text>
          </View>
          <Text style={styles.mealsText}>{quantityText}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.viewBtn} onPress={onViewDetails}>
            <Text style={styles.viewBtnText}>{t('receiver.viewDetails')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.connectBtn,
              selectedForMe && styles.connectBtnApproved,
              pickupChosen && styles.connectBtnMuted,
            ]}
            onPress={onConnect}
            disabled={connecting}
          >
            <Text style={styles.connectBtnText}>
              {pickupChosen
                ? deliveryType === 'VIA_AGENT'
                  ? t('receiver.waitingAgent')
                  : t('receiver.selfPickupReady')
                : selectedForMe
                  ? t('receiver.choosePickup')
                  : connecting
                    ? t('receiver.connecting')
                    : t('receiver.connect')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2', paddingHorizontal: 16 },

  searchRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  searchBox: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#A8A8A8',
    borderRadius: 8,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  searchInput: { flex: 1, fontSize: 14, color: '#111' },
  filterBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  filterDropdown: {
    position: 'absolute',
    top: 98,
    right: 12,
    width: 250,
    backgroundColor: '#ECECEC',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    zIndex: 10,
    elevation: 5,
  },
  filterHeader: {
    height: 40,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#D8D8D8',
  },
  filterTitle: { fontSize: 15, fontWeight: '600', color: '#111' },
  filterOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#D8D8D8',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#4A4A4A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    backgroundColor: '#F5F5F5',
  },
  checkboxChecked: {
    backgroundColor: '#EBEBEB',
  },
  filterOptionText: { fontSize: 16, color: '#333' },

  categoryTitle: { fontSize: 16, color: '#111', marginBottom: 8 },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DADADA',
    marginBottom: 10,
  },
  tabButton: { marginRight: 20, paddingBottom: 8 },
  tabButtonActive: { borderBottomWidth: 2, borderBottomColor: '#111' },
  tabLabel: { fontSize: 16, color: '#8A8A8A' },
  tabLabelActive: { color: '#111', fontWeight: '600' },

  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { paddingBottom: 24 },
  emptyWrap: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 20,
    alignItems: 'center',
    marginTop: 12,
  },
  emptyText: { color: '#666', fontSize: 14 },

  cardWrap: { marginBottom: 16 },
  cardTopRow: {
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: { fontSize: 16, color: '#111', fontWeight: '600', flex: 1, marginRight: 8 },
  distancePill: {
    fontSize: 11,
    color: roleUi.colors.primaryStrong,
    backgroundColor: roleUi.colors.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  cardBox: {
    borderWidth: 1,
    borderColor: '#555',
    backgroundColor: '#F6F6F6',
  },
  cardImage: { width: '100%', height: 90, backgroundColor: '#E8E6E6' },
  cardImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  cardBody: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 4,
  },
  donationTitle: { fontSize: 14, color: '#111', fontWeight: '700', marginBottom: 8 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8, gap: 6 },
  infoBadge: {
    backgroundColor: roleUi.colors.successSoft,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  infoBadgeMuted: {
    backgroundColor: '#ECEFF1',
  },
  infoBadgeText: { fontSize: 11, color: '#1D1D1D', fontWeight: '600' },
  quickInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  quickInfoText: { fontSize: 11, color: '#454545', flex: 1 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  addressWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 },
  addressText: { marginLeft: 2, fontSize: 11, color: '#4A4A4A', flex: 1 },
  mealsText: { fontSize: 11, color: '#4A4A4A' },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  viewBtn: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 5,
    backgroundColor: '#F4F4F4',
  },
  viewBtnText: { fontSize: 11, color: '#111' },
  connectBtn: {
    backgroundColor: roleUi.colors.primary,
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingVertical: 6,
  },
  connectBtnApproved: {
    backgroundColor: roleUi.colors.successText,
  },
  connectBtnMuted: {
    backgroundColor: '#546E7A',
  },
  connectBtnText: { fontSize: 11, color: '#fff', fontWeight: '600' },
});
