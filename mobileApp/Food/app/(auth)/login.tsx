import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { login } from '../../src/api/auth.api';
import { useI18n } from '../../src/i18n/useI18n';
import { useAuthStore } from '../../src/store/authStore';
import { roleUi } from '@/src/theme/roleUi';
import { AuthBlobs } from './_components/AuthBlobs';

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
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr]               = useState('');
  const [loading, setLoading]       = useState(false);
  const passwordRef = useRef<TextInput>(null);

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
      <AuthBlobs />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Image
              source={require('../../assets/images/avatarApp.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{t('auth.login.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color={roleUi.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.login.phonePlaceholder')}
              placeholderTextColor={roleUi.colors.textMuted}
              keyboardType="phone-pad"
              autoCapitalize="none"
              textContentType="telephoneNumber"
              autoComplete="tel"
              returnKeyType="next"
              value={identifier}
              onChangeText={setIdentifier}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={roleUi.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder={t('auth.login.passwordPlaceholder')}
              placeholderTextColor={roleUi.colors.textMuted}
              secureTextEntry={!showPassword}
              textContentType="password"
              autoComplete="current-password"
              returnKeyType="done"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={() => void onLogin()}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={roleUi.colors.textMuted}
              />
            </TouchableOpacity>
          </View>

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

          {err ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={roleUi.colors.dangerText} />
              <Text style={styles.error}>{err}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={onLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
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
  container:   { flex: 1, backgroundColor: roleUi.colors.pageBg, overflow: 'hidden' },
  scroll:      { flexGrow: 1, padding: 28, justifyContent: 'center' },
  header:      { alignItems: 'center', marginBottom: 28 },
  logo:        { width: 84, height: 84, borderRadius: 20, marginBottom: 14 },
  title:       { fontSize: 28, fontWeight: '700', color: roleUi.colors.textPrimary },
  subtitle:    { fontSize: 14, color: roleUi.colors.textSecondary, marginTop: 6 },
  inputWrap:   {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: roleUi.colors.surface,
    borderWidth: 1, borderColor: roleUi.colors.border,
    borderRadius: roleUi.radius.md, height: 52, paddingHorizontal: 14, marginBottom: 14,
  },
  inputIcon:   { marginRight: 10 },
  input:       { flex: 1, height: '100%', fontSize: 15, color: roleUi.colors.textPrimary },
  eyeBtn:      { paddingLeft: 8 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  rememberRow:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox:     { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, borderColor: '#BDBDBD', backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  checkboxActive: { backgroundColor: roleUi.colors.primary, borderColor: roleUi.colors.primary },
  checkmark:    { color: '#fff', fontSize: 11, fontWeight: '700', lineHeight: 14 },
  hint:         { color: roleUi.colors.textSecondary, fontSize: 13 },
  forgot:       { color: roleUi.colors.primary, fontSize: 13, fontWeight: '600' },
  errorBox:    {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: roleUi.colors.dangerSoft,
    borderRadius: roleUi.radius.sm, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14,
  },
  error:       { color: roleUi.colors.dangerText, fontSize: 13, flex: 1 },
  btn:         {
    backgroundColor: roleUi.colors.primary, borderRadius: roleUi.radius.md,
    height: 52, justifyContent: 'center', alignItems: 'center',
    shadowColor: roleUi.colors.primary, shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16, paddingHorizontal: 6, includeFontPadding: false },
  link:        { textAlign: 'center', color: roleUi.colors.textSecondary, fontSize: 14 },
  linkBold:    { color: roleUi.colors.primary, fontWeight: '700' },
});
