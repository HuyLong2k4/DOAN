/**
 * Distance helpers — khoảng cách đường chim bay (Haversine) + toạ độ viewer.
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
    getViewerLocation,
    isValidCoord,
};
