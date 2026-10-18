/**
 * ProxiSpeak WebRTC Manager
 * Handles peer-to-peer audio connections using browser getUserMedia and RTCPeerConnection.
 * Includes voice activity detection (VAD) and distance-based spatial audio attenuation.
 */

export const DEFAULT_RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const DEFAULT_SPATIAL_CONFIG = {
  minDistance: 60, // full volume within 60px
  maxDistance: 280, // silent beyond 280px
  panEnabled: true,
};

export function calculateSpatialVolume(distance, minDistance = 60, maxDistance = 280) {
  if (distance <= minDistance) return 1.0;
  if (distance >= maxDistance) return 0.0;
  return Math.max(0, Math.min(1, 1 - (distance - minDistance) / (maxDistance - minDistance)));
}

export function calculateSpatialPan(dx, maxDistance = 280) {
  if (!maxDistance || maxDistance <= 0) return 0;
  return Math.max(-1, Math.min(1, dx / maxDistance));
}

export class WebRTCManager {
  constructor(options = {}) {
    this.rtcConfig = options.rtcConfig || DEFAULT_RTC_CONFIG;
    this.spatialConfig = { ...DEFAULT_SPATIAL_CONFIG, ...options.spatialConfig };
    this.localUserId = options.localUserId || null;

    // Callbacks
    this.onSignal = options.onSignal || null; // ({ type, targetId, offer/answer/candidate }) => void
    this.onLocalSpeaking = options.onLocalSpeaking || null; // (isSpeaking, level) => void
    this.onRemoteSpeaking = options.onRemoteSpeaking || null; // (peerId, isSpeaking, level) => void
    this.onRemoteStream = options.onRemoteStream || null; // (peerId, stream) => void
    this.onPeerConnectionChange = options.onPeerConnectionChange || null; // (peerId, state) => void
    this.onError = options.onError || null;

    // Local stream & Web Audio
    this.localStream = null;
    this.isMuted = false;
    this.audioContext = null;
    this.localAnalyser = null;
    this.localSourceNode = null;
    this.vadInterval = null;
    this.isLocalSpeaking = false;

    // Active peer connections: Map<peerId, PeerEntry>
    // PeerEntry: { pc, stream, remoteAudio, gainNode, pannerNode, analyserNode, iceQueue, isSpeaking }
    this.peers = new Map();
  }

  setLocalUserId(userId) {
    this.localUserId = userId;
  }

