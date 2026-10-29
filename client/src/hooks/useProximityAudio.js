import { useEffect, useRef, useState } from 'react';

const PROXIMITY_RADIUS = 100;

const RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export function useProximityAudio({
  socketRef,
  localUser,
  participants,
  nearbyParticipants,
  enabled,
  isMuted,
}) {
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const pendingCandidatesRef = useRef(new Map());
  const offersInProgressRef = useRef(new Set());
  const syncNearbyRef = useRef(null);
  const latestRef = useRef({});

  // Web Audio API references
  const audioContextRef = useRef(null);
  const audioNodesRef = useRef(new Map());

  const [micStatus, setMicStatus] = useState('off');
  const [audioError, setAudioError] = useState('');
  const [audioContextReady, setAudioContextReady] =
    useState(false);

  // Keep the latest positions and settings available to WebRTC callbacks.
  latestRef.current = {
    localUser,
    participants,
    nearbyParticipants,
    enabled,
    isMuted,
  };

  useEffect(() => {
    const socket = socketRef.current;

    if (!enabled || !socket?.connected || !localUser?.id) {
      setMicStatus('off');
      return undefined;
    }

    let disposed = false;

    // Close a peer connection and its associated audio nodes.
    function closePeer(userId) {
      const id = String(userId);
      const pc = peerConnectionsRef.current.get(id);

      if (pc) {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.close();

        peerConnectionsRef.current.delete(id);
      }

      offersInProgressRef.current.delete(id);
      pendingCandidatesRef.current.delete(id);

      const nodes = audioNodesRef.current.get(id);

      if (nodes) {
        try {
          nodes.source.disconnect();
          nodes.gain.disconnect();
        } catch (error) {
          console.warn('Audio node cleanup:', error);
        }

        audioNodesRef.current.delete(id);
      }
    }

    // Create a peer connection for a participant.
    function createPeer(userId) {
      const id = String(userId);

      let pc = peerConnectionsRef.current.get(id);

      if (pc) return pc;

      pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(id, pc);

      // Add our microphone track if it is already available.
      const localStream = localStreamRef.current;

      if (localStream) {
        localStream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, localStream);
        });
      }

      // Send ICE candidates to the other participant.
      pc.onicecandidate = (event) => {
        if (event.candidate && socket.connected && !disposed) {
          socket.emit('webrtc:ice-candidate', {
            toUserId: id,
            candidate: event.candidate,
          });
        }
      };

      // Receive remote audio and connect it to a GainNode.
      pc.ontrack = async (event) => {
        if (disposed) return;

        const remoteStream = event.streams?.[0];

        if (!remoteStream) return;

        try {
          const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

          if (!AudioContextClass) {
            throw new Error(
              'Web Audio API is not supported in this browser.'
            );
          }

          if (!audioContextRef.current) {
            audioContextRef.current = new AudioContextClass();
          }

          const audioContext = audioContextRef.current;

          // Create one audio processing chain per participant.
          let nodes = audioNodesRef.current.get(id);

          if (!nodes) {
            const source =
              audioContext.createMediaStreamSource(remoteStream);

            const gain = audioContext.createGain();

            // Start muted until the initial distance is calculated.
            gain.gain.value = 0;

            source.connect(gain);
            gain.connect(audioContext.destination);

            nodes = { source, gain };
            audioNodesRef.current.set(id, nodes);
          }

          // Calculate the initial volume from current avatar positions.
          const current = latestRef.current;
          const local = current.localUser;

          const participant = (current.participants || []).find(
            (person) => String(person.id) === id
          );

          let volume = 0;

          if (
            local &&
            participant &&
            Number.isFinite(local.x) &&
            Number.isFinite(local.y) &&
            Number.isFinite(participant.x) &&
            Number.isFinite(participant.y)
          ) {
            const dx = local.x - participant.x;
            const dy = local.y - participant.y;
            const distance = Math.hypot(dx, dy);

            volume =
              distance >= PROXIMITY_RADIUS
                ? 0
                : Math.max(
                    0,
                    Math.min(
                      1,
                      1 - distance / PROXIMITY_RADIUS
                    )
                  );
          }

          nodes.gain.gain.setValueAtTime(
            volume,
            audioContext.currentTime
          );

          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          if (disposed) {
            closePeer(id);
            return;
          }

          setAudioContextReady(true);
          setAudioError('');
        } catch (error) {
          console.error('Web Audio setup error:', error);

          setAudioError(
            error?.message ||
              'Unable to initialize remote audio.'
          );
        }
      };

      // Clean up failed or closed peer connections.
      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          closePeer(id);
        }
      };

      return pc;
    }

    // Add ICE candidates received before the remote description.
    async function addPendingCandidates(userId, pc) {
      const id = String(userId);

      const pending =
        pendingCandidatesRef.current.get(id) || [];

      pendingCandidatesRef.current.delete(id);

      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error('Pending ICE candidate error:', error);
        }
      }
    }

    // Handle an incoming WebRTC offer.
    async function handleOffer({
      fromUserId,
      description,
    } = {}) {
      if (!fromUserId || !description || disposed) return;

      const id = String(fromUserId);
      const nearby =
        latestRef.current.nearbyParticipants || [];

      const isNearby = nearby.some(
        (person) => String(person.id) === id
      );

      if (!isNearby) return;

      const pc = createPeer(id);

      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(description)
        );

        await addPendingCandidates(id, pc);

        if (disposed) return;

        const answer = await pc.createAnswer();

        await pc.setLocalDescription(answer);

        if (!disposed && socket.connected) {
          socket.emit('webrtc:answer', {
            toUserId: id,
            description: pc.localDescription,
          });
        }
      } catch (error) {
        console.error('WebRTC offer error:', error);
      }
    }

    // Handle an answer to our offer.
    async function handleAnswer({
      fromUserId,
      description,
    } = {}) {
      if (!fromUserId || !description || disposed) return;

      const id = String(fromUserId);
      const pc = peerConnectionsRef.current.get(id);

      if (!pc) return;

      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(description)
        );

        await addPendingCandidates(id, pc);
      } catch (error) {
        console.error('WebRTC answer error:', error);
      }
    }

    // Handle incoming ICE candidates.
    async function handleIceCandidate({
      fromUserId,
      candidate,
    } = {}) {
      if (!fromUserId || !candidate || disposed) return;

      const id = String(fromUserId);
      const pc = peerConnectionsRef.current.get(id);

      if (!pc || !pc.remoteDescription) {
        const pending =
          pendingCandidatesRef.current.get(id) || [];

        pending.push(candidate);
        pendingCandidatesRef.current.set(id, pending);
        return;
      }

      try {
        await pc.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error('ICE candidate error:', error);
      }
    }

    // Remove a participant who has left.
    function handleAvatarLeft({ id } = {}) {
      if (id) {
        closePeer(id);
      }
    }

    // Keep peer connections synchronized with nearby participants.
    async function syncNearby() {
      if (disposed || !localStreamRef.current) return;

      const currentUser = latestRef.current.localUser;
      const nearby =
        latestRef.current.nearbyParticipants || [];

      if (!currentUser?.id) return;

      const nearbyIds = new Set(
        nearby
          .filter(
            (person) =>
              person?.id &&
              String(person.id) !== String(currentUser.id)
          )
          .map((person) => String(person.id))
      );

      // Close connections to participants who are no longer nearby.
      for (const userId of peerConnectionsRef.current.keys()) {
        if (!nearbyIds.has(String(userId))) {
          closePeer(userId);
        }
      }

      // Connect to nearby participants.
      for (const participant of nearby) {
        if (
          disposed ||
          !participant?.id ||
          String(participant.id) === String(currentUser.id)
        ) {
          continue;
        }

        const id = String(participant.id);
        const pc = createPeer(id);

        // Use a consistent rule so only one participant offers.
        const shouldOffer =
          String(currentUser.id).localeCompare(id) < 0;

        if (
          !shouldOffer ||
          pc.signalingState !== 'stable' ||
          pc.localDescription ||
          offersInProgressRef.current.has(id)
        ) {
          continue;
        }

        offersInProgressRef.current.add(id);

        try {
          const offer = await pc.createOffer();

          if (disposed || !socket.connected) continue;

          await pc.setLocalDescription(offer);

          if (!disposed && socket.connected) {
            socket.emit('webrtc:offer', {
              toUserId: id,
              description: pc.localDescription,
            });
          }
        } catch (error) {
          console.error('Nearby voice connection error:', error);
        } finally {
          offersInProgressRef.current.delete(id);
        }
      }
    }

    syncNearbyRef.current = syncNearby;

    // Register WebRTC signaling events.
    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('avatar:left', handleAvatarLeft);

    // Request microphone access.
    async function startAudio() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            'Microphone unavailable. Use localhost or HTTPS.'
          );
        }

        const stream =
          await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });

        if (disposed) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;

        stream.getAudioTracks().forEach((track) => {
          track.enabled = !latestRef.current.isMuted;
        });

        setMicStatus('ready');
        setAudioError('');

        // Add microphone tracks to existing peer connections.
        peerConnectionsRef.current.forEach((pc) => {
          const hasAudioSender = pc
            .getSenders()
            .some((sender) => sender.track?.kind === 'audio');

          if (!hasAudioSender) {
            stream.getAudioTracks().forEach((track) => {
              pc.addTrack(track, stream);
            });
          }
        });

        await syncNearbyRef.current?.();
      } catch (error) {
        if (disposed) return;

        console.error('Microphone setup error:', error);
        setMicStatus('error');

        setAudioError(
          error?.name === 'NotAllowedError'
            ? 'Microphone permission denied. Allow microphone access in browser settings.'
            : error?.message || 'Unable to start microphone.'
        );
      }
    }

    startAudio();

    // Remove event listeners and release audio resources.
    return () => {
      disposed = true;
      syncNearbyRef.current = null;

      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('avatar:left', handleAvatarLeft);

      peerConnectionsRef.current.forEach((pc) => {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.close();
      });

      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();
      offersInProgressRef.current.clear();

      audioNodesRef.current.forEach((nodes) => {
        try {
          nodes.source.disconnect();
          nodes.gain.disconnect();
        } catch (error) {
          console.warn('Audio cleanup:', error);
        }
      });

      audioNodesRef.current.clear();

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      localStreamRef.current = null;

      const audioContext = audioContextRef.current;
      audioContextRef.current = null;

      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch((error) => {
          console.warn('AudioContext cleanup:', error);
        });
      }

      setAudioContextReady(false);
    };
  }, [enabled, localUser?.id, socketRef]);

  // Mute or unmute the outgoing microphone.
  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
  }, [isMuted]);

  // Reconcile WebRTC connections when nearby users change.
  useEffect(() => {
    syncNearbyRef.current?.();
  }, [nearbyParticipants, enabled, localUser?.id]);

  // WEEK 3: Dynamic audio attenuation based on avatar distance.
  useEffect(() => {
    const audioContext = audioContextRef.current;

    if (!audioContext || !audioContextReady) return;

    const local = localUser;

    audioNodesRef.current.forEach((nodes, userId) => {
      const participant = (participants || []).find(
        (person) => String(person.id) === String(userId)
      );

      let distance = null;
      let volume = 0;

      if (
        local &&
        participant &&
        Number.isFinite(local.x) &&
        Number.isFinite(local.y) &&
        Number.isFinite(participant.x) &&
        Number.isFinite(participant.y)
      ) {
        const dx = local.x - participant.x;
        const dy = local.y - participant.y;

        distance = Math.hypot(dx, dy);

        volume =
          distance >= PROXIMITY_RADIUS
            ? 0
            : Math.max(
                0,
                Math.min(
                  1,
                  1 - distance / PROXIMITY_RADIUS
                )
              );
      }

      console.log('ATTENUATION DEBUG:', {
        localPosition: local
          ? { x: local.x, y: local.y }
          : null,
        remotePosition: participant
          ? { x: participant.x, y: participant.y }
          : null,
        distance,
        volume,
      });

      nodes.gain.gain.setTargetAtTime(
        volume,
        audioContext.currentTime,
        0.08
      );
    });
  }, [
    localUser,
    participants,
    nearbyParticipants,
    audioContextReady,
  ]);

  return { micStatus, audioError };
}