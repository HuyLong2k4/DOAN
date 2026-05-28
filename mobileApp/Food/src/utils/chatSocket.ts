import { io, type Socket } from 'socket.io-client';

let socket: Socket | null = null;
let activeToken: string | null = null;

function getSocketBaseUrl() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';
  return apiUrl.replace(/\/api\/?$/, '');
}

export function connectChatSocket(token: string) {
  if (socket && socket.connected && activeToken === token) {
    return socket;
  }

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
