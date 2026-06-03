import { Ionicons } from '@expo/vector-icons';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { DeliveryRequest, TFn } from './types';
import { roleUi } from '@/src/theme/roleUi';

type Props = {
  target: DeliveryRequest | null;
  busy: boolean;
  onClose: () => void;
  onConfirm: (target: DeliveryRequest) => void;
  t: TFn;
};

export function ConfirmAcceptModal({ target, busy, onClose, onConfirm, t }: Props) {
  return (
    <Modal transparent visible={Boolean(target)} animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={onClose}>
            <Ionicons name="close" size={16} color="#333" />
          </TouchableOpacity>

          <View style={styles.modalIconWrap}>
            <Ionicons name="bicycle-outline" size={28} color="#2B2B2B" />
          </View>

          <Text style={styles.modalMessage}>
            {target
              ? `${t('volunteer.confirmAcceptPrefix')} ${target.title} ${t('volunteer.confirmAcceptMiddle')} ${target.address}?`
              : ''}
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalNoBtn]}
              onPress={onClose}
              disabled={busy}
            >
              <Text style={styles.modalNoText}>{t('volunteer.no')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalBtn, styles.modalYesBtn, busy && styles.disabled]}
              onPress={() => target && onConfirm(target)}
              disabled={busy}
            >
              <Text style={styles.modalYesText}>{t('volunteer.yes')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 12, padding: 18, alignItems: 'center' },
  modalCloseBtn: { position: 'absolute', top: 10, right: 10, padding: 6 },
  modalIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#F0F0F0', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalMessage: { fontSize: 14, color: '#222', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  modalActions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  modalBtn: { flex: 1, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  modalNoBtn: { borderWidth: 1, borderColor: '#CFD8DC' },
  modalNoText: { color: '#4A4A4A', fontWeight: '600', fontSize: 13 },
  modalYesBtn: { backgroundColor: roleUi.colors.primaryStrong },
  modalYesText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  disabled: { opacity: 0.55 },
});
