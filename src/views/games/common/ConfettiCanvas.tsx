'use client';
import React, { useEffect, useRef } from 'react';
interface Particle {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  angle: number;
  vAngle: number;
  color: string;
  opacity: number;
}
const CONFETTI_COLORS = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];
import styles from './ConfettiCanvas.module.scss';

export const ConfettiCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const particles: Particle[] = Array.from({ length: 70 }, () => {
      const spreadX = (Math.random() - 0.5) * 8;
      const launchY = -Math.random() * 6 - 3;
      return {
        x: rect.width / 2 + (Math.random() - 0.5) * 40,
        y: Math.min(60, rect.height * 0.3),
        w: Math.random() * 8 + 4,
        h: Math.random() * 5 + 3,
        vx: spreadX,
        vy: launchY,
        angle: Math.random() * 360,
        vAngle: (Math.random() - 0.5) * 12,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        opacity: 1,
      };
    });
    let animationFrameId: number;
    let elapsedFrames = 0;
    const maxFrames = 180; // ~3 seconds at 60fps
    const render = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      elapsedFrames++;
      let aliveCount = 0;
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16; // gravity
        p.vx *= 0.99; // drag
        p.angle += p.vAngle;
        if (elapsedFrames > 120) {
          p.opacity = Math.max(0, p.opacity - 0.02);
        }
        if (p.opacity > 0 && p.y < rect.height + 20) {
          aliveCount++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.angle * Math.PI) / 180);
          ctx.globalAlpha = p.opacity;
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }
      if (aliveCount > 0 && elapsedFrames < maxFrames) {
        animationFrameId = requestAnimationFrame(render);
      }
    };
    animationFrameId = requestAnimationFrame(render);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);
  return <canvas ref={canvasRef} className={styles.canvas} />;
};
