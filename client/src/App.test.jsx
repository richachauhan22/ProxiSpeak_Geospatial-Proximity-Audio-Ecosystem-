// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';

vi.mock('./hooks/useSocket', () => ({
  useSocket: () => ({
    socketRef: { current: null },
    connectionStatus: 'disconnected',
    setConnectionStatus: vi.fn(),
  }),
}));

vi.mock('./hooks/useWebRTC', () => ({
  useWebRTC: () => ({
    localStream: null,
    isMuted: false,
    isLocalSpeaking: false,
    audioLevel: 0,
    permissionStatus: 'idle',
    speakingPeers: new Set(),
    webrtcError: null,
    startAudio: vi.fn().mockResolvedValue(null),
    stopAudio: vi.fn(),
    toggleMute: vi.fn(),
  }),
}));

vi.mock('./services/soundEffects', () => ({
  sounds: {
    playButtonClick: vi.fn(),
    playFloorChime: vi.fn(),
    playClick: vi.fn(),
    playProximityChime: vi.fn(),
  },
}));

describe('App', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/');
  });

  it('renders the landing page and opens the join screen from the primary action', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /work together/i })).toBeInTheDocument();
    const enterButtons = screen.getAllByRole('button', { name: /enter virtual office/i });
    fireEvent.click(enterButtons[0]);
    expect(screen.getByRole('heading', { name: /step into your office/i })).toBeInTheDocument();
  });

  it('validates the display name before attempting a socket connection', () => {
    render(<App />);
    const enterButtons = screen.getAllByRole('button', { name: /enter virtual office/i });
    fireEvent.click(enterButtons[0]);
    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'A' } });
    const joinButtons = screen.getAllByRole('button', { name: /join office/i });
    fireEvent.click(joinButtons[0]);
    expect(screen.getByRole('alert')).toHaveTextContent(/2-24 characters/i);
  });
});
