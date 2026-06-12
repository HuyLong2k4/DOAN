import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { roleUi } from '../../../src/theme/roleUi';
import { ScreenHeader } from '../../../src/components/ScreenHeader';

type FoodType = 'COOKED' | 'RAW' | 'FROZEN' | 'PACKAGED';

export default function ReceiverRequestScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ title?: string | string[]; donorName?: string | string[] }>();

  const FOOD_TYPE_OPTIONS: { value: FoodType; label: string }[] = [
    { value: 'COOKED',   label: t('request.cookedFood') },
    { value: 'RAW',      label: t('request.rawVeggies') },
    { value: 'FROZEN',   label: t('request.frozenFood') },
    { value: 'PACKAGED', label: t('request.packagedFood') },
  ];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [foodType, setFoodType] = useState<FoodType>('COOKED');
  const [showFoodTypePopup, setShowFoodTypePopup] = useState(false);
  const [qtyInput, setQtyInput] = useState('5');
  const [needDate, setNeedDate] = useState<Date | null>(null);
  const [needTime, setNeedTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [assured, setAssured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const prefillTitle = Array.isArray(params.title) ? params.title[0] : params.title;
  const prefillDonorName = Array.isArray(params.donorName) ? params.donorName[0] : params.donorName;

  useEffect(() => {
    if (prefillTitle && !title.trim()) {
      setTitle(prefillTitle);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillTitle]);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: true });
  const selectedFoodTypeLabel =
    FOOD_TYPE_OPTIONS.find((item) => item.value === foodType)?.label || t('request.selectFoodType');

  const onSubmit = async () => {
    if (!title.trim()) {
      setError(t('request.errorTitle'));
      return;
    }
    const requestedQuantity = Number(qtyInput);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      setError(t('request.errorQty'));
      return;
    }
    if (!assured) {
      setError(t('request.errorAssured'));
      return;
    }

    try {
      setError('');
      setLoading(true);

      const neededBefore = needDate
        ? new Date(
            needDate.getFullYear(),
            needDate.getMonth(),
            needDate.getDate(),
            needTime ? needTime.getHours() : 23,
            needTime ? needTime.getMinutes() : 59,
          ).toISOString()
        : null;

      // food_type là field riêng, không cần encode vào description.
      await http.post('/food-requests', {
        title: title.trim(),
        description: description.trim() || undefined,
        requested_quantity: requestedQuantity,
        unit: 'portion',
        food_type: foodType,
        needed_before: neededBefore,
      });

      setSuccess(true);
      setTimeout(() => {
        router.replace('/(tabs)/RECEIVER/home' as any);
      }, 700);
    } catch (err: unknown) {
      const message =
        (typeof err === 'object' &&
          err !== null &&
          'response' in err &&
          typeof (err as { response?: { data?: { message?: string } } }).response?.data?.message === 'string' &&
          (err as { response?: { data?: { message?: string } } }).response?.data?.message) ||
        t('volunteer.somethingWrong');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successBox}>
          <View style={styles.circle}><Text style={styles.check}>✓</Text></View>
          <Text style={styles.successTitle}>{t('request.postedTitle')}</Text>
          <Text style={styles.successSub}>{t('request.postedMsg')}</Text>
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={() => {
              setTitle('');
              setDescription('');
              setFoodType('COOKED');
              setQtyInput('5');
              setNeedDate(null);
              setNeedTime(null);
              setAssured(false);
              setSuccess(false);
            }}
          >
            <Text style={styles.submitBtnText}>{t('request.createAnother')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.submitBtn, styles.outlineBtn]}
            onPress={() => router.replace('/(tabs)/RECEIVER/home' as any)}
          >
            <Text style={[styles.submitBtnText, styles.outlineBtnText]}>{t('request.goHome')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('request.listingType')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>

          {prefillDonorName ? (
            <View style={styles.prefillNote}>
              <Ionicons name="person-circle-outline" size={16} color={c.primary} />
              <Text style={styles.prefillNoteText}>{t('request.connectingWith')} {prefillDonorName}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>{t('request.typeOfFood')}</Text>
          <Text style={styles.subLabel}>{t('request.typeOfFoodSub')}</Text>
          <TouchableOpacity
            style={styles.foodTypeSelector}
            onPress={() => setShowFoodTypePopup(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.foodTypeSelectorText}>{selectedFoodTypeLabel}</Text>
            <Ionicons name="chevron-down" size={18} color="#333" />
          </TouchableOpacity>

          <Text style={styles.label}>{t('request.requestTitle')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('request.titlePlaceholder')}
            placeholderTextColor="#bbb"
            value={title}
            onChangeText={setTitle}
          />

          <Text style={styles.label}>{t('request.requestDesc')}</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder={t('request.descPlaceholder')}
            placeholderTextColor="#bbb"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />

          <Text style={styles.sectionTitle}>{t('request.mealReq')}</Text>

          <Text style={styles.label}>{t('request.foodQty')}</Text>
          <Text style={styles.subLabel}>{t('request.foodQtySub')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('request.qtyPlaceholder')}
            placeholderTextColor="#bbb"
            keyboardType="number-pad"
            value={qtyInput}
            onChangeText={(text) => {
              const cleaned = text.replace(/[^0-9]/g, '');
              setQtyInput(cleaned);
            }}
          />

          <Text style={styles.sectionTitle}>{t('request.requiredTime')}</Text>

          <Text style={styles.label}>{t('request.neededDate')}</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <Text style={[styles.dateInput, !needDate && { color: '#bbb' }]}>
              {needDate ? formatDate(needDate) : 'DD MMM YYYY'}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#555" />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={needDate ?? new Date()}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setNeedDate(date);
              }}
            />
          )}

          <Text style={styles.label}>{t('request.neededTime')}</Text>
          <TouchableOpacity style={styles.dateRow} onPress={() => setShowTimePicker(true)} activeOpacity={0.8}>
            <Text style={[styles.dateInput, !needTime && { color: '#bbb' }]}>
              {needTime ? formatTime(needTime) : 'HH:MM AM/PM'}
            </Text>
            <Ionicons name="time-outline" size={20} color="#555" />
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={needTime ?? new Date()}
              mode="time"
              display="default"
              onChange={(_, time) => {
                setShowTimePicker(false);
                if (time) setNeedTime(time);
              }}
            />
          )}

          <Text style={styles.sectionTitle}>{t('request.confirmation')}</Text>
          <TouchableOpacity style={styles.assuranceRow} onPress={() => setAssured(!assured)} activeOpacity={0.8}>
            <View style={[styles.checkboxBox, assured && styles.checkboxChecked]}>
              {assured && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.assuranceText}>{t('request.assurance')}</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.error}>{error}</Text> : null}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.submitBtn} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{t('request.requestNow')}</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showFoodTypePopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFoodTypePopup(false)}
      >
        <TouchableOpacity
          style={styles.popupBackdrop}
          activeOpacity={1}
          onPress={() => setShowFoodTypePopup(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.popupCard} onPress={() => {}}>
            <Text style={styles.popupTitle}>{t('request.popupTitle')}</Text>
            {FOOD_TYPE_OPTIONS.map((option) => {
              const active = option.value === foodType;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.popupOptionRow, active && styles.popupOptionRowActive]}
                  onPress={() => {
                    setFoodType(option.value);
                    setShowFoodTypePopup(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.popupOptionText, active && styles.popupOptionTextActive]}>{option.label}</Text>
                  {active ? <Ionicons name="checkmark-circle" size={18} color={c.primary} /> : null}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const c = roleUi.colors;
const r = roleUi.radius;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: c.surface },
  inner: { paddingHorizontal: 18, paddingBottom: 16 },
  prefillNote: {
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: c.primarySoft,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: '#D5E0EC',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  prefillNoteText: { fontSize: 12, color: c.primaryStrong, fontWeight: '600', flex: 1 },

  sectionTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginTop: 18, marginBottom: 2 },
  label: { fontSize: 14, fontWeight: '600', color: c.textPrimary, marginTop: 16, marginBottom: 8 },
  subLabel: { fontSize: 12, color: c.textSecondary, marginTop: -2, marginBottom: 8 },
  foodTypeSelector: {
    borderWidth: 1,
    borderColor: c.divider,
    borderRadius: r.sm,
    minHeight: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.surface,
  },
  foodTypeSelectorText: { fontSize: 14, color: c.textPrimary, flex: 1, paddingRight: 10 },
  input: {
    borderWidth: 1,
    borderColor: c.divider,
    borderRadius: r.sm,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: c.textPrimary,
  },
  textarea: { height: 100, paddingTop: 12, textAlignVertical: 'top' },

  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.divider,
    borderRadius: r.sm,
    height: 48,
    paddingHorizontal: 14,
  },
  dateInput: { flex: 1, fontSize: 14, color: c.textPrimary },

  assuranceRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 18, marginBottom: 8 },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 1.5,
    borderColor: '#ccc',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: { backgroundColor: c.primary, borderColor: c.primary },
  assuranceText: { flex: 1, fontSize: 13, color: '#555', lineHeight: 18 },

  error: { color: c.danger, fontSize: 13, marginTop: 10 },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    backgroundColor: c.surface,
  },
  submitBtn: {
    backgroundColor: c.primary,
    borderRadius: r.sm,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  successBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  circle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: c.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  check: { color: '#fff', fontSize: 44, fontWeight: '700' },
  successTitle: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  successSub: { textAlign: 'center', color: '#555', lineHeight: 22, marginBottom: 32 },
  popupBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  popupCard: {
    backgroundColor: c.surface,
    borderRadius: r.lg,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: c.border,
  },
  popupTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  popupOptionRow: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  popupOptionRowActive: {
    backgroundColor: c.primarySoft,
  },
  popupOptionText: {
    fontSize: 14,
    color: '#222',
    fontWeight: '500',
  },
  popupOptionTextActive: {
    color: c.primaryStrong,
    fontWeight: '700',
  },
  outlineBtn: {
    marginTop: 12,
    backgroundColor: c.surface,
    borderWidth: 1.5,
    borderColor: c.primary,
  },
  outlineBtnText: { color: c.primary },
});
