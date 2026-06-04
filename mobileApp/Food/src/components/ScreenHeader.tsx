import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { roleUi } from '@/src/theme/roleUi';

type Props = {
  title: string;
  /** Hiện nút quay lại (mặc định true). */
  back?: boolean;
  /** Handler quay lại tuỳ biến; mặc định router.back(). */
  onBack?: () => void;
  /** Slot tuỳ chọn ở mép phải (nút hành động, badge…). */
  right?: ReactNode;
};

/**
 * Header chuẩn cho các stack screen: nút back trái + tiêu đề căn trái + gạch
 * chân mảnh. Dùng chung để mọi màn đồng nhất chiều cao, cỡ chữ, vị trí.
 */
export function ScreenHeader({ title, back = true, onBack, right }: Props) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      {back ? (
        <TouchableOpacity
          onPress={onBack ?? (() => router.back())}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color={roleUi.colors.textPrimary} />
        </TouchableOpacity>
      ) : null}

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: roleUi.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: roleUi.colors.divider,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: -8, marginRight: 4,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: roleUi.colors.textPrimary,
  },
  right: { marginLeft: 12 },
});
