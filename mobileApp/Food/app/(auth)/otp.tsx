import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { verifyOtp, resendOtp } from '../../src/api/auth.api';
import { useI18n } from '../../src/i18n/useI18n';
import { useAuthStore } from '../../src/store/authStore';
import type { OtpPurpose } from '../../src/types';

const OTP_LENGTH = 4;
const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone_number: string; purpose: OtpPurpose }>();
  const { phone_number, purpose } = params;
  const { t } = useI18n();

  const setToken = useAuthStore((s) => s.setToken);
  const setUser  = useAuthStore((s) => s.setUser);

  const [digits, setDigits]   = useState(['', '', '', '']);
  const [err, setErr]         = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const inputs = [useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null), useRef<TextInput>(null)];

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleDigit = (val: string, idx: number) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...digits];
    next[idx] = val.slice(-1);
    setDigits(next);
    if (val && idx < OTP_LENGTH - 1) inputs[idx + 1].current?.focus();
  };

  const handleBackspace = (idx: number) => {
    if (digits[idx]) return;
    if (idx > 0) { inputs[idx - 1].current?.focus(); }
  };

  const onVerify = async () => {
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) { setErr(t('auth.otp.errorLength')); return; }

    try {
      setErr('');
      setLoading(true);
      const res = await verifyOtp({ phone_number, otp, purpose });

      if (purpose === 'SIGNUP') {
        // Set user TRƯỚC token: tránh trường hợp _layout useEffect fire
        // với (token=X, user=null) → gọi loadProfile() → race với navigate.
        if (res.data.user) setUser(res.data.user);
        await setToken(res.data.accessToken!);
        router.replace({ pathname: '/(auth)/confirmation', params: { title: 'OTP Successful!', message: 'Your Phone number has been registered\nchanged Successfully', redirectTo: '/(auth)/selectRole' } } as any);
      } else {
        router.replace({ pathname: '/(auth)/resetPassword' as any, params: { reset_token: res.data.reset_token } });
      }
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('auth.otp.errorInvalid'));
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (countdown > 0) return;
    try {
      await resendOtp({ phone_number, purpose });
      setCountdown(RESEND_SECONDS);
      setDigits(['', '', '', '']);
      setErr('');
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('auth.otp.errorResend'));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={styles.inner}>

          <Text style={styles.title}>{t('auth.otp.title')}</Text>
          <Text style={styles.sub}>
            {t('auth.otp.sentTo')} <Text style={styles.phone}>{phone_number}</Text>
          </Text>

          <View style={styles.boxes}>
            {digits.map((d, i) => (
              <TextInput
                key={i}
                ref={inputs[i]}
                style={[styles.box, d ? styles.boxFilled : null]}
                value={d}
                onChangeText={(v) => handleDigit(v, i)}
                onKeyPress={({ nativeEvent }) => nativeEvent.key === 'Backspace' && handleBackspace(i)}
                keyboardType="number-pad"
                maxLength={1}
                textAlign="center"
              />
            ))}
          </View>

          {err ? <Text style={styles.error}>{err}</Text> : null}

          <Text style={styles.resendInfo}>
            {countdown > 0 ? `${t('auth.otp.resendIn')} ${countdown}s` : ''}
          </Text>

          <TouchableOpacity style={styles.btn} onPress={onVerify} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('auth.otp.verify')}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={onResend} disabled={countdown > 0}>
            <Text style={[styles.resendLink, countdown > 0 && styles.resendDisabled]}>
              {t('auth.otp.noCode')}
            </Text>
          </TouchableOpacity>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  inner:     { flex: 1, padding: 28, justifyContent: 'center' },
  title:     { fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 12, color: '#111' },
  sub:       { textAlign: 'center', color: '#555', marginBottom: 32, lineHeight: 22 },
  phone:     { fontWeight: '700', color: '#111' },
  boxes:     { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 20 },
  box:       {
    width: 58, height: 58, borderRadius: 8,
    backgroundColor: '#E5E5E5', fontSize: 22, fontWeight: '700', color: '#111',
  },
  boxFilled: { backgroundColor: '#DBEAFE', borderColor: '#008080', borderWidth: 1.5 },
  error:     { color: '#E53935', textAlign: 'center', marginBottom: 8, fontSize: 13 },
  resendInfo: { textAlign: 'center', color: '#888', marginBottom: 24, fontSize: 13 },
  btn:       { backgroundColor: '#008080', borderRadius: 6, height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  btnText:   { color: '#fff', fontWeight: '700', fontSize: 16 },
  resendLink: { textAlign: 'center', color: '#008080', fontSize: 14 },
  resendDisabled: { color: '#AAA' },
});
