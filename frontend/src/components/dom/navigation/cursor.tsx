'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useSpring, useMotionValue, useTransform } from 'framer-motion';
import { useUIStore, useCanvasStore } from '@/lib/store';

/**
 * ============================================
 * CUSTOM CURSOR IMPLEMENTATION GUIDE
 * ============================================
 * 
 * HOW TO IMPLEMENT A CUSTOM CURSOR:
 * 
 * 1. CURSOR ELEMENTS
 *    - Main cursor: outer ring or shape that follows mouse with lag
 *    - Inner dot: precise pointer that sticks closely to mouse
 *    - Trail effect: particles or blur that follow behind
 *    - Text label: appears on specific elements (e.g., "View", "Drag")
 * 
 * 2. TRACKING MOUSE POSITION
 *    - Listen to 'mousemove' event on document
 *    - Get clientX, clientY from the event
 *    - Store in motion values for smooth animation
 *    Example:
 *    ```
 *    document.addEventListener('mousemove', (e) => {
 *      mouseX.set(e.clientX);
 *      mouseY.set(e.clientY);
 *    });
 *    ```
 * 
 * 3. SMOOTH ANIMATION (Framer Motion Springs)
 *    - useSpring() creates smooth transitions
 *    - Config options:
 *      - stiffness: Higher = snappier (100-500)
 *      - damping: Higher = less bounce (10-50)
 *      - mass: Higher = more "weight" (0.1-1)
 *    Example:
 *    ```
 *    const cursorX = useSpring(mouseX, { damping: 20, stiffness: 300 });
 *    ```
 * 
 * 4. HOVER STATES
 *    - Use data-cursor="type" attribute on elements
 *    - Use data-cursor-text="Label" for text inside cursor
 *    - Detect via event delegation on 'mouseover'
 *    Example:
 *    ```
 *    <button data-cursor="button" data-cursor-text="Click">
 *    ```
 * 
 * 5. MAGNETIC EFFECT
 *    - Calculate distance from cursor to element center
 *    - Move element slightly toward cursor
 *    - Use transform for smooth animation
 *    Example:
 *    ```
 *    const deltaX = (mouseX - centerX) * 0.3;
 *    element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
 *    ```
 * 
 * 6. CSS REQUIREMENTS
 *    - position: fixed (stays in viewport)
 *    - pointer-events: none (doesn't block clicks)
 *    - z-index: 9999 (above everything)
 *    - mix-blend-mode: difference (optional, for contrast)
 *    - Hide default: cursor: none !important
 * 
 * 7. PERFORMANCE TIPS
 *    - Use transform, not top/left
 *    - Disable on touch devices
 *    - Use will-change: transform sparingly
 */

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(true);
  const [cursorText, setCursorText] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [hoverType, setHoverType] = useState<'default' | 'link' | 'button' | 'view' | 'drag'>('default');
  
  const setMousePosition = useCanvasStore((state) => state.setMousePosition);
  
  // Raw position values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smoothed cursor position (outer ring - more lag)
  const cursorX = useSpring(mouseX, { damping: 20, stiffness: 300, mass: 0.5 });
  const cursorY = useSpring(mouseY, { damping: 20, stiffness: 300, mass: 0.5 });
  
  // Faster inner dot
  const dotX = useSpring(mouseX, { damping: 30, stiffness: 500, mass: 0.2 });
  const dotY = useSpring(mouseY, { damping: 30, stiffness: 500, mass: 0.2 });
  
  // Rotation based on movement direction
  const cursorRotate = useTransform(
    [cursorX, cursorY],
    ([latestX, latestY]: number[]) => {
      const dx = mouseX.get() - latestX;
      const dy = mouseY.get() - latestY;
      return Math.atan2(dy, dx) * (180 / Math.PI);
    }
  );
  
  // Velocity-based stretch
  const cursorScaleX = useTransform(
    [cursorX, cursorY],
    ([latestX, latestY]: number[]) => {
      const dx = mouseX.get() - latestX;
      const dy = mouseY.get() - latestY;
      const velocity = Math.sqrt(dx * dx + dy * dy);
      return 1 + Math.min(velocity * 0.01, 0.3);
    }
  );
  
  // Check for touch device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.matchMedia('(pointer: coarse)').matches ||
        'ontouchstart' in window
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Handle mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    setIsVisible(true);
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
    
    // Update store for parallax effects
    const normalizedX = (e.clientX / window.innerWidth) * 2 - 1;
    const normalizedY = (e.clientY / window.innerHeight) * 2 - 1;
    setMousePosition(normalizedX, normalizedY);
  }, [mouseX, mouseY, setMousePosition]);
  
  // Handle hover detection
  const handleMouseOver = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Check for data-cursor attribute
    const cursorAttr = target.closest('[data-cursor]')?.getAttribute('data-cursor');
    const cursorTextAttr = target.closest('[data-cursor-text]')?.getAttribute('data-cursor-text');
    
    if (cursorAttr) {
      setIsHovering(true);
      setHoverType(cursorAttr as typeof hoverType);
      if (cursorTextAttr) setCursorText(cursorTextAttr);
    } else if (
      target.closest('a') ||
      target.closest('button') ||
      target.closest('[role="button"]')
    ) {
      setIsHovering(true);
      setHoverType('link');
    } else {
      setIsHovering(false);
      setHoverType('default');
      setCursorText('');
    }
  }, []);
  
  // Attach event listeners
  useEffect(() => {
    if (isMobile) return;
    
    const handleEnter = () => setIsVisible(true);
    const handleLeave = () => setIsVisible(false);
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseenter', handleEnter);
    document.addEventListener('mouseleave', handleLeave);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseenter', handleEnter);
      document.removeEventListener('mouseleave', handleLeave);
    };
  }, [isMobile, handleMouseMove, handleMouseOver]);
  
  // Don't render on mobile
  if (isMobile) return null;
  
  // Dynamic cursor size
  const getCursorSize = () => {
    switch (hoverType) {
      case 'button': return 80;
      case 'link': return 60;
      case 'view': return 100;
      case 'drag': return 70;
      default: return isHovering ? 50 : 32;
    }
  };
  
  const cursorSize = getCursorSize();
  
  // Trail spring configs (increasingly laggy)
  const trailConfigs = [
    { damping: 28, stiffness: 180, mass: 0.15 },
    { damping: 26, stiffness: 150, mass: 0.2 },
    { damping: 24, stiffness: 120, mass: 0.25 },
    { damping: 22, stiffness: 100, mass: 0.3 },
    { damping: 20, stiffness: 80, mass: 0.35 },
  ];
  
  return (
    <>
      {/* Outer cursor ring */}
      <motion.div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: cursorSize,
          height: cursorSize,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
      >
        {/* Main ring with gradient border */}
        <motion.div
          className="w-full h-full rounded-full relative"
          style={{
            scaleX: cursorScaleX,
            rotate: cursorRotate,
          }}
        >
          {/* Gradient border effect */}
          <div 
            className={`
              absolute inset-0 rounded-full transition-all duration-300
              ${isHovering 
                ? 'p-[2px]' 
                : 'border border-holographic/40'
              }
            `}
            style={{
              background: isHovering 
                ? 'linear-gradient(135deg, #00FF94, #2563EB, #00FF94)'
                : 'transparent',
            }}
          >
            <div className={`
              w-full h-full rounded-full 
              ${isHovering ? 'bg-void' : 'bg-transparent'}
            `} />
          </div>
          
          {/* Glow effect on hover */}
          {isHovering && (
            <motion.div
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              style={{
                boxShadow: '0 0 30px rgba(0, 255, 148, 0.4), 0 0 60px rgba(0, 255, 148, 0.2)',
              }}
            />
          )}
        </motion.div>
        
        {/* Cursor text */}
        {cursorText && (
          <motion.span
            className="absolute inset-0 flex items-center justify-center text-xs font-medium text-holographic uppercase tracking-wider"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
          >
            {cursorText}
          </motion.span>
        )}
      </motion.div>
      
      {/* Inner dot */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999]"
        style={{
          x: dotX,
          y: dotY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 0 : 6,
          height: isHovering ? 0 : 6,
          opacity: isVisible && !isHovering ? 1 : 0,
        }}
        transition={{ duration: 0.15 }}
      >
        <div className="w-full h-full rounded-full bg-chlorophyll" />
      </motion.div>
      
      {/* Trailing dots effect */}
      {trailConfigs.map((config, i) => (
        <TrailDot 
          key={i}
          mouseX={mouseX}
          mouseY={mouseY}
          config={config}
          index={i}
          isVisible={isVisible}
          isHovering={isHovering}
        />
      ))}
      
      {/* Hide default cursor */}
      <style jsx global>{`
        *, *::before, *::after {
          cursor: none !important;
        }
      `}</style>
    </>
  );
}

