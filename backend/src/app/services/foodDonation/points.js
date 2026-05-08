/**
 * Cộng điểm khi đơn hoàn tất.
 *
 * Hai bên được cộng:
 *  - Donor: 100 điểm khi đơn chuyển sang COMPLETED lần đầu
 *  - Volunteer: 100 điểm khi receiver xác nhận đã nhận (qua receiverConfirm)
 */

const User = require('../../models/userModel');

const DONOR_COMPLETION_POINTS = 100;
const VOLUNTEER_DELIVERY_POINTS = 100;

async function awardDonorCompletionPoints(donorId) {
    if (!donorId) return 0;
    await User.findByIdAndUpdate(donorId, { $inc: { points: DONOR_COMPLETION_POINTS } });
    return DONOR_COMPLETION_POINTS;
}

async function awardVolunteerDeliveryPoints(volunteerId) {
    if (!volunteerId) return 0;
    await User.findByIdAndUpdate(volunteerId, { $inc: { points: VOLUNTEER_DELIVERY_POINTS } });
    return VOLUNTEER_DELIVERY_POINTS;
}

module.exports = {
    DONOR_COMPLETION_POINTS,
    VOLUNTEER_DELIVERY_POINTS,
    awardDonorCompletionPoints,
    awardVolunteerDeliveryPoints,
};
