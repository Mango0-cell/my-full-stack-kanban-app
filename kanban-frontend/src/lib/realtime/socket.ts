import Cookies from 'js-cookie';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocketBaseUrl() {
  return process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001';
}

export function getRealtimeSocket(): Socket {
  if (socket) return socket;

  socket = io(`${getSocketBaseUrl()}/realtime`, {
    transports: ['websocket'],
    autoConnect: false,
    withCredentials: true,
    auth: () => {
      const token = Cookies.get('kanban_token');
      return token ? { token } : {};
    },
  });

  return socket;
}

export function connectRealtime() {
  const instance = getRealtimeSocket();
  if (!instance.connected) {
    instance.connect();
  }
  return instance;
}

export function disconnectRealtime() {
  if (socket?.connected) socket.disconnect();
}
