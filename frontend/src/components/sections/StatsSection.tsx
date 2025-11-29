'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { useTheme } from 'next-themes';
import clsx from 'clsx';

// Animated counter
function AnimatedNumber({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [isInView, value]);

  return (
    <span ref={ref}>
      {prefix}{displayValue.toLocaleString()}{suffix}
    </span>
  );
}

// Stat card component
function StatCard({ 
  value, 
  label, 
  suffix = '',
  prefix = '',
  index,
  isDark 
}: { 
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  index: number;
  isDark: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={clsx(
        'relative p-8 rounded-3xl text-center overflow-hidden',
        isDark
          ? 'bg-night-surface/30 border border-white/5'
          : 'bg-day-surface/30 border border-black/5'
      )}
    >
      {/* Background glow */}
      <div className={clsx(
        'absolute inset-0 opacity-30',
        isDark
          ? 'bg-gradient-to-br from-night-neon-green/20 via-transparent to-night-neon-purple/20'
          : 'bg-gradient-to-br from-day-accent/20 via-transparent to-green-600/20'
      )} />

      {/* Content */}
      <div className="relative">
        <div className={clsx(
          'text-4xl md:text-5xl lg:text-6xl font-display mb-2',
          isDark ? 'text-night-neon-green' : 'text-day-accent'
        )}>
          <AnimatedNumber value={value} suffix={suffix} prefix={prefix} />
        </div>
        <p className="text-day-muted dark:text-night-muted font-mono text-sm tracking-wider uppercase">
          {label}
        </p>
      </div>
    </motion.div>
  );
}

export function StatsSection() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.2 });

  const stats = [
    { value: 2500000, label: 'Total Value Locked', prefix: '$', suffix: '' },
    { value: 15000, label: 'Active Users', suffix: '+' },
    { value: 50000, label: 'Trees Planted', suffix: '' },
    { value: 99.9, label: 'Uptime', suffix: '%' },
  ];

  return (
    <section 
      ref={sectionRef}
      className={clsx(
        'relative py-32 px-8',
        isDark ? 'bg-night-bg' : 'bg-day-bg'
      )}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Grid lines */}
        <div className={clsx(
          'absolute inset-0 opacity-5',
          isDark ? 'bg-grid-white' : 'bg-grid-black'
        )} 
        style={{
          backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px), linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
        />
        
        {/* Decorative orbs */}
        <div className={clsx(
          'absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-20',
          isDark ? 'bg-night-neon-green' : 'bg-day-accent'
        )} />
        <div className={clsx(
          'absolute bottom-0 left-0 w-96 h-96 rounded-full blur-3xl opacity-20',
          isDark ? 'bg-night-neon-purple' : 'bg-green-600'
        )} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <span className={clsx(
            'font-mono text-xs tracking-[0.3em] uppercase mb-4 inline-block',
            isDark ? 'text-night-neon-cyan' : 'text-day-accent'
          )}>
            Impact Metrics
          </span>
          <h2 className="text-4xl md:text-5xl font-display text-day-text dark:text-night-text">
            Numbers that{' '}
            <span className={isDark ? 'text-gradient-night' : 'text-gradient-day'}>
              Matter
            </span>
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              value={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              prefix={stat.prefix || ''}
              index={index}
              isDark={isDark}
            />
          ))}
        </div>

        {/* Live indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-center mt-12"
        >
          <div className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-full',
            isDark
              ? 'bg-night-surface/50 border border-night-neon-green/30'
              : 'bg-day-surface/50 border border-day-accent/30'
          )}>
            <div className={clsx(
              'w-2 h-2 rounded-full animate-pulse',
              isDark ? 'bg-night-neon-green' : 'bg-day-accent'
            )} />
            <span className="font-mono text-xs text-day-muted dark:text-night-muted">
              Live Data from XRPL
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
