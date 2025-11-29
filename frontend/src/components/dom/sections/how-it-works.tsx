'use client';

import { useRef, useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useInView, animate } from 'framer-motion';

const steps = [
  {
    number: '01',
    title: 'Create',
    subtitle: 'Product Birth',
    description: 'Products are minted with a unique digital identity on the blockchain, storing manufacturing data, materials, and sustainability metrics.',
    color: 'chlorophyll',
  },
  {
    number: '02',
    title: 'Track',
    subtitle: 'Ownership Journey',
    description: 'Every transaction, repair, and transfer is recorded, creating a transparent history that increases trust and value.',
    color: 'cyber',
  },
  {
    number: '03',
    title: 'Return',
    subtitle: 'End of Lifecycle',
    description: 'When a product reaches its end, return it through our network. We handle logistics and ensure proper recycling.',
    color: 'holographic',
  },
  {
    number: '04',
    title: 'Reward',
    subtitle: 'Circular Incentives',
    description: 'Earn CYCLR tokens for sustainable actions. Stake tokens to increase rewards and unlock exclusive benefits.',
    color: 'chlorophyll',
  },
];

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  
  useEffect(() => {
    if (!isInView) return;
    
    const controls = animate(0, value, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplayValue(Math.round(v)),
    });
    
    return controls.stop;
  }, [isInView, value]);
  
  return (
    <span ref={ref}>
      {displayValue.toLocaleString()}{suffix}
    </span>
  );
}

export default function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  
  const progressHeight = useTransform(scrollYProgress, [0.1, 0.9], ['0%', '100%']);
  
  return (
    <section 
      ref={containerRef}
      className="relative py-32 md:py-48 bg-gradient-to-b from-void via-void/95 to-void"
    >
      {/* Section header */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="text-chlorophyll text-sm font-medium tracking-widest uppercase mb-4 block">
            How It Works
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-holographic">
            The Circular
            <span className="text-gradient-chlorophyll"> Journey</span>
          </h2>
        </motion.div>
      </div>
      
      {/* Timeline */}
      <div className="relative max-w-6xl mx-auto px-6">
        {/* Vertical progress line */}
        <div className="absolute left-[28px] md:left-1/2 top-0 bottom-0 w-px bg-glass-border md:-translate-x-px">
          <motion.div
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-chlorophyll to-cyber"
            style={{ height: progressHeight }}
          />
        </div>
        
        {/* Steps */}
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className={`
              relative flex items-start gap-8 mb-24 last:mb-0
              ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}
            `}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
          >
            {/* Timeline dot */}
            <div className="absolute left-[28px] md:left-1/2 md:-translate-x-1/2 z-10">
              <motion.div
                className={`
                  w-4 h-4 rounded-full bg-${step.color}
                  ring-4 ring-void ring-offset-2 ring-offset-void
                `}
                whileInView={{ scale: [0, 1.2, 1] }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
            </div>
            
            {/* Content */}
            <div className={`
              flex-1 pl-16 md:pl-0 md:w-1/2
              ${i % 2 === 0 ? 'md:pr-16 md:text-right' : 'md:pl-16 md:text-left'}
            `}>
              {/* Step number */}
              <motion.span
                className={`text-${step.color}/30 text-6xl font-bold block mb-2`}
                whileInView={{ opacity: [0, 1] }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                {step.number}
              </motion.span>
              
              {/* Title */}
              <h3 className="text-2xl md:text-3xl font-bold text-holographic mb-2">
                {step.title}
              </h3>
              
              {/* Subtitle */}
              <span className={`text-${step.color} text-sm font-medium tracking-wide uppercase mb-4 block`}>
                {step.subtitle}
              </span>
              
              {/* Description */}
              <p className="text-holographic-muted leading-relaxed max-w-md mx-auto md:mx-0">
                {step.description}
              </p>
            </div>
            
            {/* Empty space for alternating layout */}
            <div className="hidden md:block flex-1 w-1/2" />
          </motion.div>
        ))}
      </div>
      
      {/* Stats section */}
      <div className="max-w-5xl mx-auto px-6 mt-32">
        <motion.div
          className="glass-panel rounded-3xl p-12 grid grid-cols-2 md:grid-cols-4 gap-8"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          {[
            { value: 50000, suffix: '+', label: 'Products Registered' },
            { value: 12, suffix: 'M', label: 'Tokens Distributed' },
            { value: 340, suffix: '+', label: 'Partner Brands' },
            { value: 98, suffix: '%', label: 'Recycling Rate' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-bold text-chlorophyll mb-2">
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-holographic-dim text-sm">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
