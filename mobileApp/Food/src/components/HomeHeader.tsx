import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from 'react-native';
import { useI18n } from '../i18n/useI18n';
import { roleUi } from '../theme/roleUi';
import NotificationBell from './NotificationBell';

const c = roleUi.colors;

interface HomeHeaderProps {
  greeting: string;     // vd: t('donor.greeting')
  firstName: string;
  rolePrefix: string;   // vd: t('donor.rolePrefix')
  roleLabel: string;    // vd: t('donor.role')
  bellSize?: number;
  /** Spacing ngoài (padding/margin) riêng theo từng màn — ghi đè base row. */
  containerStyle?: StyleProp<ViewStyle>;
}

/**
 * Header dùng chung cho 3 màn home (Donor/Receiver/Volunteer):
 * lời chào + vai trò bên trái, pill đổi ngôn ngữ VI/EN + chuông thông báo bên phải.
 */
export default function HomeHeader({
  greeting,
  firstName,
  rolePrefix,
  roleLabel,
  bellSize = 26,
  containerStyle,
}: HomeHeaderProps) {
  const { language, setLanguage } = useI18n();

  return (
    <View style={[styles.header, containerStyle]}>
      <View style={styles.textWrap}>
        <Text style={styles.greeting}>{greeting} {firstName}</Text>
        <View style={styles.roleRow}>
          <Text style={styles.roleText}>{rolePrefix} </Text>
          <Text style={styles.roleBold}>{roleLabel}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
          style={styles.langPill}
          activeOpacity={0.85}
        >
          <Text style={styles.langPillText}>{language === 'vi' ? 'VI' : 'EN'}</Text>
        </TouchableOpacity>
        <NotificationBell size={bellSize} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  textWrap: { flexShrink: 1, marginRight: 8 },
  greeting: { fontSize: 16, color: c.textSecondary },
  roleRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  roleText: { fontSize: 20, color: c.textPrimary },
  roleBold: { fontSize: 20, fontWeight: '800', color: c.textPrimary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langPill: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: c.surface,
  },
  langPillText: { fontSize: 12, fontWeight: '700', color: c.textPrimary },
});
