'use client';

import { useRef, forwardRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useTheme } from '@/components/theme/theme-provider';

interface MagneticButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
}

export const MagneticButton = forwardRef<HTMLButtonElement, MagneticButtonProps>(
  ({ children, className = '', variant = 'primary', size = 'md', onClick, disabled }, _ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const { isDay } = useTheme();
    
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    const springConfig = { stiffness: 400, damping: 25 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);
    
    const handleMouseMove = (e: React.MouseEvent) => {
      if (!buttonRef.current || disabled) return;
      
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      // Magnetic pull strength
      const deltaX = (e.clientX - centerX) * 0.3;
      const deltaY = (e.clientY - centerY) * 0.3;
      
      x.set(deltaX);
      y.set(deltaY);
    };
    
    const handleMouseLeave = () => {
      x.set(0);
      y.set(0);
    };
    
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };
    
    const variantClasses = {
      primary: isDay
        ? 'bg-gradient-to-br from-leaf to-leaf-dark text-white shadow-glow-leaf'
        : 'bg-gradient-to-br from-sky to-sky-dark text-void shadow-glow-sky',
      secondary: isDay
        ? 'bg-clay text-void border-2 border-clay-dark'
        : 'bg-night-surface text-white border-2 border-sky/30',
      ghost: isDay
        ? 'bg-transparent text-leaf hover:bg-leaf/10'
        : 'bg-transparent text-sky hover:bg-sky/10',
    };
    
    return (
      <motion.button
        ref={buttonRef}
        onClick={onClick}
        disabled={disabled}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`
          relative rounded-full font-heading font-semibold
          transition-shadow duration-300
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        style={{
          x: springX,
          y: springY,
          boxShadow: variant === 'primary' 
            ? '0 10px 30px rgba(0,0,0,0.2), inset 0 2px 0 rgba(255,255,255,0.3)'
            : undefined,
        }}
        whileHover={{ scale: 1.05, rotate: 2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Shimmer effect */}
        <motion.div
          className="absolute inset-0 rounded-full overflow-hidden"
          style={{ opacity: 0.5 }}
        >
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
            initial={{ x: '-100%' }}
            whileHover={{ x: '100%' }}
            transition={{ duration: 0.6 }}
          />
        </motion.div>
        
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);

MagneticButton.displayName = 'MagneticButton';

// Recycling Loading Spinner
export function RecycleLoader({ size = 48, className = '' }: { size?: number; className?: string }) {
  const { isDay } = useTheme();
  
  return (
    <motion.div
      className={`relative ${className}`}
      style={{ width: size, height: size }}
    >
      <motion.svg
        viewBox="0 0 48 48"
        fill="none"
        className="w-full h-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Arrow 1 */}
        <motion.path
          d="M24 8 L32 16 L28 16 L28 24 L20 24 L20 16 L16 16 Z"
          className={isDay ? 'fill-leaf' : 'fill-sky'}
          animate={{ 
            fill: isDay 
              ? ['#22C55E', '#38BDF8', '#FB923C', '#22C55E'] 
              : ['#38BDF8', '#22C55E', '#FB923C', '#38BDF8'],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        {/* Arrow 2 */}
        <motion.path
          d="M38 28 L38 36 L30 32 L34 28 L26 28 L26 36 L34 36 Z"
          style={{ transformOrigin: 'center' }}
          className={isDay ? 'fill-sky' : 'fill-leaf'}
          animate={{ 
            fill: isDay 
              ? ['#38BDF8', '#FB923C', '#22C55E', '#38BDF8'] 
              : ['#22C55E', '#FB923C', '#38BDF8', '#22C55E'],
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
        />
        {/* Arrow 3 */}
        <motion.path
          d="M10 28 L18 24 L18 28 L18 36 L10 40 L14 32 Z"
          className={isDay ? 'fill-sunset' : 'fill-sunset'}
          animate={{ 
            fill: ['#FB923C', '#22C55E', '#38BDF8', '#FB923C'],
          }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 1 }}
        />
      </motion.svg>
    </motion.div>
  );
}

// Clay Card component
export function ClayCard({ 
  children, 
  className = '',
  hover = true,
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  const { isDay } = useTheme();
  
  return (
    <motion.div
      className={`
        rounded-3xl p-6
        ${isDay 
          ? 'bg-gradient-to-br from-clay-light via-clay to-clay-dark' 
          : 'bg-gradient-to-br from-night-elevated via-night-surface to-void'
        }
        ${className}
      `}
      style={{
        boxShadow: isDay
          ? '0 10px 40px rgba(0,0,0,0.1), inset 0 2px 0 rgba(255,255,255,0.5), inset 0 -2px 0 rgba(0,0,0,0.05)'
          : '0 10px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
      whileHover={hover ? { 
        scale: 1.02, 
        y: -5,
        boxShadow: isDay
          ? '0 20px 50px rgba(0,0,0,0.15), inset 0 2px 0 rgba(255,255,255,0.5)'
          : '0 20px 50px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 40px rgba(56, 189, 248, 0.1)',
      } : {}}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {children}
    </motion.div>
  );
}

// Frosted Glass Card
export function FrostCard({ 
  children, 
  className = '',
}: { 
  children: React.ReactNode; 
  className?: string;
}) {
  const { isDay } = useTheme();
  
  return (
    <motion.div
      className={`
        rounded-3xl p-6 backdrop-blur-xl
        ${isDay 
          ? 'bg-white/70 border border-white/50' 
          : 'bg-void/70 border border-sky/20'
        }
        ${className}
      `}
      style={{
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
      }}
      whileHover={{ 
        scale: 1.01,
        borderColor: isDay ? 'rgba(34, 197, 94, 0.3)' : 'rgba(56, 189, 248, 0.4)',
      }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {children}
    </motion.div>
  );
}

// Pop-in animation wrapper
export function PopIn({ 
  children, 
  delay = 0,
  className = '',
}: { 
  children: React.ReactNode; 
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15,
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

// Stagger text animation
export function StaggerText({ 
  text, 
  className = '',
  delay = 0,
}: { 
  text: string; 
  className?: string;
  delay?: number;
}) {
  const words = text.split(' ');
  
  return (
    <motion.span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          className="inline-block mr-[0.25em]"
          initial={{ y: 40, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
            delay: delay + i * 0.1,
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
}
