'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useTheme } from 'next-themes';
import clsx from 'clsx';
import Link from 'next/link';

// Magnetic hover effect with Link support
function MagneticButton({ children, className, href }: { children: React.ReactNode; className?: string; href?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (clientX - left - width / 2) * 0.15;
    const y = (clientY - top - height / 2) * 0.15;
    setPosition({ x, y });
  };

  const reset = () => setPosition({ x: 0, y: 0 });

  if (href) {
    return (
      <motion.div
        ref={ref}
        onMouseMove={handleMouse}
        onMouseLeave={reset}
        animate={{ x: position.x, y: position.y }}
        transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      >
        <Link href={href} className={className}>
          {children}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.button
      ref={ref as any}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 150, damping: 15 }}
      className={className}
    >
      {children}
    </motion.button>
  );
}

// Animated text reveal
function AnimatedText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 50, rotateX: -90 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{
            duration: 0.8,
            delay: delay + i * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
          className="inline-block mr-[0.25em]"
          style={{ perspective: '1000px' }}
        >
          {word}
        </motion.span>
      ))}
    </span>
  );
}

// Subtle gradient mesh background
function GradientMesh({ isDark }: { isDark: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Base gradient */}
      <div 
        className={clsx(
          'absolute inset-0',
          isDark 
            ? 'bg-gradient-to-br from-night-bg via-night-surface/30 to-night-bg' 
            : 'bg-gradient-to-br from-day-bg via-green-50/50 to-day-bg'
        )}
      />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px), 
                           linear-gradient(90deg, ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />
      
      {/* Radial glow */}
      <div 
        className={clsx(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-[150px] opacity-20',
          isDark ? 'bg-night-neon-green' : 'bg-day-accent'
        )}
      />
    </div>
  );
}

// Interactive card with tilt effect
function InteractiveCard({ 
  title, 
  description, 
  icon, 
  index, 
  isDark 
}: { 
  title: string; 
  description: string; 
  icon: string;
  index: number;
  isDark: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  const handleMouse = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    setRotation({ x: y * -20, y: x * 20 });
  };

  const reset = () => setRotation({ x: 0, y: 0 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 100 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouse}
      onMouseLeave={reset}
      style={{
        perspective: '1000px',
      }}
      className="group"
    >
      <motion.div
        animate={{
          rotateX: rotation.x,
          rotateY: rotation.y,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={clsx(
          'relative p-8 rounded-3xl h-full transition-all duration-300',
          isDark
            ? 'bg-gradient-to-br from-night-surface/80 to-night-surface/40 border border-white/10 hover:border-night-neon-green/50'
            : 'bg-gradient-to-br from-white/80 to-white/40 border border-black/5 hover:border-day-accent/50 shadow-xl hover:shadow-2xl'
        )}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Shine effect */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: `linear-gradient(105deg, transparent 40%, ${isDark ? 'rgba(0, 255, 136, 0.1)' : 'rgba(34, 197, 94, 0.1)'} 45%, transparent 50%)`,
          }}
        />

        {/* Icon */}
        <div 
          className="text-5xl mb-6 transform-gpu"
          style={{ transform: 'translateZ(30px)' }}
        >
          {icon}
        </div>

        {/* Content */}
        <div style={{ transform: 'translateZ(20px)' }}>
          <h3 className={clsx(
            'text-xl font-logo font-bold mb-3',
            isDark ? 'text-night-text' : 'text-day-text'
          )}>
            {title}
          </h3>
          <p className={clsx(
            'text-sm leading-relaxed',
            isDark ? 'text-night-muted' : 'text-day-muted'
          )}>
            {description}
          </p>
        </div>

        {/* Glow */}
        <div className={clsx(
          'absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl',
          isDark ? 'bg-night-neon-green/20' : 'bg-day-accent/20'
        )} />
      </motion.div>
    </motion.div>
  );
}

