import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SettingsModal,
  CalendarModal,
  NotificationsModal,
  HelpModal,
  LeaveConfirmModal,
} from './OfficeModals';

describe('SettingsModal WebRTC & Audio Configuration', () => {
  beforeEach(() => {
    Object.defineProperty(global.navigator, 'mediaDevices', {
      value: {
        enumerateDevices: vi.fn().mockResolvedValue([
          { kind: 'audioinput', deviceId: 'mic-ext', label: 'USB Headset Mic' },
        ]),
      },
      writable: true,
      configurable: true,
    });
  });

  it('renders settings modal with audio device dropdown and proximity slider', async () => {
    render(<SettingsModal isOpen={true} proximityDistance={240} />);

    expect(screen.getByText(/workspace & audio settings/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/spatial proximity audio falloff/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('USB Headset Mic')).toBeInTheDocument();
    });
  });

  it('triggers onProximityChange when slider value is adjusted', () => {
    const handleProximityChange = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        proximityDistance={240}
        onProximityChange={handleProximityChange}
      />,
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '320' } });

    expect(handleProximityChange).toHaveBeenCalledWith(320);
  });

  it('triggers onRequestMic when permission is denied and allow button is clicked', () => {
    const handleRequestMic = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        permissionStatus="denied"
        onRequestMic={handleRequestMic}
      />,
    );

    const allowBtn = screen.getByRole('button', { name: /allow microphone access/i });
    fireEvent.click(allowBtn);

    expect(handleRequestMic).toHaveBeenCalled();
  });
});

describe('Other Office Modals', () => {
  it('renders CalendarModal and handles Walk to Pod', () => {
    const handleJoinArea = vi.fn();
    const handleClose = vi.fn();

    render(
      <CalendarModal
        isOpen={true}
        onClose={handleClose}
        onJoinMeetingArea={handleJoinArea}
      />,
    );

    expect(screen.getByText(/office calendar/i)).toBeInTheDocument();
    const walkBtns = screen.getAllByRole('button', { name: /walk to pod/i });
    fireEvent.click(walkBtns[0]);

    expect(handleJoinArea).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders NotificationsModal', () => {
    render(<NotificationsModal isOpen={true} />);
    expect(screen.getByText(/notifications/i)).toBeInTheDocument();
  });

  it('renders HelpModal with movement guides', () => {
    render(<HelpModal isOpen={true} />);
    expect(screen.getByText(/movement & shortcuts guide/i)).toBeInTheDocument();
    expect(screen.getByText(/wasd & arrow keys/i)).toBeInTheDocument();
  });

  it('renders LeaveConfirmModal and handles confirmation', () => {
    const handleConfirm = vi.fn();
    render(<LeaveConfirmModal isOpen={true} onConfirm={handleConfirm} />);

    expect(screen.getByText(/leave virtual office\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /leave office/i }));

    expect(handleConfirm).toHaveBeenCalled();
  });
});
