import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, ActivityIndicator, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { http } from '../../../src/api/http';
import { getOrCreateDonationConversation } from '../../../src/api/chat.api';
import * as Location from 'expo-location';
import { useI18n } from '../../../src/i18n/useI18n';
import { TimelineRow } from './_components/TimelineRow';
import { TrackingMap } from './_components/TrackingMap';

type TrackingParams = {
  donationId?: string | string[];
  deliveryId?: string | string[];
  title?: string | string[];
  deliveryType?: 'VIA_AGENT' | 'SELF_PICKUP' | string | string[];
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

type TrackingData = {
  donation: {
    id: string;
    title: string;
    status: string;
    delivery_type: 'VIA_AGENT' | 'SELF_PICKUP';
  };
  delivery: {
    id: string;
    status: 'WAITING_AGENT' | 'SELF_PICKUP_READY' | 'AGENT_ASSIGNED' | 'ON_THE_WAY' | 'AWAITING_CONFIRMATION' | 'DELIVERED' | 'CANCELLED';
    delivery_type: 'VIA_AGENT' | 'SELF_PICKUP';
  };
  donor: {
    full_name: string;
    phone_number?: string | null;
    address_line?: string | null;
    city?: string | null;
    latitude?: number | null;
    longitude?: number | null;
  };
  volunteer: {
    full_name: string;
    phone_number?: string | null;
  } | null;
};

export default function ReceiverTrackingScreen() {
  const router = useRouter();
  const { t }  = useI18n();
  const params = useLocalSearchParams<TrackingParams>();

  const donationId = firstParam(params.donationId) || '';
  const fallbackTitle = firstParam(params.title) || 'Donation';

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [error, setError] = useState('');
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [myLocation, setMyLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const fetchTracking = useCallback(async (silent = false) => {
    if (!donationId) {
      setError(t('tracking.missingId'));
      setLoading(false);
      return;
    }

    try {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError('');
      }
      const res = await http.get(`/food-donations/${donationId}/tracking`);
      setTracking(res.data?.data ?? null);
      setLastUpdatedAt(Date.now());
      setError('');
    } catch (err: any) {
      if (!silent) {
        setTracking(null);
        setError(err?.response?.data?.message || t('tracking.cannotLoad'));
      }
    } finally {
      if (silent) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [donationId, t]);

  useFocusEffect(
    useCallback(() => {
      void fetchTracking(false);

      const intervalId = setInterval(() => {
        void fetchTracking(true);
      }, 12000);

      return () => {
        clearInterval(intervalId);
      };
    }, [fetchTracking])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;

      const fetchLocation = async () => {
        try {
          const permission = await Location.requestForegroundPermissionsAsync();
          if (permission.status !== 'granted') return;

          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (!active) return;

          setMyLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        } catch {
          // Keep map usable with donor marker even if user location is unavailable.
        }
      };

      void fetchLocation();

      return () => {
        active = false;
      };
    }, [])
  );

  const onCall = async () => {
    const phone = tracking?.delivery?.delivery_type === 'SELF_PICKUP'
      ? tracking?.donor?.phone_number
      : tracking?.volunteer?.phone_number;

    if (!phone) {
      Alert.alert(t('tracking.noPhone'), t('tracking.noPhoneMsg'));
      return;
    }

    try {
      await Linking.openURL(`tel:${phone}`);
    } catch {
      Alert.alert(t('tracking.cannotCallTitle'), t('tracking.cannotCallMsg'));
    }
  };

  const onCompleteSelfPickup = async () => {
    if (!donationId) return;

    try {
      setActionLoading(true);
      const res = await http.patch(`/food-donations/${donationId}/self-pickup-complete`);
      const pointsAwarded = Number(res.data?.points_awarded_to_donor || 0);
      const completeMessage = res.data?.message || '';
      const donorPointsMessage = pointsAwarded > 0
        ? `${t('tracking.donorEarnedPrefix')}${pointsAwarded}${t('tracking.donorEarnedSuffix')}`
        : '';

      Alert.alert(t('tracking.completedTitle'), `${completeMessage}${donorPointsMessage}`, [
        {
          text: 'OK',
          onPress: () => {
            router.replace({
              pathname: '/(stack)/RECEIVER/feedback',
              params: { donationId, title },
            } as any);
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert(t('tracking.cannotComplete'), err?.response?.data?.message || t('receiver.tryAgain'));
    } finally {
      setActionLoading(false);
    }
  };

  const onConfirmReceived = async () => {
    if (!donationId) return;

    try {
      setActionLoading(true);
      const res = await http.patch(`/food-donations/${donationId}/confirm-received`);
      const pointsAwarded = Number(res.data?.points_awarded_to_donor || 0);
      const completeMessage = res.data?.message || '';
      const donorPointsMessage = pointsAwarded > 0
        ? `${t('tracking.donorEarnedPrefix')}${pointsAwarded}${t('tracking.donorEarnedSuffix')}`
        : '';

      Alert.alert(t('tracking.completedTitle'), `${completeMessage}${donorPointsMessage}`, [
        {
          text: 'OK',
          onPress: () => {
            router.replace({
              pathname: '/(stack)/RECEIVER/feedback',
              params: { donationId, title },
            } as any);
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert(t('tracking.cannotComplete'), err?.response?.data?.message || t('receiver.tryAgain'));
    } finally {
      setActionLoading(false);
    }
  };

  const onOpenChat = async () => {
    if (!donationId) return;

    try {
      setChatLoading(true);
      const res = await getOrCreateDonationConversation(donationId);
      const conversation = res.data?.data;

      if (!conversation?.id) {
        throw new Error(t('volunteer.cannotCreateConversation'));
      }

      router.push({
        pathname: '/(stack)/chat/[conversationId]',
        params: {
          conversationId: conversation.id,
          title: conversation.counterpart?.full_name || 'Chat',
        },
      } as any);
    } catch (err: any) {
      Alert.alert(t('volunteer.cannotOpenChat'), err?.response?.data?.message || err?.message || t('receiver.tryAgain'));
    } finally {
      setChatLoading(false);
    }
  };

  const onOpenGoogleMaps = async () => {
    const donorLat = tracking?.donor?.latitude;
    const donorLng = tracking?.donor?.longitude;
    const hasDonorCoordinates = typeof donorLat === 'number' && typeof donorLng === 'number';
    const donorAddress = [tracking?.donor?.address_line, tracking?.donor?.city].filter(Boolean).join(', ');

    const destination = hasDonorCoordinates ? `${donorLat},${donorLng}` : donorAddress;
    if (!destination) {
      Alert.alert(t('tracking.noDestination'), t('tracking.donorLocationNA'));
      return;
    }

    const origin = myLocation ? `${myLocation.latitude},${myLocation.longitude}` : '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`;

    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(t('volunteer.cannotOpenMaps'), t('receiver.tryAgain'));
    }
  };

  const onOpenFeedback = () => {
    if (!donationId) return;

    router.push({
      pathname: '/(stack)/RECEIVER/feedback',
      params: { donationId, title },
    } as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#008080" />
          <Text style={styles.loadingText}>{t('tracking.loading')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !tracking) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorWrap}>
          <Text style={styles.errorText}>{error || t('tracking.notFound')}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => void fetchTracking()}>
            <Text style={styles.retryText}>{t('tracking.retry')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/(tabs)/RECEIVER/home' as any)}>
            <Text style={styles.backHomeText}>{t('tracking.backHome')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isViaAgent = tracking.delivery.delivery_type === 'VIA_AGENT';
  const isSelfPickupReady = tracking.delivery.status === 'SELF_PICKUP_READY';
  const isAwaitingConfirmation = tracking.delivery.status === 'AWAITING_CONFIRMATION';
  const isCompleted = tracking.delivery.status === 'DELIVERED';
  const title = tracking.donation?.title || fallbackTitle;
  const deliveryId = tracking.delivery?.id || '';
  const lastUpdatedText = lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : '';
  const donorAddress = [tracking.donor?.address_line, tracking.donor?.city].filter(Boolean).join(', ');
  const donorLat = tracking.donor?.latitude;
  const donorLng = tracking.donor?.longitude;
  const hasDonorCoords = typeof donorLat === 'number' && typeof donorLng === 'number';

  const mainStatus = isViaAgent
    ? tracking.delivery.status === 'WAITING_AGENT'
      ? t('tracking.waitingVolunteer')
      : tracking.delivery.status === 'AGENT_ASSIGNED'
        ? t('tracking.volunteerAssigned')
        : tracking.delivery.status === 'ON_THE_WAY'
          ? t('tracking.foodOnWay')
          : tracking.delivery.status === 'DELIVERED'
            ? t('tracking.deliveryCompleted')
            : t('tracking.deliveryStatus')
    : isCompleted
      ? t('tracking.selfPickupCompleted')
      : t('tracking.selfPickupReady');

  const mapRegion = (() => {
    if (hasDonorCoords && myLocation) {
      const centerLat = (donorLat + myLocation.latitude) / 2;
      const centerLng = (donorLng + myLocation.longitude) / 2;
      const latDelta = Math.max(Math.abs(donorLat - myLocation.latitude) * 1.7, 0.02);
      const lngDelta = Math.max(Math.abs(donorLng - myLocation.longitude) * 1.7, 0.02);
      return { latitude: centerLat, longitude: centerLng, latitudeDelta: latDelta, longitudeDelta: lngDelta };
    }
    if (hasDonorCoords) {
      return { latitude: donorLat, longitude: donorLng, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    }
    if (myLocation) {
      return { latitude: myLocation.latitude, longitude: myLocation.longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    }
    return { latitude: 10.8231, longitude: 106.6297, latitudeDelta: 0.05, longitudeDelta: 0.05 };
  })();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/RECEIVER/home' as any)}>
          <Ionicons name="arrow-back" size={24} color="#111" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{t('tracking.title')}</Text>

      <View style={styles.statusHead}>
        <Text style={styles.mainStatus}>{mainStatus}</Text>
        <Text style={styles.timeStatus}>
          {isViaAgent ? t('tracking.deliveryTimeline') : t('tracking.pickupSlotActive')}
        </Text>
        <Text style={styles.donationTitle}>{t('tracking.forPrefix')} {title}</Text>
        <Text style={styles.refreshText}>
          {refreshing
            ? t('tracking.updatingStatus')
            : lastUpdatedText
              ? `${t('tracking.updatedPrefix')} ${lastUpdatedText}`
              : ''}
        </Text>
      </View>

      <TrackingMap
        region={mapRegion}
        donor={
          hasDonorCoords
            ? {
                latitude: donorLat,
                longitude: donorLng,
                name: tracking.donor?.full_name || 'Donor',
                address: donorAddress,
              }
            : null
        }
        myLocation={myLocation}
        onOpenExternalMap={() => void onOpenGoogleMaps()}
      />

      <View style={styles.agentCard}>
        <View style={styles.agentTop}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.agentName}>
              {isViaAgent
                ? tracking.volunteer?.full_name || t('tracking.waitingForVolunteer')
                : tracking.donor?.full_name || 'Donor'}
            </Text>
            <Text style={styles.agentSub}>{isViaAgent ? t('tracking.pickupVolunteer') : t('tracking.pickupAtDonor')}</Text>
            <Text style={styles.agentSub}>{t('tracking.refPrefix')} {deliveryId || 'pending-id'}</Text>
            {!isViaAgent && donorAddress ? <Text style={styles.agentSub}>{t('tracking.addressPrefix')} {donorAddress}</Text> : null}
          </View>
          <Ionicons name="chevron-down" size={18} color="#6B7280" />
        </View>

        <View style={styles.timelineWrap}>
          <TimelineRow
            dotColor={isViaAgent && tracking.delivery.status !== 'WAITING_AGENT' ? '#22C55E' : '#BDBDBD'}
            label={isViaAgent ? t('tracking.tlAssigned') : t('tracking.tlPickupSelected')}
            time="--"
          />
          <TimelineRow
            dotColor={
              isViaAgent
                ? (tracking.delivery.status === 'AGENT_ASSIGNED' || tracking.delivery.status === 'ON_THE_WAY' || tracking.delivery.status === 'DELIVERED')
                  ? '#22C55E'
                  : '#BDBDBD'
                : (isSelfPickupReady || isCompleted)
                  ? '#22C55E'
                  : '#BDBDBD'
            }
            label={isViaAgent ? t('tracking.tlPickUp') : t('tracking.tlGoPickup')}
            time="--"
          />
          <TimelineRow dotColor={isCompleted ? '#22C55E' : '#BDBDBD'} label={t('tracking.tlComplete')} time="--" />
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => void onCall()}>
            <Ionicons name="call-outline" size={16} color="#008080" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.msgBtn, chatLoading && { opacity: 0.7 }]} onPress={() => void onOpenChat()} disabled={chatLoading}>
            <Text style={styles.msgText}>{chatLoading ? t('volunteer.openingChat') : t('tracking.sendMessage')}</Text>
          </TouchableOpacity>
          {(!isViaAgent && !isCompleted) ? (
            <TouchableOpacity style={[styles.tipBtn, actionLoading && { opacity: 0.7 }]} onPress={() => void onCompleteSelfPickup()} disabled={actionLoading}>
              <Text style={styles.tipText}>{actionLoading ? t('tracking.saving') : t('volunteer.confirm')}</Text>
            </TouchableOpacity>
          ) : isAwaitingConfirmation ? (
            <TouchableOpacity style={[styles.tipBtn, actionLoading && { opacity: 0.7 }]} onPress={() => void onConfirmReceived()} disabled={actionLoading}>
              <Text style={styles.tipText}>{actionLoading ? t('tracking.saving') : t('tracking.confirmReceived')}</Text>
            </TouchableOpacity>
          ) : isCompleted ? (
            <TouchableOpacity style={styles.tipBtn} onPress={onOpenFeedback}>
              <Text style={styles.tipText}>{t('tracking.feedback')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.tipBtn} onPress={() => Alert.alert(t('tracking.tip'), '')}>
              <Text style={styles.tipText}>{t('tracking.tip')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2', paddingHorizontal: 16, paddingBottom: 14 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#666' },
  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  errorText: { fontSize: 14, color: '#444', textAlign: 'center', marginBottom: 10 },
  retryBtn: { backgroundColor: '#008080', paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8, marginBottom: 8 },
  retryText: { color: '#fff', fontWeight: '700' },
  backHomeBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  backHomeText: { color: '#008080', fontWeight: '600' },
  headerRow: { paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 30, color: '#111', fontWeight: '700' },
  statusHead: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#CFCFCF',
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  mainStatus: { fontSize: 16, color: '#111', fontWeight: '600' },
  timeStatus: { marginTop: 4, fontSize: 14, color: '#444' },
  donationTitle: { marginTop: 5, fontSize: 13, color: '#4B5563', fontWeight: '600' },
  refreshText: { marginTop: 4, fontSize: 11, color: '#6B7280' },
  agentCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D8D8D8',
    borderRadius: 10,
    padding: 10,
  },
  agentTop: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#ECECEC' },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#B9B9B9', alignItems: 'center', justifyContent: 'center' },
  agentName: { fontSize: 16, color: '#111', fontWeight: '700' },
  agentSub: { fontSize: 12, color: '#666', marginTop: 1 },
  timelineWrap: { paddingTop: 10, paddingBottom: 6 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  iconBtn: { width: 44, height: 34, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  msgBtn: { flex: 1, height: 34, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  msgText: { fontSize: 12, color: '#333', fontWeight: '500' },
  tipBtn: { width: 70, height: 34, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  tipText: { fontSize: 12, color: '#333', fontWeight: '500' },
});
