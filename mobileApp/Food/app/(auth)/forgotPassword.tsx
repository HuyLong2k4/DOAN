import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { forgotPassword } from '../../src/api/auth.api';
import { useI18n } from '../../src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';

export default function ForgotPassword() {
  const router = useRouter();
  const { t } = useI18n();

  const [identifier, setIdentifier] = useState('');
  const [err, setErr]               = useState('');
  const [loading, setLoading]       = useState(false);

  const onSendOtp = async () => {
    if (!identifier) { setErr(t('auth.forgot.errorEmpty')); return; }
    try {
      setErr('');
      setLoading(true);
      const res = await forgotPassword({ identifier });
      router.push({
        pathname: '/(auth)/otp' as any,
        params: { phone_number: res.data.phone_number, purpose: 'RESET_PASSWORD' },
      });
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('auth.forgot.errorNotFound'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>

        <Text style={styles.title}>{t('auth.forgot.title')}</Text>
        <Text style={styles.sub}>{t('auth.forgot.subtitle')}</Text>

        <TextInput
          style={styles.input}
          placeholder={t('auth.forgot.placeholder')}
          placeholderTextColor="#999"
          autoCapitalize="none"
          value={identifier}
          onChangeText={setIdentifier}
        />

        {err ? <Text style={styles.error}>{err}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={onSendOtp} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('auth.forgot.sendOtp')}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>{t('auth.forgot.backToLogin')}</Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  inner:     { flex: 1, padding: 28, justifyContent: 'center' },
  title:     { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 12 },
  sub:       { color: '#666', marginBottom: 28, lineHeight: 22 },
  input:     {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 6, height: 50, paddingHorizontal: 14,
    fontSize: 15, color: '#111', marginBottom: 14,
  },
  error:   { color: roleUi.colors.danger, marginBottom: 12, fontSize: 13 },
  btn:     { backgroundColor: roleUi.colors.primary, borderRadius: 6, height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  back:    { textAlign: 'center', color: roleUi.colors.primary, fontSize: 14 },
});
