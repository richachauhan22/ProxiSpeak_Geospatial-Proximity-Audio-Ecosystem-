import { io } from 'socket.io-client';

export function createSocketClient() {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

  return io(socketUrl, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    transports: ['websocket', 'polling'],
  });
}