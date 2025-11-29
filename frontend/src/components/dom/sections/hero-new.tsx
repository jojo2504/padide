'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from 'framer-motion';

const letterVariants = {
  hidden: { y: '100%', opacity: 0, rotateX: -90 },
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      duration: 0.8,
      delay: i * 0.05,
      ease: [0.16, 1, 0.3, 1] as const, // expo.out
    },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.5,
    },
  },
};

const heroWords = ['SUSTAINABLE', 'CIRCULAR', 'REWARDING'];

export default function HeroNew() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  
  // Parallax transforms
  const titleY = useTransform(smoothProgress, [0, 1], [0, 150]);
  const subtitleY = useTransform(smoothProgress, [0, 1], [0, 100]);
  const opacity = useTransform(smoothProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(smoothProgress, [0, 0.5], [1, 0.95]);
  
  // Rotating word effect
  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % heroWords.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  
  // Split text into individual characters for animation
  const cyclrLetters = 'CYCLR'.split('');
  
  return (
    <section 
      ref={containerRef}
      className="relative min-h-[120vh] flex items-center justify-center overflow-hidden"
    >
      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0"
        style={{ scale }}
      >
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-radial from-void via-void to-void" />
        
        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-1/4 -left-1/4 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(0, 255, 148, 0.15) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 -right-1/4 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
          animate={{
            x: [0, -80, 0],
            y: [0, 80, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
        
        {/* Grid overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(var(--holographic-dim) 1px, transparent 1px),
              linear-gradient(90deg, var(--holographic-dim) 1px, transparent 1px)
            `,
            backgroundSize: '100px 100px',
          }}
        />
      </motion.div>
      
      {/* Hero content */}
      <motion.div 
        className="relative z-10 text-center px-6 max-w-7xl mx-auto"
        style={{ y: titleY, opacity }}
      >
        {/* Pre-title badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-chlorophyll/30 bg-chlorophyll/5 backdrop-blur-sm">
            <motion.span
              className="w-2 h-2 rounded-full bg-chlorophyll"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-chlorophyll text-sm font-medium tracking-wide">
              THE FUTURE OF PRODUCT LIFECYCLE
            </span>
          </span>
        </motion.div>
        
        {/* Main title with letter animation */}
        <motion.h1
          className="mb-6"
          variants={staggerContainer}
          initial="hidden"
          animate={mounted ? 'visible' : 'hidden'}
        >
          <div className="flex justify-center items-center gap-[0.05em] overflow-hidden">
            {cyclrLetters.map((letter, i) => (
              <motion.span
                key={i}
                className="text-[clamp(4rem,15vw,12rem)] font-bold text-transparent bg-clip-text inline-block"
                style={{
                  backgroundImage: 'linear-gradient(180deg, #E2E8F0 0%, #94A3B8 100%)',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.05em',
                }}
                variants={letterVariants}
                custom={i}
              >
                {letter}
              </motion.span>
            ))}
          </div>
        </motion.h1>
        
        {/* Rotating word subtitle */}
        <motion.div
          className="h-[3rem] md:h-[4rem] relative overflow-hidden mb-8"
          style={{ y: subtitleY }}
        >
          <AnimatePresence mode="wait">
            <motion.p
              key={currentWordIndex}
              className="text-[clamp(1.5rem,4vw,3rem)] font-light text-chlorophyll absolute inset-0 flex items-center justify-center"
              initial={{ y: 50, opacity: 0, filter: 'blur(10px)' }}
              animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
              exit={{ y: -50, opacity: 0, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {heroWords[currentWordIndex]}
            </motion.p>
          </AnimatePresence>
        </motion.div>
        
        {/* Description */}
        <motion.p
          className="text-holographic-muted text-lg md:text-xl max-w-2xl mx-auto mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
        >
          Revolutionizing product ownership through blockchain-powered
          lifecycle tracking and circular economy rewards.
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <motion.button
            className="group relative px-8 py-4 rounded-full overflow-hidden"
            data-cursor="button"
            data-cursor-text="GO"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Button gradient background */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-chlorophyll to-cyber"
              whileHover={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
            />
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 opacity-0 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
              }}
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            <span className="relative z-10 text-void font-semibold">
              Launch App
            </span>
          </motion.button>
          
          <motion.button
            className="group px-8 py-4 rounded-full border border-holographic/30 bg-holographic/5 backdrop-blur-sm hover:border-chlorophyll/50 hover:bg-chlorophyll/10 transition-all duration-300"
            data-cursor="link"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="text-holographic group-hover:text-chlorophyll transition-colors font-medium">
              Watch Demo
            </span>
          </motion.button>
        </motion.div>
        
        {/* Stats row */}
        <motion.div
          className="mt-24 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          {[
            { value: '$2.4M', label: 'Recycled Value' },
            { value: '12K+', label: 'Products Tracked' },
            { value: '340%', label: 'Avg ROI' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6 + i * 0.1 }}
            >
              <div className="text-2xl md:text-3xl font-bold text-holographic mb-1">
                {stat.value}
              </div>
              <div className="text-holographic-dim text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
      
      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <motion.div
          className="flex flex-col items-center gap-2 text-holographic-dim"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <svg 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M12 5v14M19 12l-7 7-7-7" />
          </svg>
        </motion.div>
      </motion.div>
    </section>
  );
}
