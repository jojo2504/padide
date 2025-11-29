'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useTheme } from '@/components/theme/theme-provider';
import { MagneticButton } from '@/components/ui/clay-components';

export default function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isDay } = useTheme();
  const isInView = useInView(containerRef, { once: true });
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  
  return (
    <section
      ref={containerRef}
      className={`relative py-32 overflow-hidden ${
        isDay ? 'bg-day-bg bg-paper-grain' : 'bg-void'
      }`}
    >
      {/* Animated background */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ y }}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl ${
          isDay ? 'bg-leaf/10' : 'bg-sky/10'
        }`} />
      </motion.div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <motion.span
            className={`inline-block px-4 py-2 rounded-full text-sm font-medium mb-6 ${
              isDay 
                ? 'bg-leaf/10 text-leaf' 
                : 'bg-sky/10 text-sky'
            }`}
            initial={{ scale: 0 }}
            animate={isInView ? { scale: 1 } : {}}
            transition={{ type: 'spring', stiffness: 300, delay: 0.2 }}
          >
            🌍 Join the Movement
          </motion.span>
          
          {/* Headline */}
          <h2 className={`text-display-lg font-heading font-bold mb-6 ${
            isDay ? 'text-void' : 'text-white'
          }`}>
            Ready to Start Your
            <br />
            <span className={isDay ? 'text-leaf' : 'text-sky'}>
              Circular Journey?
            </span>
          </h2>
          
          {/* Description */}
          <p className={`text-xl mb-12 max-w-2xl mx-auto ${
            isDay ? 'text-void/70' : 'text-white/70'
          }`}>
            Every product tracked. Every material recycled. Every action rewarded.
            Join thousands building a sustainable future, one scan at a time.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <MagneticButton size="lg">
              🚀 Launch App
            </MagneticButton>
            
            <MagneticButton size="lg" variant="secondary">
              📖 Read Docs
            </MagneticButton>
          </div>
          
          {/* Stats */}
          <motion.div
            className="grid grid-cols-3 gap-8 mt-16"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ delay: 0.4 }}
          >
            {[
              { value: '50K+', label: 'Products Tracked' },
              { value: '$2.4M', label: 'Recycled Value' },
              { value: '340+', label: 'Partner Brands' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                <div className={`text-3xl md:text-4xl font-heading font-bold ${
                  isDay ? 'text-leaf' : 'text-sky'
                }`}>
                  {stat.value}
                </div>
                <div className={`text-sm ${
                  isDay ? 'text-void/60' : 'text-white/60'
                }`}>
                  {stat.label}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
