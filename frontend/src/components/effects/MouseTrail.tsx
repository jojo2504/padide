'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export function MouseTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isMoving: false });
  const rafRef = useRef<number>();
  const lastMouseMoveRef = useRef(0);
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === 'dark';

  const createParticle = useCallback((x: number, y: number) => {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 1.5 + 0.5;
    
    return {
      x,
      y,
      size: Math.random() * 4 + 2,
      opacity: Math.random() * 0.4 + 0.3,
      vx: Math.cos(angle) * speed * 0.3,
      vy: Math.sin(angle) * speed * 0.3,
      life: 0,
      maxLife: 30, // Shorter lifespan
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      // Throttle particle creation to every 50ms
      if (now - lastMouseMoveRef.current < 50) return;
      lastMouseMoveRef.current = now;
      
      mouseRef.current = { x: e.clientX, y: e.clientY, isMoving: true };
      
      // Add only 1 particle per throttled move
      particlesRef.current.push(createParticle(e.clientX, e.clientY));
      
      // Limit particles to 30
      if (particlesRef.current.length > 30) {
        particlesRef.current = particlesRef.current.slice(-30);
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particlesRef.current = particlesRef.current.filter(particle => {
        particle.life++;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.opacity = 0.5 * (1 - (particle.life / particle.maxLife));
        particle.size *= 0.96;

        if (particle.life >= particle.maxLife || particle.size < 0.3) {
          return false;
        }

        // Simple drawing - no shadows for performance
        ctx.globalAlpha = particle.opacity;

        if (isDark) {
          ctx.fillStyle = '#00FF88';
          ctx.fillRect(
            particle.x - particle.size / 2,
            particle.y - particle.size / 2,
            particle.size,
            particle.size
          );
        } else {
          ctx.fillStyle = 'rgba(34, 197, 94, 0.6)';
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fill();
        }

        return true;
      });

      ctx.globalAlpha = 1;
      rafRef.current = requestAnimationFrame(animate);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isDark, createParticle]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9998]"
    />
  );
}
