const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const User = require('../app/models/userModel');
const ChatService = require('../app/services/chatService');

const userRoomName = (userId) => `user:${userId}`;
const conversationRoomName = (conversationId) => `conversation:${conversationId}`;

// Phát một message mới qua socket. Gửi tới userRoom của TỪNG người nhận (bao trùm
// mọi thiết bị, dù họ có mở màn chat hay không — userRoom được join lúc connect và
// không rời) và userRoom người gửi (để danh sách hội thoại của chính họ cập nhật
// real-time). Dùng chung cho cả socket send lẫn REST send, và chỉ emit một lần cho
// mỗi người (không phát kèm conversationRoom → tránh trùng tin cho người đang mở chat).
function emitNewMessage(io, result, senderId = null) {
    if (!io || !result) return;

    const recipientPayload = {
        conversation_id: result.conversation_id,
        message: { ...result.message, is_me: false },
    };
    (result.recipient_ids || []).forEach((recipientId) => {
        io.to(userRoomName(recipientId)).emit('chat:new_message', recipientPayload);
    });

    if (senderId) {
        io.to(userRoomName(String(senderId))).emit('chat:new_message', {
            conversation_id: result.conversation_id,
            message: result.message, // is_me = true (đã tính theo người gửi)
        });
    }
}

// Lấy jwt token từ request kết nối Socket.io
function extractToken(socket) {
    const authToken = socket.handshake?.auth?.token;
    if (authToken) return authToken;

    const header = socket.handshake?.headers?.authorization;
    if (header && header.startsWith('Bearer ')) {
        return header.slice(7);
    }

    return null;
}

function createChatSocketServer(httpServer) {
    const allowedOriginsEnv = (process.env.ALLOWED_ORIGINS || '').trim();
    const corsOrigin = allowedOriginsEnv && allowedOriginsEnv !== '*'
        ? allowedOriginsEnv.split(',').map((s) => s.trim()).filter(Boolean)
        : '*';

    const io = new Server(httpServer, {
        cors: {
            origin: corsOrigin,
            methods: ['GET', 'POST'],
        },
    });

    io.use(async (socket, next) => {
        try {
            const token = extractToken(socket);
            if (!token) return next(new Error('Unauthorized: missing token'));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('_id full_name role');
            if (!user) return next(new Error('Unauthorized: invalid user'));

            socket.user = {
                id: String(user._id),
                full_name: user.full_name || 'User',
                role: user.role,
            };

            return next();
        } catch {
            return next(new Error('Unauthorized'));
        }
    });

    io.on('connection', (socket) => {
        const currentUserId = socket.user.id;
        socket.join(userRoomName(currentUserId));

        socket.on('chat:join', async (payload = {}, ack) => {
            try {
                const conversationId = payload.conversation_id;
                if (!conversationId) throw ChatService._error('conversation_id is required.');

                await ChatService.ensureConversationMember(conversationId, currentUserId);
                socket.join(conversationRoomName(conversationId));

                if (typeof ack === 'function') ack({ success: true });
            } catch (err) {
                if (typeof ack === 'function') ack({ success: false, message: err.message });
            }
        });

        socket.on('chat:leave', (payload = {}, ack) => {
            const conversationId = payload.conversation_id;
            if (conversationId) {
                socket.leave(conversationRoomName(conversationId));
            }
            if (typeof ack === 'function') ack({ success: true });
        });

        socket.on('chat:send', async (payload = {}, ack) => {
            try {
                const conversationId = payload.conversation_id;
                const text = payload.text;
                const attachments = payload.attachments;

                const result = await ChatService.sendMessage(conversationId, socket.user, text, attachments);

                emitNewMessage(io, result, socket.user.id);

                if (typeof ack === 'function') {
                    ack({ success: true, data: { conversation_id: result.conversation_id, message: result.message } });
                }
            } catch (err) {
                if (typeof ack === 'function') ack({ success: false, message: err.message });
            }
        });

        socket.on('chat:typing', async (payload = {}, ack) => {
            try {
                const conversationId = payload.conversation_id;
                const isTyping = Boolean(payload.is_typing);
                if (!conversationId) throw ChatService._error('conversation_id is required.');

                await ChatService.ensureConversationMember(conversationId, currentUserId);
                socket.to(conversationRoomName(conversationId)).emit('chat:typing', {
                    conversation_id: conversationId,
                    user_id: currentUserId,
                    is_typing: isTyping,
                });

                if (typeof ack === 'function') ack({ success: true });
            } catch (err) {
                if (typeof ack === 'function') ack({ success: false, message: err.message });
            }
        });

        socket.on('chat:mark_read', async (payload = {}, ack) => {
            try {
                const conversationId = payload.conversation_id;
                if (!conversationId) throw ChatService._error('conversation_id is required.');

                const data = await ChatService.markConversationRead(conversationId, currentUserId);

                io.to(conversationRoomName(conversationId)).emit('chat:read', {
                    conversation_id: conversationId,
                    user_id: currentUserId,
                    read_count: data.read_count,
                });

                if (typeof ack === 'function') ack({ success: true, data });
            } catch (err) {
                if (typeof ack === 'function') ack({ success: false, message: err.message });
            }
        });
    });

    return io;
}

module.exports = {
    createChatSocketServer,
    emitNewMessage,
    userRoomName,
    conversationRoomName,
};
