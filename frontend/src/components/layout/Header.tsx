'use client';

import { RoleSelector } from '@/components/layout/RoleSelector';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { WalletLoginModal } from '@/components/wallet/WalletLoginModal';
import { getRoleIcon, useWallet } from '@/lib/wallet-context';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function Header() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { address, role, isConnected, disconnect } = useWallet();
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWalletClick = () => {
    if (isConnected) {
      disconnect();
    } else {
      setShowWalletModal(true);
    }
  };

  if (!mounted) return null;

  return (
    <>
    <WalletLoginModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
      className={clsx(
        'fixed top-0 left-0 right-0 z-40 transition-all duration-500',
        scrolled 
          ? 'py-4' 
          : 'py-6',
      )}
    >
      <div className={clsx(
        'mx-4 md:mx-8 px-6 py-3 rounded-full transition-all duration-500',
        scrolled
          ? isDark
            ? 'bg-night-bg/80 backdrop-blur-xl border border-white/5'
            : 'bg-day-bg/80 backdrop-blur-xl border border-black/5 shadow-lg'
          : 'bg-transparent'
      )}>
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className={clsx(
              'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 overflow-hidden',
              isDark 
                ? 'bg-night-neon-green/10 group-hover:bg-night-neon-green/20' 
                : 'bg-day-accent/10 group-hover:bg-day-accent/20'
            )}>
              <Image 
                src={isDark ? '/logo_white.png' : '/logo_black.png'}
                alt="CYCLR Logo" 
                width={40} 
                height={40}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            </div>
            <span className="font-logo text-xl font-bold tracking-tight text-day-text dark:text-night-text">
              CYCLR
            </span>
          </Link>

          {/* Navigation - Centered */}
          <nav className="hidden md:flex items-center justify-center flex-1 gap-8">
            {['About', 'How it Works', 'Ecosystem', 'Docs'].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                className="group relative overflow-visible py-2"
              >
                <span className={clsx(
                  'font-mono text-xs tracking-wider uppercase transition-all duration-300 relative z-10',
                  'group-hover:tracking-widest',
                  isDark 
                    ? 'text-night-muted group-hover:text-night-text' 
                    : 'text-day-muted group-hover:text-day-text'
                )}>
                  {item}
                </span>
                {/* Triangle indicator */}
                <span className={clsx(
                  'absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 scale-0 group-hover:scale-100 transition-transform duration-300',
                  'border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px]',
                  isDark ? 'border-t-night-neon-green' : 'border-t-day-accent'
                )} />
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            {/* Role Selector Dropdown */}
            <RoleSelector />

            {/* Connect Wallet / Launch App */}
            <button 
              onClick={handleWalletClick}
              className={clsx(
                'hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs tracking-wider uppercase transition-all',
                isConnected
                  ? isDark
                    ? 'bg-night-neon-green/20 border border-night-neon-green/50 text-night-neon-green hover:bg-night-neon-green/30'
                    : 'bg-day-accent/10 border border-day-accent/50 text-day-accent hover:bg-day-accent/20'
                  : isDark
                    ? 'bg-night-neon-green text-night-bg hover:shadow-neon-green'
                    : 'bg-day-accent text-white hover:shadow-lg'
              )}
            >
              {isConnected ? (
                <>
                  <span>{getRoleIcon(role)}</span>
                  <span>{address?.slice(0, 4)}...{address?.slice(-4)}</span>
                </>
              ) : (
                'Connect'
              )}
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Mobile menu button */}
            <button className="md:hidden p-2">
              <div className="space-y-1.5">
                <div className={clsx(
                  'w-6 h-0.5 rounded-full transition-colors',
                  isDark ? 'bg-night-text' : 'bg-day-text'
                )} />
                <div className={clsx(
                  'w-4 h-0.5 rounded-full transition-colors',
                  isDark ? 'bg-night-text' : 'bg-day-text'
                )} />
              </div>
            </button>
          </div>
        </div>
      </div>
    </motion.header>
    </>
  );
}
