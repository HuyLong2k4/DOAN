import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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
import { changePassword } from '../../../src/api/user.api';
import { useI18n } from '../../../src/i18n/useI18n';
import type { AppLanguage } from '../../../src/store/languageStore';
import { useAuthStore } from '../../../src/store/authStore';
import { roleUi } from '@/src/theme/roleUi';
import { ScreenHeader } from '@/src/components/ScreenHeader';

export default function SettingsScreen() {
  const router = useRouter();
  const { t, language, setLanguage } = useI18n();
  const userId = useAuthStore((s) => s.user?.id);
  const clear  = useAuthStore((s) => s.clear);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!userId) return;
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert(t('settings.changePasswordFailed'), t('settings.passwordRequired'));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t('settings.changePasswordFailed'), t('settings.passwordTooShort'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('settings.changePasswordFailed'), t('settings.passwordMismatch'));
      return;
    }

    try {
      setSubmitting(true);
      await changePassword(userId, { oldPassword, newPassword });
      // Server bumps token_version → current token is invalidated. Sign out cleanly.
      await clear();
      Alert.alert(
        t('settings.changePasswordSuccessTitle'),
        t('settings.changePasswordSuccessBody'),
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (err: any) {
      const message = err?.response?.data?.message || t('settings.changePasswordFailed');
      Alert.alert(t('settings.changePasswordFailed'), message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title={t('settings.title')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Language */}
          <Text style={styles.sectionTitle}>{t('settings.languageSection')}</Text>
          <View style={styles.card}>
            {(['en', 'vi'] as AppLanguage[]).map((code) => {
              const active = language === code;
              const label = code === 'en'
                ? t('profile.languageEnglish')
                : t('profile.languageVietnamese');
              return (
                <TouchableOpacity
                  key={code}
                  style={styles.langRow}
                  onPress={() => setLanguage(code)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.langLabel}>{label}</Text>
                  {active && <Ionicons name="checkmark" size={20} color={roleUi.colors.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Change password */}
          <Text style={styles.sectionTitle}>{t('settings.changePasswordSection')}</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.input}
              placeholder={t('settings.oldPassword')}
              placeholderTextColor="#999"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              placeholder={t('settings.newPassword')}
              placeholderTextColor="#999"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { marginBottom: 16 }]}
              placeholder={t('settings.confirmPassword')}
              placeholderTextColor="#999"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitText}>{t('settings.changePasswordBtn')}</Text>
              }
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F5F5F5' },
  scroll:           { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },
  sectionTitle:     { fontSize: 13, fontWeight: '700', color: '#666', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card:             { backgroundColor: '#fff', borderRadius: 8, padding: 14, borderWidth: 1, borderColor: '#EEE' },
  langRow:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  langLabel:        { fontSize: 15, color: '#111' },
  input:            { borderWidth: 1, borderColor: '#DDD', borderRadius: 6, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111', marginBottom: 10, backgroundColor: '#FAFAFA' },
  submitBtn:        { backgroundColor: '#111', borderRadius: 6, paddingVertical: 12, alignItems: 'center' },
  submitBtnDisabled:{ backgroundColor: '#888' },
  submitText:       { color: '#fff', fontSize: 14, fontWeight: '700' },
});
