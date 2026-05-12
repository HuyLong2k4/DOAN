import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http } from '../../../src/api/http';
import { useI18n } from '../../../src/i18n/useI18n';

type DeliveryType = 'VIA_AGENT' | 'SELF_PICKUP';

type AgentItem = {
  id: string;
  name: string;
  distanceKm: number | null;
  completedPickup: number;
  stars: number;
  ratingCount: number;
  city?: string | null;
};

export default function ReceiverAddPickupScreen() {
  const router = useRouter();
  const { t }  = useI18n();
  const params = useLocalSearchParams<{ donationId?: string | string[]; title?: string | string[] }>();

  const donationId = useMemo(
    () => (Array.isArray(params.donationId) ? params.donationId[0] : params.donationId) || '',
    [params.donationId],
  );

  const title = useMemo(
    () => (Array.isArray(params.title) ? params.title[0] : params.title) || 'Donation',
    [params.title],
  );

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('VIA_AGENT');
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [loadingAgents, setLoadingAgents] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchAgents = async () => {
      if (!donationId) {
        setAgents([]);
        setSelectedAgentId('');
        return;
      }

      try {
        setLoadingAgents(true);
        const res = await http.get(`/food-donations/${donationId}/available-volunteers`);
        const rows = (res.data?.data?.volunteers ?? []) as any[];

        if (!active) return;

        const mapped: AgentItem[] = rows.map((item) => ({
          id: String(item.id),
          name: item.full_name || 'Volunteer',
          distanceKm: typeof item.distance_km === 'number' ? item.distance_km : null,
          completedPickup: Number(item.completed_pickup || 0),
          stars: Number(item.stars || 0),
          ratingCount: Number(item.rating_count || 0),
          city: item.city || null,
        }));

        setAgents(mapped);
        setSelectedAgentId((prev) => {
          if (prev && mapped.some((m) => m.id === prev)) return prev;
          return mapped[0]?.id || '';
        });
      } catch (err: any) {
        if (!active) return;
        setAgents([]);
        setSelectedAgentId('');
        Alert.alert(t('addPickup.errorLoadVolunteer'), err?.response?.data?.message || t('receiver.tryAgain'));
      } finally {
        if (active) setLoadingAgents(false);
      }
    };

    void fetchAgents();

    return () => {
      active = false;
    };
  }, [donationId, t]);

  const onConfirm = async () => {
    if (!donationId) {
      Alert.alert(t('receiver.missingDonationTitle'), t('donationDetail.cannotDetermineMsg'));
      return;
    }

    if (deliveryType === 'VIA_AGENT' && !selectedAgentId) {
      Alert.alert(t('addPickup.selectAgentTitle'), t('addPickup.selectAgentMsg'));
      return;
    }

    try {
      setLoading(true);
      const res = await http.patch(`/food-donations/${donationId}/receiver-delivery-choice`, {
        delivery_type: deliveryType,
        preferred_agent_id: deliveryType === 'VIA_AGENT' ? selectedAgentId : undefined,
      });

      const deliveryId = res.data?.delivery?._id || res.data?.delivery?.id || '';
      router.replace({
        pathname: '/(stack)/RECEIVER/tracking',
        params: {
          donationId,
          title,
          deliveryType,
          deliveryId,
        },
      } as any);
    } catch (err: any) {
      Alert.alert(t('addPickup.cannotContinue'), err?.response?.data?.message || t('receiver.tryAgain'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#111" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerTitle}>{t('addPickup.title')}</Text>

        <Text style={styles.sectionTitle}>{t('addPickup.selectDeliveryType')}</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[styles.optionBtn, deliveryType === 'VIA_AGENT' && styles.optionBtnActive]}
            onPress={() => setDeliveryType('VIA_AGENT')}
            activeOpacity={0.85}
          >
            <Text style={[styles.optionText, deliveryType === 'VIA_AGENT' && styles.optionTextActive]}>{t('donor.delivery.viaAgent')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionBtn, deliveryType === 'SELF_PICKUP' && styles.optionBtnActive]}
            onPress={() => setDeliveryType('SELF_PICKUP')}
            activeOpacity={0.85}
          >
            <Text style={[styles.optionText, deliveryType === 'SELF_PICKUP' && styles.optionTextActive]}>{t('donor.delivery.selfPickup')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.estimateWrap}>
          <Text style={styles.estimateText}>
            {deliveryType === 'VIA_AGENT' ? t('addPickup.estimateAgent') : t('addPickup.estimateSelf')}
          </Text>
        </View>

        <View style={styles.approvedBox}>
          <View style={styles.approvedIconCircle}>
            <Ionicons name="checkmark" size={20} color="#fff" />
          </View>
          <View style={styles.approvedTextWrap}>
            <Text style={styles.approvedMainText}>{t('addPickup.requestApproved')}</Text>
            <Text style={styles.approvedSubText} numberOfLines={2}>{title}</Text>
            <View style={styles.approvedDivider} />
            <Text style={styles.approvedFooterText}>
              {deliveryType === 'VIA_AGENT' ? t('addPickup.selectAgentHint') : t('addPickup.selfPickupHint')}
            </Text>
          </View>
        </View>

        {deliveryType === 'VIA_AGENT' ? (
          <>
            <Text style={styles.agentTitle}>{t('addPickup.chooseAgent')}</Text>
            {loadingAgents ? (
              <View style={styles.agentLoadingWrap}>
                <ActivityIndicator color="#008080" />
              </View>
            ) : agents.length === 0 ? (
              <View style={styles.noAgentWrap}>
                <Text style={styles.noAgentText}>{t('addPickup.noAgents')}</Text>
              </View>
            ) : (
              <View style={styles.agentGrid}>
                {agents.map((agent) => {
                  const selected = selectedAgentId === agent.id;
                  const roundedStars = Math.max(0, Math.min(5, Math.round(agent.stars)));

                  return (
                    <TouchableOpacity
                      key={agent.id}
                      style={[styles.agentCard, selected && styles.agentCardSelected]}
                      onPress={() => setSelectedAgentId(agent.id)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.agentAvatarWrap}>
                        <View style={styles.agentAvatarCircle}>
                          <Ionicons name="person" size={54} color="#DCE4F2" />
                        </View>
                        <View style={styles.onlineDot} />
                      </View>

                      <Text style={styles.agentName} numberOfLines={1}>{agent.name}</Text>
                      <Text style={styles.agentDistance}>
                        {agent.distanceKm != null
                          ? `${agent.distanceKm} ${t('donorList.kmAway')}`
                          : t('addPickup.distanceNA')}
                      </Text>
                      {agent.city ? <Text style={styles.agentCity}>{agent.city}</Text> : null}
                      <View style={styles.agentDivider} />
                      <View style={styles.starRow}>
                        {[0, 1, 2, 3, 4].map((i) => (
                          <Ionicons
                            key={i}
                            name={i < roundedStars ? 'star' : 'star-outline'}
                            size={11}
                            color="#111"
                          />
                        ))}
                      </View>
                      <Text style={styles.agentFooter}>
                        {`${t('addPickup.completed')} ${agent.completedPickup} ${agent.completedPickup > 1 ? t('addPickup.pickups') : t('addPickup.pickup')}`}
                      </Text>
                      <Text style={styles.agentFooterSub}>{`${agent.stars.toFixed(1)} (${agent.ratingCount})`}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        ) : (
          <View style={styles.selfPickupCard}>
            <Ionicons name="walk-outline" size={18} color="#006666" />
            <Text style={styles.selfPickupText}>{t('addPickup.selfPickupInfo')}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.confirmBtn,
            (loading || (deliveryType === 'VIA_AGENT' && (loadingAgents || agents.length === 0))) && styles.confirmBtnDisabled,
          ]}
          onPress={onConfirm}
          disabled={loading || (deliveryType === 'VIA_AGENT' && (loadingAgents || agents.length === 0))}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmBtnText}>{t('volunteer.confirm')}</Text>}
        </TouchableOpacity>

        <Text style={styles.bottomHint}>{t('addPickup.currentDonation')} {title}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFEFEF' },
  scrollContent: { paddingHorizontal: 14, paddingBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    marginBottom: 2,
  },
  headerTitle: { fontSize: 29, color: '#111', fontWeight: '700', marginBottom: 12 },
  sectionTitle: { fontSize: 22, color: '#111', fontWeight: '400', marginBottom: 10 },
  optionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  optionBtn: {
    flex: 1,
    backgroundColor: '#CFCFD1',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  optionBtnActive: { backgroundColor: '#008080' },
  optionText: { fontSize: 18, color: '#222', fontWeight: '500' },
  optionTextActive: { color: '#fff' },
  estimateWrap: {
    borderTopWidth: 1,
    borderTopColor: '#CFCFCF',
    paddingTop: 10,
    marginBottom: 10,
  },
  estimateText: {
    fontSize: 16,
    color: '#606060',
    textAlign: 'center',
  },
  approvedBox: {
    backgroundColor: '#EAF9EB',
    borderWidth: 1,
    borderColor: '#5EC45E',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 12,
    marginBottom: 14,
  },
  approvedIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  approvedTextWrap: { flex: 1, marginLeft: 10 },
  approvedMainText: { fontSize: 14, color: '#1E1E1E', fontWeight: '600' },
  approvedSubText: { fontSize: 14, color: '#1E1E1E', marginTop: 2 },
  approvedDivider: { height: 1, backgroundColor: '#BFDDBF', marginTop: 10, marginBottom: 8 },
  approvedFooterText: { fontSize: 13, color: '#2D2D2D' },
  agentTitle: { fontSize: 18, color: '#111', fontWeight: '600', marginBottom: 8 },
  agentLoadingWrap: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noAgentWrap: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#DBDEE3',
    marginBottom: 8,
  },
  noAgentText: {
    color: '#4B5563',
    fontSize: 13,
    textAlign: 'center',
  },
  agentGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  agentCard: {
    width: '48.2%',
    backgroundColor: '#D9D9D9',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#B7B7B7',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  agentCardSelected: {
    borderColor: '#008080',
    borderWidth: 2,
    backgroundColor: '#EAF4FE',
  },
  agentAvatarWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  agentAvatarCircle: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#5A678A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    right: 28,
    top: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#43CF43',
    borderWidth: 2,
    borderColor: '#D9D9D9',
  },
  agentName: {
    fontSize: 15,
    color: '#1B1B1B',
    fontWeight: '600',
    textAlign: 'center',
  },
  agentDistance: {
    fontSize: 12,
    color: '#3A3A3A',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 2,
  },
  agentCity: {
    fontSize: 11,
    color: '#5B5B5B',
    textAlign: 'center',
    marginBottom: 5,
  },
  agentDivider: { height: 1, backgroundColor: '#BEBEBE', marginBottom: 6 },
  starRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 1 },
  agentFooter: {
    marginTop: 4,
    fontSize: 11,
    color: '#555',
    textAlign: 'center',
  },
  agentFooterSub: {
    marginTop: 2,
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
  },
  selfPickupCard: {
    backgroundColor: '#E8F1FF',
    borderWidth: 1,
    borderColor: '#C8DCF9',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 14,
  },
  selfPickupText: { flex: 1, color: '#006666', fontSize: 13, lineHeight: 18 },
  confirmBtn: {
    marginTop: 14,
    backgroundColor: '#008080',
    borderRadius: 0,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDisabled: { opacity: 0.65 },
  confirmBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  bottomHint: {
    marginTop: 10,
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
});