  getAudioContext() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(() => {});
    }
    return this.audioContext;
  }

  /**
   * Initializes local user microphone via navigator.mediaDevices.getUserMedia
   */
  async startLocalAudio(constraints = {}) {
    if (!navigator?.mediaDevices?.getUserMedia) {
      const err = new Error('getUserMedia is not supported in this browser environment.');
      this.onError?.(err);
      throw err;
    }

    try {
      const audioConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...constraints,
      };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: false,
      });

      this.localStream = stream;
      this.isMuted = false;

      // Apply tracks to all existing peer connections
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !this.isMuted;
        for (const [peerId, peerEntry] of this.peers.entries()) {
          const senders = peerEntry.pc.getSenders();
          const sender = senders.find((s) => s.track && s.track.kind === 'audio');
          if (sender) {
            sender.replaceTrack(audioTrack).catch((e) => {
              this.onError?.(new Error(`Failed to replace audio track for peer ${peerId}: ${e.message}`));
            });
          } else {
            peerEntry.pc.addTrack(audioTrack, stream);
          }
        }
      }

      this.setupLocalVAD(stream);
      return stream;
    } catch (error) {
      this.onError?.(error);
      throw error;
    }
  }

  /**
   * Mute or unmute the local microphone track
   */
  setMute(mute) {
    this.isMuted = Boolean(mute);
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !this.isMuted;
      });
    }

    if (this.isMuted && this.isLocalSpeaking) {
      this.isLocalSpeaking = false;
      this.onLocalSpeaking?.(false, 0);
    }

    return this.isMuted;
  }

  /**
   * Set up local Voice Activity Detection using Web Audio Analyser
   */
  setupLocalVAD(stream) {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      this.localSourceNode = ctx.createMediaStreamSource(stream);
      this.localAnalyser = ctx.createAnalyser();
      this.localAnalyser.fftSize = 256;
      this.localSourceNode.connect(this.localAnalyser);

      const buffer = new Uint8Array(this.localAnalyser.frequencyBinCount);

      if (this.vadInterval) clearInterval(this.vadInterval);

      this.vadInterval = setInterval(() => {
        if (this.isMuted || !this.localAnalyser) {
          if (this.isLocalSpeaking) {
            this.isLocalSpeaking = false;
            this.onLocalSpeaking?.(false, 0);
          }
          return;
        }

        this.localAnalyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i];
        }
        const avg = sum / buffer.length;
        const normalizedLevel = Math.min(1, avg / 80);
        const speakingNow = normalizedLevel > 0.12;

        if (speakingNow !== this.isLocalSpeaking) {
          this.isLocalSpeaking = speakingNow;
          this.onLocalSpeaking?.(speakingNow, normalizedLevel);
        }
      }, 100);
    } catch (e) {
      // AudioContext / Analyser may not be available in non-audio test environment
    }
  }

  /**
   * Create or retrieve an RTCPeerConnection for a remote peer
   */
  createPeer(peerId, isInitiator = false) {
    if (this.peers.has(peerId)) {
      return this.peers.get(peerId);
    }

    const RTCPeer = window.RTCPeerConnection || window.webkitRTCPeerConnection;
    if (!RTCPeer) {
      const err = new Error('RTCPeerConnection is not supported in this environment.');
      this.onError?.(err);
      throw err;
    }

    const pc = new RTCPeer(this.rtcConfig);

    const peerEntry = {
      peerId,
      pc,
      remoteStream: null,
      audioElement: null,
      sourceNode: null,
      gainNode: null,
      pannerNode: null,
      analyserNode: null,
      iceQueue: [],
      isSpeaking: false,
    };

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        pc.addTrack(track, this.localStream);
      });
    }

    // ICE candidate generation
    pc.onicecandidate = (event) => {
      if (event.candidate && this.onSignal) {
        this.onSignal({
          type: 'candidate',
          targetId: peerId,
          candidate: event.candidate,
        });
      }
    };

    // Remote track arrival
    pc.ontrack = (event) => {
      const stream = event.streams[0] || new MediaStream([event.track]);
      peerEntry.remoteStream = stream;
      this.setupRemoteAudio(peerId, stream);
      this.onRemoteStream?.(peerId, stream);
    };

    // Connection state monitoring
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      this.onPeerConnectionChange?.(peerId, state);
      if (state === 'failed' || state === 'closed') {
        this.removePeer(peerId);
      }
    };

    this.peers.set(peerId, peerEntry);

    // If initiator, generate offer
    if (isInitiator) {
      this.initiateOffer(peerId);
    }

    return peerEntry;
  }

  /**
   * Create and send WebRTC offer to target peer
   */
  async initiateOffer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    try {
      const offer = await peer.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false,
      });
      await peer.pc.setLocalDescription(offer);

      this.onSignal?.({
        type: 'offer',
        targetId: peerId,
        offer: peer.pc.localDescription,
      });
    } catch (error) {
      this.onError?.(new Error(`Failed to create offer for ${peerId}: ${error.message}`));
    }
  }

  /**
   * Handle incoming WebRTC offer from remote peer
   */
  async handleOffer(senderId, offer) {
    let peer = this.peers.get(senderId);
    if (!peer) {
      peer = this.createPeer(senderId, false);
    }

    try {
      const RTCSession = window.RTCSessionDescription || window.webkitRTCSessionDescription;
      const desc = RTCSession ? new RTCSession(offer) : offer;
      await peer.pc.setRemoteDescription(desc);

      // Drain queued ICE candidates
      while (peer.iceQueue.length > 0) {
        const cand = peer.iceQueue.shift();
        await this.applyIceCandidate(peer, cand);
      }

      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);

      this.onSignal?.({
        type: 'answer',
        targetId: senderId,
        answer: peer.pc.localDescription,
      });
    } catch (error) {
      this.onError?.(new Error(`Failed to handle offer from ${senderId}: ${error.message}`));
    }
  }

  /**
   * Handle incoming WebRTC answer from remote peer
   */
  async handleAnswer(senderId, answer) {
    const peer = this.peers.get(senderId);
    if (!peer) return;

    try {
      const RTCSession = window.RTCSessionDescription || window.webkitRTCSessionDescription;
      const desc = RTCSession ? new RTCSession(answer) : answer;
      await peer.pc.setRemoteDescription(desc);

      // Drain queued ICE candidates
      while (peer.iceQueue.length > 0) {
        const cand = peer.iceQueue.shift();
        await this.applyIceCandidate(peer, cand);
      }
    } catch (error) {
      this.onError?.(new Error(`Failed to handle answer from ${senderId}: ${error.message}`));
    }
  }

  /**
   * Handle incoming ICE candidate from remote peer
   */
  async handleCandidate(senderId, candidate) {
    const peer = this.peers.get(senderId);
    if (!peer) return;

    if (!peer.pc.remoteDescription || !peer.pc.remoteDescription.type) {
      peer.iceQueue.push(candidate);
      return;
    }

    await this.applyIceCandidate(peer, candidate);
  }

  async applyIceCandidate(peer, candidate) {
    try {
      const RTCIce = window.RTCIceCandidate || window.webkitRTCIceCandidate;
      const cand = RTCIce ? new RTCIce(candidate) : candidate;
      await peer.pc.addIceCandidate(cand);
    } catch (error) {
      this.onError?.(new Error(`Failed to add ICE candidate for ${peer.peerId}: ${error.message}`));
    }
  }

  /**
   * Setup remote audio playback and Web Audio spatial routing
   */
  setupRemoteAudio(peerId, stream) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    try {
      // Audio element to ensure playback and satisfy browser audio policies
      let audio = peer.audioElement;
      if (!audio && typeof document !== 'undefined') {
        audio = document.createElement('audio');
        audio.autoplay = true;
        audio.playsInline = true;
        audio.dataset.peerId = peerId;
        peer.audioElement = audio;
      }
      if (audio) {
        audio.srcObject = stream;
        audio.play().catch(() => {});
      }

      // Web Audio spatial graph
      const ctx = this.getAudioContext();
      if (ctx && typeof ctx.createMediaStreamSource === 'function') {
        const sourceNode = ctx.createMediaStreamSource(stream);
        const gainNode = ctx.createGain();
        const analyserNode = ctx.createAnalyser();
        analyserNode.fftSize = 256;

        let pannerNode = null;
        if (typeof ctx.createStereoPanner === 'function' && this.spatialConfig.panEnabled) {
          pannerNode = ctx.createStereoPanner();
          sourceNode.connect(gainNode);
          gainNode.connect(pannerNode);
          pannerNode.connect(analyserNode);
          analyserNode.connect(ctx.destination);
        } else {
          sourceNode.connect(gainNode);
          gainNode.connect(analyserNode);
          analyserNode.connect(ctx.destination);
        }

        peer.sourceNode = sourceNode;
        peer.gainNode = gainNode;
        peer.pannerNode = pannerNode;
        peer.analyserNode = analyserNode;

        // Monitor remote voice activity
        const freqBuffer = new Uint8Array(analyserNode.frequencyBinCount);
        const remoteInterval = setInterval(() => {
          if (!this.peers.has(peerId)) {
            clearInterval(remoteInterval);
            return;
          }
          analyserNode.getByteFrequencyData(freqBuffer);
          let sum = 0;
          for (let i = 0; i < freqBuffer.length; i++) sum += freqBuffer[i];
          const avg = sum / freqBuffer.length;
          const level = Math.min(1, avg / 80);
          const speaking = level > 0.12;

          if (speaking !== peer.isSpeaking) {
            peer.isSpeaking = speaking;
            this.onRemoteSpeaking?.(peerId, speaking, level);
          }
        }, 120);
        peer.remoteInterval = remoteInterval;
      }
    } catch (e) {
      // Ignore in headless/mock test environments
    }
  }

  /**
   * Update spatial audio attenuation for all active peers based on 2D office positions
   */
  updateSpatialAudio(localPos, participantsList = []) {
    if (!localPos || !Number.isFinite(localPos.x) || !Number.isFinite(localPos.y)) {
      return;
    }

    const { minDistance, maxDistance, panEnabled } = this.spatialConfig;
    const ctx = this.audioContext;

    for (const [peerId, peer] of this.peers.entries()) {
      const participant = participantsList.find((p) => p.id === peerId);
      if (!participant) continue;

      const dx = participant.x - localPos.x;
      const dy = participant.y - localPos.y;
      const distance = Math.hypot(dx, dy);

      const volume = calculateSpatialVolume(distance, minDistance, maxDistance);
      const pan = calculateSpatialPan(dx, maxDistance);

      if (peer.gainNode && ctx) {
        peer.gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      }
      if (peer.pannerNode && ctx && panEnabled) {
        peer.pannerNode.pan.setValueAtTime(pan, ctx.currentTime);
      }
      if (peer.audioElement) {
        peer.audioElement.volume = volume;
      }
    }
  }

  /**
   * Remove and clean up a single peer connection
   */
  removePeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return;

    if (peer.remoteInterval) {
      clearInterval(peer.remoteInterval);
    }

    try {
      if (peer.sourceNode) peer.sourceNode.disconnect();
      if (peer.gainNode) peer.gainNode.disconnect();
      if (peer.pannerNode) peer.pannerNode.disconnect();
      if (peer.analyserNode) peer.analyserNode.disconnect();
    } catch (e) {}

    if (peer.audioElement) {
      peer.audioElement.srcObject = null;
      peer.audioElement.remove?.();
    }

    if (peer.pc) {
      peer.pc.close();
    }

    if (peer.isSpeaking) {
      this.onRemoteSpeaking?.(peerId, false, 0);
    }

    this.peers.delete(peerId);
  }

  /**
   * Stop local audio and clean up all media tracks
   */
  stopLocalAudio() {
    if (this.vadInterval) {
      clearInterval(this.vadInterval);
      this.vadInterval = null;
    }

    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    try {
      if (this.localSourceNode) this.localSourceNode.disconnect();
      if (this.localAnalyser) this.localAnalyser.disconnect();
    } catch (e) {}

    if (this.isLocalSpeaking) {
      this.isLocalSpeaking = false;
      this.onLocalSpeaking?.(false, 0);
    }
  }

  /**
   * Full teardown of manager, peers, and audio contexts
   */
  destroy() {
    this.stopLocalAudio();

    for (const peerId of [...this.peers.keys()]) {
      this.removePeer(peerId);
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }
  }
}
