import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { roleUi } from '@/src/theme/roleUi';

const c = roleUi.colors;
const r = roleUi.radius;

export type ContactOption = {
  key: string;
  label: string;
  sublabel?: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  options: ContactOption[];
  cancelLabel: string;
  onClose: () => void;
};

/**
 * Modal chọn đối tượng liên hệ (vd: tình nguyện viên / người tặng) — thay cho
 * Alert.alert native để đồng bộ với design system của app (card bo góc, màu
 * thương hiệu). Bấm nền hoặc nút huỷ để đóng.
 */
export function ContactChooserModal({ visible, title, message, options, cancelLabel, onClose }: Props) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Chặn sự kiện press lan ra nền khi bấm trong card. */}
        <Pressable style={styles.card} onPress={() => {}}>
          <Text style={styles.title}>{title}</Text>
          {message ? <Text style={styles.message}>{message}</Text> : null}

          {options.map((opt) => (
            <TouchableOpacity
              key={opt.key}
              style={styles.optionRow}
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                opt.onPress();
              }}
            >
              <View style={styles.optionIcon}>
                <Ionicons name={opt.icon} size={20} color={c.primaryStrong} />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionLabel} numberOfLines={1}>{opt.label}</Text>
                {opt.sublabel ? <Text style={styles.optionSub} numberOfLines={1}>{opt.sublabel}</Text> : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={c.textMuted} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={onClose}>
            <Text style={styles.cancelText}>{cancelLabel}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: c.surface,
    borderRadius: r.lg,
    padding: 18,
  },
  title: { fontSize: 17, fontWeight: '700', color: c.textPrimary },
  message: { fontSize: 14, color: c.textSecondary, lineHeight: 20, marginTop: 6, marginBottom: 14 },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: r.md,
    borderWidth: 1,
    borderColor: '#D5E0EC',
    backgroundColor: c.primarySoft,
    marginBottom: 8,
  },
  optionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: c.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTextWrap: { flex: 1 },
  optionLabel: { fontSize: 15, fontWeight: '700', color: c.primaryStrong },
  optionSub: { fontSize: 12, color: c.textSecondary, marginTop: 1 },
  cancelBtn: { marginTop: 4, paddingVertical: 11, alignItems: 'center', borderRadius: r.md },
  cancelText: { fontSize: 14, fontWeight: '600', color: c.textMuted },
});
