import React, { useRef, useState, useEffect } from 'react';

/**
 * Excalidraw-style Collaborative Interactive Whiteboard Modal
 */
export function CollaborativeWhiteboardModal({ isOpen, onClose, onSave }) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState('pen'); // 'pen' | 'highlighter' | 'rect' | 'circle' | 'arrow' | 'eraser'
  const [color, setColor] = useState('#2563eb');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [shapes, setShapes] = useState([]);
  const [startPoint, setStartPoint] = useState(null);
  const [currentPath, setCurrentPath] = useState([]);

  const COLORS = ['#1e293b', '#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Fill clean whiteboard background with subtle dot grid
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'rgba(203, 213, 225, 0.45)';
    for (let x = 20; x < canvas.width; x += 24) {
      for (let y = 20; y < canvas.height; y += 24) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Default sample architecture diagram sketch
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(80, 80, 150, 70, 8);
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.font = '600 13px -apple-system, sans-serif';
    ctx.fillText('Client WebRTC', 105, 120);

    ctx.beginPath();
    ctx.moveTo(230, 115);
    ctx.lineTo(340, 115);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(340, 80, 160, 70, 8);
    ctx.stroke();
    ctx.fillText('Proximity Mesh Node', 355, 120);
  }, [isOpen]);

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentPath([{ x, y }]);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (tool === 'pen' || tool === 'highlighter' || tool === 'eraser') {
      ctx.beginPath();
      const last = currentPath[currentPath.length - 1];
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);

      if (tool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
      } else if (tool === 'highlighter') {
        ctx.strokeStyle = `${color}44`;
        ctx.lineWidth = 14;
        ctx.lineCap = 'square';
      } else {
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
      }
      ctx.stroke();
      setCurrentPath((prev) => [...prev, { x, y }]);
    }
  };

  const handlePointerUp = (e) => {
    if (!isDrawing || !startPoint) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';

    if (tool === 'rect') {
      const w = endX - startPoint.x;
      const h = endY - startPoint.y;
      ctx.beginPath();
      ctx.roundRect(startPoint.x, startPoint.y, w, h, 6);
      ctx.stroke();
    } else if (tool === 'circle') {
      const r = Math.hypot(endX - startPoint.x, endY - startPoint.y);
      ctx.beginPath();
      ctx.arc(startPoint.x, startPoint.y, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (tool === 'arrow') {
      ctx.beginPath();
      ctx.moveTo(startPoint.x, startPoint.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();
      // Arrow head
      const angle = Math.atan2(endY - startPoint.y, endX - startPoint.x);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - 12 * Math.cos(angle - Math.PI / 6), endY - 12 * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - 12 * Math.cos(angle + Math.PI / 6), endY - 12 * Math.sin(angle + Math.PI / 6));
      ctx.stroke();
    }

    setIsDrawing(false);
    setStartPoint(null);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'proxispeak-whiteboard-design.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (onSave) onSave();
  };

  if (!isOpen) return null;

  return (
    <div className="ovice-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Meeting Whiteboard">
      <div className="whiteboard-modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: '920px', maxWidth: '96vw', height: '620px', display: 'flex', flexDirection: 'column' }}>
        {/* Whiteboard Header */}
        <div className="modal-header" style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>✏️</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#0f172a' }}>Meeting Room Dry-Erase Whiteboard</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Live collaborative diagramming for Boardroom participants</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button type="button" onClick={handleExport} className="modal-btn-primary" style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px' }}>
              💾 Export PNG
            </button>
            <button type="button" onClick={handleClear} className="modal-btn-ghost" style={{ padding: '6px 12px', fontSize: '12px' }}>
              Clear
            </button>
            <button type="button" onClick={onClose} className="modal-close-btn">✕</button>
          </div>
        </div>

        {/* Toolbar Bar */}
        <div style={{ padding: '8px 20px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {/* Tool selector */}
          <div style={{ display: 'flex', gap: '4px', background: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
            {[
              { id: 'pen', label: '✏️ Pen' },
              { id: 'highlighter', label: '🖍️ Highlight' },
              { id: 'rect', label: '⬜ Rect' },
              { id: 'circle', label: '⭕ Circle' },
              { id: 'arrow', label: '➡️ Arrow' },
              { id: 'eraser', label: '🧹 Eraser' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTool(t.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: tool === t.id ? '#ffffff' : 'transparent',
                  color: tool === t.id ? '#2563eb' : '#475569',
                  boxShadow: tool === t.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Color palette */}
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '2px solid #0f172a' : '1px solid rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transform: color === c ? 'scale(1.2)' : 'scale(1)',
                }}
              />
            ))}
          </div>

          {/* Stroke Width */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b' }}>
            <span>Width:</span>
            {[2, 4, 8].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => setStrokeWidth(w)}
                style={{
                  padding: '2px 8px',
                  fontSize: '11px',
                  borderRadius: '4px',
                  border: '1px solid #cbd5e1',
                  background: strokeWidth === w ? '#2563eb' : '#ffffff',
                  color: strokeWidth === w ? '#ffffff' : '#334155',
                  cursor: 'pointer',
                }}
              >
                {w}px
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: '#f1f5f9' }}>
          <canvas
            ref={canvasRef}
            width={880}
            height={480}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            style={{ width: '100%', height: '100%', display: 'block', cursor: tool === 'eraser' ? 'cell' : 'crosshair' }}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Presentation Zone Screen Broadcast Modal
 */
export function ScreenBroadcastModal({ isOpen, onClose, onToggleBroadcast, isBroadcasting = false }) {
  if (!isOpen) return null;

  return (
    <div className="ovice-modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Screen Broadcast">
      <div className="modal-card glass-panel" onClick={(e) => e.stopPropagation()} style={{ width: '560px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📡</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Townhall Presentation Screen</h3>
              <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Broadcast your screen to all coworkers in the Presentation Zone</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="modal-close-btn">✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div
            style={{
              height: '180px',
              background: '#0f172a',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              border: isBroadcasting ? '2px solid #10b981' : '1px solid #334155',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {isBroadcasting ? (
              <>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🟢</div>
                <div style={{ fontSize: '15px', fontWeight: '700', color: '#10b981' }}>Live Broadcaster Active</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Transmitting 1080p 60fps · 4 Peers Receiving</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: '36px', marginBottom: '8px' }}>🖥️</div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Screen Broadcast Ready</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Step onto stage to transmit presentations and slide decks</div>
              </>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '18px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#1e293b' }}>Spatial Broadcast Horizon</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Overwrites distance attenuation with high-clarity stereo stream</div>
            </div>
            <button
              type="button"
              onClick={onToggleBroadcast}
              className={isBroadcasting ? 'modal-btn-ghost' : 'modal-btn-primary'}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                fontWeight: '700',
                background: isBroadcasting ? '#ef4444' : '#10b981',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isBroadcasting ? 'Stop Broadcast' : 'Start Broadcast'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
