import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { selectRole } from '../../src/api/auth.api';
import { useI18n } from '../../src/i18n/useI18n';
import { useAuthStore } from '../../src/store/authStore';
import type { UserRole } from '../../src/types';
import { roleUi } from '@/src/theme/roleUi';

export default function SelectRole() {
  const router   = useRouter();
  const setUser  = useAuthStore((s) => s.setUser);
  const { t } = useI18n();

  const ROLES: { key: UserRole; label: string; desc: string }[] = [
    { key: 'DONOR',     label: t('auth.role.donorLabel'),     desc: t('auth.role.donorDesc') },
    { key: 'RECEIVER',  label: t('auth.role.receiverLabel'),  desc: t('auth.role.receiverDesc') },
    { key: 'VOLUNTEER', label: t('auth.role.volunteerLabel'), desc: t('auth.role.volunteerDesc') },
  ];

  const [selected, setSelected] = useState<UserRole | null>(null);
  const [err, setErr]           = useState('');
  const [loading, setLoading]   = useState(false);

  const onContinue = async () => {
    if (!selected) { setErr(t('auth.role.errorSelect')); return; }
    try {
      setErr('');
      setLoading(true);
      const res = await selectRole({ role: selected });
      setUser(res.data.user);

      if (selected === 'DONOR')     router.replace('/(auth)/donorDetails' as any);
      if (selected === 'RECEIVER')  router.replace('/(auth)/receiverDetails' as any);
      if (selected === 'VOLUNTEER') router.replace('/(auth)/volunteerDetails' as any);
    } catch (e: any) {
      setErr(e?.response?.data?.message || t('auth.details.errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>

        <Text style={styles.title}>{t('auth.role.title')}</Text>
        <Text style={styles.sub}>{t('auth.role.subtitle')}</Text>

        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.key}
            style={[styles.card, selected === r.key && styles.cardSelected]}
            onPress={() => setSelected(r.key)}
            activeOpacity={0.8}
          >
            <View style={[styles.radio, selected === r.key && styles.radioSelected]}>
              {selected === r.key && <View style={styles.radioDot} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.roleLabel, selected === r.key && styles.roleLabelSelected]}>
                {r.label}
              </Text>
              <Text style={styles.roleDesc}>{r.desc}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {err ? <Text style={styles.error}>{err}</Text> : null}

        <TouchableOpacity style={styles.btn} onPress={onContinue} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('auth.role.continue')}</Text>}
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#F5F5F5' },
  inner:           { flex: 1, padding: 28, justifyContent: 'center' },
  title:           { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 6 },
  sub:             { color: '#666', marginBottom: 24, fontSize: 15 },
  card:            {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#fff', borderRadius: 8, padding: 16,
    borderWidth: 1.5, borderColor: '#E0E0E0', marginBottom: 12,
  },
  cardSelected:    { borderColor: roleUi.colors.primary, backgroundColor: '#EEF1F6' },
  radio:           { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center' },
  radioSelected:   { borderColor: roleUi.colors.primary },
  radioDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: roleUi.colors.primary },
  roleLabel:       { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 2 },
  roleLabelSelected: { color: roleUi.colors.primary },
  roleDesc:        { fontSize: 12, color: '#888' },
  error:           { color: roleUi.colors.danger, marginBottom: 12, fontSize: 13 },
  btn:             { backgroundColor: roleUi.colors.primary, borderRadius: 6, height: 50, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  btnText:         { color: '#fff', fontWeight: '700', fontSize: 16 },
});
