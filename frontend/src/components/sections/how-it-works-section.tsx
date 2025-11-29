'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useTheme } from '@/components/theme/theme-provider';

interface Step {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  emoji: string;
  side: 'left' | 'right';
}

const steps: Step[] = [
  {
    number: '01',
    title: 'Track Production',
    subtitle: 'Digital Birth Certificate',
    description: 'Every product is born with a unique blockchain identity. Manufacturing data, materials, and carbon footprint are recorded forever.',
    emoji: '🏭',
    side: 'left',
  },
  {
    number: '02',
    title: 'Stake & Earn',
    subtitle: 'Lock Value, Gain Rewards',
    description: 'Stake your registered products in the CYCLR vault. Earn passive rewards while your assets grow in value over time.',
    emoji: '🔐',
    side: 'right',
  },
  {
    number: '03',
    title: 'Recycle & Collect',
    subtitle: 'Close the Loop',
    description: 'When your product reaches end-of-life, return it through our network. The recycling bot collects it and mints your reward tokens!',
    emoji: '🤖',
    side: 'left',
  },
];

// Factory with smoke puffs
function FactoryVisual() {
  const { isDay } = useTheme();
  
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64">
      {/* Factory building */}
      <motion.div
        className={`
          absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-40 md:w-40 md:h-48 rounded-t-xl
          ${isDay 
            ? 'bg-gradient-to-b from-clay-light to-clay-dark' 
            : 'bg-gradient-to-b from-night-elevated to-night-surface'
          }
        `}
        style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.3)' }}
        whileHover={{ scale: 1.05 }}
      >
        {/* Windows */}
        <div className="grid grid-cols-3 gap-2 p-4">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={`w-full aspect-square rounded ${
                isDay ? 'bg-sky-light/50' : 'bg-sky/30'
              }`}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, delay: i * 0.2, repeat: Infinity }}
            />
          ))}
        </div>
      </motion.div>
      
      {/* Chimney */}
      <div 
        className={`absolute bottom-32 md:bottom-40 left-1/2 translate-x-4 w-8 h-16 rounded-t-md ${
          isDay ? 'bg-clay-dark' : 'bg-night-surface'
        }`}
      />
      
      {/* Smoke puffs */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 translate-x-6 w-8 h-8 rounded-full bg-white/80"
          style={{ bottom: '200px' }}
          animate={{
            y: [-20, -80, -140],
            x: [0, 20, 40],
            scale: [0.5, 1, 0.3],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            delay: i * 1,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// Vault with XRPL glow
function VaultVisual() {
  const { isDay } = useTheme();
  
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
      <motion.div
        className={`
          relative w-32 h-36 md:w-40 md:h-44 rounded-2xl
          ${isDay 
            ? 'bg-gradient-to-br from-clay to-clay-dark' 
            : 'bg-gradient-to-br from-night-elevated to-void'
          }
        `}
        style={{ 
          boxShadow: isDay 
            ? '0 20px 40px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4)'
            : '0 20px 40px rgba(0,0,0,0.4), 0 0 60px rgba(56, 189, 248, 0.2)',
        }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 4, repeat: Infinity }}
        whileHover={{ scale: 1.05, rotateY: 10 }}
      >
        {/* Vault door */}
        <motion.div
          className={`
            absolute inset-4 rounded-xl flex items-center justify-center
            ${isDay ? 'bg-clay-light' : 'bg-night-surface'}
          `}
          style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}
        >
          {/* XRPL Logo glow */}
          <motion.div
            className={`text-4xl ${isDay ? 'text-leaf' : 'text-sky'}`}
            animate={{
              textShadow: isDay
                ? ['0 0 10px rgba(34, 197, 94, 0.3)', '0 0 30px rgba(34, 197, 94, 0.6)', '0 0 10px rgba(34, 197, 94, 0.3)']
                : ['0 0 10px rgba(56, 189, 248, 0.3)', '0 0 30px rgba(56, 189, 248, 0.6)', '0 0 10px rgba(56, 189, 248, 0.3)'],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💎
          </motion.div>
        </motion.div>
        
        {/* Lock mechanism */}
        <motion.div
          className="absolute top-1/2 right-2 w-6 h-6 rounded-full bg-sunset"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </motion.div>
      
      {/* Glow ring */}
      <motion.div
        className={`absolute inset-0 rounded-full ${
          isDay ? 'border-2 border-leaf/20' : 'border-2 border-sky/20'
        }`}
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </div>
  );
}

// Recycling bot
function BotVisual() {
  const { isDay } = useTheme();
  
  return (
    <div className="relative w-48 h-48 md:w-64 md:h-64 flex items-center justify-center">
      {/* Bot body */}
      <motion.div
        className={`
          relative w-28 h-32 md:w-36 md:h-40 rounded-2xl
          ${isDay 
            ? 'bg-gradient-to-br from-leaf-light to-leaf' 
            : 'bg-gradient-to-br from-sky to-sky-dark'
          }
        `}
        style={{ boxShadow: '0 15px 40px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.4)' }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        whileHover={{ rotate: 10 }}
      >
        {/* Eyes */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-4">
          <motion.div
            className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-void" />
          </motion.div>
          <motion.div
            className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-white flex items-center justify-center"
            animate={{ scaleY: [1, 0.1, 1] }}
            transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
          >
            <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-void" />
          </motion.div>
        </div>
        
        {/* Mouth/Input */}
        <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 w-12 h-6 rounded-lg ${
          isDay ? 'bg-leaf-dark' : 'bg-sky-dark'
        }`} />
        
        {/* Arms */}
        <motion.div
          className={`absolute -left-4 top-1/2 w-4 h-8 rounded-full ${
            isDay ? 'bg-leaf-dark' : 'bg-sky-dark'
          }`}
          animate={{ rotate: [-10, 10, -10] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <motion.div
          className={`absolute -right-4 top-1/2 w-4 h-8 rounded-full ${
            isDay ? 'bg-leaf-dark' : 'bg-sky-dark'
          }`}
          animate={{ rotate: [10, -10, 10] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </motion.div>
      
      {/* Phone being eaten */}
      <motion.div
        className="absolute top-0 text-3xl"
        animate={{
          y: [0, 30, 60],
          opacity: [1, 1, 0],
          scale: [1, 0.8, 0.5],
        }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
      >
        📱
      </motion.div>
      
      {/* Coin output */}
      <motion.div
        className="absolute -bottom-4 text-3xl"
        animate={{
          y: [20, -20, -40],
          opacity: [0, 1, 0],
          scale: [0.5, 1, 0.8],
        }}
        transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 1 }}
      >
        🪙
      </motion.div>
    </div>
  );
}

// Step card component
function StepCard({ step, index }: { step: Step; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const { isDay } = useTheme();
  
  const Visual = index === 0 ? FactoryVisual : index === 1 ? VaultVisual : BotVisual;
  const isLeft = step.side === 'left';
  
  return (
    <motion.div
      ref={ref}
      className={`flex flex-col ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-8 md:gap-16 py-20`}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration: 0.6 }}
    >
      {/* Text content */}
      <motion.div
        className={`flex-1 ${isLeft ? 'md:text-right' : 'md:text-left'} text-center`}
        initial={{ 
          opacity: 0, 
          x: isLeft ? -100 : 100,
          skewX: isLeft ? 10 : -10,
        }}
        animate={isInView ? { 
          opacity: 1, 
          x: 0,
          skewX: 0,
        } : {}}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className={`text-6xl md:text-8xl font-heading font-bold ${
          isDay ? 'text-leaf/20' : 'text-sky/20'
        }`}>
          {step.number}
        </span>
        
        <h3 className={`text-3xl md:text-4xl font-heading font-bold mt-2 ${
          isDay ? 'text-void' : 'text-white'
        }`}>
          {step.title}
        </h3>
        
        <p className={`text-lg font-medium mt-2 ${
          isDay ? 'text-leaf' : 'text-sky'
        }`}>
          {step.subtitle}
        </p>
        
        <p className={`text-lg mt-4 max-w-md ${isLeft ? 'md:ml-auto' : ''} ${
          isDay ? 'text-void/70' : 'text-white/70'
        }`}>
          {step.description}
        </p>
      </motion.div>
      
      {/* Visual */}
      <motion.div
        className="flex-1 flex justify-center"
        initial={{ 
          opacity: 0, 
          x: isLeft ? 100 : -100,
          scale: 0.8,
        }}
        animate={isInView ? { 
          opacity: 1, 
          x: 0,
          scale: 1,
        } : {}}
        transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 100 }}
      >
        <Visual />
      </motion.div>
    </motion.div>
  );
}

export default function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDay } = useTheme();
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['-5%', '5%']);
  
  return (
    <section
      ref={containerRef}
      className={`relative py-32 overflow-hidden ${
        isDay ? 'bg-day-surface' : 'bg-night-surface'
      }`}
    >
      {/* Background parallax */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: backgroundY }}
      >
        <div className={`absolute top-0 left-0 w-96 h-96 rounded-full blur-3xl ${
          isDay ? 'bg-leaf/5' : 'bg-sky/5'
        }`} />
        <div className={`absolute bottom-0 right-0 w-96 h-96 rounded-full blur-3xl ${
          isDay ? 'bg-sky/5' : 'bg-leaf/5'
        }`} />
      </motion.div>
      
      {/* Section header */}
      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <motion.span
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-4 ${
              isDay 
                ? 'bg-leaf/10 text-leaf' 
                : 'bg-sky/10 text-sky'
            }`}
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            How It Works
          </motion.span>
          
          <h2 className={`text-display-lg font-heading font-bold ${
            isDay ? 'text-void' : 'text-white'
          }`}>
            The Circular Journey
          </h2>
        </motion.div>
        
        {/* Steps */}
        {steps.map((step, index) => (
          <StepCard key={step.number} step={step} index={index} />
        ))}
      </div>
    </section>
  );
}
