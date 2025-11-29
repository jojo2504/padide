'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/theme/theme-provider';
import QRScanner from '@/components/scanner/qr-scanner';

// Particle component for the seed explosion
function Particle({ delay, angle, distance }: { delay: number; angle: number; distance: number }) {
  return (
    <motion.div
      className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-leaf to-leaf-light"
      initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
      animate={{
        scale: [0, 1.5, 0],
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 0.8,
        delay,
        ease: 'easeOut',
      }}
      style={{ boxShadow: '0 0 10px rgba(34, 197, 94, 0.5)' }}
    />
  );
}

// Floating tree component
function FloatingTree({ index, total }: { index: number; total: number }) {
  const angle = (index / total) * Math.PI * 2;
  const radius = 280 + Math.random() * 80;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.4;
  const scale = 0.6 + Math.random() * 0.4;
  const delay = 1.5 + index * 0.1;
  
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: '50%', top: '55%' }}
      initial={{ scale: 0, x: 0, y: 0, opacity: 0 }}
      animate={{ 
        scale, 
        x, 
        y,
        opacity: 1,
      }}
      transition={{
        delay,
        type: 'spring',
        stiffness: 200,
        damping: 15,
      }}
    >
      <motion.div
        className="text-4xl md:text-5xl"
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ duration: 3, repeat: Infinity, delay: index * 0.2 }}
      >
        🌳
      </motion.div>
    </motion.div>
  );
}

