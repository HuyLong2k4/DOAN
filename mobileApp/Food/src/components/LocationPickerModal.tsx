import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { roleUi } from '@/src/theme/roleUi';

export interface PickedLocation {
  latitude:     number;
  longitude:    number;
  address_line: string;
  city:         string;
  pin_code:     string;
  display:      string; // full readable address
}

interface Props {
  visible:   boolean;
  onClose:   () => void;
  onConfirm: (loc: PickedLocation) => void;
  initial?:  { latitude: number; longitude: number };
  confirmOnSelect?: boolean;
}

interface NearbyPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
}

function normalizeVietnamese(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

const DEFAULT_REGION: Region = {
  latitude:      10.762622,
  longitude:     106.660172,
  latitudeDelta:  0.01,
  longitudeDelta: 0.01,
};

async function reverseGeocode(lat: number, lon: number): Promise<{
  address_line: string;
  city: string;
  pin_code: string;
  display: string;
  nearby: NearbyPlace[];
}> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`,
      { headers: { 'Accept-Language': 'vi,en', 'User-Agent': 'DonorApp/1.0' } }
    );
    const data = await res.json();
    const addr = data.address ?? {};

    const houseNo   = addr.house_number || '';
    const road      = addr.road || addr.pedestrian || addr.street || '';
    const suburb    = addr.suburb || addr.neighbourhood || addr.village || '';
    const city =
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.county ||
      addr.state_district ||
      addr.state ||
      addr.province ||
      '';
    const postCode  = addr.postcode || '';
    const streetPart   = [houseNo, road].filter(Boolean).join(' ');
    const address_line = [streetPart, suburb].filter(Boolean).join(', ');

    // Fallback: take first 3 meaningful parts of display_name
    const displayParts = (data.display_name || '').split(',').map((s: string) => s.trim()).filter(Boolean);
    const displayFallback = displayParts.slice(0, 3).join(', ');

    // Nearby search
    const nearRes = await fetch(
      `https://nominatim.openstreetmap.org/search?lat=${lat}&lon=${lon}&format=json&limit=3&addressdetails=1`,
      { headers: { 'Accept-Language': 'vi,en', 'User-Agent': 'DonorApp/1.0' } }
    );
    const nearData: NearbyPlace[] = await nearRes.json();

    const cityFallback = city || displayParts.at(-3) || displayParts.at(-2) || '';

    return {
      address_line: address_line || displayFallback || data.display_name || '',
      city: cityFallback,
      pin_code: postCode,
      display:  data.display_name || '',
      nearby:   nearData.slice(0, 3),
    };
  } catch {
    return { address_line: '', city: '', pin_code: '', display: '', nearby: [] };
  }
}

