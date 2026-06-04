const User = require('../models/userModel');
const Notification = require('../models/notificationModel');
const { renderNotification } = require('../i18n/notifications');

const EXPO_PUSH_ENDPOINT = 'https://exp.host/--/api/v2/push/send';
const EXPO_TOKEN_PREFIX = ['ExponentPushToken[', 'ExpoPushToken['];

function isExpoToken(token) {
    if (!token || typeof token !== 'string') return false;
    return EXPO_TOKEN_PREFIX.some((p) => token.startsWith(p));
}

async function postToExpo(messages) {
    if (!messages.length) return { tickets: [], invalidTokens: [] };

    const res = await fetch(EXPO_PUSH_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
        },
        body: JSON.stringify(messages),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Expo Push API ${res.status}: ${text || res.statusText}`);
    }

    const json = await res.json();
    const tickets = Array.isArray(json?.data) ? json.data : [];

    // Token nào trả về DeviceNotRegistered hoặc InvalidCredentials → cần xoá khỏi DB.
    const invalidTokens = [];
    tickets.forEach((ticket, idx) => {
        if (ticket?.status === 'error') {
            const code = ticket.details?.error;
            if (code === 'DeviceNotRegistered' || code === 'InvalidCredentials') {
                invalidTokens.push(messages[idx].to);
            }
        }
    });

    return { tickets, invalidTokens };
}

async function clearTokens(tokens) {
    if (!tokens.length) return;
    await User.updateMany({ push_token: { $in: tokens } }, { push_token: '' });
}

class NotificationService {
    // Gửi 1 push notification tới 1 user.
    static async sendToUser(userId, notification) {
        try {
            const user = await User.findById(userId).select('push_token');
            if (!user || !isExpoToken(user.push_token)) {
                return { success: false, message: 'No push token' };
            }

            const message = {
                to: user.push_token,
                title: notification.title,
                body: notification.body,
                sound: 'default',
                priority: 'high',
                data: notification.data || {},
            };

            const { invalidTokens } = await postToExpo([message]);
            await clearTokens(invalidTokens);

            return { success: invalidTokens.length === 0 };
        } catch (error) {
            console.error('[push] sendToUser error:', error.message);
            return { success: false, error: error.message };
        }
    }

    // Gửi tới nhiều user (chunked 100/lần — giới hạn của Expo).
    static async sendToMultipleUsers(userIds, notification) {
        try {
            const users = await User.find({
                _id: { $in: userIds },
                push_token: { $ne: '' },
            }).select('push_token');

            const tokens = users.map((u) => u.push_token).filter(isExpoToken);
            if (!tokens.length) return { success: 0, failed: 0 };

            const baseMessage = {
                title: notification.title,
                body: notification.body,
                sound: 'default',
                priority: 'high',
                data: notification.data || {},
            };

            let successCount = 0;
            const allInvalid = [];

            // Expo cho phép tối đa 100 message / request.
            for (let i = 0; i < tokens.length; i += 100) {
                const batch = tokens.slice(i, i + 100).map((to) => ({ ...baseMessage, to }));
                const { tickets, invalidTokens } = await postToExpo(batch);
                successCount += tickets.filter((tk) => tk?.status === 'ok').length;
                allInvalid.push(...invalidTokens);
            }

            await clearTokens(allInvalid);

            return {
                success: successCount,
                failed: tokens.length - successCount,
                totalSent: tokens.length,
            };
        } catch (error) {
            console.error('[push] sendToMultipleUsers error:', error.message);
            return { success: 0, failed: userIds.length, error: error.message };
        }
    }

    /**
     * Gửi 1 sự kiện thông báo tới nhiều người nhận, render theo NGÔN NGỮ của từng
     * người (User.language). Tạo cả thông báo in-app (lưu DB) lẫn push (nếu có
     * token). Thay thế pattern cũ: Notification.insertMany + sendToMultipleUsers.
     *
     * @param {object} opts
     * @param {string|string[]} opts.userIds  Người nhận
     * @param {string} opts.key               Key trong i18n/notifications
     * @param {object} [opts.params]          Tham số thay vào template
     * @param {string} [opts.type]            Loại thông báo (cho deep-link client)
     * @param {object} [opts.data]            Payload kèm push (vd. donation_id)
     * @param {string} [opts.related_entity_type]
     * @param {*}      [opts.related_entity_id]
     * @param {boolean}[opts.push]            Có gửi push không (default true)
     */
    static async dispatch({
        userIds,
        key,
        params = {},
        type = null,
        data = {},
        related_entity_type = null,
        related_entity_id = null,
        push = true,
    }) {
        try {
            const ids = (Array.isArray(userIds) ? userIds : [userIds])
                .filter(Boolean)
                .map(String);
            const uniqueIds = [...new Set(ids)];
            if (uniqueIds.length === 0) return;

            const users = await User.find({ _id: { $in: uniqueIds } })
                .select('language push_token')
                .lean();

            // In-app notifications — render theo ngôn ngữ từng người.
            const docs = users.map((user) => {
                const { title, body } = renderNotification(key, user.language || 'vi', params);
                return {
                    user_id: user._id,
                    title,
                    message: body,
                    type,
                    related_entity_type,
                    related_entity_id,
                };
            });
            if (docs.length > 0) {
                await Notification.insertMany(docs).catch(() => {});
            }

            // Push — chỉ user có token hợp lệ, render riêng theo ngôn ngữ.
            if (push) {
                const messages = users
                    .filter((user) => isExpoToken(user.push_token))
                    .map((user) => {
                        const { title, body } = renderNotification(key, user.language || 'vi', params);
                        return {
                            to: user.push_token,
                            title,
                            body,
                            sound: 'default',
                            priority: 'high',
                            data: { ...(type ? { type } : {}), ...data },
                        };
                    });

                const allInvalid = [];
                for (let i = 0; i < messages.length; i += 100) {
                    const { invalidTokens } = await postToExpo(messages.slice(i, i + 100));
                    allInvalid.push(...invalidTokens);
                }
                await clearTokens(allInvalid);
            }
        } catch (error) {
            console.error('[push] dispatch error:', error.message);
        }
    }

    // ============ USE CASES ============
    // Tin nhắn chat — nội dung do người dùng tạo nên KHÔNG i18n (hiển thị nguyên văn).

    static notifyNewMessage(userId, messageData) {
        return this.sendToUser(userId, {
            title: messageData.sender_name,
            body: messageData.message_text,
            data: {
                type: 'NEW_MESSAGE',
                chat_id: String(messageData.chat_id || ''),
                sender_id: String(messageData.sender_id || ''),
            },
        });
    }

}

module.exports = NotificationService;
