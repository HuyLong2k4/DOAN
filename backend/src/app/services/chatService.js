const mongoose = require('mongoose');
const Conversation = require('../models/conversationModel');
const Message = require('../models/messageModel');
const FoodDonation = require('../models/foodDonationModel');
const Notification = require('../models/notificationModel');
const NotificationService = require('./notificationService');

class ChatService {
    static _error(message, statusCode = 400) {
        return Object.assign(new Error(message), { statusCode });
    }

    static _toId(value) {
        if (!value) return null;
        return String(value);
    }

    static _buildPairKey(userA, userB) {
        return [String(userA), String(userB)].sort().join(':');
    }

    static _normalizeTargetRole(rawRole) {
        if (!rawRole) return null;

        const role = String(rawRole).trim().toUpperCase();
        const allowed = ['DONOR', 'RECEIVER', 'VOLUNTEER'];
        if (!allowed.includes(role)) {
            throw this._error('target_role không hợp lệ. Chỉ hỗ trợ DONOR, RECEIVER, VOLUNTEER.');
        }

        return role;
    }

    static _normalizeAttachments(attachments = []) {
        if (!Array.isArray(attachments)) return [];

        return attachments
            .slice(0, 5)
            .map((item) => {
                if (!item) return null;

                if (typeof item === 'string') {
                    const url = item.trim();
                    if (!url) return null;
                    return {
                        url,
                        name: '',
                        mime_type: 'application/octet-stream',
                        size_bytes: 0,
                    };
                }

                const url = String(item.url || '').trim();
                if (!url) return null;

                return {
                    url,
                    name: String(item.name || '').trim().slice(0, 255),
                    mime_type: String(item.mime_type || 'application/octet-stream').trim().slice(0, 120) || 'application/octet-stream',
                    size_bytes: Number(item.size_bytes || 0) || 0,
                };
            })
            .filter(Boolean);
    }

    static _buildMessagePreview(text, attachments = []) {
        if (text) return text;

        if (!attachments.length) return 'Tin nhắn mới';
        const first = attachments[0];
        if (first?.mime_type?.startsWith('image/')) return '📷 Đã gửi một ảnh';
        return '📎 Đã gửi một tệp đính kèm';
    }

    static _mapUser(user) {
        if (!user) return null;
        return {
            id: this._toId(user._id),
            full_name: user.full_name || null,
            avatar_url: user.avatar_url || null,
            role: user.role || null,
        };
    }

    static _mapConversation(conversation, viewerId) {
        const viewerIdStr = String(viewerId);
        const participants = (conversation.participants || []).map((item) => this._mapUser(item));
        const counterpart = participants.find((item) => item && item.id !== viewerIdStr) || null;

        return {
            id: this._toId(conversation._id),
            donation_id: this._toId(conversation.donation_id),
            delivery_id: this._toId(conversation.delivery_id),
            participants,
            counterpart,
            last_message_text: conversation.last_message_text || '',
            last_message_at: conversation.last_message_at || null,
            last_sender_id: this._toId(conversation.last_sender_id),
            updated_at: conversation.updatedAt || null,
        };
    }

    static _mapMessage(message, viewerId) {
        const sender = this._mapUser(message.sender_id);
        return {
            id: this._toId(message._id),
            conversation_id: this._toId(message.conversation_id),
            text: message.text || '',
            attachments: Array.isArray(message.attachments)
                ? message.attachments.map((item) => ({
                    url: item?.url || '',
                    name: item?.name || '',
                    mime_type: item?.mime_type || 'application/octet-stream',
                    size_bytes: item?.size_bytes || 0,
                })).filter((item) => item.url)
                : [],
            sender,
            sender_id: sender?.id || this._toId(message.sender_id),
            is_me: (sender?.id || this._toId(message.sender_id)) === String(viewerId),
            seen_by: Array.isArray(message.seen_by) ? message.seen_by.map((item) => this._toId(item)) : [],
            created_at: message.createdAt,
            updated_at: message.updatedAt,
        };
    }

