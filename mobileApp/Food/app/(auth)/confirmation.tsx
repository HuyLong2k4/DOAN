import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useI18n } from '../../src/i18n/useI18n';
import { roleUi } from '@/src/theme/roleUi';

type ConfirmationType = 'success' | 'error';

export default function Confirmation() {
    const router = useRouter();
    const { t }  = useI18n();
    const { title, message, redirectTo, type } = useLocalSearchParams<{
        title?: string;
        message?: string;
        redirectTo?: string;
        type?: ConfirmationType;
    }>();

    const isError        = type === 'error';
    const displayTitle   = title    ?? (isError ? t('auth.confirm.defaultErrorTitle') : t('auth.confirm.defaultSuccessTitle'));
    const displayMessage = message  ?? (isError ? t('auth.confirm.defaultErrorMsg') : t('auth.confirm.defaultSuccessMsg'));
    const target         = redirectTo ?? '/(auth)/login';

    useEffect(() => {
        if (isError) return;
        const timer = setTimeout(() => {
            router.replace(target as any);
        }, 2000);
        return () => clearTimeout(timer);
    }, [target, isError]);

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.frame}>
                <View style={[styles.iconCircle, isError ? styles.iconCircleError : styles.iconCircleSuccess]}>
                    <Ionicons name={isError ? 'close' : 'checkmark'} size={72} color="#fff" />
                </View>
                <Text style={styles.title}>{displayTitle}</Text>
                <Text style={styles.desc}>{displayMessage}</Text>
                {isError && (
                    <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
                        <Text style={styles.btnText}>{t('auth.confirm.tryAgain')}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container:          { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
    frame:              { alignItems: 'center', paddingHorizontal: 32 },
    iconCircle:         { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
    iconCircleSuccess:  { backgroundColor: roleUi.colors.success },
    iconCircleError:    { backgroundColor: roleUi.colors.danger },
    title:  { fontWeight: '700', fontSize: 22, color: '#111', marginBottom: 12, textAlign: 'center' },
    desc:   { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22 },
    btn:    { marginTop: 28, backgroundColor: '#111', borderRadius: 8, paddingVertical: 14, paddingHorizontal: 40 },
    btnText:{ color: '#fff', fontWeight: '600', fontSize: 15 },
});