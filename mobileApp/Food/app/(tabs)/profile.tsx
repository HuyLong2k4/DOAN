import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { logout as apiLogout } from "../../src/api/auth.api";
import { useI18n } from "../../src/i18n/useI18n";
import { useAuthStore } from "../../src/store/authStore";

export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const clear  = useAuthStore((s) => s.clear);
  const role   = useAuthStore((s) => s.user?.role);
  const rewardsLabelKey = role === 'RECEIVER' ? 'profile.myActivity' : 'profile.rewards';

  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('profile.signOutTitle'), t('profile.signOutConfirm'), [
      { text: t('profile.cancel'), style: 'cancel' },
      {
        text: t('profile.signOut'), style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await apiLogout();
          } catch { /* silent */ } finally {
            await clear();
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.divider} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <View style={styles.menu}>
          <MenuItem label={t('profile.personalInfo')} onPress={() => router.push('/(tabs)/personalInfo' as any)} />
          {role === 'DONOR' && (
            <MenuItem label={t('profile.yourDonations')} onPress={() => router.push('/(stack)/DONOR/historyDonation' as any)} />
          )}
          {role === 'VOLUNTEER' && (
            <MenuItem label={t('profile.yourDeliveries')} onPress={() => router.push('/(stack)/VOLUNTEER/historyDelivery' as any)} />
          )}
          <MenuItem label={t(rewardsLabelKey)} onPress={() => router.push('/(stack)/REWARD/rewards' as any)} />
          <MenuItem label={t('profile.settings')} onPress={() => router.push('/(stack)/SETTINGS/settings' as any)} />
          <MenuItem label={t('profile.help')} onPress={() => router.push('/(stack)/HELP/help' as any)} last />
        </View>

        <View style={styles.divider} />

        <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#111" />
            : <Text style={styles.signOutText}>{t('profile.signOut')}</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MenuItem({ label, onPress, last }: { label: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity
      style={[styles.menuItem, last && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={styles.menuLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff' },
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  backBtn:      { width: 40, height: 40, justifyContent: 'center' },
  headerTitle:  { fontSize: 18, fontWeight: '700', color: '#111' },
  divider:      { height: 1, backgroundColor: '#E8E8E8' },
  scroll:       { paddingBottom: 40 },
  menu:         { paddingHorizontal: 24, paddingTop: 8 },
  menuItem:     { paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  menuItemLast: { borderBottomWidth: 0 },
  menuLabel:    { fontSize: 16, color: '#111' },
  signOutBtn:   { marginTop: 24, alignItems: 'center', paddingVertical: 16 },
  signOutText:  { fontSize: 18, fontWeight: '600', color: '#111' },
});
