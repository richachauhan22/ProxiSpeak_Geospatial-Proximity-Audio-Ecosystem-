import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import BottomToolbar from './BottomToolbar';

describe('BottomToolbar Component', () => {
  const defaultUser = {
    displayName: 'Mia',
    avatarColor: '#2563eb',
    photoUrl: '/avatar_mia.png',
  };

  it('renders avatar, name, and default controls', () => {
    render(<BottomToolbar localUser={defaultUser} />);
    expect(screen.getByText('Mia')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByRole('toolbar')).toBeInTheDocument();
  });

  it('triggers onToggleMute when microphone button is clicked', () => {
    const handleToggleMute = vi.fn();
    render(<BottomToolbar localUser={defaultUser} isMuted={false} onToggleMute={handleToggleMute} />);

    const micBtn = screen.getByRole('button', { name: /mute microphone/i });
    fireEvent.click(micBtn);

    expect(handleToggleMute).toHaveBeenCalledTimes(1);
  });

  it('displays muted microphone state when isMuted is true', () => {
    render(<BottomToolbar localUser={defaultUser} isMuted={true} />);
    const micBtn = screen.getByRole('button', { name: /unmute microphone/i });
    expect(micBtn).toHaveClass('muted');
  });

  it('displays warning indicator and retry label when microphone permission is denied', () => {
    const handleToggleMute = vi.fn();
    render(
      <BottomToolbar
        localUser={defaultUser}
        permissionStatus="denied"
        onToggleMute={handleToggleMute}
      />,
    );

    const micBtn = screen.getByRole('button', { name: /microphone blocked/i });
    expect(micBtn).toHaveClass('permission-denied');

    fireEvent.click(micBtn);
    expect(handleToggleMute).toHaveBeenCalledTimes(1);
  });

  it('displays speaking animation on voice meter when isSpeaking is true', () => {
    render(
      <BottomToolbar
        localUser={defaultUser}
        isMuted={false}
        isSpeaking={true}
        audioLevel={0.7}
      />,
    );

    const waveContainer = screen.getByTitle('Speaking');
    expect(waveContainer).toHaveClass('speaking');
  });

  it('toggles video when camera button is clicked', () => {
    const handleToggleVideo = vi.fn();
    render(<BottomToolbar localUser={defaultUser} isVideoOn={true} onToggleVideo={handleToggleVideo} />);

    const videoBtn = screen.getByRole('button', { name: /turn camera off/i });
    fireEvent.click(videoBtn);

    expect(handleToggleVideo).toHaveBeenCalledTimes(1);
  });

  it('opens emoji reaction picker and triggers onReaction', () => {
    const handleReaction = vi.fn();
    render(<BottomToolbar localUser={defaultUser} onReaction={handleReaction} />);

    const reactionTrigger = screen.getByRole('button', { name: /reactions/i });
    fireEvent.click(reactionTrigger);

    const thumbsUp = screen.getByRole('button', { name: '👍' });
    fireEvent.click(thumbsUp);

    expect(handleReaction).toHaveBeenCalledWith('👍');
  });

  it('handles zoom in, zoom out, and reset callbacks', () => {
    const handleZoomChange = vi.fn();
    render(<BottomToolbar localUser={defaultUser} zoomLevel={100} onZoomChange={handleZoomChange} />);

    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(handleZoomChange).toHaveBeenCalledWith(110);

    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
    expect(handleZoomChange).toHaveBeenCalledWith(90);

    fireEvent.click(screen.getByRole('button', { name: /100%/i }));
    expect(handleZoomChange).toHaveBeenCalledWith(100);
  });

  it('triggers onRecenter and onToggleMiniMap', () => {
    const handleRecenter = vi.fn();
    const handleToggleMiniMap = vi.fn();

    render(
      <BottomToolbar
        localUser={defaultUser}
        onRecenter={handleRecenter}
        onToggleMiniMap={handleToggleMiniMap}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /recenter on your avatar/i }));
    expect(handleRecenter).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /mini-map radar/i }));
    expect(handleToggleMiniMap).toHaveBeenCalled();
  });
});
