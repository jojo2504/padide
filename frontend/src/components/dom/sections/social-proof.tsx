'use client';

import { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    quote: "CYCLR has completely transformed how we think about product end-of-life. The transparency and rewards have increased our return rates by 300%.",
    author: "Sarah Chen",
    role: "Chief Sustainability Officer",
    company: "EcoTech Industries",
    avatar: "SC",
  },
  {
    quote: "Our customers love earning rewards for responsible disposal. It's turned waste management into an engaging experience.",
    author: "Marcus Williams",
    role: "Product Lead",
    company: "CircularGoods Co",
    avatar: "MW",
  },
  {
    quote: "The blockchain verification gives our customers confidence in our sustainability claims. Trust has never been higher.",
    author: "Elena Rodriguez",
    role: "CEO",
    company: "GreenPath Retail",
    avatar: "ER",
  },
];

const brands = [
  { name: 'EcoTech', logo: 'ET' },
  { name: 'CircularGoods', logo: 'CG' },
  { name: 'GreenPath', logo: 'GP' },
  { name: 'Sustainable Co', logo: 'SC' },
  { name: 'ReNew Inc', logo: 'RI' },
  { name: 'EarthFirst', logo: 'EF' },
];

export default function SocialProofSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: '-100px' });
  const [activeIndex, setActiveIndex] = useState(0);
  
  return (
    <section 
      ref={containerRef}
      className="relative py-32 md:py-48 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0">
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, rgba(0, 255, 148, 0.1) 0%, transparent 70%)',
            filter: 'blur(100px)',
          }}
        />
      </div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Section header */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <span className="text-chlorophyll text-sm font-medium tracking-widest uppercase mb-4 block">
            Trusted By Leaders
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-holographic">
            What They
            <span className="text-gradient-chlorophyll"> Say</span>
          </h2>
        </motion.div>
        
        {/* Testimonial carousel */}
        <div className="max-w-4xl mx-auto mb-20">
          <div className="relative min-h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeIndex}
                className="glass-panel rounded-3xl p-8 md:p-12"
                initial={{ opacity: 0, x: 50, rotateY: -10 }}
                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                exit={{ opacity: 0, x: -50, rotateY: 10 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Quote */}
                <motion.blockquote
                  className="text-xl md:text-2xl text-holographic leading-relaxed mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-chlorophyll text-4xl leading-none">&ldquo;</span>
                  {testimonials[activeIndex].quote}
                  <span className="text-chlorophyll text-4xl leading-none">&rdquo;</span>
                </motion.blockquote>
                
                {/* Author */}
                <motion.div
                  className="flex items-center gap-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Avatar */}
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-chlorophyll to-cyber flex items-center justify-center text-void font-bold text-lg">
                    {testimonials[activeIndex].avatar}
                  </div>
                  
                  <div>
                    <div className="text-holographic font-semibold">
                      {testimonials[activeIndex].author}
                    </div>
                    <div className="text-holographic-dim text-sm">
                      {testimonials[activeIndex].role}, {testimonials[activeIndex].company}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
          
          {/* Pagination dots */}
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`
                  w-3 h-3 rounded-full transition-all duration-300
                  ${i === activeIndex 
                    ? 'bg-chlorophyll w-8' 
                    : 'bg-holographic/30 hover:bg-holographic/50'
                  }
                `}
                data-cursor="button"
              />
            ))}
          </div>
        </div>
        
        {/* Brand logos */}
        <motion.div
          className="border-t border-glass-border pt-16"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <p className="text-center text-holographic-dim text-sm mb-8">
            Trusted by forward-thinking brands worldwide
          </p>
          
          {/* Logo marquee */}
          <div className="relative overflow-hidden">
            <motion.div
              className="flex gap-12 items-center justify-center"
              animate={{ x: [0, -50, 0] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              {[...brands, ...brands].map((brand, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-6 py-3 rounded-lg bg-glass-panel/30 border border-glass-border/50 shrink-0"
                >
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-holographic/20 to-holographic/5 flex items-center justify-center text-holographic font-mono text-xs">
                    {brand.logo}
                  </div>
                  <span className="text-holographic-muted font-medium">
                    {brand.name}
                  </span>
                </div>
              ))}
            </motion.div>
            
            {/* Fade edges */}
            <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-void to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-void to-transparent pointer-events-none" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
