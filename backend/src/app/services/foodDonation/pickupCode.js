/**
 * Pickup code utilities — chống volunteer/receiver fake "đã gặp donor".
 *
 * Flow:
 *  1. Khi receiver chọn delivery → server sinh code 4 chữ số, lưu vào Delivery.pickup_code
 *  2. Donor xem code trong tracking của mình (UI hiện trên thẻ donation)
 *  3. Khi gặp mặt, donor đọc code cho volunteer (VIA_AGENT) hoặc receiver (SELF_PICKUP)
 *  4. Bên kia gọi pickup-start / self-pickup-complete kèm code → server verify
 *
 * Code 4 chữ số là đủ vì có chống brute-force: sai liên tiếp MAX_PICKUP_ATTEMPTS
 * lần sẽ tạm khoá PICKUP_LOCK_MS, đưa số tổ hợp thử được/giờ xuống mức không khả thi.
 */

const Delivery = require('../../models/deliveryModel');

const PICKUP_CODE_LENGTH = 4;
const MAX_PICKUP_ATTEMPTS = 5;          // số lần nhập sai liên tiếp tối đa
const PICKUP_LOCK_MS = 10 * 60 * 1000;  // tạm khoá 10 phút sau khi vượt ngưỡng

function _err(message, statusCode) {
    return Object.assign(new Error(message), { statusCode });
}

function generatePickupCode() {
    const min = 10 ** (PICKUP_CODE_LENGTH - 1);
    const max = 10 ** PICKUP_CODE_LENGTH - 1;
    return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/**
 * Verify mã pickup kèm chống brute-force (đếm sai + tạm khoá).
 * Hợp lệ → return void (và reset bộ đếm). Sai/đang khoá → throw Error có statusCode.
 *
 * @param {object} delivery  Document Delivery (.lean()) — cần _id, pickup_code,
 *                           pickup_attempt_count, pickup_locked_until
 * @param {string|null} provided  Mã người dùng nhập
 */
async function assertPickupCode(delivery, provided) {
    const expected = delivery.pickup_code;
    if (!expected) return; // delivery cũ chưa có code → bỏ qua (tương thích ngược)

    const now = Date.now();
    const lockedUntil = delivery.pickup_locked_until ? new Date(delivery.pickup_locked_until).getTime() : 0;
    if (lockedUntil > now) {
        const mins = Math.ceil((lockedUntil - now) / 60000);
        throw _err(`Đã nhập sai mã quá nhiều lần. Vui lòng thử lại sau ${mins} phút.`, 429);
    }

    if (provided && String(provided).trim() === String(expected).trim()) {
        // Đúng → reset bộ đếm nếu cần.
        if (delivery.pickup_attempt_count || delivery.pickup_locked_until) {
            await Delivery.updateOne(
                { _id: delivery._id },
                { $set: { pickup_attempt_count: 0, pickup_locked_until: null } },
            );
        }
        return;
    }

    // Sai → tăng đếm atomic.
    const updated = await Delivery.findOneAndUpdate(
        { _id: delivery._id },
        { $inc: { pickup_attempt_count: 1 } },
        { new: true },
    );
    const count = updated?.pickup_attempt_count ?? 1;

    if (count >= MAX_PICKUP_ATTEMPTS) {
        await Delivery.updateOne(
            { _id: delivery._id },
            { $set: { pickup_attempt_count: 0, pickup_locked_until: new Date(now + PICKUP_LOCK_MS) } },
        );
        throw _err(`Nhập sai mã quá ${MAX_PICKUP_ATTEMPTS} lần. Tạm khoá ${PICKUP_LOCK_MS / 60000} phút — nhờ donor đọc lại mã.`, 429);
    }

    throw _err(`Mã pickup không khớp. Còn ${MAX_PICKUP_ATTEMPTS - count} lần thử.`, 400);
}

module.exports = {
    PICKUP_CODE_LENGTH,
    generatePickupCode,
    assertPickupCode,
};
