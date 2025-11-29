'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import clsx from 'clsx';

export default function ClientRecyclePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const isDark = resolvedTheme === 'dark';

  useState(() => {
    setMounted(true);
  });

  if (!mounted) return null;

  return (
    <div className={clsx(
      'min-h-screen',
      isDark ? 'bg-night-bg' : 'bg-day-bg'
    )}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 p-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
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
          
          <Link 
            href="/recycle"
            className={clsx(
              'px-4 py-2 rounded-full text-sm transition-all',
              isDark 
                ? 'bg-night-surface text-night-muted hover:text-night-text' 
                : 'bg-day-surface text-day-muted hover:text-day-text'
            )}
          >
            ← Back to Roles
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Role Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-8"
          >
            <div className={clsx(
              'inline-flex items-center gap-3 px-6 py-3 rounded-full',
              isDark 
                ? 'bg-night-neon-cyan/10 border border-night-neon-cyan/30' 
                : 'bg-cyan-100 border border-cyan-200'
            )}>
              <span className="text-2xl">👤</span>
              <span className={clsx(
                'font-semibold',
                isDark ? 'text-night-neon-cyan' : 'text-cyan-700'
              )}>
                Consumer Portal
              </span>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-logo font-bold mb-6">
              <span className={isDark ? 'text-night-text' : 'text-day-text'}>Recycle Your</span>
              {' '}
              <span className={isDark ? 'text-night-neon-cyan' : 'text-cyan-500'}>Product</span>
            </h1>
            <p className={clsx(
              'text-lg max-w-2xl mx-auto',
              isDark ? 'text-night-muted' : 'text-day-muted'
            )}>
              Scan or enter your product code to start the recycling process.
              Earn rewards for every product you recycle!
            </p>
          </motion.div>

          {/* Scan Options */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center gap-4 mb-8"
          >
            <button
              onClick={() => setScanMode('camera')}
              className={clsx(
                'px-6 py-3 rounded-xl font-medium transition-all',
                scanMode === 'camera'
                  ? isDark 
                    ? 'bg-night-neon-cyan text-night-bg' 
                    : 'bg-cyan-500 text-white'
                  : isDark
                    ? 'bg-night-surface text-night-muted hover:text-night-text'
                    : 'bg-day-surface text-day-muted hover:text-day-text'
              )}
            >
              📷 Scan QR Code
            </button>
            <button
              onClick={() => setScanMode('manual')}
              className={clsx(
                'px-6 py-3 rounded-xl font-medium transition-all',
                scanMode === 'manual'
                  ? isDark 
                    ? 'bg-night-neon-cyan text-night-bg' 
                    : 'bg-cyan-500 text-white'
                  : isDark
                    ? 'bg-night-surface text-night-muted hover:text-night-text'
                    : 'bg-day-surface text-day-muted hover:text-day-text'
              )}
            >
              ⌨️ Enter Code
            </button>
          </motion.div>

          {/* Scan/Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={clsx(
              'p-8 rounded-3xl border',
              isDark 
                ? 'bg-night-surface/50 border-white/5' 
                : 'bg-day-surface/50 border-black/5 shadow-lg'
            )}
          >
            {scanMode === 'camera' ? (
              <div className="text-center">
                {/* Camera placeholder */}
                <div className={clsx(
                  'aspect-square max-w-sm mx-auto rounded-2xl flex items-center justify-center mb-6',
                  isDark ? 'bg-night-bg' : 'bg-day-bg'
                )}>
                  <div className="text-center">
                    <div className="text-6xl mb-4">📷</div>
                    <p className={isDark ? 'text-night-muted' : 'text-day-muted'}>
                      Camera access required
                    </p>
                  </div>
                </div>
                <button
                  className={clsx(
                    'px-8 py-4 rounded-xl font-semibold transition-all',
                    isDark 
                      ? 'bg-night-neon-cyan text-night-bg hover:opacity-90' 
                      : 'bg-cyan-500 text-white hover:opacity-90'
                  )}
                >
                  Enable Camera
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className={clsx(
                    'block text-sm font-medium mb-2',
                    isDark ? 'text-night-muted' : 'text-day-muted'
                  )}>
                    Product Code
                  </label>
                  <input
                    type="text"
                    placeholder="Enter the product code (e.g., CYCLR-2024-XXXX)"
                    className={clsx(
                      'w-full px-4 py-4 rounded-xl border transition-all text-lg font-mono',
                      isDark 
                        ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-cyan' 
                        : 'bg-day-bg border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-cyan-500'
                    )}
                  />
                </div>

                <button
                  className={clsx(
                    'w-full py-4 rounded-xl font-semibold text-lg transition-all',
                    isDark 
                      ? 'bg-gradient-to-r from-night-neon-cyan to-night-neon-green text-night-bg hover:opacity-90' 
                      : 'bg-gradient-to-r from-cyan-500 to-green-500 text-white hover:opacity-90'
                  )}
                >
                  Start Recycling Process
                </button>
              </div>
            )}
          </motion.div>

          {/* Rewards Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <h2 className={clsx(
              'text-xl font-logo font-bold mb-4 text-center',
              isDark ? 'text-night-text' : 'text-day-text'
            )}>
              Your Recycling Rewards
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Products Recycled', value: '0', icon: '♻️' },
                { label: 'Points Earned', value: '0', icon: '⭐' },
                { label: 'Trees Saved', value: '0', icon: '🌳' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={clsx(
                    'text-center p-6 rounded-2xl',
                    isDark ? 'bg-night-surface/50' : 'bg-day-surface/50'
                  )}
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className={clsx(
                    'text-2xl font-logo font-bold',
                    isDark ? 'text-night-neon-cyan' : 'text-cyan-500'
                  )}>
                    {stat.value}
                  </div>
                  <div className={clsx(
                    'text-sm',
                    isDark ? 'text-night-muted' : 'text-day-muted'
                  )}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
