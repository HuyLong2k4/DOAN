import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '../../src/api/auth.api';
import { useI18n } from '../../src/i18n/useI18n';
import { useAuthStore } from '../../src/store/authStore';
import { roleUi } from '@/src/theme/roleUi';

const REMEMBER_KEY  = 'remember_me';
const IDENTIFIER_KEY = 'saved_identifier';
// Cố ý KHÔNG lưu mật khẩu — chỉ lưu identifier để pre-fill ô đăng nhập.
const LEGACY_PASSWORD_KEY = 'saved_password';

export default function Login() {
  const router   = useRouter();
  const setToken = useAuthStore((s) => s.setToken);
  const setUser  = useAuthStore((s) => s.setUser);
  const { t } = useI18n();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword]     = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr]               = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    (async () => {
      // Dọn password cũ (nếu phiên trước có lưu) — không bao giờ lưu lại nữa.
      await SecureStore.deleteItemAsync(LEGACY_PASSWORD_KEY).catch(() => {});

      const remembered = await SecureStore.getItemAsync(REMEMBER_KEY);
      if (remembered === 'true') {
        const savedId = await SecureStore.getItemAsync(IDENTIFIER_KEY);
        if (savedId) setIdentifier(savedId);
        setRememberMe(true);
      }
    })();
  }, []);

  const onLogin = async () => {
    if (!identifier || !password) {
      setErr(t('auth.login.errorEmpty')); return;
    }
    try {
      setErr('');
      setLoading(true);
      const res = await login({ identifier, password });

      if (rememberMe) {
        await SecureStore.setItemAsync(REMEMBER_KEY, 'true');
        await SecureStore.setItemAsync(IDENTIFIER_KEY, identifier);
      } else {
        await SecureStore.deleteItemAsync(REMEMBER_KEY);
        await SecureStore.deleteItemAsync(IDENTIFIER_KEY);
      }

      // setToken/setUser sẽ trigger _layout redirect tới authEntryRoute đúng vai trò.
      await setToken(res.data.accessToken);
      setUser(res.data.user);
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('auth.login.errorFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <Text style={styles.title}>{t('auth.login.title')}</Text>

          <TextInput
            style={styles.input}
            placeholder={t('auth.login.phonePlaceholder')}
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            autoCapitalize="none"
            value={identifier}
            onChangeText={setIdentifier}
          />
          <TextInput
            style={styles.input}
            placeholder={t('auth.login.passwordPlaceholder')}
            placeholderTextColor="#999"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <View style={styles.row}>
            <TouchableOpacity style={styles.rememberRow} onPress={() => setRememberMe((v) => !v)} activeOpacity={0.7}>
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.hint}>{t('auth.login.rememberMe')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(auth)/forgotPassword')}>
              <Text style={styles.forgot}>{t('auth.login.forgotPassword')}</Text>
            </TouchableOpacity>
          </View>

          {err ? <Text style={styles.error}>{err}</Text> : null}

          <TouchableOpacity style={styles.btn} onPress={onLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('auth.login.btn')}</Text>}
          </TouchableOpacity>

          <View style={{ height: 28 }} />

          <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.link}>{t('auth.login.noAccount')} <Text style={styles.linkBold}>{t('auth.login.signUp')}</Text></Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F5F5F5' },
  scroll:      { flexGrow: 1, padding: 28, justifyContent: 'center' },
  title:       { fontSize: 32, fontWeight: '700', color: '#111', marginBottom: 28 },
  input:       {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E0E0E0',
    borderRadius: 6, height: 50, paddingHorizontal: 14,
    fontSize: 15, color: '#111', marginBottom: 14,
  },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  rememberRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox:     { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#BDBDBD', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: roleUi.colors.primary, borderColor: roleUi.colors.primary },
  checkmark:    { color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 14 },
  hint:         { color: '#555', fontSize: 13 },
  forgot:       { color: roleUi.colors.primary, fontSize: 13 },
  error:       { color: roleUi.colors.danger, marginBottom: 12, fontSize: 13 },
  btn:         { backgroundColor: roleUi.colors.primary, borderRadius: 6, height: 50, justifyContent: 'center', alignItems: 'center' },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16 },
  divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: 22 },
  line:        { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  or:          { marginHorizontal: 12, color: '#999', fontSize: 13 },
  socialLabel: { textAlign: 'center', color: '#555', marginBottom: 12 },
  socialRow:   { flexDirection: 'row', justifyContent: 'center', gap: 16, marginBottom: 28 },
  socialBtn:   { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#E0E0E0', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  socialIcon:  { fontSize: 18, fontWeight: '700', color: '#333' },
  link:        { textAlign: 'center', color: '#555', fontSize: 14 },
  linkBold:    { color: roleUi.colors.primary, fontWeight: '700' },
});
