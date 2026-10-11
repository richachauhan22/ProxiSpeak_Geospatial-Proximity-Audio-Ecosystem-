import { io } from 'socket.io-client';

export function createSocketClient() {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
  return io(socketUrl, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    transports: ['websocket'],
  });
}
