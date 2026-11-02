import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SettingsModal,
  CalendarModal,
  NotificationsModal,
  HelpModal,
  LeaveConfirmModal,
  QuickToolsModal,
  LayoutPersistenceModal,
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

  it('allows changing dynamic attenuation algorithm and notifies onSpatialConfigChange', () => {
    const handleConfigChange = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        spatialConfig={{ attenuationModel: 'linear', minDistance: 60, maxDistance: 240 }}
        onSpatialConfigChange={handleConfigChange}
      />,
    );

    const modelSelect = screen.getByLabelText(/distance falloff algorithm/i);
    expect(modelSelect).toBeInTheDocument();

    fireEvent.change(modelSelect, { target: { value: 'exponential' } });
    expect(handleConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ attenuationModel: 'exponential' }),
    );
  });

  it('allows selecting full-volume core radius pills and renders attenuation curve', () => {
    const handleConfigChange = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        spatialConfig={{ minDistance: 60, maxDistance: 240 }}
        onSpatialConfigChange={handleConfigChange}
      />,
    );

    expect(screen.getByText(/dynamic attenuation curve/i)).toBeInTheDocument();

    const pill90 = screen.getByRole('button', { name: /90 px/i });
    fireEvent.click(pill90);

    expect(handleConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ minDistance: 90 }),
    );
  });

  it('renders 3D spatial panning stereo separation controls and notifies on preset change', () => {
    const handleConfigChange = vi.fn();
    render(
      <SettingsModal
        isOpen={true}
        spatialConfig={{ panEnabled: true, stereoSeparation: 1.0 }}
        onSpatialConfigChange={handleConfigChange}
      />,
    );

    expect(screen.getByText(/stereo separation/i)).toBeInTheDocument();
    expect(screen.getAllByText(/100%/i).length).toBeGreaterThan(0);

    const widePreset = screen.getByRole('button', { name: /wide stereo/i });
    fireEvent.click(widePreset);

    expect(handleConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({ stereoSeparation: 1.4 }),
    );
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

  it('renders QuickToolsModal and triggers onOpenLayoutPersistence', () => {
    const handleOpenLayout = vi.fn();
    const handleClose = vi.fn();

    render(
      <QuickToolsModal
        isOpen={true}
        onClose={handleClose}
        onOpenLayoutPersistence={handleOpenLayout}
      />,
    );

    expect(screen.getByText(/office layout & sound obstacles/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/office layout & sound obstacles/i));

    expect(handleOpenLayout).toHaveBeenCalled();
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders LayoutPersistenceModal and triggers save, add, and toggle actions', async () => {
    const mockObstacles = [
      {
        id: 'desk-1',
        name: 'Focus Pod Desk A',
        type: 'desk',
        x: 100,
        y: 100,
        width: 80,
        height: 60,
        blocksSound: true,
      },
      {
        id: 'partition-1',
        name: 'Acoustic Glass Divider',
        type: 'partition',
        x: 200,
        y: 100,
        width: 140,
        height: 20,
        blocksSound: true,
      },
    ];

    const handleSave = vi.fn().mockResolvedValue({});
    const handleAdd = vi.fn();
    const handleToggle = vi.fn();
    const handleReset = vi.fn();

    render(
      <LayoutPersistenceModal
        isOpen={true}
        officeId="test-office"
        obstacles={mockObstacles}
        onSaveLayout={handleSave}
        onAddObstacle={handleAdd}
        onToggleSoundBlocking={handleToggle}
        onResetLayout={handleReset}
      />,
    );

    expect(screen.getByText(/mongodb office persistence active/i)).toBeInTheDocument();
    expect(screen.getByText('Focus Pod Desk A')).toBeInTheDocument();
    expect(screen.getByText('Acoustic Glass Divider')).toBeInTheDocument();

    // Toggle sound blocking
    const toggleBtns = screen.getAllByRole('button', { name: /blocks sound/i });
    fireEvent.click(toggleBtns[0]);
    expect(handleToggle).toHaveBeenCalledWith('desk-1');

    // Save to MongoDB
    const saveBtn = screen.getByRole('button', { name: /save layout & obstacles to mongodb/i });
    fireEvent.click(saveBtn);
    expect(handleSave).toHaveBeenCalled();

    // Reset to blueprint
    const resetBtn = screen.getByRole('button', { name: /reset to default blueprint/i });
    fireEvent.click(resetBtn);
    expect(handleReset).toHaveBeenCalled();
  });
});
