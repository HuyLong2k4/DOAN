import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signup } from '../../src/api/auth.api';
import { useI18n } from '../../src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';

export default function Register() {
  const router = useRouter();
  const { t } = useI18n();

  const [full_name, setFullName] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [password, setPassword]               = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(false);

  const onNext = async () => {
    if (!full_name.trim() || !phone_number || !password || !confirm_password) {
      setErr(t('auth.register.errorEmpty')); return;
    }
    if (password !== confirm_password) {
      setErr(t('auth.register.errorPasswordMatch')); return;
    }
    if (password.length < 6) {
      setErr(t('auth.register.errorPasswordLength')); return;
    }

    try {
      setErr('');
      setLoading(true);
      await signup({ full_name: full_name.trim(), phone_number, password, confirm_password });
      router.push({ pathname: '/(auth)/otp', params: { phone_number, purpose: 'SIGNUP' } });
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('auth.register.errorFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.title}>{t('auth.register.title')}</Text>

          <TextInput
            style={styles.input}
            placeholder={t('auth.register.fullNamePlaceholder')}
            placeholderTextColor="#999"
            value={full_name}
            onChangeText={setFullName}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.register.phonePlaceholder')}
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            value={phone_number}
            onChangeText={setPhoneNumber}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.register.passwordPlaceholder')}
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.register.confirmPlaceholder')}
            placeholderTextColor="#999"
            secureTextEntry
            value={confirm_password}
            onChangeText={setConfirmPassword}
          />

          {err ? <Text style={styles.error}>{err}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={onNext} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('auth.register.btn')}</Text>}
          </TouchableOpacity>

          <View style={{ height: 28 }} />

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.link}>{t('auth.register.haveAccount')} <Text style={styles.linkBold}>{t('auth.register.loginLink')}</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  scroll:    { flexGrow: 1, padding: 28, justifyContent: 'center' },
  title:     { fontSize: 32, fontWeight: '700', color: '#111', marginBottom: 32 },
  input:     {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 6, height: 50, paddingHorizontal: 14,
    fontSize: 15, color: '#111', marginBottom: 14,
  },
  error:     { color: roleUi.colors.danger, marginBottom: 12, fontSize: 13 },
  btn:       { backgroundColor: roleUi.colors.primary, borderRadius: 6, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  divider:   { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  line:      { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  or:        { marginHorizontal: 12, color: '#999', fontSize: 13 },
  socialLabel: { textAlign: 'center', color: '#555', marginBottom: 12 },
  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 28 },
  socialBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  socialIcon: { fontSize: 18, fontWeight: '700', color: '#333' },
  link:      { textAlign: 'center', color: '#555', fontSize: 14 },
  linkBold:  { color: roleUi.colors.primary, fontWeight: '700' },
});
