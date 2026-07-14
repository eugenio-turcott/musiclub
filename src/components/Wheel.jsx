import React, { useRef, useEffect, useCallback } from 'react';

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#FF8A5C',
  '#A29BFE',
  '#FD79A8',
  '#00B894',
  '#E17055',
  '#74B9FF',
  '#FDCB6E',
  '#6C5CE7',
  '#00CEC9',
  '#E84393',
  '#0984E3',
  '#F39C12',
  '#2ECC71',
  '#E74C3C',
  '#1DD1A1',
  '#5F27CD',
  '#FF9FF3',
  '#54A0FF',
];

const lightenColor = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  return `rgb(${R},${G},${B})`;
};

const darkenColor = (hex, percent) => {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  return `rgb(${R},${G},${B})`;
};

export function Wheel({ albums, currentAngle, onSpin }) {
  const canvasRef = useRef(null);

  const drawWheel = useCallback(
    (angle) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(width, height) / 2 - 12;

      ctx.clearRect(0, 0, width, height);

      if (!albums.length) {
        ctx.fillStyle = 'rgba(255,255,255,0.03)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.font = '18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Sin álbumes', centerX, centerY);
        return;
      }

      const segmentAngle = (Math.PI * 2) / albums.length;

      albums.forEach((album, i) => {
        const startAngle = i * segmentAngle + angle;
        const endAngle = startAngle + segmentAngle;
        const color = COLORS[i % COLORS.length];

        ctx.shadowColor = 'rgba(0,0,0,0.2)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        const grad = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius
        );
        grad.addColorStop(0, lightenColor(color, 35));
        grad.addColorStop(0.5, color);
        grad.addColorStop(1, darkenColor(color, 20));
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Texto en el segmento
        const midAngle = startAngle + segmentAngle / 2;
        const textRadius = radius * 0.68;
        const x = centerX + Math.cos(midAngle) * textRadius;
        const y = centerY + Math.sin(midAngle) * textRadius;
        let label = album.album;
        if (label.length > 14) label = label.substring(0, 12) + '…';

        ctx.save();
        ctx.translate(x, y);
        const textAngle =
          midAngle +
          (midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? Math.PI : 0);
        ctx.rotate(textAngle);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        ctx.font = 'bold 11px Inter, sans-serif';
        ctx.fillStyle = '#fff';
        ctx.fillText(label, 0, 0);
        ctx.restore();
      });

      // Anillo exterior
      ctx.shadowBlur = 0;
      const grad2 = ctx.createRadialGradient(
        centerX,
        centerY,
        radius - 5,
        centerX,
        centerY,
        radius + 2
      );
      grad2.addColorStop(0, 'rgba(255,255,255,0)');
      grad2.addColorStop(0.8, 'rgba(255,255,255,0.02)');
      grad2.addColorStop(1, 'rgba(255,255,255,0.06)');
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = grad2;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Puntos decorativos
      for (let i = 0; i < 32; i++) {
        const a = (i / 32) * Math.PI * 2;
        const dr = radius + 5;
        const x = centerX + Math.cos(a) * dr;
        const y = centerY + Math.sin(a) * dr;
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle =
          i % 2 === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)';
        ctx.fill();
      }
    },
    [albums]
  );

  useEffect(() => {
    drawWheel(currentAngle);
  }, [drawWheel, currentAngle]);

  // Redibujar en resize
  useEffect(() => {
    let timeout;
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => drawWheel(currentAngle), 200);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, [drawWheel, currentAngle]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        margin: '5px 0 20px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: '-14px',
          zIndex: 10,
          fontSize: '3.2rem',
          filter: 'drop-shadow(0 4px 20px rgba(245,87,108,0.5))',
          animation: 'pulseArrow 1.8s ease-in-out infinite',
          lineHeight: 1,
          color: '#fff',
          transform: 'rotate(0deg)',
        }}
      >
        ▼
      </div>
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '600px',
          aspectRatio: '1/1',
          margin: '0 auto',
        }}
      >
        <canvas
          ref={canvasRef}
          width="600"
          height="600"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            boxShadow:
              '0 0 0 3px rgba(255,255,255,0.05), 0 0 0 8px rgba(255,255,255,0.02), 0 20px 70px rgba(0,0,0,0.7), inset 0 0 80px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            touchAction: 'none',
          }}
          onClick={onSpin}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: '75px',
            height: '75px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 45% 35%, #4a4a5e, #1a1a2a)',
            border: '3px solid rgba(255,255,255,0.1)',
            boxShadow:
              '0 0 40px rgba(0,0,0,0.6), inset 0 2px 0 rgba(255,255,255,0.08), inset 0 -2px 0 rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 5,
            fontSize: '1.8rem',
            fontWeight: 900,
            color: '#fff',
            userSelect: 'none',
          }}
        >
          <span
            style={{
              fontSize: '2rem',
              filter: 'drop-shadow(0 2px 10px rgba(245,87,108,0.3))',
            }}
          >
            ▶
          </span>
        </div>
      </div>
    </div>
  );
}
