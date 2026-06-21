const ReportService = require('../services/reportService');

class ReportController {
    // POST /api/reports — người dùng đã đăng nhập gửi báo cáo vi phạm
    static async createReport(req, res) {
        try {
            const result = await ReportService.createReport(req.user.id, req.body);
            return res.status(201).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // GET /api/reports?status= — quản trị viên xem danh sách
    static async listReports(req, res) {
        try {
            const data = await ReportService.listReports({ status: req.query.status });
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // PATCH /api/reports/:id — quản trị viên xử lý báo cáo
    static async resolveReport(req, res) {
        try {
            const result = await ReportService.resolveReport(req.params.id, req.user.id, req.body);
            return res.status(200).json({ success: true, ...result });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }
}

module.exports = ReportController;