async function searchAddress(query: string): Promise<NearbyPlace[]> {
  const fetchSearch = async (q: string, withVietnamBias: boolean): Promise<NearbyPlace[]> => {
    const country = withVietnamBias ? '&countrycodes=vn' : '';
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1${country}`,
      { headers: { 'Accept-Language': 'vi,en', 'User-Agent': 'DonorApp/1.0' } }
    );
    return res.json();
  };

  try {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // 1) Ưu tiên tìm trong Việt Nam với query gốc
    let results = await fetchSearch(trimmed, true);

    // 2) Nếu không có, thử query không dấu (hữu ích khi API match kém tiếng Việt)
    if (results.length === 0) {
      const normalized = normalizeVietnamese(trimmed);
      if (normalized && normalized !== trimmed) {
        results = await fetchSearch(normalized, true);
      }
    }

    // 3) Fallback toàn cầu nếu vẫn không có
    if (results.length === 0) {
      results = await fetchSearch(trimmed, false);
    }

    return results;
  } catch {
    return [];
  }
}

export default function LocationPickerModal({ visible, onClose, onConfirm, initial, confirmOnSelect = true }: Props) {
  const mapRef = useRef<MapView>(null);

  const [region, setRegion]       = useState<Region>(DEFAULT_REGION);
  const [pin, setPin]             = useState({ lat: DEFAULT_REGION.latitude, lng: DEFAULT_REGION.longitude });
  const [geocodeResult, setGeocode] = useState<Awaited<ReturnType<typeof reverseGeocode>> | null>(null);
  const [geocoding, setGeocoding]   = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<NearbyPlace[]>([]);

  const moveMapTo = (latitude: number, longitude: number) => {
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    const newRegion = { latitude, longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
    setRegion(newRegion);
    setPin({ lat: latitude, lng: longitude });

    // Some devices ignore animateToRegion intermittently on controlled regions.
    mapRef.current?.animateToRegion(newRegion, 700);
    mapRef.current?.animateCamera({ center: { latitude, longitude }, zoom: 16 }, { duration: 700 });
  };

  // On open: move to initial pin or current GPS
  useEffect(() => {
    if (!visible) return;
    if (initial) {
      const r = { ...initial, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setRegion(r);
      setPin({ lat: initial.latitude, lng: initial.longitude });
      doReverseGeocode(initial.latitude, initial.longitude, false);
    } else {
      getCurrentLocation(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const doReverseGeocode = async (lat: number, lng: number, applyToForm = false) => {
    setGeocoding(true);
    const result = await reverseGeocode(lat, lng);
    setGeocode(result);

    if (applyToForm && confirmOnSelect) {
      const hasAddressPayload = Boolean(
        result.address_line?.trim() || result.city?.trim() || result.display?.trim()
      );

      if (!hasAddressPayload) {
        setGeocoding(false);
        return;
      }

      onConfirm({
        latitude: lat,
        longitude: lng,
        address_line: result.address_line,
        city: result.city,
        pin_code: result.pin_code,
        display: result.display,
      });
    }

    setGeocoding(false);
  };

  const getCurrentLocation = async (applyToForm = false) => {
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocLoading(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = loc.coords;
      moveMapTo(latitude, longitude);
      doReverseGeocode(latitude, longitude, applyToForm);
    } catch { /* silent */ } finally {
      setLocLoading(false);
    }
  };

  const onMarkerDragEnd = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPin({ lat: latitude, lng: longitude });
    doReverseGeocode(latitude, longitude, true);
  };

  const onRegionChangeComplete = (r: Region) => setRegion(r);

  const onSearchSubmit = async () => {
    if (!searchText.trim()) return;
    const results = await searchAddress(searchText.trim());
    setSearchResults(results);
  };

  const onSearchSelect = (item: NearbyPlace) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    moveMapTo(lat, lng);
    doReverseGeocode(lat, lng, true);
    setSearchResults([]);
    setSearchText('');
  };

  const onSelectNearby = (item: NearbyPlace) => {
    onSearchSelect(item);
  };

  const onSetLocation = () => {
    if (!geocodeResult) return;
    onConfirm({
      latitude:     pin.lat,
      longitude:    pin.lng,
      address_line: geocodeResult.address_line,
      city:         geocodeResult.city,
      pin_code:     geocodeResult.pin_code,
      display:      geocodeResult.display,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select your location</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search location..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={onSearchSubmit}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={onSearchSubmit}>
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Search results dropdown */}
        {searchResults.length > 0 && (
          <View style={styles.dropdown}>
            {searchResults.map((r) => (
              <TouchableOpacity key={r.place_id} style={styles.dropdownItem} onPress={() => onSearchSelect(r)}>
                <Text style={styles.dropdownText} numberOfLines={2}>📍 {r.display_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Map */}
        <View style={styles.mapWrapper}>
          <MapView
            ref={mapRef}
            style={styles.map}
            region={region}
            onRegionChangeComplete={onRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}
          >
            <Marker
              draggable
              coordinate={{ latitude: pin.lat, longitude: pin.lng }}
              onDragEnd={onMarkerDragEnd}
              pinColor={roleUi.colors.primary}
            />
          </MapView>

          {/* GPS button */}
          <TouchableOpacity style={styles.gpsBtn} onPress={() => { void getCurrentLocation(true); }} disabled={locLoading}>
            {locLoading
              ? <ActivityIndicator color={roleUi.colors.primary} size="small" />
              : <Text style={styles.gpsIcon}>⊕</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Address result */}
        {geocoding && <ActivityIndicator color={roleUi.colors.primary} style={{ marginTop: 8 }} />}
        {!geocoding && geocodeResult?.display ? (
          <View style={styles.addrBox}>
            <Text style={styles.addrLabel}>Address:</Text>
            <Text style={styles.addrText} numberOfLines={2}>{geocodeResult.display}</Text>
          </View>
        ) : null}

        {/* Nearby Locations */}
        {(geocodeResult?.nearby?.length ?? 0) > 0 && (
          <>
            <Text style={styles.nearbyTitle}>Nearby Locations</Text>
            <FlatList
              horizontal
              data={geocodeResult!.nearby}
              keyExtractor={(i) => String(i.place_id)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
              style={{ flexGrow: 0, maxHeight: 90 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.nearbyCard} onPress={() => onSelectNearby(item)}>
                  <Text style={styles.nearbyName} numberOfLines={1}>{item.display_name?.split(',')[0]}</Text>
                  <Text style={styles.nearbyAddr} numberOfLines={2}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* Set Location button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.setBtn, (!geocodeResult || geocoding) && styles.setBtnDisabled]}
            onPress={onSetLocation}
            disabled={!geocodeResult || geocoding}
          >
            <Text style={styles.setBtnText}>Set Location</Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#fff' },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  closeBtn:       { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  closeText:      { fontSize: 18, color: '#555' },
  headerTitle:    { fontSize: 17, fontWeight: '700', color: '#111' },
  searchRow:      { flexDirection: 'row', alignItems: 'center', margin: 12, backgroundColor: '#F5F5F5', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  searchInput:    { flex: 1, height: 44, paddingHorizontal: 14, fontSize: 14, color: '#111' },
  searchBtn:      { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  searchIcon:     { fontSize: 18 },
  dropdown:       { position: 'absolute', top: 110, left: 12, right: 12, backgroundColor: '#fff', borderRadius: 8, elevation: 8, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6, zIndex: 100, borderWidth: 1, borderColor: '#E0E0E0' },
  dropdownItem:   { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  dropdownText:   { fontSize: 13, color: '#333', lineHeight: 18 },
  mapWrapper:     { flex: 1, position: 'relative' },
  map:            { ...StyleSheet.absoluteFillObject },
  gpsBtn:         { position: 'absolute', bottom: 16, right: 16, width: 48, height: 48, borderRadius: 24, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4 },
  gpsIcon:        { fontSize: 26, color: roleUi.colors.primary },
  addrBox:        { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#EEF1F6' },
  addrLabel:      { fontSize: 11, fontWeight: '600', color: roleUi.colors.primary, marginBottom: 2 },
  addrText:       { fontSize: 12, color: '#333', lineHeight: 17 },
  nearbyTitle:    { fontSize: 14, fontWeight: '700', color: '#111', marginLeft: 16, marginTop: 10, marginBottom: 6 },
  nearbyCard:     { width: 180, backgroundColor: '#F8F8F8', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E8E8E8' },
  nearbyName:     { fontWeight: '700', color: '#111', fontSize: 13, marginBottom: 3 },
  nearbyAddr:     { fontSize: 11, color: '#777', lineHeight: 15 },
  footer:         { padding: 16, paddingBottom: Platform.OS === 'android' ? 16 : 8 },
  setBtn:         { backgroundColor: roleUi.colors.primary, borderRadius: 8, height: 52, justifyContent: 'center', alignItems: 'center' },
  setBtnDisabled: { backgroundColor: '#AEC2D8' },
  setBtnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
});
