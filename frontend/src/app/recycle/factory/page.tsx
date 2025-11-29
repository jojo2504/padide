'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import clsx from 'clsx';

export default function FactoryRecyclePage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
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
                ? 'bg-night-neon-purple/10 border border-night-neon-purple/30' 
                : 'bg-purple-100 border border-purple-200'
            )}>
              <span className="text-2xl">🏭</span>
              <span className={clsx(
                'font-semibold',
                isDark ? 'text-night-neon-purple' : 'text-purple-700'
              )}>
                Factory / Enterprise Portal
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
              <span className={isDark ? 'text-night-text' : 'text-day-text'}>Product</span>
              {' '}
              <span className={isDark ? 'text-night-neon-purple' : 'text-purple-500'}>Registration</span>
            </h1>
            <p className={clsx(
              'text-lg max-w-2xl mx-auto',
              isDark ? 'text-night-muted' : 'text-day-muted'
            )}>
              Register your products for recycling tracking. Monitor sustainability 
              metrics and manage the lifecycle of your manufactured goods.
            </p>
          </motion.div>

          {/* Registration Form */}
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
            <h2 className={clsx(
              'text-xl font-logo font-bold mb-6',
              isDark ? 'text-night-text' : 'text-day-text'
            )}>
              Register New Product
            </h2>

            <div className="space-y-6">
              {/* Product Name */}
              <div>
                <label className={clsx(
                  'block text-sm font-medium mb-2',
                  isDark ? 'text-night-muted' : 'text-day-muted'
                )}>
                  Product Name
                </label>
                <input
                  type="text"
                  placeholder="Enter product name"
                  className={clsx(
                    'w-full px-4 py-3 rounded-xl border transition-all',
                    isDark 
                      ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-purple' 
                      : 'bg-day-bg border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-purple-500'
                  )}
                />
              </div>

              {/* SKU */}
              <div>
                <label className={clsx(
                  'block text-sm font-medium mb-2',
                  isDark ? 'text-night-muted' : 'text-day-muted'
                )}>
                  SKU / Product ID
                </label>
                <input
                  type="text"
                  placeholder="Enter SKU or product ID"
                  className={clsx(
                    'w-full px-4 py-3 rounded-xl border transition-all',
                    isDark 
                      ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-purple' 
                      : 'bg-day-bg border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-purple-500'
                  )}
                />
              </div>

              {/* Material Composition */}
              <div>
                <label className={clsx(
                  'block text-sm font-medium mb-2',
                  isDark ? 'text-night-muted' : 'text-day-muted'
                )}>
                  Material Composition
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the recyclable materials (e.g., 70% PET plastic, 20% aluminum, 10% paper)"
                  className={clsx(
                    'w-full px-4 py-3 rounded-xl border transition-all resize-none',
                    isDark 
                      ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-purple' 
                      : 'bg-day-bg border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-purple-500'
                  )}
                />
              </div>

              {/* Batch Size */}
              <div>
                <label className={clsx(
                  'block text-sm font-medium mb-2',
                  isDark ? 'text-night-muted' : 'text-day-muted'
                )}>
                  Batch Size (units)
                </label>
                <input
                  type="number"
                  placeholder="Number of units to register"
                  className={clsx(
                    'w-full px-4 py-3 rounded-xl border transition-all',
                    isDark 
                      ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-purple' 
                      : 'bg-day-bg border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-purple-500'
                  )}
                />
              </div>

              {/* Submit Button */}
              <button
                className={clsx(
                  'w-full py-4 rounded-xl font-semibold text-lg transition-all',
                  isDark 
                    ? 'bg-gradient-to-r from-night-neon-purple to-night-neon-magenta text-white hover:opacity-90' 
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90'
                )}
              >
                Register Product for Tracking
              </button>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-3 gap-4 mt-8"
          >
            {[
              { label: 'Products Registered', value: '0' },
              { label: 'Recycled', value: '0%' },
              { label: 'CO₂ Saved', value: '0 kg' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={clsx(
                  'text-center p-6 rounded-2xl',
                  isDark ? 'bg-night-surface/50' : 'bg-day-surface/50'
                )}
              >
                <div className={clsx(
                  'text-2xl font-logo font-bold',
                  isDark ? 'text-night-neon-purple' : 'text-purple-500'
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
          </motion.div>
        </div>
      </main>
    </div>
  );
}
