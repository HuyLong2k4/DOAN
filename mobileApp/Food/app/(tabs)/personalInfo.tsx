import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyProfile } from "../../src/api/profile.api";
import { uploadAvatar } from "../../src/api/user.api";
import { useI18n } from "../../src/i18n/useI18n";
import { useAuthStore } from "../../src/store/authStore";

type ProfileDetails = {
  address_line?: string | null;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function prettyRole(role?: string) {
  if (!role) return '';
  return role.charAt(0) + role.slice(1).toLowerCase();
}

function formatAddress(profile: ProfileDetails | null): string {
  if (!profile) return '';
  const compactAddress = [profile.address_line, profile.city]
    .filter((v) => typeof v === "string" && v.trim().length > 0)
    .join(", ");
  return compactAddress;
}

function hasPin(profile: ProfileDetails | null) {
  return Boolean(Number.isFinite(profile?.latitude) && Number.isFinite(profile?.longitude));
}

function formatCoordinate(value?: number | null) {
  return Number.isFinite(value) ? Number(value).toFixed(6) : null;
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function PersonalInfoScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { t } = useI18n();

  const [profile, setProfile] = useState<ProfileDetails | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handlePickAvatar = async () => {
    if (uploadingAvatar) return;

    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (perm.status !== 'granted') {
      Alert.alert(t('personalInfo.avatarUploadFailed'), t('personalInfo.permissionDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const fileName = asset.fileName || `avatar-${Date.now()}.jpg`;
    const mimeType = asset.mimeType || 'image/jpeg';

    try {
      setUploadingAvatar(true);
      const res = await uploadAvatar({ uri: asset.uri, name: fileName, type: mimeType });
      const updated = res.data?.data;
      if (updated && user) {
        setUser({ ...user, avatar_url: updated.avatar_url ?? null });
      }
    } catch (err: any) {
      const message = err?.response?.data?.message || t('personalInfo.avatarUploadFailed');
      Alert.alert(t('personalInfo.avatarUploadFailed'), message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const loadProfile = useCallback(async () => {
    try {
      const res = await getMyProfile();
      const data = res.data?.data;
      setProfile((data?.profile as ProfileDetails | null) ?? null);
      if (data?.user) setUser(data.user);
    } catch {
      setProfile(null);
    }
  }, [setUser]);

  useFocusEffect(
    useCallback(() => {
      loadProfile().finally(() => setLoadingProfile(false));
    }, [loadProfile]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, [loadProfile]);

  const notUpdated = t('personalInfo.notUpdated');
  const fullName = user?.full_name?.trim() || notUpdated;
  const email = user?.email?.trim() || notUpdated;
  const phoneNumber = user?.phone_number?.trim() || notUpdated;
  const role = prettyRole(user?.role) || notUpdated;
  const accountStatus = user?.profile_completed ? t('personalInfo.completed') : t('personalInfo.incomplete');
  const verifyStatus = user?.is_phone_verified ? t('personalInfo.verified') : t('personalInfo.notVerified');

  const pinSet = hasPin(profile);
  const latitudeText = formatCoordinate(profile?.latitude);
  const longitudeText = formatCoordinate(profile?.longitude);
  const addressText = formatAddress(profile) || notUpdated;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/(tabs)/profile" as any)} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#111" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('personalInfo.title')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#008080" colors={['#008080']} />}
      >
        <View style={styles.profileCard}>
          <TouchableOpacity
            onPress={handlePickAvatar}
            activeOpacity={0.8}
            disabled={uploadingAvatar}
            accessibilityLabel={t('personalInfo.changeAvatar')}
          >
            <View style={styles.avatar}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={42} color="#fff" />
              )}
              {uploadingAvatar && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.roleText}>{role}</Text>
        </View>

        <View style={styles.pinCard}>
          <View style={styles.pinHeader}>
            <Ionicons name="location" size={18} color={pinSet ? "#047857" : "#B45309"} />
            <Text style={styles.pinTitle}>{t('personalInfo.pinLocation')}</Text>
            <View style={[styles.pinBadge, pinSet ? styles.pinBadgeSet : styles.pinBadgeUnset]}>
              <Text style={[styles.pinBadgeText, pinSet ? styles.pinBadgeTextSet : styles.pinBadgeTextUnset]}>
                {loadingProfile ? t('personalInfo.loading') : pinSet ? t('personalInfo.set') : t('personalInfo.notSet')}
              </Text>
            </View>
          </View>

          <Text style={styles.pinSubText}>
            {pinSet && latitudeText && longitudeText
              ? `Lat: ${latitudeText} | Lng: ${longitudeText}`
              : t('personalInfo.locationNotPinned')}
          </Text>

          <View style={styles.addressBlock}>
            <Text style={styles.addressLabel}>{t('personalInfo.addressLabel')}</Text>
            <Text style={styles.addressValue}>{loadingProfile ? t('personalInfo.loading') : addressText}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <InfoRow label={t('personalInfo.fullName')} value={fullName} />
          <InfoRow label={t('personalInfo.email')} value={email} />
          <InfoRow label={t('personalInfo.phone')} value={phoneNumber} />
          <InfoRow label={t('personalInfo.role')} value={role} />
          <InfoRow label={t('personalInfo.phoneVerification')} value={verifyStatus} />
          <InfoRow label={t('personalInfo.profileStatus')} value={accountStatus} />
        </View>

        {loadingProfile ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color="#111" size="small" />
            <Text style={styles.loadingText}>{t('personalInfo.fetchingPin')}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  scrollContent: {
    paddingBottom: 28,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111",
  },
  headerSpacer: {
    width: 40,
  },
  profileCard: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: "#111827",
    paddingVertical: 22,
    alignItems: "center",
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    overflow: "hidden",
    position: "relative",
  },
  avatarImg: {
    width: 78,
    height: 78,
    borderRadius: 39,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 39,
  },
  avatarBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#008080",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  roleText: {
    marginTop: 4,
    color: "#CBD5E1",
    fontSize: 14,
    fontWeight: "600",
  },
  pinCard: {
    marginTop: 12,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  pinHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pinTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  pinBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pinBadgeSet: {
    backgroundColor: "#ECFDF3",
  },
  pinBadgeUnset: {
    backgroundColor: "#FFFBEB",
  },
  pinBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  pinBadgeTextSet: {
    color: "#047857",
  },
  pinBadgeTextUnset: {
    color: "#B45309",
  },
  pinSubText: {
    marginTop: 8,
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 18,
  },
  addressBlock: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEF2F7",
    paddingTop: 10,
  },
  addressLabel: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 4,
  },
  addressValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "600",
    lineHeight: 20,
  },
  section: {
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  infoRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF2F7",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 16,
    color: "#111827",
    fontWeight: "600",
  },
  loadingRow: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: "#6B7280",
  },
});
