import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  WebRTCManager,
  calculateSpatialVolume,
  calculateSpatialPan,
  DEFAULT_RTC_CONFIG,
  DEFAULT_SPATIAL_CONFIG,
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

  it('handles edge case when minDistance is equal to or greater than maxDistance', () => {
    expect(calculateSpatialVolume(50, 100, 100)).toBe(1.0);
    expect(calculateSpatialVolume(100, 100, 100)).toBe(1.0);
    expect(calculateSpatialVolume(150, 100, 100)).toBe(0.0);
  });

  it('calculates stereo panning clamped to [-1, 1]', () => {
    expect(calculateSpatialPan(0, 280)).toBe(0);
    expect(calculateSpatialPan(140, 280)).toBe(0.5);
    expect(calculateSpatialPan(-140, 280)).toBe(-0.5);
    expect(calculateSpatialPan(280, 280)).toBe(1);
    expect(calculateSpatialPan(-280, 280)).toBe(-1);
    expect(calculateSpatialPan(500, 280)).toBe(1);
    expect(calculateSpatialPan(-500, 280)).toBe(-1);
  });

  it('handles invalid or zero maxDistance in calculateSpatialPan', () => {
    expect(calculateSpatialPan(100, 0)).toBe(0);
    expect(calculateSpatialPan(100, -50)).toBe(0);
  });
});

