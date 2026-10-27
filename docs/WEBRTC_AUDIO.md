# ProxiSpeak WebRTC Peer-to-Peer Spatial Audio Documentation

This document provides a comprehensive technical overview of the WebRTC peer-to-peer audio architecture, browser audio capture (`getUserMedia`), signaling protocol, voice activity detection, and 2D spatial audio attenuation implemented in ProxiSpeak.

---

## 🎧 Architecture Overview

ProxiSpeak uses a decentralized peer-to-peer (P2P) mesh topology for real-time voice communication, coordinated via a centralized Socket.io signaling layer. Audio streams are spatialized dynamically in the client's Web Audio API graph based on the relative Cartesian distance between avatars in the virtual office.

```
                    ┌────────────────────────────┐
                    │  Socket.io Signaling Relay │
                    │     (Express / Node.js)    │
                    └─────────────┬──────────────┘
                                  │
                 Signaling events │ (Offer / Answer / ICE)
                                  ▼
        ┌──────────────────────────────────────────────────┐
        │                                                  │
┌───────┴────────┐                                ┌────────┴───────┐
│   Client A     │ ◄════════════════════════════► │    Client B    │
│  (Local User)  │     Direct P2P Audio Track     │  (Remote Peer) │
│                │     via RTCPeerConnection      │                │
└────────────────┘                                └────────────────┘
```

---

## 🎤 1. Local Microphone Capture (`getUserMedia`)

Local audio capture is managed by `WebRTCManager` (`client/src/services/webrtcManager.js`) and accessed by the `useWebRTC` React hook (`client/src/hooks/useWebRTC.js`).

### Audio Constraints
```javascript
const constraints = {
  audio: {
    deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: false,
};
```

### Features:
- **Automatic Track Management**: Audio tracks are extracted from the `MediaStream` and added to all active `RTCPeerConnection` instances.
- **Hardware-level Muting**: Toggling mute enables or disables the audio track (`track.enabled = !isMuted`), preventing sensitive audio from leaving the browser.
- **Permission Lifecycle**: Tracks states (`'idle'`, `'prompt'`, `'granted'`, `'denied'`, `'unsupported'`) and provides user-friendly browser permission guidance in the UI.

---

## 🔄 2. WebRTC Signaling Protocol

Since WebRTC cannot establish direct P2P connections without exchanging session metadata, ProxiSpeak utilizes Socket.io to relay Session Description Protocol (SDP) and Interactive Connectivity Establishment (ICE) candidates between peers.

### STUN Configuration
```javascript
export const DEFAULT_RTC_CONFIG = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};
```

### Signaling Message Flow
1. **Join Notification**: When User A enters the office, existing participants are received in `office:joined`.
2. **Deterministic Initiator**: To avoid call collisions (glare), the peer with the lexicographically smaller ID initiates the connection:
   ```javascript
   const isInitiator = localUserId < peerId;
   manager.createPeer(peerId, isInitiator);
   ```
3. **Offer Creation**: Initiator calls `pc.createOffer()`, sets `localDescription`, and emits `webrtc:offer` to the server:
   ```json
   {
     "targetId": "user-david",
     "offer": { "type": "offer", "sdp": "..." }
   }
   ```
4. **Relay**: The server routes the payload to David's socket:
   ```javascript
   io.to(targetSocketId).emit('webrtc:offer', { senderId, offer });
   ```
5. **Answer Creation**: David sets `remoteDescription`, creates answer via `pc.createAnswer()`, sets `localDescription`, and emits `webrtc:answer`.
6. **ICE Candidates**: Both peers exchange ICE candidates via `webrtc:ice-candidate`. If candidates arrive before `remoteDescription` is set, they are queued and drained automatically once the description is ready.

---

## 🗣️ 3. Voice Activity Detection (VAD)

ProxiSpeak includes client-side Voice Activity Detection using the Web Audio API without requiring external heavy models.

```
MediaStream ──► MediaStreamAudioSourceNode ──► AnalyserNode (fftSize 256)
                                                     │
                                                     ▼
                                            ByteFrequencyData
                                            Volume > Threshold?
                                            ├── Yes: isSpeaking = true
                                            └── No:  isSpeaking = false
```

- **Local Speaking Feedback**: When talking, the user's avatar displays an active orange voice arc, and the bottom toolbar renders animated green equalizer waves.
- **Remote Speaking Feedback**: Remote incoming streams are routed through per-peer `AnalyserNode` instances so nearby speaking colleagues light up visually in real time.

---

## 🌐 4. Dynamic Attenuation Algorithms & 2D Spatial Audio

ProxiSpeak simulates realistic proximity audio falloff on the virtual office floor (1440 × 894 px canvas) by hooking WebRTC peer audio streams directly into the Web Audio API.

### 4.1 Volume Drop-Off Algorithms Based on Pixel Distance

Multiple configurable attenuation curves are supported to match physical acoustic propagation or perceptual preferences:

