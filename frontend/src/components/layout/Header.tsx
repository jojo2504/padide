'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

// Wallet addresses for role detection
const WALLET_ROLES = {
  factory: 'rfHrTMepc23WLFgnFtxpd1LPa52sT7qKoK',
  client: 'rMwm4mhdGKXUiJA4MRdWzgx81g7LBKg8iX',
  recycler: 'rnYrUUuqgU5PddJVBu8Hitsw9ejPheKhLd',
};

export function Header() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Determine the recycle page based on connected wallet
  const getRecyclePath = () => {
    if (!connectedWallet) return '/recycle';
    if (connectedWallet === WALLET_ROLES.factory) return '/recycle/factory';
    if (connectedWallet === WALLET_ROLES.client) return '/recycle/client';
    if (connectedWallet === WALLET_ROLES.recycler) return '/recycle/recycler';
    return '/recycle';
  };

  // Simulate wallet connection (for demo purposes)
  const handleConnectWallet = () => {
    // For demo, cycle through wallets or connect
    const wallets = [null, WALLET_ROLES.factory, WALLET_ROLES.client, WALLET_ROLES.recycler];
    const currentIndex = wallets.indexOf(connectedWallet);
    const nextIndex = (currentIndex + 1) % wallets.length;
    setConnectedWallet(wallets[nextIndex]);
  };

  if (!mounted) return null;

  return (
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
            {/* Recycle Product Button */}
            <Link
              href={getRecyclePath()}
              className={clsx(
                'hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs tracking-wider uppercase transition-all border',
                isDark
                  ? 'border-night-neon-green/50 text-night-neon-green hover:bg-night-neon-green/10'
                  : 'border-day-accent/50 text-day-accent hover:bg-day-accent/10'
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recycle Product
            </Link>

            {/* Connect Wallet / Launch App */}
            <button 
              onClick={handleConnectWallet}
              className={clsx(
                'hidden sm:block px-4 py-2 rounded-full font-mono text-xs tracking-wider uppercase transition-all',
                isDark
                  ? 'bg-night-neon-green text-night-bg hover:shadow-neon-green'
                  : 'bg-day-accent text-white hover:shadow-lg'
              )}
            >
              {connectedWallet 
                ? `${connectedWallet.slice(0, 4)}...${connectedWallet.slice(-4)}`
                : 'Connect'
              }
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
  );
}
