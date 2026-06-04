import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getReceiverFeedbackContext, submitReceiverFeedback } from '../../../src/api/feedback.api';
import { useI18n } from '../../../src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';
import { ScreenHeader } from '@/src/components/ScreenHeader';

type FeedbackParams = {
  donationId?: string | string[];
  title?: string | string[];
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function Stars({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => onChange(star)} style={styles.starBtn}>
          <Ionicons name={star <= value ? 'star' : 'star-outline'} size={26} color={star <= value ? roleUi.colors.warning : '#666666'} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function ReceiverFeedbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<FeedbackParams>();
  const { t } = useI18n();

  const donationId = firstParam(params.donationId) || '';
  const fallbackTitle = firstParam(params.title) || 'Delivery';

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [canFeedback, setCanFeedback] = useState(false);
  const [deliveryCompleted, setDeliveryCompleted] = useState(false);

  const [donorName, setDonorName] = useState('Donor');
  const [volunteerName, setVolunteerName] = useState<string | null>(null);
  const [pointsEarned, setPointsEarned] = useState(100);

  const [donorRating, setDonorRating] = useState(0);
  const [volunteerRating, setVolunteerRating] = useState(0);
  const [donorComment, setDonorComment] = useState('');
  const [volunteerComment, setVolunteerComment] = useState('');
  const [tipAmount, setTipAmount] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!donationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await getReceiverFeedbackContext(donationId);
        const data = res.data?.data;
        if (!active || !data) return;

        setCanFeedback(Boolean(data.can_feedback));
        setDeliveryCompleted(Boolean(data.is_completed));
        setDonorName(data.donor?.full_name || 'Donor');
        setVolunteerName(data.volunteer?.full_name || null);
        setPointsEarned(Number(data.points_earned || 100));

        setDonorRating(Number(data.existing_feedback?.donor_rating || 0));
        setDonorComment(data.existing_feedback?.donor_comment || '');
        setVolunteerRating(Number(data.existing_feedback?.volunteer_rating || 0));
        setVolunteerComment(data.existing_feedback?.volunteer_comment || '');
      } catch (err: any) {
        if (!active) return;
        Alert.alert(t('feedback.cannotLoad'), err?.response?.data?.message || t('receiver.tryAgain'));
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [donationId, t]);

  const isValid = useMemo(() => {
    if (!canFeedback || !deliveryCompleted) return false;
    if (donorRating < 1) return false;
    if (volunteerName && volunteerRating < 1) return false;
    return true;
  }, [canFeedback, deliveryCompleted, donorRating, volunteerName, volunteerRating]);

  const onSubmit = async () => {
    if (!donationId) {
      Alert.alert(t('feedback.missingDonation'), t('feedback.missingDonationMsg'));
      return;
    }

    if (!isValid) {
      Alert.alert(t('feedback.incomplete'), t('feedback.incompleteMsg'));
      return;
    }

    try {
      setSubmitting(true);
      const payload: {
        donor_rating: number;
        donor_comment?: string;
        volunteer_rating?: number;
        volunteer_comment?: string;
      } = {
        donor_rating: donorRating,
        donor_comment: donorComment.trim() || undefined,
      };

      if (volunteerName) {
        payload.volunteer_rating = volunteerRating;
        payload.volunteer_comment = volunteerComment.trim() || undefined;
      }

      await submitReceiverFeedback(donationId, payload);

      Alert.alert(t('feedback.successTitle'), t('feedback.successMsg'), [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/RECEIVER/home' as any),
        },
      ]);
    } catch (err: any) {
      Alert.alert(t('feedback.cannotSubmit'), err?.response?.data?.message || t('receiver.tryAgain'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={roleUi.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('feedback.title')} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content}>

          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={32} color={roleUi.colors.successText} />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.successHeading}>{t('feedback.congrats')}</Text>
              <Text style={styles.successText}>{t('feedback.delivered')}</Text>
            </View>
          </View>

          <View style={styles.earnedWrap}>
            <Text style={styles.earnedLabel}>{t('feedback.youEarned')}</Text>
            <Text style={styles.earnedValue}>{pointsEarned} {t('feedback.points')}</Text>
            <Text style={styles.earnedSub}>{t('feedback.forReducing')}</Text>
            <Text style={styles.earnedTitle} numberOfLines={1}>{t('feedback.deliveryPrefix')} {fallbackTitle}</Text>
          </View>

          {!deliveryCompleted ? (
            <View style={styles.warnBox}>
              <Text style={styles.warnText}>{t('feedback.notCompleted')}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('feedback.thankAgent')}</Text>
            {volunteerName ? (
              <>
                <Text style={styles.sectionSub}>{t('feedback.ratePrefix')} {volunteerName} {t('feedback.volunteerSuffix')}</Text>
                <Stars value={volunteerRating} onChange={setVolunteerRating} />

                <Text style={styles.inputLabel}>{t('feedback.commentOptional')}</Text>
                <TextInput
                  style={styles.input}
                  value={volunteerComment}
                  onChangeText={setVolunteerComment}
                  placeholder={t('feedback.typePlaceholder')}
                  placeholderTextColor="#8A8A8A"
                  multiline
                />

                <Text style={styles.inputLabel}>{t('feedback.contributeOptional')}</Text>
                <TextInput
                  style={styles.input}
                  value={tipAmount}
                  onChangeText={setTipAmount}
                  placeholder={t('feedback.tipPlaceholder')}
                  placeholderTextColor="#8A8A8A"
                  keyboardType="number-pad"
                />
              </>
            ) : (
              <Text style={styles.noVolunteerText}>{t('feedback.noVolunteer')}</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('feedback.thankDonor')}</Text>
            <Text style={styles.sectionSub}>{t('feedback.ratePrefix')} {donorName} {t('feedback.donorSuffix')}</Text>
            <Stars value={donorRating} onChange={setDonorRating} />

            <Text style={styles.inputLabel}>{t('feedback.feedbackLabel')}</Text>
            <TextInput
              style={styles.input}
              value={donorComment}
              onChangeText={setDonorComment}
              placeholder={t('feedback.typePlaceholder')}
              placeholderTextColor="#8A8A8A"
              multiline
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (!isValid || submitting) && styles.submitBtnDisabled]}
            onPress={() => void onSubmit()}
            disabled={!isValid || submitting}
          >
            <Text style={styles.submitText}>{submitting ? t('feedback.submitting') : t('feedback.submit')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F2' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 18, paddingBottom: 32 },
  successBox: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: roleUi.colors.success,
    backgroundColor: roleUi.colors.successSoft,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  successHeading: { fontSize: 24, fontWeight: '700', color: '#111111' },
  successText: { fontSize: 20, color: '#111111', marginTop: 2 },
  earnedWrap: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#D5D5D5',
    paddingVertical: 14,
    marginBottom: 14,
  },
  earnedLabel: { fontSize: 22, color: '#111' },
  earnedValue: { fontSize: 44, fontWeight: '800', color: '#111', marginTop: 2 },
  earnedSub: { fontSize: 15, color: '#444', marginTop: 4 },
  earnedTitle: { fontSize: 13, color: '#666', marginTop: 6 },
  warnBox: { backgroundColor: '#F1E8CF', borderRadius: 8, padding: 10, marginBottom: 12 },
  warnText: { color: roleUi.colors.warningText, fontSize: 14 },
  section: {
    borderTopWidth: 1,
    borderColor: '#D5D5D5',
    paddingTop: 14,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 27, fontWeight: '700', color: '#111', marginBottom: 8 },
  sectionSub: { fontSize: 22, color: '#222', marginBottom: 8 },
  starsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  starBtn: { marginRight: 6, paddingVertical: 2 },
  inputLabel: { fontSize: 22, color: '#444', marginBottom: 6 },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    backgroundColor: '#F5F6F7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 19,
    color: '#111',
    minHeight: 52,
    marginBottom: 10,
  },
  noVolunteerText: { fontSize: 20, color: '#666666' },
  submitBtn: {
    height: 52,
    borderRadius: 8,
    backgroundColor: roleUi.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  submitBtnDisabled: { opacity: 0.55 },
  submitText: { color: '#fff', fontSize: 24, fontWeight: '700' },
});
