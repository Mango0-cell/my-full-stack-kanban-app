import Cookies from 'js-cookie';
import { io, Socket } from 'socket.io-client';

const SOCKET_VERSION = 8; // bump to force HMR reset

let socket: Socket | null = null;
let socketVersion = 0;

function getSocketBaseUrl() {
  if (process.env.NEXT_PUBLIC_SOCKET_URL) {
    return process.env.NEXT_PUBLIC_SOCKET_URL;
  }
  // Dev: connect directly to backend (CORS allows localhost:3000)
  // Prod: set NEXT_PUBLIC_SOCKET_URL to the backend URL
  return 'http://localhost:3001';
}

export function getRealtimeSocket(): Socket {
  // Force-recreate if version changed (HMR)
  if (socket && socketVersion !== SOCKET_VERSION) {
    console.warn('[socket] version mismatch, destroying stale instance');
    socket.disconnect();
    socket = null;
  }

  if (socket) return socket;

  socketVersion = SOCKET_VERSION;
  const base = getSocketBaseUrl();
  const url = `${base}/realtime`;
  console.warn(`[socket:v${SOCKET_VERSION}] creating →`, url);

  socket = io(url, {
    transports: ['websocket'],
    autoConnect: false,
    forceNew: true,
    auth: (cb) => {
      const token = Cookies.get('kanban_token');
      console.warn('[socket] auth token present:', !!token);
      cb(token ? { token } : {});
    },
  });

  socket.on('auth_error', (data: { message?: string }) => {
    console.error('[socket] auth_error:', data?.message);
  });

  socket.on('connect_error', (err: Error) => {
    console.warn('[socket] connect_error:', err.message);
  });

  socket.on('connect', () => {
    console.warn('[socket] connected, id:', socket!.id);
  });

  socket.on('disconnect', (reason: string) => {
    console.warn('[socket] disconnected:', reason);
  });

  return socket;
}

export function connectRealtime() {
  const instance = getRealtimeSocket();
  console.warn(`[socket:v${SOCKET_VERSION}] connectRealtime, connected:`, instance.connected);
  if (!instance.connected) {
    instance.connect();
  }
  return instance;
}

export function disconnectRealtime() {
  if (socket?.connected) socket.disconnect();
}

export function destroyRealtime() {
  socket?.disconnect();
  socket = null;
}
