import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { http } from '../../../src/api/http';
import { roleUi } from '../../../src/theme/roleUi';
import { ScreenHeader } from '../../../src/components/ScreenHeader';
import { useI18n } from '@/src/i18n/useI18n';

const FOOD_TYPES = [
  { label: 'donor.donate.cookedFood',         value: 'COOKED'   },
  { label: 'donor.donate.fruitsVegetables', value: 'RAW'      },
  { label: 'donor.donate.packagedFood',       value: 'PACKAGED' },
  { label: 'donor.donate.frozenFood',         value: 'FROZEN'   },
];

export default function DonateScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const [title, setTitle]               = useState('');
  const [description, setDesc]          = useState('');
  const [foodType, setFoodType]         = useState(FOOD_TYPES[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [qty, setQty]                   = useState(5);
  const [expiryDate, setExpiryDate]     = useState<Date | null>(null);
  const [expiryTime, setExpiryTime]     = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const [assured, setAssured]           = useState(false);
  const [photos, setPhotos]             = useState<string[]>([]);
  const [err, setErr]                   = useState('');
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);

  const pickImage = async () => {
    if (photos.length >= 6) {
      setErr(t('donor.donate.maxPhotosReached'));
      return;
    }
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setErr(t('donor.donate.permissionRequired'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotos(prev => [...prev, result.assets[0].uri].slice(0, 6));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async () => {
    if (!title.trim()) { setErr(t('donor.donate.titleRequired')); return; }
    if (!expiryDate) { setErr(t('donor.donate.dateRequired')); return; }
    if (!assured) { setErr(t('donor.donate.assuranceRequired')); return; }

    try {
      setErr('');
      setLoading(true);
      const expDatetime = new Date(
        expiryDate.getFullYear(), expiryDate.getMonth(), expiryDate.getDate(),
        expiryTime ? expiryTime.getHours() : 23,
        expiryTime ? expiryTime.getMinutes() : 59,
      );

      let imageUrls: string[] = [];
      if (photos.length > 0) {
        const formData = new FormData();
        photos.forEach((uri, index) => {
          const filename = uri.split('/').pop() || `photo-${index}.jpg`;
          const extMatch = /\.(\w+)$/.exec(filename);
          const ext = extMatch ? extMatch[1].toLowerCase() : 'jpg';
          const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
          formData.append('files', {
            uri,
            name: filename,
            type: mime,
          } as any);
        });

        const uploadRes = await http.post('/food-donations/uploads', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrls = (uploadRes.data?.data?.images || []).map((it: any) => it.url).filter(Boolean);
      }

      await http.post('/food-donations', {
        title:                title.trim(),
        description:          description.trim() || undefined,
        food_type:            foodType.value,
        quantity:             qty,
        unit:                 'portion',
        expiration_datetime:  expDatetime.toISOString(),
        images:               imageUrls,
      });
      setSuccess(true);
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('donor.donate.createFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successBox}>
          <View style={styles.circle}><Text style={styles.check}>✓</Text></View>
          <Text style={styles.successTitle}>{t('donor.donate.donationPosted')}</Text>
          <Text style={styles.successSub}>
            {t('donor.donate.donationPostedMessage')}
          </Text>
          <TouchableOpacity style={styles.submitBtn} onPress={() => {
            setTitle(''); setDesc(''); setQty(5);
            setExpiryDate(null); setExpiryTime(null);
            setPhotos([]); setAssured(false); setSuccess(false);
          }}>
            <Text style={styles.submitBtnText}>{t('donor.donate.donateAgain')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, { marginTop: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: c.primary }]}
            onPress={() => router.replace('/(tabs)/DONOR/home' as any)}
          >
            <Text style={[styles.submitBtnText, { color: c.primary }]}>{t('donor.donate.viewMyPosts')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('donor.donate.header')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>

          {/* ── Title ── */}
          <Text style={styles.label}>{t('donor.donate.addTitle')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('donor.donate.addTitlePlaceholder')}
            placeholderTextColor="#bbb"
            value={title}
            onChangeText={setTitle}
          />

          {/* ── Description ── */}
          <Text style={styles.label}>{t('donor.donate.description')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={t('donor.donate.descPlaceholder')}
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDesc}
          />

          {/* ── Type of Food dropdown ── */}
          <Text style={styles.label}>{t('donor.donate.typeOfFood')}</Text>
          <TouchableOpacity style={styles.dropdown} onPress={() => setShowDropdown(!showDropdown)} activeOpacity={0.8}>
            <Text style={styles.dropdownText}>{t(foodType.label as any)}</Text>
            <Ionicons name="chevron-down" size={20} color="#555" />
          </TouchableOpacity>
          {showDropdown && (
            <View style={styles.dropdownList}>
              {FOOD_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.label}
                  style={[styles.dropdownItem, foodType.label === type.label && styles.dropdownItemActive]}
                  onPress={() => { setFoodType(type); setShowDropdown(false); }}
                >
                  <Text style={[styles.dropdownItemText, foodType.label === type.label && styles.dropdownItemTextActive]}>
                    {t(type.label as any)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Food Quantity ── */}
          <Text style={styles.label}>{t('donor.donate.foodQuantity')}</Text>
          <View style={styles.mealRow}>
            <Text style={styles.mealLabel}>{t('donor.portion')}</Text>
            <View style={styles.counter}>
              <TouchableOpacity style={styles.counterBtn} onPress={() => setQty(Math.max(1, qty - 1))}>
                <Text style={styles.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.counterValue}>{qty}</Text>
              <TouchableOpacity style={styles.counterBtn} onPress={() => setQty(qty + 1)}>
                <Text style={styles.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Photos ── */}
          <Text style={styles.label}>{t('donor.donate.photos')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photoRow}>
              {photos.map((uri, i) => (
                <TouchableOpacity key={i} style={styles.photoBox} onPress={() => removePhoto(i)}>
                  <Image source={{ uri }} style={styles.photoThumb} />
                  <View style={styles.photoRemove}>
                    <Ionicons name="close-circle" size={18} color="#fff" />
                  </View>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.photoBox} onPress={pickImage}>
                <Ionicons name="camera-outline" size={26} color="#bbb" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.addMoreBtn} onPress={pickImage}>
                <Text style={styles.addMoreText}>{t('donor.donate.addMore')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* ── Expiration Date ── */}
          <Text style={styles.label}>{t('donor.donate.expirationDate')}</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <Text style={[styles.dateInput, !expiryDate && { color: '#bbb' }]}>
              {expiryDate ? formatDate(expiryDate) : t('donor.donate.dateFormat')}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#555" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={expiryDate ?? new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_, date) => { setShowDatePicker(false); if (date) setExpiryDate(date); }}
            />
          )}

          {/* ── Expiration Time ── */}
          <Text style={styles.label}>{t('donor.donate.expirationTime')}</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
            <Text style={[styles.dateInput, !expiryTime && { color: '#bbb' }]}>
              {expiryTime ? formatTime(expiryTime) : t('donor.donate.timeFormat')}
            </Text>
            <Ionicons name="time-outline" size={20} color="#555" />
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={expiryTime ?? new Date()}
              mode="time"
              display="default"
              onChange={(_, time) => { setShowTimePicker(false); if (time) setExpiryTime(time); }}
            />
          )}

          {/* ── Quality assurance ── */}
          <TouchableOpacity style={styles.assuranceRow} onPress={() => setAssured(!assured)} activeOpacity={0.8}>
            <View style={[styles.checkboxBox, assured && styles.checkboxChecked]}>
              {assured && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.assuranceText}>
              {t('donor.donate.assuranceText')}
            </Text>
          </TouchableOpacity>

          {err ? <Text style={styles.error}>{err}</Text> : null}

        </ScrollView>

        {/* ── Submit Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('donor.donate.submit')}</Text>}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const c = roleUi.colors;
const r = roleUi.radius;

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: c.surface },
  inner:                 { paddingHorizontal: 18, paddingBottom: 16 },
  label:                 { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginTop: 16, marginBottom: 8 },
  subLabel:              { fontSize: 13, color: c.textSecondary, marginBottom: 10, marginTop: -4 },
  input:                 { borderWidth: 1, borderColor: c.divider, borderRadius: r.sm, height: 48, paddingHorizontal: 14, fontSize: 14, color: c.textPrimary },
  textarea:              { height: 100, paddingTop: 12, textAlignVertical: 'top' },
  dropdown:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: c.divider, borderRadius: r.sm, height: 48, paddingHorizontal: 14 },
  dropdownText:          { fontSize: 14, color: c.textSecondary },
  dropdownList:          { borderWidth: 1, borderColor: c.divider, borderRadius: r.sm, marginTop: 2, backgroundColor: c.surface, zIndex: 100 },
  dropdownItem:          { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  dropdownItemActive:    { backgroundColor: c.primarySoft },
  dropdownItemText:      { fontSize: 14, color: c.textSecondary },
  dropdownItemTextActive:{ color: c.primary, fontWeight: '600' },
  mealRow:               { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: c.border, borderRadius: r.md, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 8 },
  checkRow:              { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radioOuter:            { width: 20, height: 20, borderWidth: 2, borderColor: '#ccc', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  radioOuterActive:      { borderColor: c.primary },
  radioInner:            { width: 10, height: 10, borderRadius: 5, backgroundColor: c.primary },
  checkboxBox:           { width: 20, height: 20, borderWidth: 1.5, borderColor: '#ccc', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked:       { backgroundColor: c.primary, borderColor: c.primary },
  mealLabel:             { fontSize: 14, color: c.textSecondary, fontWeight: '500' },
  counter:               { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn:            { width: 30, height: 30, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  counterBtnText:        { fontSize: 18, color: '#333', fontWeight: '500', lineHeight: 22 },
  counterValue:          { fontSize: 16, fontWeight: '600', color: '#111', minWidth: 22, textAlign: 'center' },
  photoRow:              { flexDirection: 'row', alignItems: 'center', gap: 10 },
  photoBox:              { width: 62, height: 62, borderWidth: 1.5, borderColor: '#D0D0D0', borderRadius: 6, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  photoThumb:            { width: '100%', height: '100%', borderRadius: 5 },
  photoRemove:           { position: 'absolute', top: 2, right: 2 },
  addMoreBtn:            { paddingHorizontal: 6 },
  addMoreText:           { fontSize: 13, color: '#888' },
  dateRow:               { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.divider, borderRadius: r.sm, height: 48, paddingHorizontal: 14 },
  dateInput:             { flex: 1, fontSize: 14, color: c.textPrimary },
  assuranceRow:          { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 18, marginBottom: 8 },
  assuranceText:         { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },
  error:                 { color: c.danger, fontSize: 13, marginTop: 10 },
  footer:                { padding: 16, paddingBottom: Platform.OS === 'ios' ? 28 : 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: c.surface },
  submitBtn:             { backgroundColor: c.surface, borderRadius: r.sm, height: 50, justifyContent: 'center', alignItems: 'center', borderColor: c.primary, borderWidth: 1.5 },
  submitBtnText:         { color: c.primary, fontWeight: '700', fontSize: 16, paddingLeft: 16, paddingRight: 16 },
  successBox:            { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  circle:                { width: 90, height: 90, borderRadius: 45, backgroundColor: c.success, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  check:                 { color: '#fff', fontSize: 44, fontWeight: '700' },
  successTitle:          { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  successSub:            { textAlign: 'center', color: c.textSecondary, lineHeight: 22, marginBottom: 32 },
});
