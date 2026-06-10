import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { completeReceiverProfile, resetRole } from '../../src/api/profile.api';
import LocationPickerModal, { PickedLocation } from '../../src/components/LocationPickerModal';
import { useI18n } from '../../src/i18n/useI18n';
import { useAuthStore } from '../../src/store/authStore';
import { roleUi } from '@/src/theme/roleUi';

type ReceiverType = 'Individual' | 'NGO' | 'Orphanage' | 'Shelter';

function fallbackAddressFromDisplay(display: string): { addressLine: string; city: string } {
  const parts = display.split(',').map((p) => p.trim()).filter(Boolean);
  const addressLine = parts.slice(0, 2).join(', ');
  const city = parts.at(-3) || parts.at(-2) || '';
  return { addressLine, city };
}

export default function ReceiverDetails() {
  const router  = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const authUser = useAuthStore((s) => s.user);
  const { t } = useI18n();

  const RECEIVER_TYPES: { key: ReceiverType; label: string }[] = [
    { key: 'Individual', label: t('auth.receiver.individual') },
    { key: 'NGO',        label: t('auth.receiver.ngo') },
    { key: 'Orphanage',  label: t('auth.receiver.orphanage') },
    { key: 'Shelter',    label: t('auth.receiver.shelter') },
  ];

  const [receiverType, setReceiverType] = useState<ReceiverType>('Individual');
  const [orgName, setOrgName]           = useState('');
  const [contactName, setContactName]   = useState(authUser?.full_name?.trim() || '');
  const [addressLine, setAddressLine]   = useState('');
  const [pinCode, setPinCode]           = useState('');
  const [city, setCity]                 = useState('');
  const [err, setErr]                   = useState('');
  const [loading, setLoading]           = useState(false);
  const [mapVisible, setMapVisible]     = useState(false);
  const [latitude, setLatitude]         = useState<number | undefined>();
  const [longitude, setLongitude]       = useState<number | undefined>();
  const [locationPinned, setLocationPinned] = useState(false);
  const [addressLocked, setAddressLocked] = useState(false);

  const onLocationPicked = (loc: PickedLocation) => {
    const fb = fallbackAddressFromDisplay(loc.display || '');
    const nextAddressLine = (loc.address_line || fb.addressLine || loc.display || '').trim();
    const nextPinCode = (loc.pin_code || '').trim();
    const nextCity = (loc.city || fb.city || '').trim();

    if (nextAddressLine) setAddressLine(nextAddressLine);
    if (nextPinCode) setPinCode(nextPinCode);
    if (nextCity) setCity(nextCity);
    setLatitude(loc.latitude);
    setLongitude(loc.longitude);
    setLocationPinned(true);
    setAddressLocked(true);
  };

  const onSubmit = async () => {
    if (receiverType !== 'Individual' && !orgName.trim()) {
      setErr(t('auth.details.errorOrgName')); return;
    }
    const normalizedAddressLine =
      addressLine.trim() ||
      (latitude != null && longitude != null ? 'Pinned location' : '');
    const normalizedCity =
      city.trim() ||
      (latitude != null && longitude != null ? 'Pinned area' : '');

    if (!normalizedAddressLine || !normalizedCity) {
      setErr(t('auth.details.errorAddress')); return;
    }

    if (normalizedAddressLine !== addressLine) setAddressLine(normalizedAddressLine);
    if (normalizedCity !== city) setCity(normalizedCity);

    try {
      setErr('');
      setLoading(true);
      const res = await completeReceiverProfile({
        receiver_type: receiverType.toUpperCase() as any,
        organization_name: receiverType !== 'Individual' ? orgName.trim() : undefined,
        contact_name:  contactName.trim() || authUser?.full_name?.trim() || undefined,
        address_line:  normalizedAddressLine,
        pin_code:      pinCode.trim() || undefined,
        city:          normalizedCity,
        latitude,
        longitude,
      });
      setUser(res.data.user);
      router.replace('/(tabs)/RECEIVER/home');
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('auth.details.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleReselectRole = async () => {
    try {
      const res = await resetRole();
      setUser(res.data.user);
      router.replace('/(auth)/selectRole');
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('auth.details.errorGeneric'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner}>

          <Text style={styles.title}>{t('auth.receiver.title')}</Text>
          <Text style={styles.sub}>{t('auth.receiver.subtitle')}</Text>

          <Text style={styles.label}>{t('auth.receiver.type')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 4 }}>
            <View style={styles.tabs}>
              {RECEIVER_TYPES.map((rt) => (
                <TouchableOpacity
                  key={rt.key}
                  style={[styles.tab, receiverType === rt.key && styles.tabActive]}
                  onPress={() => setReceiverType(rt.key)}
                >
                  <Text style={[styles.tabText, receiverType === rt.key && styles.tabTextActive]}>{rt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {receiverType !== 'Individual' && (
            <>
              <Text style={styles.label}>{t('auth.details.orgName')}</Text>
              <TextInput style={styles.input} placeholder={t('auth.details.orgNamePlaceholder')} placeholderTextColor="#999" value={orgName} onChangeText={setOrgName} />
            </>
          )}

          <Text style={styles.label}>{t('auth.details.contactName')}</Text>
          <TextInput style={styles.input} placeholder={t('auth.details.contactNamePlaceholder')} placeholderTextColor="#999" value={contactName} onChangeText={setContactName} />

          <Text style={styles.label}>{t('auth.details.addressLine')}</Text>
          <TextInput
            style={[styles.input, addressLocked && styles.inputDisabled]}
            placeholder={t('auth.details.addressLinePlaceholder')}
            placeholderTextColor="#999"
            value={addressLine}
            onChangeText={setAddressLine}
            editable={!addressLocked}
          />

          <Text style={styles.label}>{t('auth.details.city')}</Text>
          <TextInput
            style={[styles.input, addressLocked && styles.inputDisabled]}
            placeholder={t('auth.details.cityPlaceholder')}
            placeholderTextColor="#999"
            value={city}
            onChangeText={setCity}
            editable={!addressLocked}
          />

          {addressLocked && (
            <TouchableOpacity onPress={() => setAddressLocked(false)}>
              <Text style={styles.editManuallyLink}>{t('auth.details.editManually')}</Text>
            </TouchableOpacity>
          )}

          <View style={styles.orRow}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>{t('auth.details.or')}</Text>
            <View style={styles.orLine} />
          </View>
          <TouchableOpacity onPress={() => setMapVisible(true)}>
            <Text style={styles.mapLink}>📍 {t('auth.details.pinLocation')}</Text>
          </TouchableOpacity>
          {locationPinned && (
            <Text style={styles.pinnedNote}>✅ {t('auth.details.locationPinned')}</Text>
          )}

          {err ? <Text style={styles.error}>{err}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('auth.details.submit')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleReselectRole} disabled={loading}>
            <Text style={styles.reselectText}>{t('auth.details.reselectRole')}</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>

      <LocationPickerModal
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={onLocationPicked}
        initial={latitude && longitude ? { latitude, longitude } : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F5F5F5' },
  inner:         { padding: 24, paddingBottom: 48 },
  title:         { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 6 },
  sub:           { color: '#666', marginBottom: 24 },
  label:         { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6, marginTop: 12 },
  input:         {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 6, height: 50, paddingHorizontal: 14,
    fontSize: 15, color: '#111',
  },
  inputDisabled: { backgroundColor: '#F5F5F5', color: '#666' },
  tabs:          { flexDirection: 'row', gap: 8 },
  tab:           { paddingHorizontal: 16, height: 40, justifyContent: 'center', alignItems: 'center', borderRadius: 6, borderWidth: 1.5, borderColor: '#E0E0E0', backgroundColor: '#fff' },
  tabActive:     { backgroundColor: roleUi.colors.primary, borderColor: roleUi.colors.primary },
  tabText:       { fontSize: 13, fontWeight: '600', color: '#555' },
  tabTextActive: { color: '#fff' },
  error:         { color: roleUi.colors.danger, marginTop: 12, fontSize: 13 },
  orRow:         { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 4 },
  orLine:        { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  orText:        { marginHorizontal: 12, color: '#999', fontSize: 13 },
  mapLink:       { textAlign: 'center', color: roleUi.colors.primary, fontWeight: '600', fontSize: 14, paddingVertical: 8 },
  editManuallyLink: { textAlign: 'right', color: roleUi.colors.primary, fontSize: 12, marginTop: 6 },
  pinnedNote:    { textAlign: 'center', color: roleUi.colors.success, fontSize: 12, marginTop: 4 },
  btn:           { backgroundColor: roleUi.colors.primary, borderRadius: 6, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 24 },
  btnText:       { color: '#fff', fontWeight: '700', fontSize: 16 },
  reselectText:  { textAlign: 'center', color: '#888', fontSize: 13, marginTop: 18, textDecorationLine: 'underline' },
});
