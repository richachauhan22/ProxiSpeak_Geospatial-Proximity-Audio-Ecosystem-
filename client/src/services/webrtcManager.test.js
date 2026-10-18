import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WebRTCManager,
  calculateSpatialVolume,
  calculateSpatialPan,
} from './webrtcManager';

describe('Spatial Audio Math Calculations', () => {
  it('calculates full volume within minDistance', () => {
    expect(calculateSpatialVolume(0, 60, 280)).toBe(1.0);
    expect(calculateSpatialVolume(50, 60, 280)).toBe(1.0);
    expect(calculateSpatialVolume(60, 60, 280)).toBe(1.0);
  });

  it('calculates zero volume beyond maxDistance', () => {
    expect(calculateSpatialVolume(280, 60, 280)).toBe(0.0);
    expect(calculateSpatialVolume(350, 60, 280)).toBe(0.0);
  });

  it('calculates smooth linear falloff between min and max distance', () => {
    const midDistance = 60 + (280 - 60) / 2; // 170
    const volume = calculateSpatialVolume(midDistance, 60, 280);
    expect(volume).toBeCloseTo(0.5, 2);
  });

  it('calculates stereo panning clamped to [-1, 1]', () => {
    expect(calculateSpatialPan(0, 280)).toBe(0);
    expect(calculateSpatialPan(280, 280)).toBe(1);
    expect(calculateSpatialPan(-280, 280)).toBe(-1);
    expect(calculateSpatialPan(500, 280)).toBe(1);
    expect(calculateSpatialPan(-500, 280)).toBe(-1);
  });
});

describe('WebRTCManager Core Audio & Peer Management', () => {
  let mockAudioTrack;
  let mockMediaStream;
  let mockPeerConnection;

  beforeEach(() => {
    mockAudioTrack = {
      kind: 'audio',
      enabled: true,
      stop: vi.fn(),
    };

    mockMediaStream = {
      getTracks: vi.fn(() => [mockAudioTrack]),
      getAudioTracks: vi.fn(() => [mockAudioTrack]),
    };

    // Mock navigator.mediaDevices.getUserMedia
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockMediaStream),
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'audioinput', deviceId: 'mic-1', label: 'Internal Mic' },
        ]),
      },
      writable: true,
      configurable: true,
    });

    // Mock RTCPeerConnection
    mockPeerConnection = {
      addTrack: vi.fn(),
      getSenders: vi.fn(() => []),
      createOffer: vi.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-offer-sdp' }),
      createAnswer: vi.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-answer-sdp' }),
      setLocalDescription: vi.fn().mockImplementation(async (desc) => {
        mockPeerConnection.localDescription = desc;
      }),
      setRemoteDescription: vi.fn().mockImplementation(async (desc) => {
        mockPeerConnection.remoteDescription = desc;
      }),
      addIceCandidate: vi.fn().mockResolvedValue(undefined),
      close: vi.fn(),
      connectionState: 'new',
      onicecandidate: null,
      ontrack: null,
      onconnectionstatechange: null,
    };

    global.RTCPeerConnection = vi.fn().mockImplementation(() => mockPeerConnection);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initializes local audio stream with getUserMedia constraints', async () => {
    const manager = new WebRTCManager();
    const stream = await manager.startLocalAudio();

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: expect.objectContaining({
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }),
      video: false,
    });

    expect(stream).toBe(mockMediaStream);
    expect(manager.localStream).toBe(mockMediaStream);
    expect(manager.isMuted).toBe(false);

    manager.destroy();
  });

  it('mutes and unmutes local audio tracks correctly', async () => {
    const manager = new WebRTCManager();
    await manager.startLocalAudio();

    expect(mockAudioTrack.enabled).toBe(true);

    manager.setMute(true);
    expect(manager.isMuted).toBe(true);
    expect(mockAudioTrack.enabled).toBe(false);

    manager.setMute(false);
    expect(manager.isMuted).toBe(false);
    expect(mockAudioTrack.enabled).toBe(true);

    manager.destroy();
  });

  it('creates peer connections and initiates offers when isInitiator is true', async () => {
    const signalHandler = vi.fn();
    const manager = new WebRTCManager({ onSignal: signalHandler });
    await manager.startLocalAudio();

    const peer = manager.createPeer('peer-david', true);

    expect(global.RTCPeerConnection).toHaveBeenCalled();
    expect(mockPeerConnection.addTrack).toHaveBeenCalledWith(mockAudioTrack, mockMediaStream);
    expect(peer.peerId).toBe('peer-david');

    // Wait for async initiateOffer
    await Promise.resolve();
    await Promise.resolve();

    expect(mockPeerConnection.createOffer).toHaveBeenCalled();
    expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
    expect(signalHandler).toHaveBeenCalledWith({
      type: 'offer',
      targetId: 'peer-david',
      offer: { type: 'offer', sdp: 'mock-offer-sdp' },
    });

    manager.destroy();
  });

  it('handles remote offer and returns generated answer via signaling callback', async () => {
    const signalHandler = vi.fn();
    const manager = new WebRTCManager({ onSignal: signalHandler });

    await manager.handleOffer('peer-alex', { type: 'offer', sdp: 'incoming-sdp' });

    expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalledWith({
      type: 'offer',
      sdp: 'incoming-sdp',
    });
    expect(mockPeerConnection.createAnswer).toHaveBeenCalled();
    expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
    expect(signalHandler).toHaveBeenCalledWith({
      type: 'answer',
      targetId: 'peer-alex',
      answer: { type: 'answer', sdp: 'mock-answer-sdp' },
    });

    manager.destroy();
  });

  it('handles remote answer and sets remote description', async () => {
    const manager = new WebRTCManager();
    manager.createPeer('peer-alex', false);

    await manager.handleAnswer('peer-alex', { type: 'answer', sdp: 'response-sdp' });

    expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalledWith({
      type: 'answer',
      sdp: 'response-sdp',
    });

    manager.destroy();
  });

  it('queues ICE candidates until remoteDescription is set, then drains them', async () => {
    const manager = new WebRTCManager();
    const peer = manager.createPeer('peer-marcus', false);

    // No remote description yet
    await manager.handleCandidate('peer-marcus', { candidate: 'candidate-1' });
    expect(peer.iceQueue).toHaveLength(1);
    expect(mockPeerConnection.addIceCandidate).not.toHaveBeenCalled();

    // Receiving offer sets remote description and drains queue
    await manager.handleOffer('peer-marcus', { type: 'offer', sdp: 'offer-sdp' });
    expect(mockPeerConnection.addIceCandidate).toHaveBeenCalledWith({ candidate: 'candidate-1' });
    expect(peer.iceQueue).toHaveLength(0);

    manager.destroy();
  });

  it('removes peer and closes RTCPeerConnection cleanly', () => {
    const manager = new WebRTCManager();
    manager.createPeer('peer-oliver', false);
    expect(manager.peers.has('peer-oliver')).toBe(true);

    manager.removePeer('peer-oliver');
    expect(mockPeerConnection.close).toHaveBeenCalled();
    expect(manager.peers.has('peer-oliver')).toBe(false);

    manager.destroy();
  });

  it('stops local audio and releases media tracks on destroy', async () => {
    const manager = new WebRTCManager();
    await manager.startLocalAudio();

    manager.destroy();
    expect(mockAudioTrack.stop).toHaveBeenCalled();
    expect(manager.localStream).toBeNull();
  });
});
