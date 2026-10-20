

import { useEffect, useRef, useState } from 'react';

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

    const closePeer = (userId) => {
      const pc = peerConnectionsRef.current.get(userId);

      if (pc) {
        pc.onicecandidate = null;
        pc.ontrack = null;
        pc.onconnectionstatechange = null;
        pc.close();
        peerConnectionsRef.current.delete(userId);
      }

      pendingCandidatesRef.current.delete(userId);

      const audio = audioElementsRef.current.get(userId);

      if (audio) {
        audio.srcObject = null;
        audio.remove();
        audioElementsRef.current.delete(userId);
      }
    };

    const createPeer = (userId) => {
      let pc = peerConnectionsRef.current.get(userId);

      if (pc) return pc;

      pc = new RTCPeerConnection(RTC_CONFIG);
      peerConnectionsRef.current.set(userId, pc);

      const stream = localStreamRef.current;

      if (stream) {
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socket.connected) {
          socket.emit('webrtc:ice-candidate', {
            toUserId: userId,
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        let audio = audioElementsRef.current.get(userId);

        if (!audio) {
          audio = document.createElement('audio');
          audio.autoplay = true;
          audio.playsInline = true;
          audio.setAttribute('aria-label', 'Participant voice');
          document.body.appendChild(audio);
          audioElementsRef.current.set(userId, audio);
        }

        const [remoteStream] = event.streams;

        if (remoteStream) {
          audio.srcObject = remoteStream;
          audio.play().catch(() => {
            setAudioError(
              'Audio autoplay blocked. Click the page and allow audio playback.'
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
    };

    const addPendingCandidates = async (userId, pc) => {
      const pending = pendingCandidatesRef.current.get(userId) || [];
      pendingCandidatesRef.current.delete(userId);

      for (const candidate of pending) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('ICE candidate error:', error);
        }
      }
    };

    const handleOffer = async ({
      fromUserId,
      description,
    } = {}) => {
      if (!fromUserId || !description || disposed) return;

      const pc = createPeer(fromUserId);

      try {
        await pc.setRemoteDescription(
          new RTCSessionDescription(description)
        );

        await addPendingCandidates(fromUserId, pc);

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit('webrtc:answer', {
          toUserId: fromUserId,
          description: pc.localDescription,
        });
      } catch (error) {
        console.error('WebRTC offer error:', error);
      }
    };

    const handleAnswer = async ({
      fromUserId,
      description,
    } = {}) => {
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
    };

    const handleIceCandidate = async ({
      fromUserId,
      candidate,
    } = {}) => {
      if (!fromUserId || !candidate) return;

      const pc = peerConnectionsRef.current.get(fromUserId);

      if (!pc || !pc.remoteDescription) {
        const pending =
          pendingCandidatesRef.current.get(fromUserId) || [];

        pending.push(candidate);
        pendingCandidatesRef.current.set(fromUserId, pending);
        return;
      }

      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('ICE candidate error:', error);
      }
    };

    const handleAvatarLeft = ({ id } = {}) => {
      if (id) closePeer(id);
    };

    socket.on('webrtc:offer', handleOffer);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('avatar:left', handleAvatarLeft);

    async function startAudio() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error(
            'Microphone access is unavailable. Use localhost or HTTPS.'
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

        // Attach microphone tracks to peers created before permission resolved.
        peerConnectionsRef.current.forEach((pc) => {
          const hasAudioSender = pc
            .getSenders()
            .some((sender) => sender.track?.kind === 'audio');

          if (!hasAudioSender) {
            stream.getTracks().forEach((track) => {
              pc.addTrack(track, stream);
            });
          }
        });

        const currentUser = latestRef.current.localUser;
        const nearby = latestRef.current.nearbyParticipants || [];

        for (const participant of nearby) {
          if (!participant?.id || participant.id === currentUser?.id) {
            continue;
          }

          const pc = createPeer(participant.id);

          // Only one side creates the initial offer.
          if (
            String(currentUser.id).localeCompare(String(participant.id)) < 0 &&
            !pc.localDescription
          ) {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            socket.emit('webrtc:offer', {
              toUserId: participant.id,
              description: pc.localDescription,
            });
          }
        }
      } catch (error) {
        console.error('Microphone setup error:', error);
        setMicStatus('error');
        setAudioError(
          error?.name === 'NotAllowedError'
            ? 'Microphone permission denied. Allow microphone access in your browser.'
            : error?.message || 'Unable to start microphone.'
        );
      }
    }

    startAudio();

    return () => {
      disposed = true;

      socket.off('webrtc:offer', handleOffer);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('avatar:left', handleAvatarLeft);

      peerConnectionsRef.current.forEach((pc) => pc.close());
      peerConnectionsRef.current.clear();
      pendingCandidatesRef.current.clear();

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

  // Update mute state without rebuilding all peer connections.
  useEffect(() => {
    localStreamRef.current?.getAudioTracks().forEach((track) => {
      track.enabled = !isMuted;
    });
  }, [isMuted]);

  // Apply proximity-based volume to each remote audio stream.
  useEffect(() => {
    const local = localUser;

    audioElementsRef.current.forEach((audio, userId) => {
      const participant = (participants || []).find(
        (person) => person.id === userId
      );

      if (!local || !participant) {
        audio.volume = 0;
        return;
      }

      const dx = local.x - participant.x;
      const dy = local.y - participant.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const radius = 100;

      if (distance >= radius) {
        audio.volume = 0;
      } else {
        audio.volume = Math.max(0, Math.min(1, 1 - distance / radius));
      }
    });
  }, [localUser, participants, nearbyParticipants]);

  return { micStatus, audioError };
}
