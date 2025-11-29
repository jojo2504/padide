'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import clsx from 'clsx';
import { HeroPortal } from './HeroPortal';

// Magnetic text component - CSS based for performance
function MagneticText({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span 
      className={clsx(
        'inline-block transition-transform duration-200 ease-out hover:scale-105',
        className
      )}
    >
      {children}
    </span>
  );
}

// Floating word animation
function FloatingWord({ word, delay = 0, className }: { word: string; delay?: number; className?: string }) {
  return (
    <motion.span
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{
        duration: 0.8,
        delay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={clsx('inline-block', className)}
    >
      <MagneticText>{word}</MagneticText>
    </motion.span>
  );
}

export function HeroSection() {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const isDark = resolvedTheme === 'dark';

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  // Simpler transforms without springs for better performance
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '40%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.9]);

  return (
    <section 
      ref={containerRef}
      className="relative min-h-[200vh]"
    >
      {/* Sticky container for parallax */}
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Background parallax layer */}
        <motion.div 
          className="absolute inset-0 z-0"
          style={{ y }}
        >
          <HeroPortal />
        </motion.div>

        {/* Content layer */}
        <motion.div 
          ref={textRef}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center"
          style={{ 
            opacity,
            scale,
          }}
        >
          {/* Main headline */}
          <div className="text-center px-4 max-w-6xl mx-auto">
            {/* Eyebrow text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mb-8"
            >
              <span className={clsx(
                'font-mono text-xs tracking-[0.3em] uppercase px-4 py-2 rounded-full',
                isDark 
                  ? 'bg-night-neon-green/10 text-night-neon-green border border-night-neon-green/30' 
                  : 'bg-day-accent/10 text-day-accent border border-day-accent/30'
              )}>
                Built on XRPL • Powered by Nature
              </span>
            </motion.div>

            {/* Main title - Line 1 */}
            <h1 className="overflow-hidden mb-4">
              <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6">
                <FloatingWord 
                  word="THE" 
                  delay={0.7}
                  className="text-5xl md:text-7xl lg:text-9xl font-display text-day-text dark:text-night-text"
                />
                <FloatingWord 
                  word="CYCLE" 
                  delay={0.8}
                  className={clsx(
                    'text-5xl md:text-7xl lg:text-9xl font-display',
                    isDark ? 'text-gradient-night' : 'text-gradient-day'
                  )}
                />
              </div>
            </h1>

            {/* Main title - Line 2 */}
            <h1 className="overflow-hidden mb-8">
              <div className="flex flex-wrap justify-center gap-x-4 md:gap-x-6">
                <FloatingWord 
                  word="IS" 
                  delay={0.9}
                  className="text-5xl md:text-7xl lg:text-9xl font-display text-day-text dark:text-night-text"
                />
                <FloatingWord 
                  word="BROKEN." 
                  delay={1}
                  className={clsx(
                    'text-5xl md:text-7xl lg:text-9xl font-display',
                    isDark ? 'text-night-neon-magenta' : 'text-red-500'
                  )}
                />
              </div>
            </h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.8 }}
              className="text-lg md:text-xl lg:text-2xl font-sans text-day-muted dark:text-night-muted max-w-2xl mx-auto mb-12"
            >
              Traditional finance extracts. <span className={isDark ? 'text-night-neon-green' : 'text-day-accent'}>CYCLR</span> regenerates.
              <br />
              Every transaction plants seeds of change.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-4"
            >
              <button className="btn-primary">
                <span className="relative z-10">Enter the Cycle</span>
              </button>
              <button className="btn-ghost group">
                <span>Learn More</span>
                <svg 
                  className="inline-block ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: 0.5 }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-xs tracking-widest uppercase text-day-muted dark:text-night-muted">
                Scroll to explore
              </span>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={clsx(
                  'w-6 h-10 rounded-full border-2 flex justify-center pt-2',
                  isDark ? 'border-night-neon-green/50' : 'border-day-accent/50'
                )}
              >
                <motion.div
                  animate={{ height: ['20%', '40%', '20%'] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={clsx(
                    'w-1 rounded-full',
                    isDark ? 'bg-night-neon-green' : 'bg-day-accent'
                  )}
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>

        {/* Decorative elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Floating shapes - Day mode */}
          {!isDark && (
            <>
              <motion.div
                animate={{ 
                  y: [0, -30, 0],
                  rotate: [0, 10, 0],
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-20 left-[10%] w-32 h-32 rounded-full bg-day-accent/10 blur-xl"
              />
              <motion.div
                animate={{ 
                  y: [0, 20, 0],
                  rotate: [0, -10, 0],
                }}
                transition={{ duration: 10, repeat: Infinity }}
                className="absolute bottom-40 right-[15%] w-48 h-48 rounded-full bg-day-accent/5 blur-2xl"
              />
            </>
          )}

          {/* Data streams - Night mode */}
          {isDark && (
            <div className="absolute inset-0 data-stream opacity-20" />
          )}
        </div>
      </div>

      {/* Scroll reveal section */}
      <div className="relative z-20 -mt-[50vh] pt-[50vh]">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1 }}
          className="min-h-screen flex items-center justify-center px-4"
        >
          <div className="text-center max-w-4xl">
            <motion.h2
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-4xl md:text-6xl lg:text-8xl font-display mb-8"
            >
              <span className="text-day-text dark:text-night-text">LET'S </span>
              <span className={isDark ? 'text-gradient-night' : 'text-gradient-day'}>FIX IT.</span>
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-xl md:text-2xl text-day-muted dark:text-night-muted"
            >
              A new financial primitive that puts ecology at the center.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
