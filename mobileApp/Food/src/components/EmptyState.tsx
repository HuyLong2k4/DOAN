import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { roleUi } from '../theme/roleUi';

const c = roleUi.colors;
const r = roleUi.radius;

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * Empty state dùng chung cho 3 màn home (và nơi khác): icon trong vòng tròn nhạt
 * + dòng tiêu đề + dòng phụ (tuỳ chọn), trong một card viền nhất quán. Giúp các
 * trạng thái rỗng "cùng nhịp" thay vì mỗi màn một kiểu chữ trơn.
 */
export default function EmptyState({ icon = 'file-tray-outline', title, subtitle, style }: EmptyStateProps) {
  return (
    <View style={[styles.box, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={22} color={c.textMuted} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: c.surface,
    borderRadius: r.lg,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 22,
    paddingHorizontal: 18,
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 13, fontWeight: '600', color: c.textSecondary, textAlign: 'center' },
  subtitle: { fontSize: 12, color: c.textMuted, textAlign: 'center', marginTop: 4 },
});
