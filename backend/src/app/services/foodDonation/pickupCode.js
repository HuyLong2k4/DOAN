/**
 * Pickup code utilities — chống volunteer fake "đã pickup" mà chưa gặp donor.
 *
 * Flow:
 *  1. Khi receiver chọn VIA_AGENT → server sinh code 4 chữ số, lưu vào Delivery.pickup_code
 *  2. Donor xem code trong tracking của mình (UI hiện trên thẻ donation)
 *  3. Khi volunteer đến lấy hàng, donor đọc code cho volunteer
 *  4. Volunteer gọi pickup-start kèm code → server verify match → cho qua
 *
 * Code không phải là secret cao — mục đích là chứng minh "volunteer đã có mặt
 * tại điểm donor". 4 chữ số là đủ vì:
 *   - Code chỉ valid trong vài giờ (đến khi expire)
 *   - Mỗi đơn có code riêng, không tái dùng
 *   - Brute-force 10000 lần qua API là không hợp lý (rate limiting + log)
 */

const PICKUP_CODE_LENGTH = 4;

function generatePickupCode() {
    const min = 10 ** (PICKUP_CODE_LENGTH - 1);
    const max = 10 ** PICKUP_CODE_LENGTH - 1;
    return String(Math.floor(min + Math.random() * (max - min + 1)));
}

/**
 * @param {string|null|undefined} provided  Code volunteer nhập
 * @param {string|null|undefined} expected  Code lưu trong Delivery
 * @returns {boolean}
 */
function verifyPickupCode(provided, expected) {
    if (!expected) {
        // Legacy delivery (chưa có pickup_code) → cho qua để tương thích ngược.
        return true;
    }
    if (!provided) return false;
    return String(provided).trim() === String(expected).trim();
}

module.exports = {
    PICKUP_CODE_LENGTH,
    generatePickupCode,
    verifyPickupCode,
};
