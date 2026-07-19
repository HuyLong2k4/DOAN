const Report = require('../models/reportModel');
const FoodDonation = require('../models/foodDonationModel');
const User = require('../models/userModel');
const NotificationService = require('./notificationService');

// Chỉ các reason người dùng được phép gửi qua POST /reports. Reason no-show là
// sự cố hệ thống, chỉ được tạo từ luồng xác nhận bên trong backend.
const USER_REPORT_REASON = ['SPOILED', 'EXPIRED_UNSAFE', 'WRONG_INFO', 'FRAUD', 'INAPPROPRIATE', 'OTHER'];
const REPORT_STATUS_RESOLVABLE = ['RESOLVED', 'DISMISSED'];
const REPORT_ACTIONS = ['NONE', 'WARN', 'LOCK_USER', 'REMOVE_DONATION'];
const TERMINAL_DONATION_STATUS = ['COMPLETED', 'EXPIRED', 'CANCELLED'];

function _error(message, statusCode = 400) {
    const err = new Error(message);
    err.statusCode = statusCode;
    return err;
}

class ReportService {
    // Báo cáo hệ thống được tạo từ luồng receiver báo volunteer không giao.
    // Dùng upsert để cùng một sự cố không sinh nhiều report nếu request bị gửi lại.
    static async ensureVolunteerNoShowReport({ reporterId, volunteerId, donationId, deliveryId }) {
        const description = [
            'Báo cáo tự động: Receiver xác nhận volunteer đã nhận hàng nhưng không giao đến.',
            deliveryId ? `Delivery ID: ${deliveryId}.` : null,
        ].filter(Boolean).join(' ');

        const incidentKey = {
            donation_id: donationId,
            reason: 'VOLUNTEER_NO_SHOW',
        };

        try {
            return await Report.findOneAndUpdate(
                incidentKey,
                {
                    $setOnInsert: {
                        reporter_id: reporterId,
                        donation_id: donationId,
                        reported_user_id: volunteerId,
                        reason: 'VOLUNTEER_NO_SHOW',
                        description,
                        status: 'PENDING',
                    },
                },
                { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
            );
        } catch (err) {
            // Hai request đồng thời có thể cùng vượt qua bước tìm trước khi unique
            // index chặn insert thứ hai. Khi đó trả lại report đã được tạo.
            if (err?.code === 11000) return Report.findOne(incidentKey);
            throw err;
        }
    }

    // Người dùng đã đăng nhập gửi báo cáo. Bắt buộc reason hợp lệ và xác định
    // được đối tượng bị báo cáo (theo đơn hoặc theo người dùng). Nếu báo cáo
    // theo đơn thì tự suy ra người bị báo cáo là donor của đơn đó.
    static async createReport(reporterId, body) {
        const { donation_id, reported_user_id, reason, description } = body || {};

        if (!reason || !USER_REPORT_REASON.includes(reason)) {
            throw _error(`reason không hợp lệ. Các giá trị hợp lệ: ${USER_REPORT_REASON.join(', ')}`);
        }

        let donationId = donation_id || null;
        let reportedUserId = reported_user_id || null;

        if (donationId) {
            const donation = await FoodDonation.findById(donationId)
                .select('donor_id selected_receiver_id volunteer_id')
                .lean();
            if (!donation) throw _error('Không tìm thấy đơn quyên góp.', 404);

            // Chống lạm dụng ("chơi xấu"): chỉ người có tham gia đơn — người nhận
            // đã kết nối hoặc tình nguyện viên được phân công — mới được báo cáo
            // đơn đó. Người chỉ lướt xem không thể báo cáo đơn mình không liên quan.
            const participants = [donation.selected_receiver_id, donation.volunteer_id]
                .filter(Boolean)
                .map((id) => id.toString());
            if (!participants.includes(reporterId.toString())) {
                throw _error('Bạn chỉ có thể báo cáo đơn mà mình có tham gia (đã kết nối nhận hoặc được phân công giao).', 403);
            }

            // Người bị báo cáo mặc định là người quyên góp của đơn.
            if (!reportedUserId) reportedUserId = donation.donor_id;

            // Mỗi người chỉ có một báo cáo đang chờ xử lý cho mỗi đơn (chống spam).
            const existing = await Report.findOne({
                reporter_id: reporterId,
                donation_id: donationId,
                status: 'PENDING',
            }).lean();
            if (existing) {
                throw _error('Bạn đã gửi báo cáo cho đơn này và đang chờ xử lý.', 409);
            }
        }

        if (!donationId && !reportedUserId) {
            throw _error('Cần chỉ định đơn hoặc người dùng bị báo cáo.');
        }

        const report = await Report.create({
            reporter_id:      reporterId,
            donation_id:      donationId,
            reported_user_id: reportedUserId,
            reason,
            description:      (description || '').trim() || null,
        });

        return { message: 'Đã gửi báo cáo. Quản trị viên sẽ xem xét.', report };
    }

    // Quản trị viên: lấy danh sách báo cáo, có thể lọc theo trạng thái.
    static async listReports(filter = {}) {
        const query = {};
        if (filter.status) query.status = filter.status;

        return Report.find(query)
            .sort({ createdAt: -1 })
            .populate('reporter_id', 'full_name avatar_url role')
            .populate('reported_user_id', 'full_name avatar_url role is_active')
            .populate('donation_id', 'title status food_type')
            .lean();
    }

    // Quản trị viên: xử lý báo cáo (RESOLVED / DISMISSED) kèm ghi chú và chế tài
    // tuỳ chọn. Chế tài chỉ được áp dụng khi admin chủ động chọn, không tự động.
    static async resolveReport(reportId, adminId, body) {
        const { status, admin_note, action } = body || {};
        if (!REPORT_STATUS_RESOLVABLE.includes(status)) {
            throw _error(`status không hợp lệ. Chỉ chấp nhận: ${REPORT_STATUS_RESOLVABLE.join(', ')}`);
        }
        const reportAction = REPORT_ACTIONS.includes(action) ? action : 'NONE';

        const report = await Report.findById(reportId);
        if (!report) throw _error('Không tìm thấy báo cáo.', 404);

        // Áp dụng chế tài (nếu có) — đồng thời gửi thông báo cho người bị xử lý.
        if (reportAction !== 'NONE') {
            await ReportService._applyAction(reportAction, report);
        }

        report.status       = status;
        report.admin_note   = (admin_note || '').trim() || null;
        report.action_taken = reportAction;
        report.resolved_by  = adminId;
        report.resolved_at  = new Date();
        await report.save();

        // Đóng vòng phản hồi: báo kết quả tổng quát cho người đã gửi báo cáo,
        // không tiết lộ chế tài cụ thể áp lên người bị báo cáo.
        await NotificationService.dispatch({
            userIds: report.reporter_id,
            key: status === 'RESOLVED' ? 'report.reviewer.resolved' : 'report.reviewer.dismissed',
            type: 'REPORT_REVIEWED',
            ...(report.donation_id
                ? { related_entity_type: 'FoodDonation', related_entity_id: report.donation_id }
                : {}),
        });

        return { message: 'Đã cập nhật trạng thái báo cáo.', report };
    }

    // Thực thi chế tài: cảnh báo, gỡ đơn, hoặc khoá tài khoản — kèm thông báo
    // (in-app + push) tới người bị xử lý để họ biết lý do.
    static async _applyAction(action, report) {
        const targetUserId = report.reported_user_id || null;

        let donation = null;
        if (report.donation_id) {
            donation = await FoodDonation.findById(report.donation_id).select('title status donor_id').lean();
        }
        const donationTitle = donation?.title || '';
        const targetIsDonationOwner = Boolean(
            targetUserId && donation?.donor_id && String(targetUserId) === String(donation.donor_id),
        );

        if (action === 'WARN') {
            if (!targetUserId) throw _error('Báo cáo này không xác định được người dùng để cảnh báo.', 400);
            await NotificationService.dispatch({
                userIds: targetUserId,
                key: donationTitle && targetIsDonationOwner ? 'report.warned' : 'report.warnedUser',
                params: { title: donationTitle },
                type: 'REPORT_WARNED',
                ...(report.donation_id
                    ? { related_entity_type: 'FoodDonation', related_entity_id: report.donation_id }
                    : {}),
            });
            return;
        }

        if (action === 'REMOVE_DONATION') {
            if (report.reason === 'VOLUNTEER_NO_SHOW') {
                throw _error('Báo cáo no-show chỉ xử lý trên tài khoản volunteer; đơn đã được huỷ.', 400);
            }
            if (!report.donation_id) throw _error('Báo cáo này không gắn với đơn nào để gỡ.', 400);
            const donation = await FoodDonation.findById(report.donation_id);
            if (!donation) throw _error('Không tìm thấy đơn để gỡ.', 404);
            if (!TERMINAL_DONATION_STATUS.includes(donation.status)) {
                donation.status        = 'CANCELLED';
                donation.cancel_reason = 'ADMIN_REMOVED';
                donation.cancelled_at  = new Date();
                await donation.save();
            }
            if (targetUserId) {
                await NotificationService.dispatch({
                    userIds: targetUserId,
                    key: 'report.donationRemoved',
                    params: { title: donation.title || donationTitle },
                    type: 'REPORT_DONATION_REMOVED',
                    related_entity_type: 'FoodDonation',
                    related_entity_id: report.donation_id,
                });
            }
            return;
        }

        if (action === 'LOCK_USER') {
            if (!targetUserId) throw _error('Báo cáo này không xác định được người dùng để khoá.', 400);
            await User.findByIdAndUpdate(targetUserId, { is_active: false });
            await NotificationService.dispatch({
                userIds: targetUserId,
                key: 'report.accountLocked',
                type: 'REPORT_ACCOUNT_LOCKED',
            });
        }
    }
}

module.exports = ReportService;