// 3D Phone with scan beam
function Phone3D({ onScanClick }: { onScanClick: () => void }) {
  const { isDay } = useTheme();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientY - rect.top - rect.height / 2) / 20;
    const y = (e.clientX - rect.left - rect.width / 2) / 20;
    setRotation({ x: -x, y });
  };

  return (
    <motion.div
      className="relative w-64 h-[480px] md:w-80 md:h-[560px] cursor-pointer perspective-1000"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setRotation({ x: 0, y: 0 })}
      onClick={onScanClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Phone body - clay material */}
      <motion.div
        className={`
          absolute inset-0 rounded-[40px] p-3
          ${isDay 
            ? 'bg-gradient-to-br from-clay-light via-clay to-clay-dark' 
            : 'bg-gradient-to-br from-night-surface via-void to-void-deep'
          }
        `}
        style={{
          boxShadow: isDay 
            ? '0 30px 80px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.1)'
            : '0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 60px rgba(56, 189, 248, 0.2)',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          transformStyle: 'preserve-3d',
        }}
        animate={{
          rotateY: [rotation.y - 5, rotation.y + 5, rotation.y - 5],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Phone screen */}
        <div 
          className={`
            w-full h-full rounded-[32px] overflow-hidden relative
            ${isDay 
              ? 'bg-gradient-to-b from-day-bg to-day-surface' 
              : 'bg-gradient-to-b from-void-deep to-void'
            }
          `}
        >
          {/* Screen content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {/* CYCLR logo on screen */}
            <motion.div
              className={`text-3xl md:text-4xl font-heading font-bold mb-4 ${
                isDay ? 'text-leaf' : 'text-sky'
              }`}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              CYCLR
            </motion.div>
            
            {/* QR Frame */}
            <div className={`
              w-32 h-32 md:w-40 md:h-40 rounded-2xl border-4 border-dashed
              ${isDay ? 'border-leaf/50' : 'border-sky/50'}
              flex items-center justify-center
            `}>
              <motion.div
                className="text-4xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                📱
              </motion.div>
            </div>
            
            <p className={`mt-4 text-sm ${isDay ? 'text-void/60' : 'text-white/60'}`}>
              Tap to scan
            </p>
          </div>
          
          {/* Scan beam */}
          <motion.div
            className={`absolute left-4 right-4 h-1 rounded-full ${
              isDay ? 'bg-leaf' : 'bg-sky'
            }`}
            style={{
              boxShadow: isDay 
                ? '0 0 20px rgba(34, 197, 94, 0.8)' 
                : '0 0 20px rgba(56, 189, 248, 0.8)',
            }}
            animate={{ top: ['20%', '80%', '20%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        
        {/* Camera notch */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />
      </motion.div>
      
      {/* Click indicator */}
      <motion.div
        className={`
          absolute -bottom-12 left-1/2 -translate-x-1/2
          px-4 py-2 rounded-full font-medium text-sm
          ${isDay 
            ? 'bg-leaf text-white shadow-glow-leaf' 
            : 'bg-sky text-void shadow-glow-sky'
          }
        `}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        📸 Scan Product
      </motion.div>
    </motion.div>
  );
}

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDay } = useTheme();
  const [showScanner, setShowScanner] = useState(false);
  const [seedAnimationComplete, setSeedAnimationComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  useInView(containerRef, { once: true });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const contentScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);
  
  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setSeedAnimationComplete(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleScanSuccess = (data: string) => {
    console.log('QR Scanned:', data);
    setShowScanner(false);
    // TODO: Handle QR data - navigate to product page
    alert(`Product scanned: ${data}`);
  };

  if (!mounted) return null;

  return (
    <>
      <section
        ref={containerRef}
        className={`
          relative min-h-screen overflow-hidden
          ${isDay 
            ? 'bg-day-bg bg-paper-grain' 
            : 'bg-void'
          }
        `}
      >
        {/* Animated background gradient */}
        <motion.div 
          className="absolute inset-0 pointer-events-none"
          style={{ y: backgroundY }}
        >
          {/* Gradient orbs */}
          <motion.div
            className={`absolute w-[600px] h-[600px] rounded-full blur-3xl ${
              isDay ? 'bg-leaf/10' : 'bg-sky/10'
            }`}
            style={{ left: '20%', top: '10%' }}
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />
          <motion.div
            className={`absolute w-[400px] h-[400px] rounded-full blur-3xl ${
              isDay ? 'bg-sky/10' : 'bg-leaf/10'
            }`}
            style={{ right: '10%', bottom: '20%' }}
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
        
        {/* Main content */}
        <motion.div
          className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-20"
          style={{ opacity: contentOpacity, scale: contentScale }}
        >
          {/* Seed drop animation */}
          {!seedAnimationComplete && (
            <motion.div
              className="absolute left-1/2 text-6xl"
              initial={{ y: -200, x: '-50%', opacity: 1 }}
              animate={{ y: 0, opacity: 0 }}
              transition={{ 
                duration: 0.8, 
                ease: [0.34, 1.56, 0.64, 1],
              }}
              onAnimationComplete={() => setSeedAnimationComplete(true)}
            >
              🌱
            </motion.div>
          )}
          
          {/* Particle explosion */}
          {seedAnimationComplete && (
            <div className="absolute left-1/2 top-1/3 -translate-x-1/2">
              {[...Array(12)].map((_, i) => (
                <Particle
                  key={i}
                  delay={0}
                  angle={(i / 12) * Math.PI * 2}
                  distance={100 + Math.random() * 50}
                />
              ))}
            </div>
          )}
          
          {/* Floating trees that pop up */}
          {seedAnimationComplete && (
            <>
              {[...Array(8)].map((_, i) => (
                <FloatingTree key={i} index={i} total={8} />
              ))}
            </>
          )}
          
          {/* Logo reveal */}
          <motion.h1
            className={`text-display-hero font-heading font-bold mb-6 text-center ${
              isDay ? 'text-void' : 'text-white'
            }`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ 
              delay: 0.8,
              type: 'spring',
              stiffness: 200,
              damping: 15,
            }}
          >
            <motion.span
              className={isDay ? 'text-leaf' : 'text-sky'}
              animate={{ 
                textShadow: isDay 
                  ? ['0 0 20px rgba(34, 197, 94, 0.3)', '0 0 40px rgba(34, 197, 94, 0.5)', '0 0 20px rgba(34, 197, 94, 0.3)']
                  : ['0 0 20px rgba(56, 189, 248, 0.3)', '0 0 40px rgba(56, 189, 248, 0.5)', '0 0 20px rgba(56, 189, 248, 0.3)'],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              CYCLR
            </motion.span>
          </motion.h1>
          
          {/* Tagline with stagger animation */}
          <motion.p
            className={`text-xl md:text-2xl font-body max-w-2xl text-center mb-12 ${
              isDay ? 'text-void/70' : 'text-white/70'
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            The circular economy, powered by blockchain.
            <br />
            <span className={isDay ? 'text-leaf font-semibold' : 'text-sky font-semibold'}>
              Track. Stake. Recycle. Earn.
            </span>
          </motion.p>
          
          {/* 3D Phone */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, type: 'spring', stiffness: 100 }}
          >
            <Phone3D onScanClick={() => setShowScanner(true)} />
          </motion.div>
          
          {/* Scroll indicator */}
          <motion.div
            className={`absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 ${
              isDay ? 'text-void/50' : 'text-white/50'
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <span className="text-sm font-medium tracking-widest uppercase">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12l7 7 7-7" />
              </svg>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>
      
      {/* QR Scanner Modal */}
      <AnimatePresence>
        {showScanner && (
          <QRScanner
            onScanSuccess={handleScanSuccess}
            onScanError={(err) => console.error(err)}
            onClose={() => setShowScanner(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
