'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import clsx from 'clsx';

// Wallet addresses for role detection
const WALLET_ROLES = {
  factory: 'rfHrTMepc23WLFgnFtxpd1LPa52sT7qKoK',
  client: 'rMwm4mhdGKXUiJA4MRdWzgx81g7LBKg8iX',
  recycler: 'rnYrUUuqgU5PddJVBu8Hitsw9ejPheKhLd',
};

export default function RecyclePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const roles = [
    {
      title: 'Consumer',
      description: 'Recycle products you\'ve purchased and earn rewards for sustainable choices.',
      icon: '👤',
      href: '/recycle/client',
      wallet: WALLET_ROLES.client,
      color: isDark ? 'from-night-neon-cyan to-night-neon-green' : 'from-blue-400 to-green-400',
    },
    {
      title: 'Factory / Enterprise',
      description: 'Register products for recycling tracking and manage your sustainability metrics.',
      icon: '🏭',
      href: '/recycle/factory',
      wallet: WALLET_ROLES.factory,
      color: isDark ? 'from-night-neon-purple to-night-neon-magenta' : 'from-purple-400 to-pink-400',
    },
    {
      title: 'Recycling Enterprise',
      description: 'Process recyclable materials and validate the recycling cycle completion.',
      icon: '♻️',
      href: '/recycle/recycler',
      wallet: WALLET_ROLES.recycler,
      color: isDark ? 'from-night-neon-green to-cyclr-primary' : 'from-green-400 to-emerald-500',
    },
  ];

  return (
    <div className={clsx(
      'min-h-screen',
      isDark ? 'bg-night-bg' : 'bg-day-bg'
    )}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 p-6">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className={clsx(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isDark ? 'bg-night-neon-green/10' : 'bg-day-accent/10'
          )}>
            <span className={clsx(
              'text-lg font-logo font-bold',
              isDark ? 'text-night-neon-green' : 'text-day-accent'
            )}>
              C
            </span>
          </div>
          <span className="font-logo text-xl font-bold tracking-tight text-day-text dark:text-night-text">
            CYCLR
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-logo font-bold mb-6">
              <span className={isDark ? 'text-night-text' : 'text-day-text'}>Recycle</span>
              {' '}
              <span className={isDark ? 'text-night-neon-green' : 'text-day-accent'}>Product</span>
            </h1>
            <p className={clsx(
              'text-lg md:text-xl max-w-2xl mx-auto',
              isDark ? 'text-night-muted' : 'text-day-muted'
            )}>
              Select your role to access the appropriate recycling portal.
              Connect your wallet to verify your identity.
            </p>
          </motion.div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            {roles.map((role, index) => (
              <motion.div
                key={role.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={role.href}>
                  <div className={clsx(
                    'group relative p-8 rounded-3xl border transition-all duration-300 cursor-pointer h-full',
                    isDark
                      ? 'bg-night-surface/50 border-white/5 hover:border-night-neon-green/30 hover:bg-night-surface'
                      : 'bg-day-surface/50 border-black/5 hover:border-day-accent/30 hover:bg-day-surface hover:shadow-xl'
                  )}>
                    {/* Gradient glow on hover */}
                    <div className={clsx(
                      'absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br',
                      role.color
                    )} />

                    {/* Icon */}
                    <div className="text-5xl mb-6">{role.icon}</div>

                    {/* Title */}
                    <h2 className={clsx(
                      'text-2xl font-logo font-bold mb-3',
                      isDark ? 'text-night-text' : 'text-day-text'
                    )}>
                      {role.title}
                    </h2>

                    {/* Description */}
                    <p className={clsx(
                      'mb-6',
                      isDark ? 'text-night-muted' : 'text-day-muted'
                    )}>
                      {role.description}
                    </p>

                    {/* Wallet hint */}
                    <div className={clsx(
                      'font-mono text-xs p-3 rounded-lg',
                      isDark ? 'bg-night-bg text-night-muted' : 'bg-day-bg text-day-muted'
                    )}>
                      Wallet: {role.wallet.slice(0, 8)}...{role.wallet.slice(-6)}
                    </div>

                    {/* Arrow */}
                    <div className={clsx(
                      'absolute top-8 right-8 w-10 h-10 rounded-full flex items-center justify-center transition-all',
                      'group-hover:translate-x-1',
                      isDark 
                        ? 'bg-night-neon-green/10 text-night-neon-green' 
                        : 'bg-day-accent/10 text-day-accent'
                    )}>
                      →
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
