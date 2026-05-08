const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const User = require('../app/models/userModel');
const ChatService = require('../app/services/chatService');

const userRoomName = (userId) => `user:${userId}`;
const conversationRoomName = (conversationId) => `conversation:${conversationId}`;

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
    const io = new Server(httpServer, {
        cors: {
            origin: '*',
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

                const eventPayload = {
                    conversation_id: result.conversation_id,
                    message: result.message,
                };

                io.to(conversationRoomName(result.conversation_id)).emit('chat:new_message', eventPayload);
                result.recipient_ids.forEach((recipientId) => {
                    io.to(userRoomName(recipientId)).emit('chat:new_message', eventPayload);
                });

                if (typeof ack === 'function') ack({ success: true, data: eventPayload });
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
    userRoomName,
    conversationRoomName,
};
