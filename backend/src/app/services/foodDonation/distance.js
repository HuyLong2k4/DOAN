/**
 * Distance helpers — Haversine fallback + Google Distance Matrix khi có API key.
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

// Cache cho Google Distance Matrix — key gồm cả origin & dest rounded ~111m
// để tự invalidate khi donor đổi địa chỉ. TTL 10 phút.
const GOOGLE_CACHE_TTL_MS = 10 * 60 * 1000;
const googleDistanceCache = new Map();

function _roundCoord(value) {
    return Math.round(value * 1000) / 1000;
}

function _cacheKey(origin, dest) {
    return `${_roundCoord(origin.latitude)},${_roundCoord(origin.longitude)}|${_roundCoord(dest.latitude)},${_roundCoord(dest.longitude)}`;
}

function _cacheGet(key) {
    const entry = googleDistanceCache.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
        googleDistanceCache.delete(key);
        return undefined;
    }
    return entry.km;
}

function _cacheSet(key, km) {
    googleDistanceCache.set(key, { km, expiresAt: Date.now() + GOOGLE_CACHE_TTL_MS });
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

/**
 * Khoảng cách đường bộ thực tế qua Google Distance Matrix.
 * Trả về `Map<id, km>` hoặc null nếu không có API key / lỗi.
 *
 * Có cache in-memory TTL 10 phút theo `(origin_rounded, dest_rounded)` để
 * tránh tốn quota khi nhiều receiver xem cùng list donation.
 */
async function getRoadDistancesFromGoogle(origin, destinations) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_DISTANCE_MATRIX_API_KEY;
    if (!apiKey) return null;
    if (!origin || destinations.length === 0) return null;

    const resultMap = new Map();
    const missing = [];

    for (const dest of destinations) {
        const cached = _cacheGet(_cacheKey(origin, dest));
        if (cached !== undefined) {
            resultMap.set(dest.id, cached);
        } else {
            missing.push(dest);
        }
    }

    if (missing.length === 0) return resultMap;

    const originParam = `${origin.latitude},${origin.longitude}`;
    const destinationParam = missing
        .map((d) => `${d.latitude},${d.longitude}`)
        .join('|');

    const url =
        'https://maps.googleapis.com/maps/api/distancematrix/json' +
        `?origins=${encodeURIComponent(originParam)}` +
        `&destinations=${encodeURIComponent(destinationParam)}` +
        '&mode=driving&language=vi&units=metric' +
        `&key=${encodeURIComponent(apiKey)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) return resultMap.size > 0 ? resultMap : null;

        const payload = await response.json();
        if (payload?.status !== 'OK') return resultMap.size > 0 ? resultMap : null;

        const elements = payload?.rows?.[0]?.elements;
        if (!Array.isArray(elements)) return resultMap.size > 0 ? resultMap : null;

        missing.forEach((dest, idx) => {
            const element = elements[idx];
            if (element?.status !== 'OK') return;

            const meters = element?.distance?.value;
            if (typeof meters !== 'number') return;

            const km = meters / 1000;
            resultMap.set(dest.id, km);
            _cacheSet(_cacheKey(origin, dest), km);
        });

        return resultMap;
    } catch {
        return resultMap.size > 0 ? resultMap : null;
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
    getRoadDistancesFromGoogle,
    getViewerLocation,
    isValidCoord,
};
