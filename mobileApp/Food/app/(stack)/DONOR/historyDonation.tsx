import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
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
import DonationHistoryCard from '../../../src/components/DonationHistoryCard';
import { Donation } from '../../../src/components/DonationPostCard';
import { http } from '../../../src/api/http';
import { useI18n } from '@/src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';
import { ScreenHeader } from '@/src/components/ScreenHeader';

export default function DonationHistoryScreen() {
    const { t } = useI18n();
    const [search, setSearch] = useState('');
    const [donations, setDonations] = useState<Donation[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');

    const loadDonations = useCallback(async (isPullToRefresh = false) => {
        try {
            setError('');
            if (isPullToRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }

            const res = await http.get('/food-donations/my');
            const list: Donation[] = Array.isArray(res.data?.data) ? res.data.data : [];
            list.sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return bTime - aTime;
            });
            setDonations(list);
        } catch (err: any) {
            setError(err?.response?.data?.message || t('donor.history.loadFailed'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useFocusEffect(
        useCallback(() => {
            loadDonations();
        }, [loadDonations])
    );

    const filteredDonations = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        if (!keyword) return donations;

        return donations.filter((d) => {
            const idPart = d._id ? d._id.slice(-6).toLowerCase() : '';
            return (
                (d.title || '').toLowerCase().includes(keyword)
                || (d.status || '').toLowerCase().includes(keyword)
                || idPart.includes(keyword)
            );
        });
    }, [donations, search]);

    return (
        <SafeAreaView style={styles.container}>
            <ScreenHeader title={t('donor.history.title')} />

            <View style={styles.searchWrap}>
                <Ionicons name="search-outline" size={18} color="#777" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    value={search}
                    onChangeText={setSearch}
                    placeholder={t('donor.history.searchPlaceholder')}
                    placeholderTextColor="#9e9e9e"
                    autoCorrect={false}
                />
            </View>

            {loading ? (
                <View style={styles.centerState}>
                    <ActivityIndicator size="large" color={roleUi.colors.primary} />
                    <Text style={styles.stateText}>{t('donor.history.loading')}</Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.list}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => loadDonations(true)}
                            tintColor={roleUi.colors.primary}
                        />
                    }
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {error ? (
                        <View style={styles.messageCard}>
                            <Text style={styles.errorText}>{error}</Text>
                            <TouchableOpacity style={styles.retryBtn} onPress={() => loadDonations()}>
                                <Text style={styles.retryBtnText}>{t('donor.history.tryAgain')}</Text>
                            </TouchableOpacity>
                        </View>
                    ) : filteredDonations.length === 0 ? (
                        <View style={styles.messageCard}>
                            <Text style={styles.emptyText}>
                                {search.trim()
                                    ? t('donor.history.noMatch')
                                    : t('donor.history.noYet')}
                            </Text>
                        </View>
                    ) : (
                        filteredDonations.map((d) => (
                            <DonationHistoryCard key={d._id} d={d} />
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#FAFAFA' },
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
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: '#111',
    },
    list: { flex: 1 },
    listContent: { paddingTop: 6, paddingBottom: 20 },
    centerState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
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
    retryBtn: {
        backgroundColor: roleUi.colors.primarySoft,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
    },
    retryBtnText: { color: roleUi.colors.primaryStrong, fontWeight: '600' },
});