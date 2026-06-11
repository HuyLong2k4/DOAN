/**
 * Distance helpers — ước lượng khoảng cách hai tầng + toạ độ viewer.
 *
 *  - Tầng chính:    Google Distance Matrix (quãng đường đường bộ thực tế) khi có
 *                   GOOGLE_MAPS_API_KEY.
 *  - Tầng dự phòng: công thức Haversine (đường chim bay) khi không có khoá,
 *                   API lỗi, timeout hoặc mất mạng.
 *
 * Kết quả đường bộ được cache in-memory (TTL 10 phút, khoá là cặp toạ độ đã làm
 * tròn ~111 m) để nhiều người ở gần nhau dùng chung, giảm mạnh số lượt gọi API.
 */

const DonorProfile = require('../../models/donorProfileModel');
const ReceiverProfile = require('../../models/receiverProfileModel');
const VolunteerProfile = require('../../models/volunteerProfileModel');

function toRad(value) {
    return (value * Math.PI) / 180;
}

// (0,0) là default lúc seed → Vịnh Guinea, không phải vị trí thật. Reject để
// tránh tính khoảng cách sai hàng nghìn km.
function isValidCoord(lat, lon) {
    if (lat == null || lon == null) return false;
    if (typeof lat !== 'number' || typeof lon !== 'number') return false;
    if (Number.isNaN(lat) || Number.isNaN(lon)) return false;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return false;
    if (Math.abs(lat) < 1e-6 && Math.abs(lon) < 1e-6) return false;
    return true;
}

/**
 * Haversine — khoảng cách đường chim bay (km).
 */
function distanceKm(lat1, lon1, lat2, lon2) {
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
}

// ── Tầng chính: Google Distance Matrix (đường bộ) + cache ────────────────────

const DISTANCE_MATRIX_ENDPOINT = 'https://maps.googleapis.com/maps/api/distancematrix/json';
const ROAD_CACHE_TTL_MS = 10 * 60 * 1000; // 10 phút
const ROAD_API_TIMEOUT_MS = 4000;
const roadCache = new Map(); // key -> { km, expires }

// Làm tròn ~111 m (3 chữ số thập phân). Nhờ làm tròn, các điểm rất gần nhau cùng
// trỏ về một khoá cache; khi đổi địa chỉ thì khoá đổi theo nên tự hết hiệu lực.
function roundCoord(value) {
    return Math.round(value * 1000) / 1000;
}

function roadCacheKey(lat1, lon1, lat2, lon2) {
    return `${roundCoord(lat1)},${roundCoord(lon1)}|${roundCoord(lat2)},${roundCoord(lon2)}`;
}

/**
 * Khoảng cách hai tầng có suy giảm an toàn (km). Luôn trả về một giá trị hợp lệ
 * nếu toạ độ hợp lệ: ưu tiên đường bộ, hỏng thì tự quay về Haversine.
 */
async function roadDistanceKm(lat1, lon1, lat2, lon2) {
    if (!isValidCoord(lat1, lon1) || !isValidCoord(lat2, lon2)) return null;

    const fallback = distanceKm(lat1, lon1, lat2, lon2);

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) return fallback;

    const key = roadCacheKey(lat1, lon1, lat2, lon2);
    const cached = roadCache.get(key);
    if (cached && cached.expires > Date.now()) return cached.km;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ROAD_API_TIMEOUT_MS);
    try {
        const url = new URL(DISTANCE_MATRIX_ENDPOINT);
        url.searchParams.set('origins', `${lat1},${lon1}`);
        url.searchParams.set('destinations', `${lat2},${lon2}`);
        url.searchParams.set('mode', 'driving');
        url.searchParams.set('key', apiKey);

        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`Distance Matrix HTTP ${res.status}`);
        const json = await res.json();

        const element = json?.rows?.[0]?.elements?.[0];
        if (json?.status !== 'OK' || element?.status !== 'OK' || typeof element?.distance?.value !== 'number') {
            return fallback;
        }

        const km = element.distance.value / 1000;
        roadCache.set(key, { km, expires: Date.now() + ROAD_CACHE_TTL_MS });
        return km;
    } catch (err) {
        // Mất mạng / timeout / lỗi API → suy giảm an toàn về Haversine.
        return fallback;
    } finally {
        clearTimeout(timer);
    }
}

/**
 * Lấy toạ độ của viewer (donor / receiver / volunteer) từ profile.
 */
async function getViewerLocation(viewer = null) {
    if (!viewer?.id || !viewer?.role) return null;

    if (viewer.role === 'DONOR') {
        const donor = await DonorProfile.findOne({ user_id: viewer.id }).select('latitude longitude').lean();
        if (!isValidCoord(donor?.latitude, donor?.longitude)) return null;
        return { latitude: donor.latitude, longitude: donor.longitude };
    }

    if (viewer.role === 'RECEIVER') {
        const receiver = await ReceiverProfile.findOne({ user_id: viewer.id }).select('latitude longitude').lean();
        if (!isValidCoord(receiver?.latitude, receiver?.longitude)) return null;
        return { latitude: receiver.latitude, longitude: receiver.longitude };
    }

    if (viewer.role === 'VOLUNTEER') {
        const volunteer = await VolunteerProfile.findOne({ user_id: viewer.id }).select('latitude longitude').lean();
        if (!isValidCoord(volunteer?.latitude, volunteer?.longitude)) return null;
        return { latitude: volunteer.latitude, longitude: volunteer.longitude };
    }

    return null;
}

module.exports = {
    distanceKm,
    roadDistanceKm,
    getViewerLocation,
    isValidCoord,
};
