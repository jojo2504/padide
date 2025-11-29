'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

export default function CTASection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  
  return (
    <section 
      ref={containerRef}
      className="relative py-32 md:py-48"
    >
      {/* Background gradient */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 1 }}
        >
          <div 
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse, rgba(0, 255, 148, 0.15) 0%, transparent 70%)',
              filter: 'blur(100px)',
            }}
          />
        </motion.div>
      </div>
      
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          {/* Eyebrow */}
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full border border-chlorophyll/30 bg-chlorophyll/5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2 }}
          >
            <span className="w-2 h-2 rounded-full bg-chlorophyll animate-pulse" />
            <span className="text-chlorophyll text-sm font-medium">
              Ready to Join?
            </span>
          </motion.span>
          
          {/* Headline */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-holographic mb-6">
            Start Your
            <br />
            <span className="text-gradient-chlorophyll">Circular Journey</span>
          </h2>
          
          {/* Description */}
          <p className="text-holographic-muted text-lg md:text-xl max-w-2xl mx-auto mb-12">
            Every product returned. Every material reused. Every action rewarded.
            Be part of the circular economy revolution.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <motion.button
              className="group relative px-10 py-5 rounded-full overflow-hidden"
              data-cursor="button"
              data-cursor-text="GO"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Animated gradient */}
              <motion.div
                className="absolute inset-0"
                style={{
                  background: 'linear-gradient(90deg, #00FF94, #2563EB, #00FF94)',
                  backgroundSize: '200% 100%',
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  boxShadow: '0 0 40px rgba(0, 255, 148, 0.5)',
                }}
              />
              
              <span className="relative z-10 text-void font-semibold text-lg">
                Launch App
              </span>
            </motion.button>
            
            <motion.button
              className="group px-10 py-5 rounded-full border border-holographic/30 bg-holographic/5 backdrop-blur-sm hover:border-chlorophyll/50 hover:bg-chlorophyll/10 transition-all duration-300"
              data-cursor="link"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="text-holographic group-hover:text-chlorophyll transition-colors font-medium text-lg">
                Read Whitepaper
              </span>
            </motion.button>
          </div>
          
          {/* Email signup */}
          <motion.div
            className="max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.4 }}
          >
            <p className="text-holographic-dim text-sm mb-4">
              Or get notified when we launch new features
            </p>
            <form 
              className="flex gap-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-5 py-3 rounded-full bg-glass-panel border border-glass-border text-holographic placeholder:text-holographic-dim focus:outline-none focus:border-chlorophyll/50 transition-colors"
              />
              <motion.button
                type="submit"
                className="px-6 py-3 rounded-full bg-chlorophyll text-void font-medium"
                data-cursor="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Subscribe
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
