import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  opacity: number;
  shape: 'circle' | 'rect';
}

const GOLD_PALETTE = ['#F5C027', '#FFF2A1', '#FCD34D', '#FFFFFF', '#EAB308'];

export const GoldParticleCanvas: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = window.innerWidth);
    const height = (canvas.height = window.innerHeight);

    // Create 70 luxury gold particles
    const particleCount = 70;
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: width * 0.3 + Math.random() * (width * 0.4), // Center cluster
      y: height * 0.35 + (Math.random() - 0.5) * 50,
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 5 - 2, // Initial upward burst
      size: Math.random() * 7 + 4,
      color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.1,
      opacity: 1,
      shape: Math.random() > 0.4 ? 'rect' : 'circle'
    }));

    let animId: number;
    let startTime = Date.now();

    const render = () => {
      const elapsedSec = (Date.now() - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Physics update
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // Gravity
        p.vx *= 0.98; // Air drag
        p.rotation += p.vRot;

        // Fade out over 2.5 seconds
        p.opacity = Math.max(0, 1 - elapsedSec / 2.5);

        if (p.opacity <= 0) return;

        ctx.save();
        ctx.globalAlpha = p.opacity;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.shadowColor = '#F5C027';
        ctx.shadowBlur = 6;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      if (elapsedSec < 3) {
        animId = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      if (ctx) ctx.clearRect(0, 0, width, height);
    };
  }, [isActive]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[130]"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};
