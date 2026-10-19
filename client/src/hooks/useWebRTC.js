import { useEffect, useRef, useState, useCallback } from 'react';
import { WebRTCManager } from '../services/webrtcManager';

/**
 * useWebRTC Hook
 * Coordinates browser getUserMedia, WebRTC peer connections, socket signaling,
 * voice activity detection, and 2D spatial audio falloff.
 */
export function useWebRTC({
  socketRef,
  localUser,
  participants = [],
  enabled = false,
  spatialConfig,
} = {}) {
  const managerRef = useRef(null);
  const [managerInstance, setManagerInstance] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState('idle'); // 'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported'
  const [connectedPeers, setConnectedPeers] = useState([]);
  const [speakingPeers, setSpeakingPeers] = useState(() => new Set());
  const [webrtcError, setWebrtcError] = useState(null);

  const localUserRef = useRef(localUser);
  localUserRef.current = localUser;

  const participantsRef = useRef(participants);
  participantsRef.current = participants;

  // Initialize WebRTCManager instance
  useEffect(() => {
    const manager = new WebRTCManager({
      spatialConfig,
      localUserId: localUser?.id || null,
      onSignal: ({ type, targetId, offer, answer, candidate }) => {
        const socket = socketRef?.current;
        if (!socket || !socket.connected) return;

        if (type === 'offer') {
          socket.emit('webrtc:offer', { targetId, offer });
        } else if (type === 'answer') {
          socket.emit('webrtc:answer', { targetId, answer });
        } else if (type === 'candidate') {
          socket.emit('webrtc:ice-candidate', { targetId, candidate });
        }
      },
      onLocalSpeaking: (speaking, level) => {
        setIsLocalSpeaking(speaking);
        setAudioLevel(level);
      },
      onRemoteSpeaking: (peerId, speaking) => {
        setSpeakingPeers((prev) => {
          const next = new Set(prev);
          if (speaking) next.add(peerId);
          else next.delete(peerId);
          return next;
        });
      },
      onPeerConnectionChange: (peerId, state) => {
        if (state === 'connected') {
          setConnectedPeers((prev) => (prev.includes(peerId) ? prev : [...prev, peerId]));
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          setConnectedPeers((prev) => prev.filter((id) => id !== peerId));
        }
      },
      onError: (err) => {
        console.warn('[WebRTC]', err?.message || err);
        setWebrtcError(err?.message || 'WebRTC error');
      },
    });

    managerRef.current = manager;
    setManagerInstance(manager);

    return () => {
      manager.destroy();
      managerRef.current = null;
      setManagerInstance(null);
    };
  }, [spatialConfig]);

  // Keep manager informed of local user ID
  useEffect(() => {
    if (managerRef.current && localUser?.id) {
      managerRef.current.setLocalUserId(localUser.id);
    }
  }, [localUser?.id]);

  /**
   * Request microphone stream via getUserMedia
   */
  const startAudio = useCallback(async (constraints = {}) => {
    if (!managerRef.current) return null;
    try {
      setPermissionStatus('prompt');
      setWebrtcError(null);
      const stream = await managerRef.current.startLocalAudio(constraints);
      setLocalStream(stream);
      setIsMuted(managerRef.current.isMuted);
      setPermissionStatus('granted');
      return stream;
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionStatus('denied');
        setWebrtcError('Microphone permission was denied. Please allow microphone access in your browser.');
      } else if (err.message?.includes('not supported')) {
        setPermissionStatus('unsupported');
        setWebrtcError('WebRTC audio is not supported in this browser.');
      } else {
        setPermissionStatus('denied');
        setWebrtcError(err.message || 'Failed to access microphone.');
      }
      return null;
    }
  }, []);

  /**
   * Stop local microphone stream
   */
  const stopAudio = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.stopLocalAudio();
    }
    setLocalStream(null);
    setIsLocalSpeaking(false);
    setAudioLevel(0);
  }, []);

  /**
   * Toggle mute / unmute state
   */
  const toggleMute = useCallback(() => {
    if (!managerRef.current) return !isMuted;
    const nextState = !isMuted;
    managerRef.current.setMute(nextState);
    setIsMuted(nextState);
    return nextState;
  }, [isMuted]);

  /**
   * Set mute state explicitly
   */
  const setMute = useCallback((muted) => {
    if (!managerRef.current) return;
    managerRef.current.setMute(muted);
    setIsMuted(Boolean(muted));
  }, []);

  // Listen to socket WebRTC signaling events
  useEffect(() => {
    const socket = socketRef?.current;
    if (!socket || !enabled) return undefined;

    const handleOffer = ({ senderId, offer }) => {
      if (senderId && offer && managerRef.current) {
        managerRef.current.handleOffer(senderId, offer);
      }
    };

    const handleAnswer = ({ senderId, answer }) => {
      if (senderId && answer && managerRef.current) {
        managerRef.current.handleAnswer(senderId, answer);
      }
    };

    const handleCandidate = ({ senderId, candidate }) => {
      if (senderId && candidate && managerRef.current) {
        managerRef.current.handleCandidate(senderId, candidate);
      }
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleCandidate);

    return () => {
      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleCandidate);
    };
  }, [socketRef, enabled]);

  // Connect to peers when office is enabled and participants update
  useEffect(() => {
    if (!enabled || !managerRef.current || !localUser?.id) return;

    const manager = managerRef.current;
    const myId = localUser.id;

    // Connect to each participant in the room
    participants.forEach((peer) => {
      if (!peer.id || peer.id === myId) return;

      if (!manager.peers.has(peer.id)) {
        // Deterministic initiator: user with lexicographically smaller ID initiates
        const isInitiator = myId < peer.id;
        manager.createPeer(peer.id, isInitiator);
      }
    });

    // Prune peers that left
    const currentParticipantIds = new Set(participants.map((p) => p.id));
    for (const peerId of manager.peers.keys()) {
      if (!currentParticipantIds.has(peerId)) {
        manager.removePeer(peerId);
      }
    }
  }, [enabled, participants, localUser?.id]);

  // Continuously synchronize spatial audio based on positions
  useEffect(() => {
    if (!enabled || !managerRef.current || !localUser) return;
    managerRef.current.updateSpatialAudio(localUser, participants);
  }, [enabled, localUser?.x, localUser?.y, participants]);

  return {
    localStream,
    isMuted,
    isLocalSpeaking,
    audioLevel,
    permissionStatus,
    connectedPeers,
    speakingPeers,
    webrtcError,
    startAudio,
    stopAudio,
    toggleMute,
    setMute,
    manager: managerInstance || managerRef.current,
  };
}
