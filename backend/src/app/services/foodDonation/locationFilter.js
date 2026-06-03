/**
 * Lọc broadcast notification theo khoảng cách thay vì gửi cho tất cả donor.
 *
 * Nếu không có vị trí (donor chưa setup profile / receiver chưa setup) → fallback
 * về hành vi cũ là gửi cho tất cả, nhưng giới hạn N donor đầu tiên để đỡ flood.
 */

const DonorProfile = require('../../models/donorProfileModel');
const ReceiverProfile = require('../../models/receiverProfileModel');
const User = require('../../models/userModel');
const { distanceKm } = require('./distance');

const DEFAULT_RADIUS_KM = 10;
const MAX_FALLBACK_DONORS = 200;

/**
 * Tìm danh sách donor user_id sẵn sàng nhận notification từ 1 receiver.
 * Lọc theo bán kính. Nếu không có toạ độ → fallback toàn bộ (giới hạn).
 *
 * @param {string} receiverId  ObjectId receiver
 * @param {number} radiusKm    Bán kính (km), default 10
 * @returns {Promise<string[]>} Mảng donor user_id
 */
async function findNearbyDonorIds(receiverId, radiusKm = DEFAULT_RADIUS_KM) {
    const receiverProfile = await ReceiverProfile.findOne({ user_id: receiverId })
        .select('latitude longitude')
        .lean();

    const hasReceiverLocation =
        receiverProfile &&
        receiverProfile.latitude != null &&
        receiverProfile.longitude != null;

    if (!hasReceiverLocation) {
        // Fallback: toàn bộ donor (giới hạn).
        const donors = await User.find({ role: 'DONOR' })
            .select('_id')
            .limit(MAX_FALLBACK_DONORS)
            .lean();
        return donors.map((d) => String(d._id));
    }

    const donorProfiles = await DonorProfile.find({
        latitude: { $ne: null },
        longitude: { $ne: null },
    })
        .select('user_id latitude longitude')
        .lean();

    const nearbyIds = [];
    for (const profile of donorProfiles) {
        const km = distanceKm(
            receiverProfile.latitude,
            receiverProfile.longitude,
            profile.latitude,
            profile.longitude,
        );
        if (km <= radiusKm) {
            nearbyIds.push(String(profile.user_id));
        }
    }

    if (nearbyIds.length === 0) {
        // Không có ai trong bán kính → không broadcast (tránh ai cũng bị spam).
        // Receiver vẫn có thể tự browse donations PENDING để nhận.
        return [];
    }

    return nearbyIds;
}

module.exports = {
    findNearbyDonorIds,
    DEFAULT_RADIUS_KM,
};
