'use client';

import { useRef, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import clsx from 'clsx';

// Feature card with 3D icon
function FeatureCard({ 
  icon, 
  title, 
  description, 
  index,
  isDark 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
  isDark: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className={clsx(
        'group relative p-8 rounded-3xl transition-all duration-500',
        'hover:scale-[1.02]',
        isDark
          ? 'bg-night-surface/50 hover:bg-night-surface border border-white/5 hover:border-night-neon-green/30'
          : 'bg-day-surface/50 hover:bg-day-surface border border-black/5 hover:border-day-accent/30 hover:shadow-xl'
      )}
    >
      {/* Glow effect on hover */}
      <div className={clsx(
        'absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10',
        isDark 
          ? 'bg-gradient-to-br from-night-neon-green/5 to-night-neon-purple/5 blur-xl' 
          : 'bg-gradient-to-br from-day-accent/5 to-green-600/5 blur-xl'
      )} />

      {/* Icon */}
      <div className={clsx(
        'w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300',
        'group-hover:scale-110',
        isDark
          ? 'bg-night-neon-green/10 text-night-neon-green'
          : 'bg-day-accent/10 text-day-accent'
      )}>
        {icon}
      </div>

      {/* Content */}
      <h3 className="text-xl font-display mb-3 text-day-text dark:text-night-text">
        {title}
      </h3>
      <p className="text-day-muted dark:text-night-muted">
        {description}
      </p>

      {/* Arrow indicator */}
      <div className={clsx(
        'absolute bottom-8 right-8 opacity-0 group-hover:opacity-100 transition-all duration-300',
        'transform translate-x-2 group-hover:translate-x-0',
        isDark ? 'text-night-neon-green' : 'text-day-accent'
      )}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </div>
    </motion.div>
  );
}

// Floating 3D background element
function FloatingOrb({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <Sphere args={[0.5, 32, 32]} position={position}>
        <MeshDistortMaterial
          color={color}
          distort={0.3}
          speed={2}
          transparent
          opacity={0.6}
        />
      </Sphere>
    </Float>
  );
}

export function FeaturesSection() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.1 });

  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'Trustless Escrow',
      description: 'Smart contracts on XRPL ensure your funds are always secure and automatically released when conditions are met.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Ecological Impact',
      description: 'Every transaction contributes to verified environmental projects. Track your positive impact in real-time.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: 'Lightning Fast',
      description: 'XRPL settles transactions in 3-5 seconds with near-zero fees. No more waiting for confirmations.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Fully Transparent',
      description: 'All transactions are recorded on the public ledger. Verify every flow, every split, every impact.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Community Governed',
      description: 'Token holders decide on project allocations, fee structures, and platform evolution through on-chain voting.',
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Earn While Saving',
      description: 'Competitive APY on your escrow deposits. Your money works for you while waiting to be released.',
    },
  ];

  return (
    <section 
      ref={sectionRef}
      className="relative py-32 px-8 overflow-hidden"
    >
      {/* Background 3D elements */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
          <ambientLight intensity={0.5} />
          <FloatingOrb 
            position={[-5, 3, -5]} 
            color={isDark ? '#00FF88' : '#22C55E'} 
          />
          <FloatingOrb 
            position={[5, -2, -5]} 
            color={isDark ? '#A855F7' : '#16A34A'} 
          />
        </Canvas>
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <span className={clsx(
            'font-mono text-xs tracking-[0.3em] uppercase mb-4 inline-block',
            isDark ? 'text-night-neon-purple' : 'text-day-accent'
          )}>
            Why CYCLR?
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display mb-6 text-day-text dark:text-night-text">
            Finance that{' '}
            <span className={isDark ? 'text-gradient-night' : 'text-gradient-day'}>
              Regenerates
            </span>
          </h2>
          <p className="text-xl text-day-muted dark:text-night-muted max-w-2xl mx-auto">
            Every feature designed to align profit with purpose.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
