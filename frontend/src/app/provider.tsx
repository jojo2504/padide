'use client';

import { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from '@/components/theme/theme-provider';
import { RecycleLoader } from '@/components/ui/clay-components';

interface ProvidersProps {
  children: ReactNode;
}

// Preloader component with recycling animation
function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + Math.random() * 15;
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 500);
          return 100;
        }
        return next;
      });
    }, 150);
    
    return () => clearInterval(interval);
  }, [onComplete]);
  
  return (
    <motion.div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-day-bg"
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Recycling loader */}
        <RecycleLoader size={64} />
        
        {/* Brand */}
        <motion.div
          className="text-3xl font-heading font-bold text-leaf"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          CYCLR
        </motion.div>
        
        {/* Progress bar */}
        <div className="w-48 h-1 bg-clay rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-leaf to-sky rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Loading text */}
        <p className="text-void/50 text-sm font-body">
          Loading the future...
        </p>
      </div>
    </motion.div>
  );
}

export default function Providers({ children }: ProvidersProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // Prevent hydration mismatch
  if (!isMounted) {
    return null;
  }
  
  return (
    <ThemeProvider>
      <AnimatePresence mode="wait">
        {isLoading && (
          <Preloader onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoading ? 0 : 1 }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    </ThemeProvider>
  );
}
