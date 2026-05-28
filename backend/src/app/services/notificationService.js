const User = require('../models/userModel');

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

    // ============ USE CASES ============

    static notifyDonorNewOrder(donorId, orderData) {
        return this.sendToUser(donorId, {
            title: 'Có người đặt đồ ăn của bạn',
            body: `${orderData.receiver_name} muốn nhận ${orderData.quantity} suất`,
            data: { type: 'NEW_ORDER', order_id: String(orderData.order_id || '') },
        });
    }

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
