// src/components/HeroMusicCanvas.jsx
import React, { useEffect, useRef } from 'react';

const MUSICAL_SYMBOLS = [
  '🎵',
  '🎶',
  '🎧',
  '💿',
  '✨',
  '🎼',
  '💫',
  '🌟',
  '🎹',
  '⚡',
];

export function HeroMusicCanvas({ containerRef }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId = null;
    let isRunning = false;
    let particles = [];
    let shockwaves = [];
    let mouse = {
      x: -1000,
      y: -1000,
      isOver: false,
      prevX: -1000,
      prevY: -1000,
    };
    let lastSpawnTime = 0;
    let width = 0;
    let height = 0;

    // Define startLoop & render with standard hoisted function declarations
    function startLoop() {
      if (!isRunning) {
        isRunning = true;
        animationFrameId = requestAnimationFrame(render);
      }
    }

    function render() {
      if (!canvas) {
        isRunning = false;
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Cursor glow spotlight (lightweight single pass)
      if (mouse.isOver && mouse.x > 0 && mouse.y > 0) {
        const grad = ctx.createRadialGradient(
          mouse.x,
          mouse.y,
          0,
          mouse.x,
          mouse.y,
          90
        );
        grad.addColorStop(0, 'rgba(245, 87, 108, 0.12)');
        grad.addColorStop(0.7, 'rgba(240, 147, 251, 0.03)');
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 90, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radius += 3.5;
        sw.opacity -= 0.04;

        if (sw.opacity <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(245, 87, 108, ${Math.max(0, sw.opacity)})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      // 3. Musical particles
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.life -= p.decay;
        p.opacity = Math.max(0, p.life);

        if (p.scale < 1) {
          p.scale += 0.2;
        }

        if (p.life <= 0 || p.y < -20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.scale(p.scale, p.scale);
        ctx.globalAlpha = p.opacity;

        ctx.font = `${p.size}px sans-serif`;
        ctx.fillText(p.char, 0, 0);

        ctx.restore();
      }

      // If there are still active elements or mouse is over, continue loop; else sleep
      if (particles.length > 0 || shockwaves.length > 0 || mouse.isOver) {
        animationFrameId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
        isRunning = false;
        animationFrameId = null;
      }
    }

    function spawnParticle(x, y, isBurst = false) {
      const char =
        MUSICAL_SYMBOLS[Math.floor(Math.random() * MUSICAL_SYMBOLS.length)];
      const size = isBurst ? Math.random() * 6 + 14 : Math.random() * 4 + 13;
      const angle = isBurst
        ? Math.random() * Math.PI * 2
        : (Math.random() - 0.5) * 1.2 - Math.PI / 2;
      const speed = isBurst
        ? Math.random() * 2.5 + 1
        : Math.random() * 1.2 + 0.5;

      particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.3,
        char,
        size,
        opacity: 1,
        rotation: (Math.random() - 0.5) * 0.3,
        rotSpeed: (Math.random() - 0.5) * 0.03,
        life: 1,
        decay: Math.random() * 0.025 + 0.02,
        scale: 0.3,
      });

      if (particles.length > 20) {
        particles.shift();
      }

      startLoop();
    }

    function spawnShockwave(x, y) {
      shockwaves.push({
        x,
        y,
        radius: 6,
        maxRadius: 70,
        opacity: 0.7,
      });
      startLoop();
    }

    // Resize handler
    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      startLoop();
    };

    handleResize();

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    const targetElement = containerRef?.current || canvas.parentElement;

    // Throttled mouse move
    const handleMouseMove = (e) => {
      if (!targetElement) return;
      const rect = targetElement.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;

      // Calculate distance moved
      const dx = newX - mouse.prevX;
      const dy = newY - mouse.prevY;
      const dist = dx * dx + dy * dy;

      mouse.x = newX;
      mouse.y = newY;
      mouse.isOver = true;

      const now = performance.now();
      // Only spawn if moved at least 25px or 70ms elapsed
      if (dist > 625 && now - lastSpawnTime > 70) {
        spawnParticle(mouse.x, mouse.y);
        mouse.prevX = newX;
        mouse.prevY = newY;
        lastSpawnTime = now;
      }
      startLoop();
    };

    const handleMouseEnter = () => {
      mouse.isOver = true;
      startLoop();
    };

    const handleMouseLeave = () => {
      mouse.isOver = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    const handleClick = (e) => {
      if (!targetElement) return;
      const rect = targetElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      spawnShockwave(clickX, clickY);

      for (let i = 0; i < 5; i++) {
        spawnParticle(clickX, clickY, true);
      }
    };

    if (targetElement) {
      targetElement.addEventListener('mousemove', handleMouseMove, {
        passive: true,
      });
      targetElement.addEventListener('mouseenter', handleMouseEnter, {
        passive: true,
      });
      targetElement.addEventListener('mouseleave', handleMouseLeave, {
        passive: true,
      });
      targetElement.addEventListener('click', handleClick, { passive: true });
    }

    startLoop();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (targetElement) {
        targetElement.removeEventListener('mousemove', handleMouseMove);
        targetElement.removeEventListener('mouseenter', handleMouseEnter);
        targetElement.removeEventListener('mouseleave', handleMouseLeave);
        targetElement.removeEventListener('click', handleClick);
      }
      resizeObserver.disconnect();
    };
  }, [containerRef]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ willChange: 'transform' }}
    />
  );
}
