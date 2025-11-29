'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Float, 
  Cylinder,
  RoundedBox,
} from '@react-three/drei';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import * as THREE from 'three';
import clsx from 'clsx';

gsap.registerPlugin(ScrollTrigger);

// 3D Coin component - optimized
function Coin({ 
  position, 
  rotation, 
  scale, 
  color,
  isGlowing 
}: { 
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  color: string;
  isGlowing: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y += 0.01;
  });

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
      <cylinderGeometry args={[0.5, 0.5, 0.1, 24]} />
      <meshStandardMaterial
        color={color}
        metalness={0.7}
        roughness={0.3}
        emissive={isGlowing ? color : '#000000'}
        emissiveIntensity={isGlowing ? 0.2 : 0}
      />
    </mesh>
  );
}

// Factory/Processing visual
function ProcessingStation({ progress, isDark }: { progress: number; isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
  });

  const stationColor = isDark ? '#00FF88' : '#22C55E';
  const accentColor = isDark ? '#A855F7' : '#16A34A';

  return (
    <group ref={groupRef}>
      {/* Main cylinder */}
      <Cylinder args={[1, 1, 0.3, 32]} position={[0, 0, 0]}>
        <meshStandardMaterial 
          color={stationColor}
          metalness={0.6}
          roughness={0.3}
          transparent
          opacity={0.8}
        />
      </Cylinder>
      
      {/* Rotating rings */}
      {[0.3, 0.5, 0.7].map((offset, i) => (
        <mesh 
          key={i} 
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 0.15 + i * 0.1, 0]}
        >
          <torusGeometry args={[1.2 + i * 0.2, 0.02, 16, 100]} />
          <meshBasicMaterial 
            color={i % 2 === 0 ? stationColor : accentColor}
            transparent
            opacity={0.5 + (progress / 100) * 0.5}
          />
        </mesh>
      ))}

      {/* Energy beams */}
      {progress > 30 && (
        <>
          {[0, 1, 2, 3].map((i) => (
            <mesh 
              key={i}
              position={[
                Math.cos((i / 4) * Math.PI * 2) * 1.5,
                0,
                Math.sin((i / 4) * Math.PI * 2) * 1.5
              ]}
            >
              <cylinderGeometry args={[0.02, 0.02, 1, 8]} />
              <meshBasicMaterial color={accentColor} transparent opacity={0.8} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

// Vault visual
function Vault({ isOpen, isDark }: { isOpen: boolean; isDark: boolean }) {
  const doorRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    if (!doorRef.current) return;
    
    gsap.to(doorRef.current.rotation, {
      y: isOpen ? -Math.PI / 2 : 0,
      duration: 1,
      ease: 'power3.inOut',
    });
  }, [isOpen]);

  useFrame(() => {
    if (glowRef.current) {
      glowRef.current.intensity = isOpen ? 2 + Math.sin(Date.now() * 0.005) : 0;
    }
  });

  const vaultColor = isDark ? '#0A0A0A' : '#1F2937';
  const accentColor = isDark ? '#00FF88' : '#22C55E';

  return (
    <group>
      {/* Vault body */}
      <RoundedBox args={[2, 2, 1.5]} radius={0.1} position={[0, 0, -0.75]}>
        <meshStandardMaterial 
          color={vaultColor}
          metalness={0.9}
          roughness={0.1}
        />
      </RoundedBox>

      {/* Vault door */}
      <mesh ref={doorRef} position={[-1, 0, 0]}>
        <group position={[1, 0, 0]}>
          <RoundedBox args={[2, 2, 0.2]} radius={0.05}>
            <meshStandardMaterial 
              color={vaultColor}
              metalness={0.9}
              roughness={0.1}
            />
          </RoundedBox>
          
          {/* Lock mechanism */}
          <mesh position={[0.3, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.1, 24]} />
            <meshStandardMaterial 
              color={accentColor}
              emissive={accentColor}
              emissiveIntensity={isOpen ? 0.5 : 0.2}
            />
          </mesh>
        </group>
      </mesh>

      {/* Inner glow */}
      <pointLight 
        ref={glowRef}
        position={[0, 0, 0]}
        color={accentColor}
        intensity={0}
        distance={3}
      />
    </group>
  );
}

// Split coins visualization - optimized
function SplitCoins({ progress, isDark }: { progress: number; isDark: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const splits = useMemo(() => [
    { label: 'USER', color: isDark ? '#00FFFF' : '#22C55E', position: [-2, 0, 0] as [number, number, number] },
    { label: 'COMPANY', color: isDark ? '#A855F7' : '#16A34A', position: [0, 0, 0] as [number, number, number] },
    { label: 'ECOLOGY', color: isDark ? '#00FF88' : '#15803D', position: [2, 0, 0] as [number, number, number] },
  ], [isDark]);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.children.forEach((child, i) => {
      child.position.y = Math.sin(state.clock.elapsedTime * 2 + i) * 0.1;
      (child as THREE.Mesh).rotation.y += 0.008;
    });
  });

  const splitProgress = Math.max(0, Math.min(1, (progress - 60) / 40));

  return (
    <group ref={groupRef}>
      {splits.map((split, i) => (
        <group 
          key={split.label}
          position={[
            split.position[0] * splitProgress,
            split.position[1],
            split.position[2]
          ]}
        >
          <mesh>
            <cylinderGeometry args={[0.4, 0.4, 0.08, 24]} />
            <meshStandardMaterial
              color={split.color}
              metalness={0.7}
              roughness={0.3}
              emissive={split.color}
              emissiveIntensity={0.2}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Journey Scene
function JourneyScene({ scrollProgress, isDark }: { scrollProgress: number; isDark: boolean }) {
  const { camera } = useThree();

  useEffect(() => {
    // Animate camera based on scroll
    const targetZ = 5 - scrollProgress * 0.02;
    const targetY = scrollProgress * 0.02;
    
    gsap.to(camera.position, {
      z: targetZ,
      y: targetY,
      duration: 0.5,
      ease: 'power2.out',
    });
  }, [scrollProgress, camera]);

  const stage = scrollProgress < 33 ? 'deposit' : scrollProgress < 66 ? 'process' : 'split';

  return (
    <>
      <ambientLight intensity={isDark ? 0.2 : 0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color={isDark ? '#00FFFF' : '#ffffff'} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color={isDark ? '#A855F7' : '#22C55E'} />

      {/* Stage 1: Coin deposit */}
      {stage === 'deposit' && (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
          <Coin 
            position={[0, 0, 0]}
            rotation={[0, 0, 0]}
            scale={1.5 + (scrollProgress / 33) * 0.5}
            color={isDark ? '#00FF88' : '#22C55E'}
            isGlowing={true}
          />
        </Float>
      )}

      {/* Stage 2: Processing */}
      {stage === 'process' && (
        <ProcessingStation 
          progress={(scrollProgress - 33) * 3}
          isDark={isDark}
        />
      )}

      {/* Stage 3: Split */}
      {stage === 'split' && (
        <SplitCoins 
          progress={scrollProgress}
          isDark={isDark}
        />
      )}

      {/* Connecting pipes/paths */}
      <mesh position={[0, -1, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 10, 16]} />
        <meshBasicMaterial 
          color={isDark ? '#00FF88' : '#22C55E'}
          transparent
          opacity={0.3}
        />
      </mesh>
    </>
  );
}

// Step card component
function StepCard({ 
  step, 
  title, 
  description, 
  isActive,
  isDark 
}: { 
  step: number;
  title: string;
  description: string;
  isActive: boolean;
  isDark: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className={clsx(
        'p-6 rounded-2xl transition-all duration-500',
        isActive 
          ? isDark 
            ? 'bg-night-surface/80 border border-night-neon-green/50 shadow-neon-green' 
            : 'bg-day-surface/80 border border-day-accent/50 shadow-xl'
          : 'bg-transparent border border-transparent'
      )}
    >
      <div className="flex items-start gap-4">
        <div className={clsx(
          'w-10 h-10 rounded-full flex items-center justify-center font-mono text-sm',
          isActive
            ? isDark 
              ? 'bg-night-neon-green text-night-bg' 
              : 'bg-day-accent text-white'
            : isDark
              ? 'bg-night-surface text-night-muted border border-night-muted'
              : 'bg-day-surface text-day-muted border border-day-muted'
        )}>
          {step}
        </div>
        <div>
          <h3 className={clsx(
            'text-lg font-display mb-2 transition-colors',
            isActive 
              ? isDark ? 'text-night-neon-green' : 'text-day-accent'
              : 'text-day-text dark:text-night-text'
          )}>
            {title}
          </h3>
          <p className="text-sm text-day-muted dark:text-night-muted">
            {description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// Main Escrow Journey component
export function EscrowJourney() {
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const trigger = ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        setScrollProgress(self.progress * 100);
      },
    });

    return () => trigger.kill();
  }, []);

  const steps = [
    { title: 'Deposit', description: 'Funds enter the secure escrow smart contract on XRPL.' },
    { title: 'Process', description: 'Verified and stamped with ecological impact metrics.' },
    { title: 'Distribute', description: 'Split between user rewards, platform, and ecology fund.' },
  ];

  const currentStep = scrollProgress < 33 ? 1 : scrollProgress < 66 ? 2 : 3;

  if (!mounted) {
    return <div className="h-[300vh] bg-day-bg dark:bg-night-bg" />;
  }

  return (
    <section 
      ref={containerRef}
      className="relative h-[300vh]"
    >
      {/* Section header */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex">
          {/* Left side - 3D visualization - optimized */}
          <div className="w-full md:w-1/2 h-full relative">
            <Canvas
              camera={{ position: [0, 0, 5], fov: 50 }}
              dpr={[1, 1.5]}
              frameloop="always"
              gl={{ antialias: false, powerPreference: 'high-performance' }}
              className="!absolute inset-0"
            >
              <JourneyScene scrollProgress={scrollProgress} isDark={isDark} />
            </Canvas>
          </div>

          {/* Right side - Content */}
          <div className="hidden md:flex w-1/2 h-full items-center px-12">
            <div className="max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <span className={clsx(
                  'font-mono text-xs tracking-[0.3em] uppercase mb-4 inline-block',
                  isDark ? 'text-night-neon-purple' : 'text-day-accent'
                )}>
                  The Journey
                </span>
                <h2 className="text-4xl md:text-5xl font-display mb-8 text-day-text dark:text-night-text">
                  Follow the{' '}
                  <span className={isDark ? 'text-gradient-night' : 'text-gradient-day'}>
                    Flow
                  </span>
                </h2>
              </motion.div>

              {/* Steps */}
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <StepCard
                    key={i}
                    step={i + 1}
                    title={step.title}
                    description={step.description}
                    isActive={currentStep === i + 1}
                    isDark={isDark}
                  />
                ))}
              </div>

              {/* Progress indicator */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs text-day-muted dark:text-night-muted">
                    Progress
                  </span>
                  <span className={clsx(
                    'font-mono text-xs',
                    isDark ? 'text-night-neon-green' : 'text-day-accent'
                  )}>
                    {scrollProgress.toFixed(0)}%
                  </span>
                </div>
                <div className="h-1 bg-day-surface dark:bg-night-surface rounded-full overflow-hidden">
                  <motion.div
                    className={clsx(
                      'h-full rounded-full',
                      isDark 
                        ? 'bg-gradient-to-r from-night-neon-cyan via-night-neon-green to-night-neon-purple' 
                        : 'bg-gradient-to-r from-day-accent to-green-600'
                    )}
                    style={{ width: `${scrollProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile content overlay */}
        <div className="md:hidden absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-day-bg dark:from-night-bg to-transparent">
          <div className="text-center">
            <span className={clsx(
              'font-mono text-xs tracking-[0.3em] uppercase',
              isDark ? 'text-night-neon-green' : 'text-day-accent'
            )}>
              Step {currentStep}: {steps[currentStep - 1].title}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
