'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme, ThemeToggle } from '@/components/theme/theme-provider';
import { MagneticButton } from '@/components/ui/clay-components';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDay } = useTheme();
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const navItems = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'About', href: '#about' },
  ];
  
  return (
    <>
      <motion.nav
        className={`
          fixed top-0 left-0 right-0 z-50 px-6 py-4
          transition-all duration-300
          ${isScrolled 
            ? `backdrop-blur-xl ${isDay ? 'bg-day-bg/80' : 'bg-void/80'} shadow-lg` 
            : ''
          }
        `}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo */}
          <motion.a
            href="/"
            className={`text-2xl font-heading font-bold ${
              isDay ? 'text-leaf' : 'text-sky'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            🌱 CYCLR
          </motion.a>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <motion.a
                key={item.label}
                href={item.href}
                className={`font-body font-medium transition-colors ${
                  isDay 
                    ? 'text-void/70 hover:text-leaf' 
                    : 'text-white/70 hover:text-sky'
                }`}
                whileHover={{ y: -2 }}
              >
                {item.label}
              </motion.a>
            ))}
            
            <ThemeToggle />
            
            <MagneticButton size="sm">
              Connect Wallet
            </MagneticButton>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-4">
            <ThemeToggle />
            
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`w-10 h-10 flex flex-col items-center justify-center gap-1.5 ${
                isDay ? 'text-void' : 'text-white'
              }`}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                className={`w-6 h-0.5 ${isDay ? 'bg-void' : 'bg-white'}`}
                animate={{ rotate: isMobileMenuOpen ? 45 : 0, y: isMobileMenuOpen ? 8 : 0 }}
              />
              <motion.div
                className={`w-6 h-0.5 ${isDay ? 'bg-void' : 'bg-white'}`}
                animate={{ opacity: isMobileMenuOpen ? 0 : 1 }}
              />
              <motion.div
                className={`w-6 h-0.5 ${isDay ? 'bg-void' : 'bg-white'}`}
                animate={{ rotate: isMobileMenuOpen ? -45 : 0, y: isMobileMenuOpen ? -8 : 0 }}
              />
            </motion.button>
          </div>
        </div>
      </motion.nav>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className={`
              fixed inset-0 z-40 pt-20 px-6
              ${isDay ? 'bg-day-bg' : 'bg-void'}
            `}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex flex-col gap-6 pt-8">
              {navItems.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className={`text-2xl font-heading font-bold ${
                    isDay ? 'text-void' : 'text-white'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </motion.a>
              ))}
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <MagneticButton size="lg" className="w-full">
                  Connect Wallet 💎
                </MagneticButton>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
