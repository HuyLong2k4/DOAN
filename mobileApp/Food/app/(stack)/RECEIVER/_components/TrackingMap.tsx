import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useI18n } from '../../../../src/i18n/useI18n';

type LatLng = { latitude: number; longitude: number };

type Props = {
  region: LatLng & { latitudeDelta: number; longitudeDelta: number };
  donor: { latitude: number; longitude: number; name: string; address: string } | null;
  myLocation: LatLng | null;
  onOpenExternalMap: () => void;
};

export function TrackingMap({ region, donor, myLocation, onOpenExternalMap }: Props) {
  const { t } = useI18n();
  const hasContent = Boolean(donor) || Boolean(myLocation);

  return (
    <View style={styles.mapBox}>
      {hasContent ? (
        <MapView provider={PROVIDER_GOOGLE} style={styles.mapBg} initialRegion={region} region={region}>
          {donor ? (
            <Marker
              coordinate={{ latitude: donor.latitude, longitude: donor.longitude }}
              title={donor.name}
              description={donor.address || t('tracking.donorLocation')}
              pinColor="#E53935"
            />
          ) : null}
          {myLocation ? (
            <Marker
              coordinate={{ latitude: myLocation.latitude, longitude: myLocation.longitude }}
              title={t('tracking.yourLocation')}
              description={t('tracking.currentLocation')}
              pinColor="#008080"
            />
          ) : null}
          {donor && myLocation ? (
            <Polyline
              coordinates={[
                { latitude: myLocation.latitude, longitude: myLocation.longitude },
                { latitude: donor.latitude, longitude: donor.longitude },
              ]}
              strokeColor="#FF7043"
              strokeWidth={3}
            />
          ) : null}
        </MapView>
      ) : (
        <View style={styles.mapFallback}>
          <Ionicons name="location-outline" size={24} color="#7A7A7A" />
          <Text style={styles.mapFallbackText}>{t('tracking.donorCoordsUnavailable')}</Text>
        </View>
      )}
      <TouchableOpacity style={styles.openMapBtn} onPress={onOpenExternalMap}>
        <Ionicons name="map-outline" size={16} color="#fff" />
        <Text style={styles.openMapText}>{t('tracking.openGoogleMaps')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapBox: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    position: 'relative',
  },
  mapBg: { flex: 1 },
  mapFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  mapFallbackText: { fontSize: 12, color: '#7A7A7A' },
  openMapBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#008080',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  openMapText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
