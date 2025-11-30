'use client';

import { Header } from '@/components/layout/Header';
import { SelectedRole, useWallet } from '@/lib/wallet-context';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RecyclePage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const { isConnected, selectedRole, selectRole } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  // If connected and has selected role, redirect to appropriate dashboard
  useEffect(() => {
    if (mounted && isConnected && selectedRole && !isSelecting) {
      const routes: Record<string, string> = {
        customer: '/recycle/client',
        manufacturer: '/recycle/factory',
        recycler: '/recycle/recycler',
      };
      const route = routes[selectedRole];
      if (route) {
        router.push(route);
      }
    }
  }, [mounted, isConnected, selectedRole, router, isSelecting]);

  if (!mounted) return null;

  const handleRoleSelect = (role: SelectedRole) => {
    setIsSelecting(true);
    selectRole(role);
    
    // Navigate after small delay for visual feedback
    setTimeout(() => {
      const routes: Record<string, string> = {
        customer: '/recycle/client',
        manufacturer: '/recycle/factory',
        recycler: '/recycle/recycler',
      };
      if (role) {
        router.push(routes[role]);
      }
    }, 300);
  };

  const roles = [
    {
      id: 'customer' as SelectedRole,
      title: 'Customer',
      description: 'Buy eco-friendly products with built-in recycling rewards. Earn APY on your escrow while promoting sustainability.',
      icon: '👤',
      features: ['Browse & buy products', 'Track APY earnings', 'View escrow balance', 'Recycling rewards'],
      color: isDark ? 'from-night-neon-cyan to-night-neon-green' : 'from-blue-400 to-green-400',
      bgColor: isDark ? 'bg-cyan-500/10' : 'bg-cyan-50',
    },
    {
      id: 'manufacturer' as SelectedRole,
      title: 'Company / Manufacturer',
      description: 'Register products with NFT certificates and QR codes. Build sustainable supply chains and earn recycling incentives.',
      icon: '🏭',
      features: ['Create products', 'Generate QR codes', 'Mint product NFTs', 'Track product lifecycle'],
      color: isDark ? 'from-night-neon-purple to-night-neon-magenta' : 'from-purple-400 to-pink-400',
      bgColor: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
    },
    {
      id: 'recycler' as SelectedRole,
      title: 'Recycling Enterprise',
      description: 'Scan product QR codes to process recycling claims and trigger reward distributions for the circular economy.',
      icon: '♻️',
      features: ['Scan QR codes', 'Process recycling', 'Receive 20% APY share', 'Validate products'],
      color: isDark ? 'from-night-neon-green to-cyclr-primary' : 'from-green-400 to-emerald-500',
      bgColor: isDark ? 'bg-green-500/10' : 'bg-green-50',
    },
  ];

  return (
    <div className={clsx(
      'min-h-screen',
      isDark ? 'bg-night-bg' : 'bg-day-bg'
    )}>
      <Header />

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className={clsx(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6',
              isDark ? 'bg-night-neon-green/10 border border-night-neon-green/30' : 'bg-green-100 border border-green-200'
            )}>
              <span className="text-xl">🌍</span>
              <span className={clsx('text-sm font-medium', isDark ? 'text-night-neon-green' : 'text-green-700')}>
                Welcome to the Circular Economy
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-logo font-bold mb-4">
              <span className={isDark ? 'text-night-text' : 'text-day-text'}>Choose Your</span>
              {' '}
              <span className={isDark ? 'text-night-neon-green' : 'text-day-accent'}>Role</span>
            </h1>
            <p className={clsx(
              'text-lg max-w-2xl mx-auto',
              isDark ? 'text-night-muted' : 'text-day-muted'
            )}>
              Select how you want to participate in the CYCLR ecosystem.
              Your role determines your dashboard and available actions.
            </p>
          </motion.div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {roles.map((role, index) => (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleRoleSelect(role.id)}
                disabled={isSelecting}
                className={clsx(
                  'relative p-6 rounded-3xl border text-left transition-all duration-300',
                  'hover:scale-[1.02] hover:-translate-y-1',
                  'disabled:opacity-70 disabled:cursor-not-allowed',
                  isDark
                    ? 'bg-night-surface/50 border-white/5 hover:border-night-neon-green/30 hover:bg-night-surface'
                    : 'bg-white/50 border-black/5 hover:border-day-accent/30 hover:bg-white hover:shadow-xl',
                  selectedRole === role.id && (isDark ? 'ring-2 ring-night-neon-green' : 'ring-2 ring-green-500')
                )}
              >
                {/* Icon */}
                <div className={clsx(
                  'w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4',
                  role.bgColor
                )}>
                  {role.icon}
                </div>

                {/* Title */}
                <h3 className={clsx(
                  'text-xl font-logo font-bold mb-2',
                  isDark ? 'text-night-text' : 'text-day-text'
                )}>
                  {role.title}
                </h3>

                {/* Description */}
                <p className={clsx(
                  'text-sm mb-4',
                  isDark ? 'text-night-muted' : 'text-day-muted'
                )}>
                  {role.description}
                </p>

                {/* Features */}
                <div className="space-y-2">
                  {role.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className={clsx(
                        'w-1.5 h-1.5 rounded-full',
                        isDark ? 'bg-night-neon-green' : 'bg-green-500'
                      )} />
                      <span className={clsx(
                        'text-xs',
                        isDark ? 'text-night-muted' : 'text-day-muted'
                      )}>
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Arrow */}
                <div className={clsx(
                  'absolute bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                  isDark ? 'bg-white/5 group-hover:bg-night-neon-green/20' : 'bg-black/5 group-hover:bg-green-100'
                )}>
                  <svg className={clsx('w-5 h-5', isDark ? 'text-night-muted' : 'text-day-muted')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </motion.button>
            ))}
          </div>

          {/* How It Works */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className={clsx(
              'p-8 rounded-3xl border',
              isDark ? 'bg-night-surface/30 border-white/5' : 'bg-white/50 border-black/5'
            )}
          >
            <h2 className={clsx(
              'text-2xl font-logo font-bold mb-6 text-center',
              isDark ? 'text-night-text' : 'text-day-text'
            )}>
              How CYCLR Works
            </h2>

            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: '1', title: 'Register', desc: 'Company creates product with 5% deposit', icon: '📝' },
                { step: '2', title: 'Purchase', desc: 'Customer buys with 5% escrow to AMM', icon: '🛒' },
                { step: '3', title: 'Earn APY', desc: 'Both deposits earn yield in the AMM pool', icon: '📈' },
                { step: '4', title: 'Recycle', desc: 'Recycler scans QR, rewards distributed', icon: '♻️' },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className={clsx(
                    'w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-3',
                    isDark ? 'bg-night-neon-green/20' : 'bg-green-100'
                  )}>
                    {item.icon}
                  </div>
                  <div className={clsx(
                    'text-xs font-medium mb-1',
                    isDark ? 'text-night-neon-green' : 'text-green-600'
                  )}>
                    Step {item.step}
                  </div>
                  <div className={clsx(
                    'font-semibold mb-1',
                    isDark ? 'text-night-text' : 'text-day-text'
                  )}>
                    {item.title}
                  </div>
                  <div className={clsx(
                    'text-xs',
                    isDark ? 'text-night-muted' : 'text-day-muted'
                  )}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* APY Distribution */}
            <div className={clsx(
              'mt-8 pt-6 border-t',
              isDark ? 'border-white/10' : 'border-black/10'
            )}>
              <h3 className={clsx(
                'text-center font-semibold mb-4',
                isDark ? 'text-night-text' : 'text-day-text'
              )}>
                When Recycled: APY Distribution
              </h3>
              <div className="flex justify-center gap-4 flex-wrap">
                {[
                  { label: 'Customer', percent: '40%', color: 'bg-cyan-500' },
                  { label: 'Manufacturer', percent: '20%', color: 'bg-purple-500' },
                  { label: 'Recycler', percent: '20%', color: 'bg-green-500' },
                  { label: 'Eco Fund', percent: '20%', color: 'bg-blue-500' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={clsx('w-3 h-3 rounded-full', item.color)} />
                    <span className={clsx('text-sm', isDark ? 'text-night-muted' : 'text-day-muted')}>
                      {item.label}: <span className="font-semibold">{item.percent}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
