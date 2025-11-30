'use client';

import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useState } from 'react';
import { Header } from '../layout/Header';
import { WalletLoginModal } from './WalletLoginModal';

interface ConnectWalletRequiredProps {
  role: 'customer' | 'manufacturer' | 'recycler';
  title: string;
  description: string;
}

const roleConfig = {
  customer: {
    icon: '👤',
    color: 'cyan',
    gradient: 'from-cyan-500 to-blue-500',
  },
  manufacturer: {
    icon: '🏭',
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
  },
  recycler: {
    icon: '♻️',
    color: 'green',
    gradient: 'from-green-500 to-cyan-500',
  },
};

export function ConnectWalletRequired({ role, title, description }: ConnectWalletRequiredProps) {
  const { resolvedTheme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const isDark = resolvedTheme === 'dark';
  const config = roleConfig[role];

  return (
    <>
      <WalletLoginModal isOpen={showModal} onClose={() => setShowModal(false)} />
      
      <div className={clsx(
        'min-h-screen',
        isDark ? 'bg-night-bg' : 'bg-day-bg'
      )}>
        {/* Header */}
        <Header />

        {/* Content centered */}
        <div className="min-h-screen flex items-center justify-center p-6">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className={clsx(
              'absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20',
              config.color === 'cyan' && 'bg-cyan-500',
              config.color === 'purple' && 'bg-purple-500',
              config.color === 'green' && 'bg-green-500',
            )} />
            <div className={clsx(
              'absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full blur-3xl opacity-10',
              config.color === 'cyan' && 'bg-blue-500',
              config.color === 'purple' && 'bg-pink-500',
              config.color === 'green' && 'bg-cyan-500',
            )} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
              'relative max-w-md w-full p-8 rounded-3xl border text-center',
              isDark 
                ? 'bg-night-surface/80 border-white/10 backdrop-blur-xl' 
                : 'bg-white/80 border-black/5 backdrop-blur-xl shadow-2xl'
            )}
          >
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-8">
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

          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="text-6xl mb-6"
          >
            {config.icon}
          </motion.div>

          {/* Title */}
          <h1 className={clsx(
            'text-2xl font-logo font-bold mb-3',
            isDark ? 'text-night-text' : 'text-day-text'
          )}>
            {title}
          </h1>

          {/* Description */}
          <p className={clsx(
            'text-sm mb-8',
            isDark ? 'text-night-muted' : 'text-day-muted'
          )}>
            {description}
          </p>

          {/* Connect Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowModal(true)}
            className={clsx(
              'w-full py-4 rounded-2xl font-semibold text-lg text-white transition-all',
              `bg-gradient-to-r ${config.gradient}`,
              'hover:shadow-lg hover:shadow-current/25'
            )}
          >
            🔗 Connect Wallet
          </motion.button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className={clsx('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-black/10')} />
            <span className={clsx('text-xs', isDark ? 'text-night-muted' : 'text-day-muted')}>
              or
            </span>
            <div className={clsx('flex-1 h-px', isDark ? 'bg-white/10' : 'bg-black/10')} />
          </div>

          {/* Back link */}
          <Link 
            href="/recycle"
            className={clsx(
              'inline-flex items-center gap-2 text-sm transition-all',
              isDark ? 'text-night-muted hover:text-night-text' : 'text-day-muted hover:text-day-text'
            )}
          >
            ← Choose a different role
          </Link>

          {/* Info */}
          <div className={clsx(
            'mt-8 p-4 rounded-xl text-left text-xs',
            isDark ? 'bg-night-bg/50' : 'bg-gray-50'
          )}>
            <div className={clsx('font-semibold mb-2', isDark ? 'text-night-text' : 'text-day-text')}>
              💡 Quick Connect Options:
            </div>
            <ul className={clsx('space-y-1', isDark ? 'text-night-muted' : 'text-day-muted')}>
              <li>• <strong>Manufacturer:</strong> rfHrTMepc...7qKoK</li>
              <li>• <strong>Recycler:</strong> rnYrUUuq...eKhLd</li>
              <li>• <strong>Customer:</strong> Any XRPL address</li>
            </ul>
          </div>
        </motion.div>
        </div>
      </div>
    </>
  );
}
