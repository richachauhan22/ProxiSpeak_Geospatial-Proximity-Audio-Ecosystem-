\# Week 3 – Dynamic Audio Attenuation



\## Objective

Implement realistic spatial audio in ProxiSpeak by dynamically adjusting remote WebRTC audio volume based on the pixel distance between avatars.



\## Task 1: Web Audio API Integration

\- Connect remote WebRTC audio tracks to the Web Audio API.

\- Use AudioContext, MediaStreamAudioSourceNode, and GainNode.

\- Maintain separate audio nodes for each remote participant.



\## Task 2: Distance-Based Volume Calculation

\- Calculate Euclidean distance using avatar X and Y coordinates.

\- Use the existing 100-pixel hearing radius.

\- Gradually decrease volume as participants move farther apart.

\- Set volume to zero outside the hearing radius.



\## Task 3: Dynamic Volume Updates

\- Update audio gain whenever participant positions change.

\- Smooth volume transitions to avoid sudden audio changes.

\- Maintain independent volume control for each participant.



\## Task 4: Audio Lifecycle Management

\- Preserve mute and unmute functionality.

\- Clean up audio nodes when participants leave.

\- Prevent duplicate audio nodes during reconnections.



\## Task 5: Testing and Validation

\- Test audio at different avatar distances.

\- Verify that nearby participants sound louder than distant participants.

\- Confirm silence outside the 100-pixel radius.

\- Test multiple participants simultaneously.

\- Verify room isolation and podium broadcasting.



\## Expected Outcome

A natural virtual-office audio experience where sound intensity changes dynamically according to participant distance.

