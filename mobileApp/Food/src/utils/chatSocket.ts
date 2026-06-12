import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let activeToken: string | null = null;

function getSocketBaseUrl() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function connectChatSocket(token: string) {
  // Cùng token → tái dùng socket hiện có (kể cả khi đang connect/đang reconnect).
  // socket.io tự lo reconnect; KHÔNG teardown ở đây để tránh huỷ socket đang kết nối
  // làm mất các listener đã đăng ký (vd. listener global ở tabs layout).
  if (socket && activeToken === token) {
    return socket;
  }

  // Đổi token (đăng nhập tài khoản khác) → bỏ socket cũ, tạo mới.
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  const baseUrl = getSocketBaseUrl();
  if (!baseUrl) {
    throw new Error('Missing EXPO_PUBLIC_API_URL.');
  }

  activeToken = token;
  socket = io(baseUrl, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
    timeout: 10000,
  });

  return socket;
}
