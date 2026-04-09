const admin = require('firebase-admin');
const User = require('../models/userModel');

class NotificationService {
    // ============ QUẢN LÝ FCM TOKEN ============
    
    /**
     * Cập nhật FCM token khi user đăng nhập vào app mobile
     * Gọi API này ngay sau khi user login thành công
     */
    static async updateUserToken(userId, fcmToken) {
        try {
            const user = await User.findByIdAndUpdate(
                userId,
                { fcm_token: fcmToken },
                { new: true }
            );

            if (!user) {
                throw new Error('User không tồn tại');
            }

            return { success: true, message: 'FCM token đã được cập nhật' };
        } catch (error) {
            console.error('Error updating FCM token:', error);
            throw error;
        }
    }

    /**
     * Xóa FCM token khi user đăng xuất
     * Tránh gửi notification đến device đã logout
     */
    static async removeUserToken(userId) {
        try {
            await User.findByIdAndUpdate(userId, { fcm_token: '' });
            return { success: true, message: 'FCM token đã được xóa' };
        } catch (error) {
            console.error('Error removing FCM token:', error);
            throw error;
        }
    }

    // ============ GỬI THÔNG BÁO ============

    /**
     * Gửi thông báo cho 1 user cụ thể
     */
    static async sendToUser(userId, notification) {
        try {
            const user = await User.findById(userId).select('fcm_token');

            if (!user || !user.fcm_token) {
                console.log(`User ${userId} không có FCM token`);
                return { success: false, message: 'No FCM token' };
            }

            const message = {
                token: user.fcm_token,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    ...(notification.imageUrl && { imageUrl: notification.imageUrl })
                },
                data: notification.data || {},
                // Cài đặt cho Android & iOS
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default',
                            badge: 1
                        }
                    }
                }
            };

            const response = await admin.messaging().send(message);
            return { success: true, messageId: response };

        } catch (error) {
            // Token không hợp lệ (user đã xóa app, đổi thiết bị, etc.)
            if (error.code === 'messaging/invalid-registration-token' ||
                error.code === 'messaging/registration-token-not-registered') {
                console.log(`Invalid token for user ${userId}, removing...`);
                await User.findByIdAndUpdate(userId, { fcm_token: '' });
            }
            console.error('Error sending notification:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Gửi thông báo cho nhiều user cùng lúc
     * VD: Thông báo cho tất cả user trong bán kính 2km
     */
    static async sendToMultipleUsers(userIds, notification) {
        try {
            const users = await User.find({
                _id: { $in: userIds },
                fcm_token: { $ne: '' }
            }).select('fcm_token');

            const tokens = users.map(u => u.fcm_token);

            if (tokens.length === 0) {
                return { success: 0, failed: 0, message: 'No FCM tokens found' };
            }

            const message = {
                tokens: tokens,
                notification: {
                    title: notification.title,
                    body: notification.body,
                    ...(notification.imageUrl && { imageUrl: notification.imageUrl })
                },
                data: notification.data || {},
                android: {
                    priority: 'high',
                    notification: {
                        sound: 'default',
                        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
                    }
                },
                apns: {
                    payload: {
                        aps: {
                            sound: 'default'
                        }
                    }
                }
            };

            const response = await admin.messaging().sendMulticast(message);

            // Xóa các token không hợp lệ
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push(tokens[idx]);
                    }
                });
                // Xóa các token lỗi khỏi database
                await User.updateMany(
                    { fcm_token: { $in: failedTokens } },
                    { fcm_token: '' }
                );
            }

            return {
                success: response.successCount,
                failed: response.failureCount,
                totalSent: tokens.length
            };

        } catch (error) {
            console.error('Error sending multicast notification:', error);
            throw error;
        }
    }

    // ============ USE CASES CỤ THỂ CHO FOODRESCUE ============

    /**
     * 🔔 Thông báo khi có đồ ăn mới gần user
     * Đây là tính năng QUAN TRỌNG NHẤT của app
     * 
     * @param {Array} nearbyUserIds - Danh sách ID user trong bán kính 2-5km
     * @param {Object} foodData - Thông tin đồ ăn (tên, số lượng, địa chỉ, hình ảnh)
     */
    static async notifyNewFoodNearby(nearbyUserIds, foodData) {
        const notification = {
            title: '🍲 Có đồ ăn miễn phí gần bạn!',
            body: `${foodData.food_name} - ${foodData.quantity} suất, cách bạn ${foodData.distance}m`,
            imageUrl: foodData.image_url,
            data: {
                type: 'NEW_FOOD',
                food_id: foodData.food_id,
                donor_location: JSON.stringify(foodData.location),
                click_action: 'FOOD_DETAIL_SCREEN'
            }
        };

        return await this.sendToMultipleUsers(nearbyUserIds, notification);
    }

    /**
     * 🎉 Thông báo khi đạt huy hiệu mới
     */
    static async notifyBadgeEarned(userId, badge) {
        const notification = {
            title: '🎉 Chúc mừng! Bạn đạt huy hiệu mới',
            body: `${badge.name} - ${badge.description}`,
            imageUrl: badge.image_url,
            data: {
                type: 'BADGE_EARNED',
                badge_id: badge._id.toString(),
                click_action: 'PROFILE_SCREEN'
            }
        };

        return await this.sendToUser(userId, notification);
    }

    /**
     * ✅ Thông báo khi đơn của RECEIVER được xác nhận
     */
    static async notifyOrderConfirmed(receiverId, orderData) {
        const notification = {
            title: '✅ Đơn của bạn đã được xác nhận',
            body: `${orderData.donor_name} đã xác nhận. Hãy đến lấy trước ${orderData.pickup_time}`,
            data: {
                type: 'ORDER_CONFIRMED',
                order_id: orderData.order_id,
                click_action: 'ORDER_DETAIL_SCREEN'
            }
        };

        return await this.sendToUser(receiverId, notification);
    }

    /**
     * ❌ Thông báo khi đơn bị từ chối
     */
    static async notifyOrderRejected(receiverId, orderData) {
        const notification = {
            title: '❌ Đơn của bạn bị từ chối',
            body: `Lý do: ${orderData.reason || 'Đồ ăn không còn đủ số lượng'}`,
            data: {
                type: 'ORDER_REJECTED',
                order_id: orderData.order_id,
                click_action: 'HOME_SCREEN'
            }
        };

        return await this.sendToUser(receiverId, notification);
    }

    /**
     * 📦 Thông báo cho DONOR khi có người đặt đồ ăn của họ
     */
    static async notifyDonorNewOrder(donorId, orderData) {
        const notification = {
            title: '📦 Có người đặt đồ ăn của bạn',
            body: `${orderData.receiver_name} muốn nhận ${orderData.quantity} suất`,
            data: {
                type: 'NEW_ORDER',
                order_id: orderData.order_id,
                click_action: 'ORDER_MANAGEMENT_SCREEN'
            }
        };

        return await this.sendToUser(donorId, notification);
    }

    /**
     * ⏰ Nhắc nhở RECEIVER đến lấy đồ (gửi trước 30 phút)
     */
    static async notifyPickupReminder(receiverId, orderData) {
        const notification = {
            title: '⏰ Nhắc nhở: Đến giờ lấy đồ ăn rồi!',
            body: `Đơn hàng #${orderData.order_code} cần lấy trước ${orderData.pickup_time}`,
            data: {
                type: 'PICKUP_REMINDER',
                order_id: orderData.order_id,
                click_action: 'ORDER_DETAIL_SCREEN'
            }
        };

        return await this.sendToUser(receiverId, notification);
    }

    /**
     * ⏰ Nhắc nhở DONOR đồ ăn sắp hết hạn (chưa có người lấy)
     */
    static async notifyDonorExpiringSoon(donorId, foodData) {
        const notification = {
            title: '⏰ Đồ ăn của bạn sắp hết hạn',
            body: `${foodData.food_name} còn ${foodData.remaining_quantity} suất nhưng chưa có người nhận`,
            data: {
                type: 'FOOD_EXPIRING',
                food_id: foodData.food_id,
                click_action: 'DONATION_DETAIL_SCREEN'
            }
        };

        return await this.sendToUser(donorId, notification);
    }

    /**
     * 🌟 Thông báo khi có tin nhắn mới (chat giữa donor-receiver)
     */
    static async notifyNewMessage(userId, messageData) {
        const notification = {
            title: `💬 ${messageData.sender_name}`,
            body: messageData.message_text,
            data: {
                type: 'NEW_MESSAGE',
                chat_id: messageData.chat_id,
                sender_id: messageData.sender_id,
                click_action: 'CHAT_SCREEN'
            }
        };

        return await this.sendToUser(userId, notification);
    }

    /**
     * 📢 Thông báo hệ thống (từ admin)
     */
    static async notifySystemAnnouncement(announcement) {
        // Lấy tất cả user có FCM token (active users)
        const users = await User.find({ fcm_token: { $ne: '' } }).select('_id');
        const userIds = users.map(u => u._id);

        const notification = {
            title: announcement.title,
            body: announcement.body,
            imageUrl: announcement.image_url,
            data: {
                type: 'SYSTEM_ANNOUNCEMENT',
                announcement_id: announcement.id,
                click_action: 'NOTIFICATION_SCREEN'
            }
        };

        return await this.sendToMultipleUsers(userIds, notification);
    }
}

module.exports = NotificationService;