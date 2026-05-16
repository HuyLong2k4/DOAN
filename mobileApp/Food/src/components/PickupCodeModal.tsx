import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useI18n } from '../i18n/useI18n';

const CODE_LENGTH = 4;

type PickupCodeModalProps = {
  visible: boolean;
  busy?: boolean;
  donationTitle?: string;
  error?: string | null;
  onClose: () => void;
  onSubmit: (code: string) => void;
  onClearError?: () => void;
};

export default function PickupCodeModal({
  visible,
  busy = false,
  donationTitle,
  error,
  onClose,
  onSubmit,
  onClearError,
}: PickupCodeModalProps) {
  const { t } = useI18n();
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!visible) setCode('');
  }, [visible]);

  useEffect(() => {
    if (error) setCode('');
  }, [error]);

  const handleChange = (value: string) => {
    setCode(value.replace(/\D/g, ''));
    if (error && onClearError) onClearError();
  };

  const handleConfirm = () => {
    const trimmed = code.trim();
    if (trimmed.length !== CODE_LENGTH) return;
    onSubmit(trimmed);
  };

  const submitDisabled = busy || code.trim().length !== CODE_LENGTH;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.card}>
          <View style={styles.headRow}>
            <Ionicons name="key-outline" size={20} color="#006666" />
            <Text style={styles.title}>{t('volunteer.pickupCode.title')}</Text>
          </View>

          {donationTitle ? (
            <Text style={styles.donation} numberOfLines={1}>
              {donationTitle}
            </Text>
          ) : null}

          <Text style={styles.hint}>{t('volunteer.pickupCode.hint')}</Text>

          <TextInput
            style={[styles.input, error && styles.inputError]}
            placeholder="0000"
            placeholderTextColor="#B0BEC5"
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            value={code}
            onChangeText={handleChange}
            autoFocus
          />

          {error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#C62828" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose} disabled={busy}>
              <Text style={styles.btnGhostText}>{t('volunteer.pickupCode.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, submitDisabled && styles.btnDisabled]}
              onPress={handleConfirm}
              disabled={submitDisabled}
            >
              {busy ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>{t('volunteer.pickupCode.confirm')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 14, padding: 18 },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  title: { fontSize: 16, fontWeight: '700', color: '#111' },
  donation: { fontSize: 13, color: '#555', marginBottom: 6 },
  hint: { fontSize: 13, color: '#666', lineHeight: 18, marginBottom: 14 },
  input: {
    borderWidth: 1,
    borderColor: '#006666',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 28,
    fontWeight: '700',
    color: '#006666',
    textAlign: 'center',
    letterSpacing: 14,
    backgroundColor: '#F5FAFF',
  },
  inputError: {
    borderColor: '#C62828',
    color: '#C62828',
    backgroundColor: '#FFF5F5',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  errorText: { fontSize: 12, color: '#C62828', flex: 1, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  btn: { flex: 1, paddingVertical: 11, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#006666' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnGhost: { borderWidth: 1, borderColor: '#CFD8DC' },
  btnGhostText: { color: '#37474F', fontWeight: '600', fontSize: 14 },
  btnDisabled: { opacity: 0.55 },
});
