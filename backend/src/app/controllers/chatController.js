const ChatService = require('../services/chatService');
const { emitNewMessage } = require('../../socket/chatSocket');
const path = require('path');

class ChatController {
    // ── POST /api/chat/direct/donation/:donationId ─────────────────────────
    static async getOrCreateDirectConversationByDonation(req, res) {
        try {
            const data = await ChatService.getOrCreateDirectConversationByDonation(
                req.params.donationId,
                req.user,
                req.body?.target_role || req.query?.target_role || null,
            );
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── GET /api/chat/conversations ────────────────────────────────────────
    static async listConversations(req, res) {
        try {
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 20);

            const data = await ChatService.listConversations(req.user.id, page, limit);
            return res.status(200).json({ success: true, ...data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── GET /api/chat/conversations/:id/messages ───────────────────────────
    static async getConversationMessages(req, res) {
        try {
            const page = Number(req.query.page || 1);
            const limit = Number(req.query.limit || 30);

            const data = await ChatService.getConversationMessages(
                req.params.id,
                req.user.id,
                page,
                limit,
            );
            return res.status(200).json({ success: true, ...data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/chat/conversations/:id/messages ──────────────────────────
    static async sendMessage(req, res) {
        try {
            let attachments = req.body?.attachments || [];
            if (typeof attachments === 'string') {
                try {
                    attachments = JSON.parse(attachments);
                } catch {
                    attachments = [];
                }
            }

            
            const data = await ChatService.sendMessage(
                req.params.id,
                req.user,
                req.body?.text,
                attachments,
            );

            // Phát socket event cho người nhận (và người gửi) như đường socket —
            // để tin gửi qua REST (khi socket chưa connect) vẫn cập nhật real-time.
            emitNewMessage(req.app.get('io'), data, req.user.id);

            return res.status(201).json({ success: true, data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }

    // ── POST /api/chat/uploads ─────────────────────────────────────────────
    static async uploadAttachments(req, res) {
        try {
            const files = req.files || [];
            if (!files.length) {
                return res.status(400).json({ success: false, message: 'Không có tệp nào được tải lên.' });
            }

            const baseUrl = `${req.protocol}://${req.get('host')}`;
            const attachments = files.map((file) => ({
                url: `${baseUrl}/uploads/chat/${encodeURIComponent(path.basename(file.filename))}`,
                name: file.originalname || file.filename,
                mime_type: file.mimetype || 'application/octet-stream',
                size_bytes: file.size || 0,
            }));

            return res.status(201).json({
                success: true,
                data: {
                    attachments,
                },
            });
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message || 'Upload file thất bại.' });
        }
    }

    // ── POST /api/chat/conversations/:id/read ──────────────────────────────
    static async markConversationRead(req, res) {
        try {
            const data = await ChatService.markConversationRead(req.params.id, req.user.id);
            return res.status(200).json({ success: true, data });
        } catch (err) {
            return res.status(err.statusCode || 500).json({ success: false, message: err.message });
        }
    }
}

module.exports = ChatController;
