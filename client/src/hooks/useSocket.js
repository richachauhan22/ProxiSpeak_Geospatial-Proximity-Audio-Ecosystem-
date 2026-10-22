import { useEffect, useRef, useState } from 'react';
import { createSocketClient } from '../services/socketClient';

export function useSocket({ onConnect, onDisconnect, onConnectError } = {}) {
  const socketRef = useRef(null);
  const callbacksRef = useRef({ onConnect, onDisconnect, onConnectError });
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  callbacksRef.current = { onConnect, onDisconnect, onConnectError };

  useEffect(() => {
    const socket = createSocketClient();
    socketRef.current = socket;

    const handleConnect = () => {
      console.log('[Socket] Connected to server on port 4000!');
      setConnectionStatus('connected');
      callbacksRef.current.onConnect?.();
    };

    const handleDisconnect = (reason) => {
      console.log('[Socket] Disconnected:', reason);
      setConnectionStatus(socket.active ? 'reconnecting' : 'disconnected');
      callbacksRef.current.onDisconnect?.(reason);
    };

    const handleConnection = (payload) => {
      if (payload?.status === 'connected') setConnectionStatus('connected');
    };

    const handleConnectError = (error) => {
      console.error('[Socket] Connection error:', error.message);
      setConnectionStatus('error');
      callbacksRef.current.onConnectError?.(error);
    };

    const handleReconnectAttempt = () => setConnectionStatus('reconnecting');

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connection', handleConnection);
    socket.on('connect_error', handleConnectError);
    socket.io.on('reconnect_attempt', handleReconnectAttempt);

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connection', handleConnection);
      socket.off('connect_error', handleConnectError);
      socket.io.off('reconnect_attempt', handleReconnectAttempt);
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return { socketRef, connectionStatus, setConnectionStatus };
}