    static async ensureConversationMember(conversationId, userId) {
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: userId,
            is_active: true,
        }).select('_id participants').lean();

        if (!conversation) {
            throw this._error('Bạn không có quyền truy cập cuộc trò chuyện này.', 403);
        }

        return conversation;
    }

    static _resolveDirectCounterpart(donation, currentUser, targetRole = null) {
        const currentUserId = String(currentUser.id);
        const donorId = this._toId(donation.donor_id);
        const receiverId = this._toId(donation.selected_receiver_id);
        const volunteerId = this._toId(donation.volunteer_id);

        const membership = [donorId, receiverId, volunteerId].filter(Boolean);
        if (!membership.includes(currentUserId)) {
            throw this._error('Bạn không thuộc đơn quyên góp này.', 403);
        }

        if (currentUser.role === 'RECEIVER') {
            if (targetRole === 'DONOR') return donorId;

            if (targetRole === 'VOLUNTEER') {
                if (!volunteerId) {
                    throw this._error('Chưa có volunteer được gán cho đơn này.', 409);
                }
                return volunteerId;
            }

            if (targetRole && targetRole !== 'DONOR' && targetRole !== 'VOLUNTEER') {
                throw this._error('Receiver chỉ có thể chat với Donor hoặc Volunteer.', 400);
            }

            if (donation.delivery_type === 'VIA_AGENT') {
                if (!volunteerId) {
                    throw this._error('Chưa có volunteer được gán cho đơn này.', 409);
                }
                return volunteerId;
            }
            return donorId;
        }

        if (currentUser.role === 'VOLUNTEER') {
            if (volunteerId !== currentUserId) {
                throw this._error('Bạn không phải volunteer của đơn này.', 403);
            }

            if (targetRole === 'DONOR') return donorId;

            if (targetRole && targetRole !== 'RECEIVER' && targetRole !== 'DONOR') {
                throw this._error('Volunteer chỉ có thể chat với Donor hoặc Receiver.', 400);
            }

            if (!receiverId) {
                throw this._error('Đơn chưa có receiver để bắt đầu chat.', 409);
            }
            return receiverId;
        }

        if (currentUser.role === 'DONOR') {
            if (targetRole === 'VOLUNTEER') {
                if (!volunteerId) {
                    throw this._error('Đơn chưa có volunteer để bắt đầu chat.', 409);
                }
                return volunteerId;
            }

            if (targetRole && targetRole !== 'RECEIVER' && targetRole !== 'VOLUNTEER') {
                throw this._error('Donor chỉ có thể chat với Receiver hoặc Volunteer.', 400);
            }

            if (!receiverId) {
                throw this._error('Đơn chưa có receiver để bắt đầu chat.', 409);
            }
            return receiverId;
        }

        throw this._error('Role hiện tại không hỗ trợ chat đơn quyên góp.', 403);
    }

    static async getOrCreateDirectConversationByDonation(donationId, currentUser, targetRoleRaw = null) {
        const donation = await FoodDonation.findById(donationId)
            .select('donor_id selected_receiver_id volunteer_id delivery_id delivery_type title')
            .lean();

        if (!donation) {
            throw this._error('Không tìm thấy đơn quyên góp.', 404);
        }

        const targetRole = this._normalizeTargetRole(targetRoleRaw);
        const counterpartId = this._resolveDirectCounterpart(donation, currentUser, targetRole);
        const currentUserId = String(currentUser.id);

        if (currentUserId === counterpartId) {
            throw this._error('Không thể tạo chat với chính bạn.', 400);
        }

        const pairKey = this._buildPairKey(currentUserId, counterpartId);

        let conversation = await Conversation.findOne({
            donation_id: donation._id,
            pair_key: pairKey,
            is_active: true,
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [currentUserId, counterpartId],
                pair_key: pairKey,
                donation_id: donation._id,
                delivery_id: donation.delivery_id || null,
                last_message_text: '',
                last_message_at: null,
            });
        } else if (!conversation.delivery_id && donation.delivery_id) {
            conversation.delivery_id = donation.delivery_id;
            await conversation.save();
        }

        const populated = await Conversation.findById(conversation._id)
            .populate('participants', 'full_name avatar_url role')
            .lean();

        return this._mapConversation(populated, currentUser.id);
    }

    static async listConversations(userId, page = 1, limit = 20) {
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.max(1, Math.min(50, Number(limit) || 20));
        const skip = (safePage - 1) * safeLimit;

        const query = { participants: userId, is_active: true };

        const [total, conversations] = await Promise.all([
            Conversation.countDocuments(query),
            Conversation.find(query)
                .sort({ last_message_at: -1, updatedAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .populate('participants', 'full_name avatar_url role')
                .lean(),
        ]);

        const conversationIds = conversations.map((item) => item._id);
        const viewerObjectId = new mongoose.Types.ObjectId(userId);

        const unreadAgg = conversationIds.length > 0
            ? await Message.aggregate([
                {
                    $match: {
                        conversation_id: { $in: conversationIds },
                        sender_id: { $ne: viewerObjectId },
                        seen_by: { $ne: viewerObjectId },
                    },
                },
                {
                    $group: {
                        _id: '$conversation_id',
                        unread_count: { $sum: 1 },
                    },
                },
            ])
            : [];

        const unreadMap = new Map(
            unreadAgg.map((item) => [String(item._id), item.unread_count || 0]),
        );

        return {
            data: conversations.map((item) => ({
                ...this._mapConversation(item, userId),
                unread_count: unreadMap.get(String(item._id)) || 0,
            })),
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.max(1, Math.ceil(total / safeLimit)),
            },
        };
    }

    static async getConversationMessages(conversationId, userId, page = 1, limit = 30) {
        const safePage = Math.max(1, Number(page) || 1);
        const safeLimit = Math.max(1, Math.min(100, Number(limit) || 30));
        const skip = (safePage - 1) * safeLimit;

        await this.ensureConversationMember(conversationId, userId);

        const [total, messages] = await Promise.all([
            Message.countDocuments({ conversation_id: conversationId }),
            Message.find({ conversation_id: conversationId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(safeLimit)
                .populate('sender_id', 'full_name avatar_url role')
                .lean(),
        ]);

        const ordered = messages.reverse();

        return {
            data: ordered.map((item) => this._mapMessage(item, userId)),
            pagination: {
                page: safePage,
                limit: safeLimit,
                total,
                totalPages: Math.max(1, Math.ceil(total / safeLimit)),
            },
        };
    }

    static async sendMessage(conversationId, senderUser, text, attachments = []) {
        const normalizedText = (text || '').trim();
        const normalizedAttachments = this._normalizeAttachments(attachments);

        if (!normalizedText && normalizedAttachments.length === 0) {
            throw this._error('Tin nhắn cần có nội dung hoặc tệp đính kèm.');
        }

        if (normalizedText.length > 2000) {
            throw this._error('Nội dung tin nhắn quá dài (tối đa 2000 ký tự).');
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: senderUser.id,
            is_active: true,
        }).select('_id participants donation_id').lean();

        if (!conversation) {
            throw this._error('Bạn không có quyền gửi tin trong cuộc trò chuyện này.', 403);
        }

        const message = await Message.create({
            conversation_id: conversation._id,
            sender_id: senderUser.id,
            text: normalizedText,
            attachments: normalizedAttachments,
            seen_by: [senderUser.id],
        });

        const lastMessagePreview = this._buildMessagePreview(normalizedText, normalizedAttachments);

        await Conversation.findByIdAndUpdate(conversation._id, {
            last_message_text: lastMessagePreview,
            last_message_at: message.createdAt,
            last_sender_id: senderUser.id,
        });

        const mappedMessage = await Message.findById(message._id)
            .populate('sender_id', 'full_name avatar_url role')
            .lean();

        const recipientIds = (conversation.participants || [])
            .map((id) => String(id))
            .filter((id) => id !== String(senderUser.id));

        if (recipientIds.length > 0) {
            await Promise.allSettled(recipientIds.map(async (recipientId) => {
                await Notification.create({
                    user_id: recipientId,
                    title: senderUser.full_name || 'Tin nhắn mới',
                    message: lastMessagePreview,
                    type: 'NEW_MESSAGE',
                    related_entity_type: 'CONVERSATION',
                    related_entity_id: conversation._id,
                });

                await NotificationService.notifyNewMessage(recipientId, {
                    sender_name: senderUser.full_name || 'Người dùng',
                    message_text: lastMessagePreview,
                    chat_id: String(conversation._id),
                    sender_id: String(senderUser.id),
                });
            }));
        }

        return {
            conversation_id: String(conversation._id),
            recipient_ids: recipientIds,
            message: this._mapMessage(mappedMessage, senderUser.id),
        };
    }

    static async markConversationRead(conversationId, userId) {
        await this.ensureConversationMember(conversationId, userId);

        const result = await Message.updateMany(
            {
                conversation_id: conversationId,
                sender_id: { $ne: userId },
                seen_by: { $ne: userId },
            },
            {
                $addToSet: { seen_by: userId },
            },
        );

        return {
            read_count: result.modifiedCount || 0,
        };
    }
}

module.exports = ChatService;
