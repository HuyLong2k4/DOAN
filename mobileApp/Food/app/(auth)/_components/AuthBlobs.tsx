import { StyleSheet, View } from 'react-native';
import { roleUi } from '@/src/theme/roleUi';

/**
 * Hai khối màu teal nhạt trang trí ở góc trên-phải và dưới-trái, dùng chung cho
 * các màn auth (login, register, forgot). Đặt ngay sau <SafeAreaView> (cần
 * `overflow: 'hidden'` ở container để cắt phần tràn) và trước nội dung form.
 */
export function AuthBlobs() {
  return (
    <>
      <View style={styles.blobTop} pointerEvents="none" />
      <View style={styles.blobBottom} pointerEvents="none" />
    </>
  );
}

const styles = StyleSheet.create({
  blobTop: {
    position: 'absolute', top: -90, right: -70,
    width: 240, height: 240, borderRadius: 120,
    backgroundColor: roleUi.colors.primarySoft,
  },
  blobBottom: {
    position: 'absolute', bottom: -110, left: -80,
    width: 260, height: 260, borderRadius: 130,
    backgroundColor: roleUi.colors.primarySoft,
  },
});
