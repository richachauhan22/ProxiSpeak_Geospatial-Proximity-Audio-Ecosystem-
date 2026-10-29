import { useRef, useState, useEffect } from 'react';

const COLORS = ['#1e293b', '#2563eb', '#059669', '#d97706', '#dc2626', '#9333ea'];

export default function Whiteboard({ isOpen, onClose, socket, officeId }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#2563eb');
  const [brushSize, setBrushSize] = useState(4);
  const [isEraser, setIsEraser] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const currentStrokeRef = useRef(null);

  // Redraw canvas whenever strokes change
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle grid dots
    ctx.fillStyle = '#f1f5f9';
    for (let x = 20; x < canvas.width; x += 30) {
      for (let y = 20; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw all strokes
    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [isOpen, strokes]);

  // Listen for drawing events from teammates over Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleRemoteDraw = (stroke) => {
      setStrokes((prev) => [...prev, stroke]);
    };

    const handleRemoteClear = () => {
      setStrokes([]);
    };

    socket.on('whiteboard:draw', handleRemoteDraw);
    socket.on('whiteboard:clear', handleRemoteClear);

    return () => {
      socket.off('whiteboard:draw', handleRemoteDraw);
      socket.off('whiteboard:clear', handleRemoteClear);
    };
  }, [socket]);

  if (!isOpen) return null;

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    currentStrokeRef.current = {
      color: isEraser ? '#ffffff' : currentColor,
      width: isEraser ? 24 : brushSize,
      points: [{ x, y }],
    };
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || !currentStrokeRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    currentStrokeRef.current.points.push({ x, y });

    // Draw line segment immediately for smooth feedback
    const ctx = canvas.getContext('2d');
    const pts = currentStrokeRef.current.points;
    if (pts.length >= 2) {
      ctx.beginPath();
      ctx.strokeStyle = currentStrokeRef.current.color;
      ctx.lineWidth = currentStrokeRef.current.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  };

  const handlePointerUp = () => {
    if (isDrawing && currentStrokeRef.current) {
      const finishedStroke = currentStrokeRef.current;
      setStrokes((prev) => [...prev, finishedStroke]);

      // Broadcast stroke to teammates!
      if (socket) {
        socket.emit('whiteboard:draw', finishedStroke);
      }
    }
    setIsDrawing(false);
    currentStrokeRef.current = null;
  };

  const handleClear = () => {
    if (window.confirm('Clear the whiteboard for everyone?')) {
      setStrokes([]);
      if (socket) {
        socket.emit('whiteboard:clear');
      }
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `whiteboard-${Date.now()}.png`;
    a.click();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
    }}>
      <div style={{
        backgroundColor: '#0f172a',
        border: '1px solid #334155',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '950px',
        height: '80vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 20px',
          borderBottom: '1px solid #334155',
          color: '#ffffff',
        }}>
          <div style={{ fontWeight: 'bold', fontSize: '15px' }}>
            📝 Shared Collaborative Whiteboard
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={handleDownload} style={{ padding: '6px 12px', background: '#1e293b', color: '#cbd5e1', border: '1px solid #475569', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
              Download Image
            </button>
            <button onClick={handleClear} style={{ padding: '6px 12px', background: '#7f1d1d', color: '#fca5a5', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>
              Clear Board
            </button>
            <button onClick={onClose} style={{ padding: '6px 14px', background: '#3b82f6', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '8px 20px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
        }}>
          {/* Colors */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => { setCurrentColor(c); setIsEraser(false); }}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: c,
                  border: !isEraser && currentColor === c ? '2px solid #ffffff' : '2px solid transparent',
                  cursor: 'pointer',
                  transform: !isEraser && currentColor === c ? 'scale(1.15)' : 'none',
                }}
              />
            ))}
          </div>

          <div style={{ width: '1px', height: '20px', backgroundColor: '#475569' }} />

          {/* Eraser */}
          <button
            onClick={() => setIsEraser(!isEraser)}
            style={{
              padding: '4px 10px',
              backgroundColor: isEraser ? '#dc2626' : '#334155',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            {isEraser ? '🧽 Eraser (Active)' : '🧽 Eraser'}
          </button>
        </div>

        {/* Whiteboard Canvas */}
        <div style={{ flex: 1, backgroundColor: '#ffffff', cursor: 'crosshair', position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={950}
            height={650}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>
      </div>
    </div>
  );
}