import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useI18n } from '../i18n/useI18n';
import { roleUi } from '../theme/roleUi';

type ClaimQuantityModalProps = {
  visible: boolean;
  maxQuantity: number;
  unit?: string;
  title?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: (quantity: number) => void;
};

function normalizeMaxQuantity(value: number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 1;
  return Math.max(1, Math.floor(numeric));
}

function clampQuantity(value: number, maxQuantity: number) {
  return Math.min(maxQuantity, Math.max(1, value));
}

export default function ClaimQuantityModal({
  visible,
  maxQuantity,
  unit,
  title,
  loading = false,
  onCancel,
  onConfirm,
}: ClaimQuantityModalProps) {
  const { t } = useI18n();
  const safeMaxQuantity = useMemo(() => normalizeMaxQuantity(maxQuantity), [maxQuantity]);
  const unitLabel = unit || t('receiver.portion');
  const [input, setInput] = useState('1');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!visible) return;
    setInput('1');
    setError('');
  }, [visible, safeMaxQuantity]);

  const parsedQuantity = Number(input);
  const quantityIsValid =
    Number.isSafeInteger(parsedQuantity) &&
    parsedQuantity >= 1 &&
    parsedQuantity <= safeMaxQuantity;

  const setQuantity = (nextQuantity: number) => {
    setInput(String(clampQuantity(Math.floor(nextQuantity), safeMaxQuantity)));
    setError('');
  };

  const onChangeQuantityText = (text: string) => {
    setInput(text.replace(/[^0-9]/g, ''));
    setError('');
  };

  const handleConfirm = () => {
    if (!quantityIsValid) {
      setError(t('receiver.claimInvalid'));
      return;
    }
    onConfirm(parsedQuantity);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel}>
        <Pressable style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>{t('receiver.claimQuantityTitle')}</Text>
              {title ? <Text style={styles.subtitle} numberOfLines={1}>{title}</Text> : null}
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onCancel} disabled={loading}>
              <Ionicons name="close" size={20} color={roleUi.colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.availableBox}>
            <Text style={styles.availableLabel}>{t('receiver.claimAvailable')}</Text>
            <Text style={styles.availableValue}>{safeMaxQuantity} {unitLabel}</Text>
          </View>

          <Text style={styles.inputLabel}>{t('receiver.claimQuantityLabel')}</Text>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={[styles.stepperBtn, (!quantityIsValid || parsedQuantity <= 1 || loading) && styles.stepperBtnDisabled]}
              onPress={() => setQuantity((quantityIsValid ? parsedQuantity : 1) - 1)}
              disabled={!quantityIsValid || parsedQuantity <= 1 || loading}
            >
              <Ionicons name="remove" size={18} color={roleUi.colors.primaryStrong} />
            </TouchableOpacity>

            <TextInput
              value={input}
              onChangeText={onChangeQuantityText}
              keyboardType="number-pad"
              maxLength={String(safeMaxQuantity).length}
              editable={!loading}
              style={styles.quantityInput}
              textAlign="center"
            />

            <TouchableOpacity
              style={[styles.stepperBtn, (!quantityIsValid || parsedQuantity >= safeMaxQuantity || loading) && styles.stepperBtnDisabled]}
              onPress={() => setQuantity((quantityIsValid ? parsedQuantity : 1) + 1)}
              disabled={!quantityIsValid || parsedQuantity >= safeMaxQuantity || loading}
            >
              <Ionicons name="add" size={18} color={roleUi.colors.primaryStrong} />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.allBtn}
              onPress={() => setQuantity(safeMaxQuantity)}
              disabled={loading}
            >
              <Text style={styles.allBtnText}>{t('receiver.claimAll')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, loading && styles.confirmBtnDisabled]}
              onPress={handleConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>{t('receiver.claimConfirm')}</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.38)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: roleUi.colors.surface,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  headerTextWrap: { flex: 1 },
  title: { fontSize: 18, fontWeight: '700', color: roleUi.colors.textPrimary },
  subtitle: { marginTop: 2, fontSize: 13, color: roleUi.colors.textSecondary },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: roleUi.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: roleUi.colors.border,
  },
  availableBox: {
    borderWidth: 1,
    borderColor: roleUi.colors.border,
    borderRadius: roleUi.radius.md,
    backgroundColor: roleUi.colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  availableLabel: { fontSize: 12, color: roleUi.colors.textSecondary },
  availableValue: { marginTop: 2, fontSize: 16, fontWeight: '700', color: roleUi.colors.textPrimary },
  inputLabel: {
    fontSize: 12,
    color: roleUi.colors.textSecondary,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: roleUi.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D5E0EC',
    backgroundColor: roleUi.colors.primarySoft,
  },
  stepperBtnDisabled: { opacity: 0.45 },
  quantityInput: {
    flex: 1,
    height: 44,
    borderRadius: roleUi.radius.md,
    borderWidth: 1,
    borderColor: roleUi.colors.border,
    color: roleUi.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: roleUi.colors.surface,
  },
  errorText: { marginTop: 8, fontSize: 12, color: roleUi.colors.dangerText },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  allBtn: {
    flex: 1,
    height: 46,
    borderRadius: roleUi.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D5E0EC',
    backgroundColor: roleUi.colors.primarySoft,
  },
  allBtnText: { fontSize: 14, color: roleUi.colors.primaryStrong, fontWeight: '700' },
  confirmBtn: {
    flex: 1,
    height: 46,
    borderRadius: roleUi.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: roleUi.colors.primary,
  },
  confirmBtnDisabled: { opacity: 0.65 },
  confirmBtnText: { fontSize: 14, color: '#fff', fontWeight: '700' },
});
