'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Theme = 'day' | 'night';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDay: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('day');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Check for saved preference or system preference
    const saved = localStorage.getItem('cyclr-theme') as Theme | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (prefersDark ? 'night' : 'day'));
  }, []);

  useEffect(() => {
    // Apply theme class to document
    document.documentElement.classList.remove('day', 'night');
    document.documentElement.classList.add(theme);
    localStorage.setItem('cyclr-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setTheme((prev) => (prev === 'day' ? 'night' : 'day'));
      setTimeout(() => setIsTransitioning(false), 600);
    }, 100);
  };

  const isDay = theme === 'day';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDay }}>
      {/* Shockwave effect on theme change */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className={`absolute w-20 h-20 rounded-full ${
                isDay ? 'bg-night-bg' : 'bg-day-bg'
              }`}
              style={{
                left: '50%',
                top: '50%',
                translateX: '-50%',
                translateY: '-50%',
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 50, opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </motion.div>
        )}
      </AnimatePresence>
      {children}
    </ThemeContext.Provider>
  );
}

// Theme Toggle Switch Component
export function ThemeToggle() {
  const { toggleTheme, isDay } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className={`
        relative w-20 h-10 rounded-full p-1
        shadow-clay transition-colors duration-300
        ${isDay 
          ? 'bg-gradient-to-r from-sky-light to-sky' 
          : 'bg-gradient-to-r from-void to-night-surface'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${isDay ? 'night' : 'day'} mode`}
    >
      {/* Track decoration */}
      <div className="absolute inset-1 rounded-full overflow-hidden">
        {/* Stars (night mode) */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: isDay ? 0 : 1 }}
          transition={{ duration: 0.3 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${20 + Math.random() * 40}%`,
                top: `${20 + Math.random() * 60}%`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </motion.div>
        
        {/* Clouds (day mode) */}
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: isDay ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="absolute w-4 h-2 bg-white/60 rounded-full"
            style={{ left: '60%', top: '20%' }}
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.div>
      </div>

      {/* Sun/Moon toggle */}
      <motion.div
        className={`
          relative w-8 h-8 rounded-full flex items-center justify-center
          shadow-lg transition-colors duration-300
          ${isDay 
            ? 'bg-gradient-to-br from-sunset-light to-sunset' 
            : 'bg-gradient-to-br from-gray-200 to-gray-400'
          }
        `}
        animate={{ x: isDay ? 0 : 40 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      >
        {/* Sun rays / Moon craters */}
        {isDay ? (
          <motion.div
            className="absolute inset-0"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-2 bg-sunset-light rounded-full"
                style={{
                  left: '50%',
                  top: '-4px',
                  transform: `translateX(-50%) rotate(${i * 45}deg)`,
                  transformOrigin: '50% 20px',
                }}
              />
            ))}
          </motion.div>
        ) : (
          <>
            <div className="absolute w-2 h-2 bg-gray-300 rounded-full" style={{ left: '20%', top: '30%' }} />
            <div className="absolute w-1.5 h-1.5 bg-gray-300 rounded-full" style={{ left: '50%', top: '50%' }} />
            <div className="absolute w-1 h-1 bg-gray-300 rounded-full" style={{ left: '35%', top: '65%' }} />
          </>
        )}
      </motion.div>
    </motion.button>
  );
}
