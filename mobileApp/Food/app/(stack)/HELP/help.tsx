import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../../../src/i18n/useI18n';
import type { TranslationKey } from '../../../src/i18n/translations';

const FAQS: { q: TranslationKey; a: TranslationKey }[] = [
  { q: 'help.q1', a: 'help.a1' },
  { q: 'help.q2', a: 'help.a2' },
  { q: 'help.q3', a: 'help.a3' },
];

export default function HelpScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('help.title')}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('help.faqTitle')}</Text>
        <View style={styles.card}>
          {FAQS.map((item, idx) => {
            const open = openIdx === idx;
            const isLast = idx === FAQS.length - 1;
            return (
              <View key={item.q} style={[styles.faqItem, isLast && styles.faqItemLast]}>
                <TouchableOpacity
                  style={styles.faqHead}
                  onPress={() => setOpenIdx(open ? null : idx)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqQ}>{t(item.q)}</Text>
                  <Ionicons
                    name={open ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#666"
                  />
                </TouchableOpacity>
                {open && <Text style={styles.faqA}>{t(item.a)}</Text>}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>{t('help.contactTitle')}</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL(`mailto:${t('help.email')}`)}
            activeOpacity={0.7}
          >
            <View style={styles.contactIconWrap}>
              <Ionicons name="mail-outline" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactValue}>{t('help.email')}</Text>
              <Text style={styles.contactHint}>{t('help.tapEmail')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#BBB" />
          </TouchableOpacity>

          <View style={styles.contactDivider} />

          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => Linking.openURL(`tel:${t('help.phone').replace(/\s+/g, '')}`)}
            activeOpacity={0.7}
          >
            <View style={[styles.contactIconWrap, { backgroundColor: '#4CAF50' }]}>
              <Ionicons name="call-outline" size={18} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactValue}>{t('help.phone')}</Text>
              <Text style={styles.contactHint}>{t('help.tapPhone')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#BBB" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#F5F5F5' },
  header:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 10 },
  headerTitle:      { fontSize: 16, fontWeight: '700', color: '#111' },
  scroll:           { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 32 },
  sectionTitle:     { fontSize: 13, fontWeight: '700', color: '#666', marginTop: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card:             { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden' },
  faqItem:          { paddingHorizontal: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  faqItemLast:      { borderBottomWidth: 0 },
  faqHead:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  faqQ:             { flex: 1, fontSize: 14, color: '#111', fontWeight: '600' },
  faqA:             { fontSize: 13, color: '#555', lineHeight: 19, marginTop: 8 },
  contactRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  contactIconWrap:  { width: 36, height: 36, borderRadius: 18, backgroundColor: '#008080', justifyContent: 'center', alignItems: 'center' },
  contactValue:     { fontSize: 14, color: '#111', fontWeight: '600' },
  contactHint:      { fontSize: 12, color: '#888', marginTop: 2 },
  contactDivider:   { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 14 },
});
