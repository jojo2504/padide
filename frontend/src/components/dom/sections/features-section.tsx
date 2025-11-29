'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';

const features = [
  {
    title: 'Digital Product Passports',
    description: 'Every product gets a unique blockchain identity, tracking its journey from creation to recycling.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
        <rect x="4" y="8" width="40" height="32" rx="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="16" cy="20" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M8 32h32M16 26v6" stroke="currentColor" strokeWidth="2" />
        <rect x="26" y="16" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    gradient: 'from-chlorophyll/20 to-chlorophyll/5',
    accent: 'chlorophyll',
  },
  {
    title: 'Lifecycle Rewards',
    description: 'Earn tokens for sustainable actions: recycling, returning, and extending product life.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2" />
        <path d="M24 12v12l8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M32 8l4 4M16 8l-4 4M24 40v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    gradient: 'from-cyber/20 to-cyber/5',
    accent: 'cyber',
  },
  {
    title: 'Impact Dashboard',
    description: 'Visualize your environmental impact with real-time metrics and personalized insights.',
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-12 h-12">
        <rect x="4" y="4" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M12 32l8-12 8 8 8-16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="32" r="2" fill="currentColor" />
        <circle cx="20" cy="20" r="2" fill="currentColor" />
        <circle cx="28" cy="28" r="2" fill="currentColor" />
        <circle cx="36" cy="12" r="2" fill="currentColor" />
      </svg>
    ),
    gradient: 'from-holographic/20 to-holographic/5',
    accent: 'holographic',
  },
];

const cardVariants = {
  hidden: { 
    opacity: 0, 
    y: 60,
    rotateX: -15,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: {
      duration: 0.8,
      delay: i * 0.2,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

export default function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  
  const backgroundY = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  
  return (
    <section 
      ref={containerRef}
      className="relative py-32 md:py-48 overflow-hidden"
    >
      {/* Background elements */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: backgroundY }}
      >
        <div 
          className="absolute top-1/4 left-0 w-[500px] h-[500px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(0, 255, 148, 0.1) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div 
          className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
            filter: 'blur(60px)',
          }}
        />
      </motion.div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            className="inline-block text-chlorophyll text-sm font-medium tracking-widest uppercase mb-4"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.2 }}
          >
            Platform Features
          </motion.span>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-holographic mb-6">
            <motion.span
              className="inline-block"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              The Complete
            </motion.span>
            <br />
            <motion.span
              className="inline-block text-gradient-chlorophyll"
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              Circular Ecosystem
            </motion.span>
          </h2>
          
          <motion.p
            className="text-holographic-muted text-lg max-w-2xl mx-auto"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            From production to recycling, CYCLR creates a transparent,
            rewarding journey for every product.
          </motion.p>
        </motion.div>
        
        {/* Feature cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              className="group relative"
              variants={cardVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
              custom={i}
              style={{ perspective: '1000px' }}
            >
              {/* Card */}
              <div 
                className={`
                  relative h-full p-8 rounded-3xl
                  bg-gradient-to-br ${feature.gradient}
                  border border-glass-border
                  backdrop-blur-sm
                  transition-all duration-500
                  group-hover:border-${feature.accent}/30
                  group-hover:shadow-lg group-hover:shadow-${feature.accent}/10
                `}
                data-cursor="view"
                data-cursor-text="VIEW"
              >
                {/* Glow effect on hover */}
                <motion.div
                  className="absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: `linear-gradient(135deg, var(--${feature.accent}) 0%, transparent 50%)`,
                    filter: 'blur(20px)',
                  }}
                />
                
                {/* Icon */}
                <motion.div
                  className={`relative text-${feature.accent} mb-6`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  {feature.icon}
                </motion.div>
                
                {/* Content */}
                <h3 className="relative text-xl font-semibold text-holographic mb-3">
                  {feature.title}
                </h3>
                
                <p className="relative text-holographic-muted leading-relaxed">
                  {feature.description}
                </p>
                
                {/* Learn more link */}
                <motion.div
                  className={`relative mt-6 flex items-center gap-2 text-${feature.accent} text-sm font-medium`}
                  initial={{ x: 0 }}
                  whileHover={{ x: 5 }}
                >
                  Learn more
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 16 16" 
                    fill="none" 
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
