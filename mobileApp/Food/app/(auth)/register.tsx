import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { signup } from '../../src/api/auth.api';
import { useI18n } from '../../src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';
import { AuthBlobs } from './_components/AuthBlobs';

export default function Register() {
  const router = useRouter();
  const { t } = useI18n();

  const [full_name, setFullName] = useState('');
  const [phone_number, setPhoneNumber] = useState('');
  const [password, setPassword]               = useState('');
  const [confirm_password, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const [err, setErr]       = useState('');
  const [loading, setLoading] = useState(false);

  const phoneRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef  = useRef<TextInput>(null);

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
      <AuthBlobs />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          <View style={styles.header}>
            <Image
              source={require('../../assets/images/avatarApp.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>{t('auth.register.title')}</Text>
            <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={roleUi.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={t('auth.register.fullNamePlaceholder')}
              placeholderTextColor={roleUi.colors.textMuted}
              textContentType="name"
              autoComplete="name"
              returnKeyType="next"
              value={full_name}
              onChangeText={setFullName}
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color={roleUi.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              ref={phoneRef}
              style={styles.input}
              placeholder={t('auth.register.phonePlaceholder')}
              placeholderTextColor={roleUi.colors.textMuted}
              keyboardType="phone-pad"
              autoCapitalize="none"
              textContentType="telephoneNumber"
              autoComplete="tel"
              returnKeyType="next"
              value={phone_number}
              onChangeText={setPhoneNumber}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={roleUi.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              ref={passwordRef}
              style={styles.input}
              placeholder={t('auth.register.passwordPlaceholder')}
              placeholderTextColor={roleUi.colors.textMuted}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              autoComplete="password-new"
              returnKeyType="next"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={() => confirmRef.current?.focus()}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.eyeBtn}
            >
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={roleUi.colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={roleUi.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              ref={confirmRef}
              style={styles.input}
              placeholder={t('auth.register.confirmPlaceholder')}
              placeholderTextColor={roleUi.colors.textMuted}
              secureTextEntry={!showConfirm}
              textContentType="newPassword"
              autoComplete="password-new"
              returnKeyType="done"
              value={confirm_password}
              onChangeText={setConfirmPassword}
              onSubmitEditing={() => void onNext()}
            />
            <TouchableOpacity
              onPress={() => setShowConfirm((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.eyeBtn}
            >
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={roleUi.colors.textMuted} />
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
            onPress={onNext}
            disabled={loading}
            activeOpacity={0.85}
          >
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
  container:   { flex: 1, backgroundColor: roleUi.colors.pageBg, overflow: 'hidden' },
  scroll:      { flexGrow: 1, padding: 28, justifyContent: 'center' },
  header:      { alignItems: 'center', marginBottom: 24 },
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
  errorBox:    {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: roleUi.colors.dangerSoft,
    borderRadius: roleUi.radius.sm, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14,
  },
  error:       { color: roleUi.colors.dangerText, fontSize: 13, flex: 1 },
  btn:         {
    backgroundColor: roleUi.colors.primary, borderRadius: roleUi.radius.md,
    height: 52, justifyContent: 'center', alignItems: 'center', marginTop: 4,
    shadowColor: roleUi.colors.primary, shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16, paddingHorizontal: 6, includeFontPadding: false },
  link:        { textAlign: 'center', color: roleUi.colors.textSecondary, fontSize: 14 },
  linkBold:    { color: roleUi.colors.primary, fontWeight: '700' },
});