describe('WebRTCManager Core Audio & Peer Management', () => {
  let mockAudioTrack;
  let mockMediaStream;
  let mockPeerConnection;
  let mockAudioContext;
  let mockGainNode;
  let mockPannerNode;
  let mockAnalyserNode;
  let mockSourceNode;

  beforeEach(() => {
    vi.useFakeTimers();

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

    // Mock Web Audio API
    mockGainNode = {
      gain: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockPannerNode = {
      pan: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAnalyserNode = {
      fftSize: 256,
      frequencyBinCount: 128,
      getByteFrequencyData: vi.fn((buf) => buf.fill(50)), // Simulates sound
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockSourceNode = {
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    mockAudioContext = {
      state: 'running',
      currentTime: 10,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createMediaStreamSource: vi.fn(() => mockSourceNode),
      createGain: vi.fn(() => mockGainNode),
      createStereoPanner: vi.fn(() => mockPannerNode),
      createAnalyser: vi.fn(() => mockAnalyserNode),
    };

    global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext);

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

    window.AudioContext = global.AudioContext;
    window.RTCPeerConnection = global.RTCPeerConnection;
    window.RTCSessionDescription = vi.fn().mockImplementation((desc) => desc);
    window.RTCIceCandidate = vi.fn().mockImplementation((cand) => cand);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with default options and allows setting localUserId', () => {
    const manager = new WebRTCManager({ localUserId: 'user-1' });
    expect(manager.rtcConfig).toEqual(DEFAULT_RTC_CONFIG);
    expect(manager.spatialConfig).toEqual(DEFAULT_SPATIAL_CONFIG);
    expect(manager.localUserId).toBe('user-1');

    manager.setLocalUserId('user-2');
    expect(manager.localUserId).toBe('user-2');

    manager.destroy();
  });

  it('resumes audioContext if it was suspended when getAudioContext is called', () => {
    mockAudioContext.state = 'suspended';
    const manager = new WebRTCManager();
    const ctx = manager.getAudioContext();

    expect(ctx).toBe(mockAudioContext);
    expect(mockAudioContext.resume).toHaveBeenCalled();

    manager.destroy();
  });

  it('throws and triggers onError when getUserMedia is not supported', async () => {
    const errorHandler = vi.fn();
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const manager = new WebRTCManager({ onError: errorHandler });
    await expect(manager.startLocalAudio()).rejects.toThrow(/not supported/i);
    expect(errorHandler).toHaveBeenCalled();

    manager.destroy();
  });

  it('initializes local audio stream with getUserMedia constraints and sets up VAD', async () => {
    const speakingHandler = vi.fn();
    const manager = new WebRTCManager({ onLocalSpeaking: speakingHandler });
    const stream = await manager.startLocalAudio({ echoCancellation: false });

    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
      audio: expect.objectContaining({
        echoCancellation: false,
        noiseSuppression: true,
        autoGainControl: true,
      }),
      video: false,
    });

    expect(stream).toBe(mockMediaStream);
    expect(manager.localStream).toBe(mockMediaStream);
    expect(manager.isMuted).toBe(false);

    // Fast-forward timer to verify VAD interval triggers speaking
    vi.advanceTimersByTime(150);
    expect(speakingHandler).toHaveBeenCalledWith(true, expect.any(Number));

    manager.destroy();
  });

  it('replaces audio track on existing peer connections when new stream is started', async () => {
    const manager = new WebRTCManager();
    const mockSender = {
      track: { kind: 'audio' },
      replaceTrack: vi.fn().mockResolvedValue(undefined),
    };
    mockPeerConnection.getSenders.mockReturnValue([mockSender]);

    manager.createPeer('peer-existing', false);
    await manager.startLocalAudio();

    expect(mockSender.replaceTrack).toHaveBeenCalledWith(mockAudioTrack);
    manager.destroy();
  });

  it('mutes and unmutes local audio tracks correctly and turns off VAD', async () => {
    const speakingHandler = vi.fn();
    const manager = new WebRTCManager({ onLocalSpeaking: speakingHandler });
    await manager.startLocalAudio();

    expect(mockAudioTrack.enabled).toBe(true);

    // Trigger speaking
    vi.advanceTimersByTime(150);
    expect(speakingHandler).toHaveBeenCalledWith(true, expect.any(Number));

    // Mute
    manager.setMute(true);
    expect(manager.isMuted).toBe(true);
    expect(mockAudioTrack.enabled).toBe(false);
    expect(speakingHandler).toHaveBeenCalledWith(false, 0);

    // Advance time while muted, should stay silent
    speakingHandler.mockClear();
    vi.advanceTimersByTime(200);
    expect(speakingHandler).not.toHaveBeenCalledWith(true, expect.any(Number));

    // Unmute
    manager.setMute(false);
    expect(manager.isMuted).toBe(false);
    expect(mockAudioTrack.enabled).toBe(true);

    manager.destroy();
  });

  it('throws and triggers onError when RTCPeerConnection is unsupported', () => {
    const errorHandler = vi.fn();
    global.RTCPeerConnection = undefined;

    const manager = new WebRTCManager({ onError: errorHandler });
    expect(() => manager.createPeer('peer-1')).toThrow(/not supported/i);
    expect(errorHandler).toHaveBeenCalled();

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

  it('triggers onSignal with ice candidate when onicecandidate fires', () => {
    const signalHandler = vi.fn();
    const manager = new WebRTCManager({ onSignal: signalHandler });
    manager.createPeer('peer-alex', false);

    expect(typeof mockPeerConnection.onicecandidate).toBe('function');
    mockPeerConnection.onicecandidate({ candidate: { candidate: 'cand-123' } });

    expect(signalHandler).toHaveBeenCalledWith({
      type: 'candidate',
      targetId: 'peer-alex',
      candidate: { candidate: 'cand-123' },
    });

    manager.destroy();
  });

  it('attaches remote stream and notifies onRemoteStream when ontrack fires', () => {
    const remoteStreamHandler = vi.fn();
    const remoteSpeakingHandler = vi.fn();
    const manager = new WebRTCManager({
      onRemoteStream: remoteStreamHandler,
      onRemoteSpeaking: remoteSpeakingHandler,
    });
    manager.createPeer('peer-mia', false);

    const mockRemoteTrack = { kind: 'audio' };
    const mockRemoteStream = { id: 'stream-remote' };

    mockPeerConnection.ontrack({
      streams: [mockRemoteStream],
      track: mockRemoteTrack,
    });

    expect(remoteStreamHandler).toHaveBeenCalledWith('peer-mia', mockRemoteStream);

    // Advance time for remote VAD interval
    vi.advanceTimersByTime(250);
    expect(remoteSpeakingHandler).toHaveBeenCalledWith('peer-mia', true, expect.any(Number));

    manager.destroy();
  });

  it('handles peer connection state changes and removes peer on failed or closed', () => {
    const stateHandler = vi.fn();
    const manager = new WebRTCManager({ onPeerConnectionChange: stateHandler });
    manager.createPeer('peer-temp', false);

    mockPeerConnection.connectionState = 'connected';
    mockPeerConnection.onconnectionstatechange();
    expect(stateHandler).toHaveBeenCalledWith('peer-temp', 'connected');
    expect(manager.peers.has('peer-temp')).toBe(true);

    mockPeerConnection.connectionState = 'failed';
    mockPeerConnection.onconnectionstatechange();
    expect(stateHandler).toHaveBeenCalledWith('peer-temp', 'failed');
    expect(manager.peers.has('peer-temp')).toBe(false);

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

    await manager.handleCandidate('peer-marcus', { candidate: 'candidate-1' });
    expect(peer.iceQueue).toHaveLength(1);
    expect(mockPeerConnection.addIceCandidate).not.toHaveBeenCalled();

    await manager.handleOffer('peer-marcus', { type: 'offer', sdp: 'offer-sdp' });
    expect(mockPeerConnection.addIceCandidate).toHaveBeenCalledWith({ candidate: 'candidate-1' });
    expect(peer.iceQueue).toHaveLength(0);

    manager.destroy();
  });

  it('updates spatial audio gain and panner based on 2D avatar distance', () => {
    const manager = new WebRTCManager({
      spatialConfig: { minDistance: 60, maxDistance: 280, panEnabled: true },
    });
    manager.getAudioContext();
    manager.createPeer('peer-bob', false);

    // Setup remote audio nodes manually
    mockPeerConnection.ontrack({
      streams: [{ id: 'stream-bob' }],
      track: { kind: 'audio' },
    });

    // Local user at (100, 100), Peer Bob at (200, 100) -> dx = 100, dy = 0, dist = 100
    manager.updateSpatialAudio({ x: 100, y: 100 }, [{ id: 'peer-bob', x: 200, y: 100 }]);

    expect(mockGainNode.gain.setValueAtTime).toHaveBeenCalledWith(
      expect.any(Number),
      mockAudioContext.currentTime,
    );
    expect(mockPannerNode.pan.setValueAtTime).toHaveBeenCalledWith(
      expect.any(Number),
      mockAudioContext.currentTime,
    );

    manager.destroy();
  });

  it('safely ignores updateSpatialAudio when position is invalid', () => {
    const manager = new WebRTCManager();
    manager.createPeer('peer-bob', false);

    expect(() => manager.updateSpatialAudio(null, [])).not.toThrow();
    expect(() => manager.updateSpatialAudio({ x: NaN, y: 100 }, [])).not.toThrow();

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
    expect(mockAudioContext.close).toHaveBeenCalled();
  });
});
