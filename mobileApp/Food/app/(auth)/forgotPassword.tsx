import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, Image, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { forgotPassword } from '../../src/api/auth.api';
import { useI18n } from '../../src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';
import { AuthBlobs } from './_components/AuthBlobs';

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
      <AuthBlobs />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.inner}>

        <View style={styles.header}>
          <Image
            source={require('../../assets/images/avatarApp.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>{t('auth.forgot.title')}</Text>
          <Text style={styles.sub}>{t('auth.forgot.subtitle')}</Text>
        </View>

        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={18} color={roleUi.colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.forgot.placeholder')}
            placeholderTextColor={roleUi.colors.textMuted}
            autoCapitalize="none"
            returnKeyType="done"
            value={identifier}
            onChangeText={setIdentifier}
            onSubmitEditing={() => void onSendOtp()}
          />
        </View>

        {err ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={roleUi.colors.dangerText} />
            <Text style={styles.error}>{err}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={onSendOtp}
          disabled={loading}
          activeOpacity={0.85}
        >
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
  container:   { flex: 1, backgroundColor: roleUi.colors.pageBg, overflow: 'hidden' },
  inner:       { flex: 1, padding: 28, justifyContent: 'center' },
  header:      { alignItems: 'center', marginBottom: 28 },
  logo:        { width: 84, height: 84, borderRadius: 20, marginBottom: 14 },
  title:       { fontSize: 26, fontWeight: '700', color: roleUi.colors.textPrimary },
  sub:         { fontSize: 14, color: roleUi.colors.textSecondary, marginTop: 6, textAlign: 'center', lineHeight: 22 },
  inputWrap:   {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: roleUi.colors.surface,
    borderWidth: 1, borderColor: roleUi.colors.border,
    borderRadius: roleUi.radius.md, height: 52, paddingHorizontal: 14, marginBottom: 14,
  },
  inputIcon:   { marginRight: 10 },
  input:       { flex: 1, height: '100%', fontSize: 15, color: roleUi.colors.textPrimary },
  errorBox:    {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: roleUi.colors.dangerSoft,
    borderRadius: roleUi.radius.sm, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 14,
  },
  error:       { color: roleUi.colors.dangerText, fontSize: 13, flex: 1 },
  btn:         {
    backgroundColor: roleUi.colors.primary, borderRadius: roleUi.radius.md,
    height: 52, justifyContent: 'center', alignItems: 'center', marginBottom: 20,
    shadowColor: roleUi.colors.primary, shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#fff', fontWeight: '700', fontSize: 16, paddingHorizontal: 6, includeFontPadding: false },
  back:        { textAlign: 'center', color: roleUi.colors.primary, fontSize: 14, fontWeight: '600' },
});
