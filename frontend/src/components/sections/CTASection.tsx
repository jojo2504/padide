'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTheme } from 'next-themes';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, Torus } from '@react-three/drei';
import * as THREE from 'three';
import clsx from 'clsx';

// Animated 3D background
function CTABackground({ isDark }: { isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <group ref={groupRef}>
      {/* Central orb */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <Sphere args={[1.5, 64, 64]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color={isDark ? '#00FF88' : '#22C55E'}
            envMapIntensity={0.5}
            clearcoat={1}
            clearcoatRoughness={0}
            metalness={0.2}
            distort={0.4}
            speed={3}
            transparent
            opacity={0.8}
          />
        </Sphere>
      </Float>

      {/* Orbiting rings */}
      {[0, 1, 2].map((i) => (
        <Torus 
          key={i}
          args={[2.5 + i * 0.5, 0.02, 16, 100]}
          rotation={[Math.PI / 2 + i * 0.2, i * 0.5, 0]}
        >
          <meshBasicMaterial
            color={isDark ? (i % 2 === 0 ? '#00FFFF' : '#A855F7') : '#22C55E'}
            transparent
            opacity={0.3}
          />
        </Torus>
      ))}

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Float key={i} speed={1 + Math.random()} floatIntensity={0.5}>
          <Sphere
            args={[0.05, 16, 16]}
            position={[
              (Math.random() - 0.5) * 6,
              (Math.random() - 0.5) * 6,
              (Math.random() - 0.5) * 6,
            ]}
          >
            <meshBasicMaterial 
              color={isDark ? '#00FF88' : '#22C55E'} 
              transparent 
              opacity={0.8} 
            />
          </Sphere>
        </Float>
      ))}
    </group>
  );
}

export function CTASection() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  return (
    <section 
      ref={sectionRef}
      className={clsx(
        'relative py-32 px-8 overflow-hidden',
        isDark 
          ? 'bg-gradient-to-b from-night-bg via-night-surface to-night-bg' 
          : 'bg-gradient-to-b from-day-bg via-day-surface to-day-bg'
      )}
    >
      {/* 3D Background */}
      <div className="absolute inset-0 opacity-50">
        <Canvas camera={{ position: [0, 0, 8], fov: 50 }}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={1} color={isDark ? '#00FFFF' : '#ffffff'} />
          <CTABackground isDark={isDark} />
        </Canvas>
      </div>

      {/* Content */}
      <div className="relative max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.8 }}
        >
          <span className={clsx(
            'font-mono text-xs tracking-[0.3em] uppercase mb-6 inline-block',
            isDark ? 'text-night-neon-green' : 'text-day-accent'
          )}>
            Ready to Begin?
          </span>

          <h2 className="text-4xl md:text-6xl lg:text-7xl font-display mb-8 text-day-text dark:text-night-text">
            Join the{' '}
            <span className={isDark ? 'text-gradient-night' : 'text-gradient-day'}>
              Regeneration
            </span>
          </h2>

          <p className="text-xl text-day-muted dark:text-night-muted mb-12 max-w-2xl mx-auto">
            Be part of the movement that's redefining what finance can be. 
            Start earning while saving the planet.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                'px-8 py-4 rounded-full font-mono text-sm tracking-wider uppercase transition-all',
                isDark
                  ? 'bg-night-neon-green text-night-bg hover:shadow-neon-green'
                  : 'bg-day-accent text-white hover:shadow-xl'
              )}
            >
              Launch App
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                'px-8 py-4 rounded-full font-mono text-sm tracking-wider uppercase transition-all',
                isDark
                  ? 'border border-night-neon-green/50 text-night-neon-green hover:bg-night-neon-green/10'
                  : 'border border-day-accent/50 text-day-accent hover:bg-day-accent/10'
              )}
            >
              Read Whitepaper
            </motion.button>
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-8"
          >
            {[
              { label: 'Audited by', value: 'CertiK' },
              { label: 'Powered by', value: 'XRPL' },
              { label: 'Partners', value: '15+' },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="font-mono text-xs text-day-muted dark:text-night-muted mb-1">
                  {item.label}
                </div>
                <div className={clsx(
                  'font-display text-lg',
                  isDark ? 'text-night-text' : 'text-day-text'
                )}>
                  {item.value}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-day-bg dark:from-night-bg to-transparent pointer-events-none" />
    </section>
  );
}
