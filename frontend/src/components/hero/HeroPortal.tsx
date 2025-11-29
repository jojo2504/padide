'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';

// Exported Hero Portal Component - simplified to static gradient (no 3D)
export function HeroPortal() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-[60vh] md:h-[80vh] bg-gradient-to-b from-day-bg to-day-surface dark:from-night-bg dark:to-night-surface" />
    );
  }

  return (
    <div className="relative w-full h-[60vh] md:h-[80vh] overflow-hidden">
      {/* Background gradient - simple CSS, no 3D animations */}
      <div 
        className={`absolute inset-0 transition-colors duration-500 ${
          isDark 
            ? 'bg-gradient-radial from-night-surface via-night-bg to-night-void' 
            : 'bg-gradient-radial from-day-surface via-day-bg to-white'
        }`}
      />

      {/* Subtle center glow */}
      <div 
        className={`absolute inset-0 flex items-center justify-center pointer-events-none`}
      >
        <div 
          className={`w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full blur-3xl opacity-30 ${
            isDark 
              ? 'bg-gradient-to-br from-night-neon-cyan to-night-neon-purple' 
              : 'bg-gradient-to-br from-cyclr-primary to-cyclr-secondary'
          }`}
        />
      </div>

      {/* Overlay gradient for text readability */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-day-bg/80 dark:from-night-bg/80 via-transparent to-transparent" />
    </div>
  );
}