1. **Linear Drop-Off (`calculateLinearVolume`)**:
   $$\text{Volume}(d) = \begin{cases} 1.0 & \text{if } d \le d_{\min} \\ 0.0 & \text{if } d \ge d_{\max} \\ 1.0 - \frac{d - d_{\min}}{d_{\max} - d_{\min}} & \text{otherwise} \end{cases}$$

2. **Exponential / Logarithmic Drop-Off (`calculateExponentialVolume`)**:
   Models human auditory perception (Weber-Fechner logarithmic hearing response and decibel sensation):
   $$t = \frac{d - d_{\min}}{d_{\max} - d_{\min}}, \quad \text{Volume}(t) = \frac{e^{-\alpha \cdot t} - e^{-\alpha}}{1 - e^{-\alpha}}$$

3. **Inverse Distance Drop-Off (`calculateInverseVolume`)**:
   Models 3D spherical acoustic wave energy dispersion ($1/r$ sound pressure falloff):
   $$t = \frac{d - d_{\min}}{d_{\max} - d_{\min}}, \quad \text{Volume}(t) = \frac{\frac{1}{1 + \gamma \cdot t} - \frac{1}{1 + \gamma}}{1 - \frac{1}{1 + \gamma}}$$

4. **Smoothstep S-Curve (`calculateSmoothstepVolume`)**:
   Cubic Hermite polynomial with zero first derivative at both boundary limits ($d_{\min}$ and $d_{\max}$), preventing sudden jumps in volume slope:
   $$t = \frac{d - d_{\min}}{d_{\max} - d_{\min}}, \quad \text{Volume}(t) = 1 - (3t^2 - 2t^3)$$

5. **Acoustic Air Damping (`calculateAirDampingCutoff`)**:
   High frequencies attenuate faster through air over distance. A low-pass filter cutoff scales logarithmically from 20,000 Hz ($d \le d_{\min}$) down to 1,000 Hz ($d \ge d_{\max}$).

6. **Obstacle & Wall Occlusion (`calculateObstacleOcclusion`)**:
   Raycasting checks whether direct line-of-sight between two avatars is obstructed by cubicle partition obstacles, applying acoustic dampening and barrier low-pass filtration.

### 4.2 Stereo Panning ($[-1, 1]$):
$$\text{Pan}(\Delta x) = \max\left(-1, \min\left(1, \frac{\Delta x}{d_{\max}}\right)\right)$$
Where $\Delta x = x_{\text{peer}} - x_{\text{local}}$. A teammate to the user's left sounds in the left channel, while one to the right sounds in the right channel.

### 4.3 Web Audio Routing Graph:
```
Remote MediaStream ──► MediaStreamAudioSourceNode
                             │
                             ▼
                     BiquadFilterNode (Lowpass Air Damping & Occlusion)
                             │
                             ▼
                         GainNode (Dynamic Distance Volume Drop-off)
                             │
                             ▼
                     StereoPannerNode (Left/Right Directional Pan)
                             │
                             ▼
                         AnalyserNode (Remote VAD & Metering)
                             │
                             ▼
                     audioContext.destination (Speakers / Headphones)
```

---

## 🎛️ 5. Frontend Components & User Controls

| Component | Responsibility |
|---|---|
| [`WebRTCManager`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/services/webrtcManager.js) | Native WebRTC and Web Audio orchestration class with dynamic attenuation algorithms and click-free audio ramping. |
| [`useWebRTC`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/hooks/useWebRTC.js) | Custom React hook binding WebRTC state to React lifecycle, obstacle occlusion detection, and proximity gating. |
| [`BottomToolbar`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/components/BottomToolbar.jsx) | Microphone toggle, real-time audio activity meter, mute states, and permission alerts. |
| [`SettingsModal`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/components/OfficeModals.jsx) | Dynamic Attenuation Engine: algorithm selector (Linear, Exponential, Inverse, Smoothstep), core radius pills ($d_{\min}$), falloff slider ($d_{\max}$), interactive SVG curve visualizer, and acoustic filters. |
| [`OfficeCanvas`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/office/OfficeCanvas.jsx) & [`OfficeRenderer`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/office/OfficeRenderer.js) | 2D canvas drawing avatars with dynamic attenuation halos (emerald 100% core ring + dashed blue outer falloff perimeter) and live volume percentage pills (`% vol • px dist`). |

---

## 🧪 6. Testing & Quality Assurance

The WebRTC audio pipeline is verified via comprehensive unit tests in Vitest:
- [`webrtcManager.test.js`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/services/webrtcManager.test.js):
  - Spatial volume boundary & falloff math
  - Stereo pan boundary clamping
  - `getUserMedia` constraints verification
  - Track-level mute/unmute execution
  - Offer/answer handshake generation
  - ICE candidate queue buffering & draining
  - Clean peer and stream destruction
- [`useWebRTC.test.js`](file:///c:/Users/MITESH%20SAWANT/Downloads/PROXISPEAK/client/src/hooks/useWebRTC.test.js):
  - React hook mount/unmount lifecycles
  - Audio permission state transitions
  - Socket signaling listener binding & cleanup