// Marquee text
function MarqueeText({ text, isDark }: { text: string; isDark: boolean }) {
  return (
    <div className="overflow-hidden py-8">
      <motion.div
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="flex whitespace-nowrap"
      >
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            className={clsx(
              'text-[8vw] font-logo font-bold mx-8 opacity-10',
              isDark ? 'text-night-text' : 'text-day-text'
            )}
          >
            {text}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

// Main Creative Landing Component
export function CreativeLanding() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDark = resolvedTheme === 'dark';

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 0.15], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.9]);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-day-bg dark:bg-night-bg" />;
  }

  const features = [
    { icon: '🔄', title: 'Circular Economy', description: 'Products designed for infinite cycles. Waste becomes resource.' },
    { icon: '🌱', title: 'Impact Verified', description: 'Every action tracked on XRPL. Transparent and immutable.' },
    { icon: '⚡', title: 'Instant Rewards', description: 'Earn tokens for recycling. Redeem for discounts or trade.' },
    { icon: '🤝', title: 'Community Driven', description: 'Factories, consumers, and recyclers united for change.' },
  ];

  return (
    <div ref={containerRef} className={clsx('relative', isDark ? 'bg-night-bg' : 'bg-day-bg')}>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <GradientMesh isDark={isDark} />

        <motion.div
          style={{ opacity: heroOpacity, scale: heroScale }}
          className="relative z-10 text-center px-4 max-w-6xl mx-auto"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-8"
          >
            <span className={clsx(
              'inline-flex items-center gap-2 font-mono text-xs tracking-[0.3em] uppercase px-4 py-2 rounded-full',
              isDark
                ? 'bg-night-neon-green/10 text-night-neon-green border border-night-neon-green/30'
                : 'bg-day-accent/10 text-day-accent border border-day-accent/30'
            )}>
              <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
              Built on XRPL
            </span>
          </motion.div>

          {/* Main Title */}
          <h1 className="mb-8">
            <div className="text-5xl md:text-7xl lg:text-9xl font-logo font-bold leading-none">
              <AnimatedText 
                text="CYCLR" 
                className={isDark ? 'text-night-text' : 'text-day-text'}
                delay={0.5}
              />
            </div>
            <div className="text-2xl md:text-4xl lg:text-5xl font-logo mt-4">
              <AnimatedText
                text="The Future of Recycling"
                className={isDark ? 'text-gradient-night' : 'text-gradient-day'}
                delay={0.8}
              />
            </div>
          </h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className={clsx(
              'text-lg md:text-xl max-w-2xl mx-auto mb-12',
              isDark ? 'text-night-muted' : 'text-day-muted'
            )}
          >
            Connecting factories, consumers, and recyclers on a transparent blockchain.
            <br />
            <span className={isDark ? 'text-night-neon-green' : 'text-day-accent'}>Every product has a story. Make yours circular.</span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.8, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <MagneticButton
              href="/recycle"
              className={clsx(
                'px-8 py-4 rounded-full font-logo font-semibold text-lg transition-all duration-300',
                isDark
                  ? 'bg-night-neon-green text-night-bg hover:shadow-[0_0_40px_rgba(0,255,136,0.4)]'
                  : 'bg-day-accent text-white hover:shadow-[0_0_40px_rgba(34,197,94,0.4)]'
              )}
            >
              Start Recycling
            </MagneticButton>
          </motion.div>
        </motion.div>
      </section>

      {/* Marquee */}
      <MarqueeText text="RECYCLE • EARN • IMPACT • SUSTAIN •" isDark={isDark} />

      {/* Features Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className={clsx(
              'font-mono text-xs tracking-[0.3em] uppercase mb-4 inline-block',
              isDark ? 'text-night-neon-purple' : 'text-day-accent'
            )}>
              How It Works
            </span>
            <h2 className={clsx(
              'text-4xl md:text-5xl lg:text-6xl font-logo font-bold',
              isDark ? 'text-night-text' : 'text-day-text'
            )}>
              Simple.{' '}
              <span className={isDark ? 'text-gradient-night' : 'text-gradient-day'}>
                Powerful.
              </span>
            </h2>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <InteractiveCard
                key={feature.title}
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                index={index}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className={clsx(
              'text-4xl md:text-6xl font-logo font-bold mb-8',
              isDark ? 'text-night-text' : 'text-day-text'
            )}>
              Ready to make an{' '}
              <span className={isDark ? 'text-gradient-night' : 'text-gradient-day'}>
                impact
              </span>
              ?
            </h2>

            <p className={clsx(
              'text-lg mb-12 max-w-2xl mx-auto',
              isDark ? 'text-night-muted' : 'text-day-muted'
            )}>
              Join thousands of users who are already transforming how we think about product lifecycle.
            </p>

            <MagneticButton
              href="/recycle"
              className={clsx(
                'inline-block px-12 py-5 rounded-full font-logo font-bold text-xl transition-all duration-300',
                isDark
                  ? 'bg-gradient-to-r from-night-neon-green via-night-neon-cyan to-night-neon-purple text-night-bg hover:shadow-[0_0_60px_rgba(0,255,136,0.5)]'
                  : 'bg-gradient-to-r from-day-accent via-green-500 to-emerald-500 text-white hover:shadow-[0_0_60px_rgba(34,197,94,0.5)]'
              )}
            >
              Get Started Now →
            </MagneticButton>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className={clsx(
                'flex flex-wrap justify-center gap-8 mt-16 pt-16 border-t',
                isDark ? 'border-white/10' : 'border-black/10'
              )}
            >
              {[
                { label: 'Powered by', value: 'XRPL' },
                { label: 'Products Tracked', value: '50K+' },
                { label: 'CO₂ Saved', value: '100T' },
              ].map((item) => (
                <div key={item.label} className="text-center">
                  <div className={clsx(
                    'font-mono text-xs uppercase mb-1',
                    isDark ? 'text-night-muted' : 'text-day-muted'
                  )}>
                    {item.label}
                  </div>
                  <div className={clsx(
                    'text-2xl font-logo font-bold',
                    isDark ? 'text-night-neon-green' : 'text-day-accent'
                  )}>
                    {item.value}
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
