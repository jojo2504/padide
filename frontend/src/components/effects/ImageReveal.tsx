'use client';

import { useRef, useEffect, useState, ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
import clsx from 'clsx';

interface ImageRevealProps {
  children: ReactNode;
  className?: string;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
}

export function ImageReveal({ 
  children, 
  className,
  direction = 'right',
  delay = 0
}: ImageRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [hasRevealed, setHasRevealed] = useState(false);

  useEffect(() => {
    if (isInView && !hasRevealed) {
      const timeout = setTimeout(() => setHasRevealed(true), delay * 1000);
      return () => clearTimeout(timeout);
    }
  }, [isInView, hasRevealed, delay]);

  const clipPaths = {
    left: {
      hidden: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      visible: 'polygon(100% 0, 100% 0, 100% 100%, 100% 100%)',
    },
    right: {
      hidden: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      visible: 'polygon(0 0, 0 0, 0 100%, 0 100%)',
    },
    up: {
      hidden: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      visible: 'polygon(0 0, 100% 0, 100% 0, 0 0)',
    },
    down: {
      hidden: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      visible: 'polygon(0 100%, 100% 100%, 100% 100%, 0 100%)',
    },
  };

  return (
    <div ref={ref} className={clsx('relative overflow-hidden', className)}>
      {/* Reveal curtain */}
      <motion.div
        className="absolute inset-0 bg-cyclr-primary z-10"
        initial={{ clipPath: clipPaths[direction].hidden }}
        animate={{ 
          clipPath: hasRevealed 
            ? clipPaths[direction].visible 
            : clipPaths[direction].hidden 
        }}
        transition={{
          duration: 0.8,
          ease: [0.77, 0, 0.175, 1],
        }}
        style={{
          clipPath: hasRevealed 
            ? clipPaths[direction].visible 
            : clipPaths[direction].hidden,
        }}
      />
      
      {/* Content with scale animation */}
      <motion.div
        initial={{ scale: 1.2 }}
        animate={{ scale: hasRevealed ? 1 : 1.2 }}
        transition={{
          duration: 1.2,
          ease: [0.4, 0, 0.2, 1],
          delay: 0.2,
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
