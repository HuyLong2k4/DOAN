/**
 * Distance helpers — Haversine fallback + Google Distance Matrix khi có API key.
 */

const DonorProfile = require('../../models/donorProfileModel');
const ReceiverProfile = require('../../models/receiverProfileModel');
const VolunteerProfile = require('../../models/volunteerProfileModel');

function toRad(value) {
    return (value * Math.PI) / 180;
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
 */
async function getRoadDistancesFromGoogle(origin, destinations) {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_DISTANCE_MATRIX_API_KEY;
    if (!apiKey) return null;
    if (!origin || destinations.length === 0) return null;

    const originParam = `${origin.latitude},${origin.longitude}`;
    const destinationParam = destinations
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
        if (!response.ok) return null;

        const payload = await response.json();
        if (payload?.status !== 'OK') return null;

        const elements = payload?.rows?.[0]?.elements;
        if (!Array.isArray(elements)) return null;

        const resultMap = new Map();
        destinations.forEach((dest, idx) => {
            const element = elements[idx];
            if (element?.status !== 'OK') return;

            const meters = element?.distance?.value;
            if (typeof meters !== 'number') return;

            resultMap.set(dest.id, meters / 1000);
        });

        return resultMap;
    } catch {
        return null;
    }
}

/**
 * Lấy toạ độ của viewer (donor / receiver / volunteer) từ profile.
 */
async function getViewerLocation(viewer = null) {
    if (!viewer?.id || !viewer?.role) return null;

    if (viewer.role === 'DONOR') {
        const donor = await DonorProfile.findOne({ user_id: viewer.id }).select('latitude longitude').lean();
        if (donor?.latitude == null || donor?.longitude == null) return null;
        return { latitude: donor.latitude, longitude: donor.longitude };
    }

    if (viewer.role === 'RECEIVER') {
        const receiver = await ReceiverProfile.findOne({ user_id: viewer.id }).select('latitude longitude').lean();
        if (receiver?.latitude == null || receiver?.longitude == null) return null;
        return { latitude: receiver.latitude, longitude: receiver.longitude };
    }

    if (viewer.role === 'VOLUNTEER') {
        const volunteer = await VolunteerProfile.findOne({ user_id: viewer.id }).select('latitude longitude').lean();
        if (volunteer?.latitude == null || volunteer?.longitude == null) return null;
        return { latitude: volunteer.latitude, longitude: volunteer.longitude };
    }

    return null;
}

module.exports = {
    distanceKm,
    getRoadDistancesFromGoogle,
    getViewerLocation,
};
