import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { resetPassword } from '../../src/api/auth.api';
import { useI18n } from '../../src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';

export default function ResetPassword() {
  const router = useRouter();
  const { reset_token } = useLocalSearchParams<{ reset_token: string }>();
  const { t } = useI18n();

  const [new_password, setNew]         = useState('');
  const [confirm_password, setConfirm] = useState('');
  const [err, setErr]                  = useState('');
  const [loading, setLoading]          = useState(false);
  const [done, setDone]                = useState(false);

  const onConfirm = async () => {
    if (!new_password || !confirm_password) { setErr(t('auth.reset.errorEmpty')); return; }
    if (new_password.length < 6) { setErr(t('auth.reset.errorLength')); return; }
    if (new_password !== confirm_password) { setErr(t('auth.reset.errorMatch')); return; }

    try {
      setErr('');
      setLoading(true);
      await resetPassword({ reset_token, new_password, confirm_password });
      setDone(true);
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('auth.reset.errorFailed'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successBox}>
          <View style={styles.circle}><Text style={styles.check}>✓</Text></View>
          <Text style={styles.awesomeTitle}>{t('auth.reset.successTitle')}</Text>
          <Text style={styles.awesomeSub}>{t('auth.reset.successMsg')}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.btnText}>{t('auth.reset.backToLogin')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.inner}>

        <Text style={styles.title}>{t('auth.reset.title')}</Text>
        <Text style={styles.sub}>{t('auth.reset.subtitle')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.reset.newPassword')}
          placeholderTextColor="#999"
          secureTextEntry
          value={new_password}
          onChangeText={setNew}
        />
        <TextInput
          style={styles.input}
          placeholder={t('auth.reset.confirmPassword')}
          placeholderTextColor="#999"
          secureTextEntry
          value={confirm_password}
          onChangeText={setConfirm}
        />

        {err ? <Text style={styles.error}>{err}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={onConfirm} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('auth.reset.confirm')}</Text>}
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F5F5F5' },
  inner:        { flex: 1, padding: 28, justifyContent: 'center' },
  title:        { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 12 },
  sub:          { color: '#666', marginBottom: 28 },
  input:        {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 6, height: 50, paddingHorizontal: 14,
    fontSize: 15, color: '#111', marginBottom: 14,
  },
  error:        { color: roleUi.colors.danger, marginBottom: 12, fontSize: 13 },
  btn:          { backgroundColor: roleUi.colors.primary, borderRadius: 6, height: 50, justifyContent: 'center', alignItems: 'center' },
  btnText:      { color: '#fff', fontWeight: '700', fontSize: 16, padding: 60 },
  successBox:   { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 28 },
  circle:       { width: 90, height: 90, borderRadius: 45, backgroundColor: roleUi.colors.success, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  check:        { color: '#fff', fontSize: 44, fontWeight: '700' },
  awesomeTitle: { fontSize: 24, fontWeight: '700', marginBottom: 12, color: '#111' },
  awesomeSub:   { textAlign: 'center', color: '#555', marginBottom: 32, lineHeight: 22 },
});
