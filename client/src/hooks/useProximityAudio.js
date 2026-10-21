
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
  const audioElementsRef = useRef(new Map());
  const pendingCandidatesRef = useRef(new Map());
  const offersInProgressRef = useRef(new Set());
  const syncNearbyRef = useRef(null);
  const latestRef = useRef({});

  const [micStatus, setMicStatus] = useState('off');
  const [audioError, setAudioError] = useState('');

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

    function closePeer(userId) {
      const pc = peerConnectionsRef.current.get(userId);

      if (pc) {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.close();
        peerConnectionsRef.current.delete(userId);
      }

      offersInProgressRef.current.delete(userId);
      pendingCandidatesRef.current.delete(userId);

      const audio = audioElementsRef.current.get(userId);

      if (audio) {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
        audioElementsRef.current.delete(userId);
      }
    }

    function createPeer(userId) {
      let pc = peerConnectionsRef.current.get(userId);

      if (pc) return pc;

      pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(userId, pc);

      const stream = localStreamRef.current;

      if (stream) {
        stream.getAudioTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socket.connected && !disposed) {
          socket.emit('webrtc:ice-candidate', {
            toUserId: userId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        if (disposed) return;

        let audio = audioElementsRef.current.get(userId);

        if (!audio) {
          audio = document.createElement('audio');
          audio.autoplay = true;
          audio.playsInline = true;
          audio.setAttribute('aria-label', 'Participant voice');

          document.body.appendChild(audio);
          audioElementsRef.current.set(userId, audio);
        }

        const remoteStream = event.streams?.[0];

        if (remoteStream) {
          audio.srcObject = remoteStream;

          audio.play().then(() => {
            setAudioError('');
          }).catch(() => {
            setAudioError(
              'Audio playback blocked. Click the page and allow audio playback.'
            );
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          closePeer(userId);
        }
      };

      return pc;
    }

    async function addPendingCandidates(userId, pc) {
      const pending = pendingCandidatesRef.current.get(userId) || [];
      pendingCandidatesRef.current.delete(userId);

      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(
            new RTCIceCandidate(candidate)
          );
        } catch (error) {
          console.error('ICE candidate error:', error);
        }
      }
    }

    async function handleOffer({
      fromUserId,
      description,
    } = {}) {
      if (!fromUserId || !description || disposed) return;

      // Ignore offers from users who are no longer nearby.
      const nearby = latestRef.current.nearbyParticipants || [];
      const isNearby = nearby.some(
        (person) => String(person.id) === String(fromUserId)
      );

      if (!isNearby) return;

      const pc = createPeer(fromUserId);

      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(description)
        );

        await addPendingCandidates(fromUserId, pc);

        if (disposed) return;

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        if (!disposed && socket.connected) {
          socket.emit('webrtc:answer', {
            toUserId: fromUserId,
            description: pc.localDescription,
          });
        }
      } catch (error) {
        console.error('WebRTC offer error:', error);
      }
    }

    async function handleAnswer({
      fromUserId,
      description,
    } = {}) {
      if (!fromUserId || !description || disposed) return;

      const pc = peerConnectionsRef.current.get(fromUserId);

      if (!pc || !description) return;

      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(description)
        );

        await addPendingCandidates(fromUserId, pc);
      } catch (error) {
        console.error('WebRTC answer error:', error);
      }
    }

    async function handleIceCandidate({
      fromUserId,
      candidate,
    } = {}) {
      if (!fromUserId || !candidate || disposed) return;

      const pc = peerConnectionsRef.current.get(fromUserId);

      if (!pc || !pc.remoteDescription) {
        const pending =
          pendingCandidatesRef.current.get(fromUserId) || [];

        pending.push(candidate);
        pendingCandidatesRef.current.set(fromUserId, pending);
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

    function handleAvatarLeft({ id } = {}) {
      if (id) {
        closePeer(id);
      }
    }

    async function syncNearby() {
      if (disposed || !localStreamRef.current) return;

      const currentUser = latestRef.current.localUser;
      const nearby = latestRef.current.nearbyParticipants || [];

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

      // Close connections to avatars that are no longer nearby.
      for (const userId of peerConnectionsRef.current.keys()) {
        if (!nearbyIds.has(String(userId))) {
          closePeer(userId);
        }
      }

      // Connect to newly nearby avatars.
      for (const participant of nearby) {
        if (
          disposed ||
          !participant?.id ||
          String(participant.id) === String(currentUser.id)
        ) {
          continue;
        }

        const userId = participant.id;
        const pc = createPeer(userId);

        // Only one side should initiate an offer.
        const shouldOffer =
          String(currentUser.id).localeCompare(String(userId)) < 0;

        if (
          !shouldOffer ||
          pc.signalingState !== 'stable' ||
          pc.localDescription ||
          offersInProgressRef.current.has(userId)
        ) {
          continue;
        }

        offersInProgressRef.current.add(userId);

        try {
          const offer = await pc.createOffer();

          if (disposed || !socket.connected) continue;

          await pc.setLocalDescription(offer);

          if (!disposed && socket.connected) {
            socket.emit('webrtc:offer', {
              toUserId: userId,
              description: pc.localDescription,
            });
          }
        } catch (error) {
          console.error('Nearby voice connection error:', error);
        } finally {
          offersInProgressRef.current.delete(userId);
        }
      }
    }

    syncNearbyRef.current = syncNearby;

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('avatar:left', handleAvatarLeft);

    async function startAudio() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            'Microphone unavailable. Use localhost or HTTPS.'
          );
        }

        const stream = await navigator.mediaDevices.getUserMedia({
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

        // Add microphone tracks to any existing peer connections.
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

      audioElementsRef.current.forEach((audio) => {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      });

      audioElementsRef.current.clear();

      localStreamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      localStreamRef.current = null;
    };
  }, [enabled, localUser?.id, socketRef]);

  // Start or stop outgoing microphone audio when mute changes.
  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
  }, [isMuted]);

  // Synchronize connections whenever the nearby participant list changes.
  useEffect(() => {
    syncNearbyRef.current?.();
  }, [nearbyParticipants, enabled, localUser?.id]);

  // Adjust incoming voice volume according to avatar distance.
  useEffect(() => {
    const local = localUser;

    audioElementsRef.current.forEach((audio, userId) => {
      const participant = (participants || []).find(
        (person) => String(person.id) === String(userId)
      );

      if (
        !local ||
        !participant ||
        !Number.isFinite(local.x) ||
        !Number.isFinite(local.y) ||
        !Number.isFinite(participant.x) ||
        !Number.isFinite(participant.y)
      ) {
        audio.volume = 0;
        return;
      }

      const dx = local.x - participant.x;
      const dy = local.y - participant.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      audio.volume =
        distance >= PROXIMITY_RADIUS
          ? 0
          : Math.max(0, Math.min(1, 1 - distance / PROXIMITY_RADIUS));
    });
  }, [localUser, participants, nearbyParticipants]);

  return { micStatus, audioError };
}
