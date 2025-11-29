'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import clsx from 'clsx';

export default function RecyclerPage() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === 'dark';

  useState(() => {
    setMounted(true);
  });

  if (!mounted) return null;

  // Sample pending items
  const pendingItems = [
    { id: 'CYCLR-2024-001', product: 'Plastic Bottle', material: 'PET', date: '2024-01-15', status: 'pending' },
    { id: 'CYCLR-2024-002', product: 'Aluminum Can', material: 'Aluminum', date: '2024-01-14', status: 'pending' },
    { id: 'CYCLR-2024-003', product: 'Cardboard Box', material: 'Paper', date: '2024-01-13', status: 'processing' },
  ];

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
        <div className="max-w-5xl mx-auto">
          {/* Role Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex justify-center mb-8"
          >
            <div className={clsx(
              'inline-flex items-center gap-3 px-6 py-3 rounded-full',
              isDark 
                ? 'bg-night-neon-green/10 border border-night-neon-green/30' 
                : 'bg-green-100 border border-green-200'
            )}>
              <span className="text-2xl">♻️</span>
              <span className={clsx(
                'font-semibold',
                isDark ? 'text-night-neon-green' : 'text-green-700'
              )}>
                Recycling Enterprise Portal
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
              <span className={isDark ? 'text-night-text' : 'text-day-text'}>Process</span>
              {' '}
              <span className={isDark ? 'text-night-neon-green' : 'text-green-500'}>Recyclables</span>
            </h1>
            <p className={clsx(
              'text-lg max-w-2xl mx-auto',
              isDark ? 'text-night-muted' : 'text-day-muted'
            )}>
              Validate and process incoming recyclable materials.
              Confirm the recycling cycle completion and issue certificates.
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Pending', value: '3', color: 'yellow' },
              { label: 'Processing', value: '1', color: 'blue' },
              { label: 'Completed Today', value: '12', color: 'green' },
              { label: 'Total Processed', value: '847', color: 'purple' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={clsx(
                  'text-center p-5 rounded-2xl',
                  isDark ? 'bg-night-surface/50' : 'bg-day-surface/50'
                )}
              >
                <div className={clsx(
                  'text-3xl font-logo font-bold',
                  stat.color === 'yellow' && (isDark ? 'text-yellow-400' : 'text-yellow-600'),
                  stat.color === 'blue' && (isDark ? 'text-blue-400' : 'text-blue-600'),
                  stat.color === 'green' && (isDark ? 'text-night-neon-green' : 'text-green-600'),
                  stat.color === 'purple' && (isDark ? 'text-night-neon-purple' : 'text-purple-600'),
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

          {/* Pending Items */}
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
              Incoming Recyclables
            </h2>

            <div className="space-y-4">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className={clsx(
                    'flex items-center justify-between p-5 rounded-2xl',
                    isDark ? 'bg-night-bg' : 'bg-day-bg'
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={clsx(
                      'w-12 h-12 rounded-xl flex items-center justify-center text-xl',
                      isDark ? 'bg-night-neon-green/10' : 'bg-green-100'
                    )}>
                      ♻️
                    </div>
                    <div>
                      <div className={clsx(
                        'font-medium',
                        isDark ? 'text-night-text' : 'text-day-text'
                      )}>
                        {item.product}
                      </div>
                      <div className={clsx(
                        'text-sm font-mono',
                        isDark ? 'text-night-muted' : 'text-day-muted'
                      )}>
                        {item.id}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={clsx(
                        'text-sm',
                        isDark ? 'text-night-muted' : 'text-day-muted'
                      )}>
                        {item.material}
                      </div>
                      <div className={clsx(
                        'text-xs',
                        isDark ? 'text-night-muted/50' : 'text-day-muted/50'
                      )}>
                        {item.date}
                      </div>
                    </div>
                    
                    {item.status === 'pending' ? (
                      <button
                        className={clsx(
                          'px-4 py-2 rounded-lg font-medium text-sm transition-all',
                          isDark 
                            ? 'bg-night-neon-green text-night-bg hover:opacity-90' 
                            : 'bg-green-500 text-white hover:opacity-90'
                        )}
                      >
                        Process
                      </button>
                    ) : (
                      <span className={clsx(
                        'px-4 py-2 rounded-lg text-sm',
                        isDark 
                          ? 'bg-blue-500/20 text-blue-400' 
                          : 'bg-blue-100 text-blue-600'
                      )}>
                        Processing...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty state for when there are no items */}
            {pendingItems.length === 0 && (
              <div className={clsx(
                'text-center py-12',
                isDark ? 'text-night-muted' : 'text-day-muted'
              )}>
                <div className="text-5xl mb-4">✨</div>
                <p>No pending recyclables. Great job!</p>
              </div>
            )}
          </motion.div>

          {/* Scan New Item */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8"
          >
            <div className={clsx(
              'p-6 rounded-2xl border flex items-center justify-between',
              isDark 
                ? 'bg-night-surface/30 border-white/5' 
                : 'bg-day-surface/30 border-black/5'
            )}>
              <div>
                <h3 className={clsx(
                  'font-logo font-bold',
                  isDark ? 'text-night-text' : 'text-day-text'
                )}>
                  Scan New Item
                </h3>
                <p className={clsx(
                  'text-sm',
                  isDark ? 'text-night-muted' : 'text-day-muted'
                )}>
                  Scan product QR code to add to processing queue
                </p>
              </div>
              <button
                className={clsx(
                  'px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2',
                  isDark 
                    ? 'bg-night-neon-green/10 text-night-neon-green hover:bg-night-neon-green/20' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                )}
              >
                📷 Scan QR
              </button>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
