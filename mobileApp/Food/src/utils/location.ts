import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };

// Cache GPS ở module-level (dùng chung mọi màn) để:
//  1) Không xin quyền / đọc GPS lặp lại mỗi lần focus màn.
//  2) Các màn khác nhau (home, donorList...) tính khoảng cách từ CÙNG một toạ độ
//     trong cửa sổ 60s → không bị lệch số km cho cùng một đơn.
const TTL_MS = 60_000;
let cached: { latitude: number; longitude: number; at: number } | null = null;

/**
 * Lấy GPS hiện tại (đã cache 60s). Trả về null nếu chưa được cấp quyền hoặc lỗi.
 */
export async function getCurrentGps(): Promise<Coords | null> {
  try {
    if (cached && Date.now() - cached.at < TTL_MS) {
      return { latitude: cached.latitude, longitude: cached.longitude };
    }

    const current = await Location.getForegroundPermissionsAsync();
    let status = current.status;
    if (status === 'undetermined') {
      const req = await Location.requestForegroundPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    cached = { latitude: loc.coords.latitude, longitude: loc.coords.longitude, at: Date.now() };
    return { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
  } catch {
    return null;
  }
}
