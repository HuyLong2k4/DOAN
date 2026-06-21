const mongoose = require('mongoose');

// Báo cáo vi phạm về một đơn quyên góp hoặc một người dùng (vd thực phẩm
// hỏng/ôi thiu, quá hạn không an toàn, thông tin sai, gian lận, nội dung không
// phù hợp). Là kênh để người dùng phản ánh và quản trị viên xử lý — bổ trợ cho
// cơ chế đánh giá sau giao dịch.
const REPORT_REASON = ['SPOILED', 'EXPIRED_UNSAFE', 'WRONG_INFO', 'FRAUD', 'INAPPROPRIATE', 'OTHER'];
// SPOILED        : Thực phẩm hỏng / ôi thiu
// EXPIRED_UNSAFE : Quá hạn / không bảo đảm an toàn
// WRONG_INFO     : Thông tin đơn sai lệch
// FRAUD          : Có dấu hiệu gian lận
// INAPPROPRIATE  : Nội dung / hành vi không phù hợp
// OTHER          : Lý do khác (mô tả ở description)

const REPORT_STATUS = ['PENDING', 'RESOLVED', 'DISMISSED'];
// PENDING   : Mới gửi, chờ quản trị viên xử lý
// RESOLVED  : Đã xử lý (có biện pháp xử lý)
// DISMISSED : Đã xem xét và bỏ qua (không vi phạm)

const ReportSchema = new mongoose.Schema({
    reporter_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Đối tượng bị báo cáo: theo đơn và/hoặc theo người dùng.
    donation_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDonation', default: null },
    reported_user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    reason:      { type: String, enum: REPORT_REASON, required: true },
    description: { type: String, default: null },

    status:      { type: String, enum: REPORT_STATUS, default: 'PENDING' },
    admin_note:  { type: String, default: null },
    // Chế tài quản trị viên đã áp dụng khi xử lý báo cáo.
    action_taken: { type: String, enum: ['NONE', 'WARN', 'LOCK_USER', 'REMOVE_DONATION'], default: 'NONE' },
    resolved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolved_at: { type: Date, default: null },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Report', ReportSchema);