// Separate component for trail dots to avoid hooks in loops
function TrailDot({ 
  mouseX, 
  mouseY, 
  config, 
  index, 
  isVisible, 
  isHovering 
}: { 
  mouseX: ReturnType<typeof useMotionValue<number>>;
  mouseY: ReturnType<typeof useMotionValue<number>>;
  config: { damping: number; stiffness: number; mass: number };
  index: number;
  isVisible: boolean;
  isHovering: boolean;
}) {
  const x = useSpring(mouseX, config);
  const y = useSpring(mouseY, config);
  
  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9998]"
      style={{
        x,
        y,
        translateX: '-50%',
        translateY: '-50%',
      }}
      animate={{
        width: 4 - index * 0.5,
        height: 4 - index * 0.5,
        opacity: isVisible && !isHovering ? 0.3 - index * 0.05 : 0,
      }}
    >
      <div className="w-full h-full rounded-full bg-chlorophyll/50" />
    </motion.div>
  );
}

/**
 * ============================================
 * MAGNETIC BUTTON HOOK
 * ============================================
 * 
 * Use this hook to add magnetic effect to any element.
 * The element will subtly move toward the cursor when hovered.
 * 
 * USAGE:
 * ```tsx
 * function MyButton() {
 *   const buttonRef = useRef<HTMLButtonElement>(null);
 *   useMagneticCursor(buttonRef, 0.3); // 0.3 = strength
 * 
 *   return (
 *     <button ref={buttonRef} data-cursor="button">
 *       Click me
 *     </button>
 *   );
 * }
 * ```
 * 
 * PARAMETERS:
 * - ref: React ref to the element
 * - strength: How much the element moves (0.1 = subtle, 0.5 = dramatic)
 */
export function useMagneticCursor(
  ref: React.RefObject<HTMLElement>,
  strength: number = 0.3
) {
  const setCursorHovering = useUIStore((state) => state.setCursorHovering);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;
      
      element.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
    };
    
    const handleMouseLeave = () => {
      setCursorHovering(false);
      element.style.transform = 'translate(0, 0)';
      element.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    };
    
    const handleMouseEnter = () => {
      setCursorHovering(true);
      element.style.transition = 'none';
    };
    
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mouseenter', handleMouseEnter);
    
    return () => {
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [ref, strength, setCursorHovering]);
}
