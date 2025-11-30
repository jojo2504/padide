'use client';

import { SelectedRole, useWallet } from '@/lib/wallet-context';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const ROLES = [
  { 
    id: 'customer' as SelectedRole, 
    label: 'Customer', 
    icon: '👤', 
    description: 'Buy products & earn APY',
    path: '/recycle/client',
    color: 'cyan'
  },
  { 
    id: 'manufacturer' as SelectedRole, 
    label: 'Company', 
    icon: '🏭', 
    description: 'Register & track products',
    path: '/recycle/factory',
    color: 'purple'
  },
  { 
    id: 'recycler' as SelectedRole, 
    label: 'Recycler', 
    icon: '♻️', 
    description: 'Process & earn rewards',
    path: '/recycle/recycler',
    color: 'green'
  },
];

export function RoleSelector() {
  const { resolvedTheme } = useTheme();
  const { isConnected, selectedRole, selectRole } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const isDark = resolvedTheme === 'dark';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRoleSelect = (role: typeof ROLES[0]) => {
    selectRole(role.id);
    setIsOpen(false);
    router.push(role.path);
  };

  const currentRole = ROLES.find(r => r.id === selectedRole);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          'flex items-center gap-2 px-3 py-2 rounded-full font-mono text-xs tracking-wider uppercase transition-all border',
          isOpen && 'ring-2',
          isDark
            ? 'border-white/10 hover:border-white/20 text-night-text ring-cyan-500/50'
            : 'border-black/10 hover:border-black/20 text-day-text ring-cyan-500/50'
        )}
      >
        <span className="text-base">{currentRole?.icon || '👤'}</span>
        <span className="hidden sm:inline">{currentRole?.label || 'Select Role'}</span>
        <svg 
          className={clsx('w-3 h-3 transition-transform', isOpen && 'rotate-180')} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              'absolute right-0 mt-2 w-64 rounded-2xl border shadow-xl overflow-hidden z-50',
              isDark 
                ? 'bg-night-surface border-white/10' 
                : 'bg-white border-black/10'
            )}
          >
            <div className={clsx(
              'px-4 py-3 border-b',
              isDark ? 'border-white/5 bg-night-bg/50' : 'border-black/5 bg-gray-50'
            )}>
              <p className={clsx(
                'text-xs font-medium',
                isDark ? 'text-night-muted' : 'text-day-muted'
              )}>
                Switch Dashboard
              </p>
            </div>

            <div className="p-2">
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.id;
                return (
                  <button
                    key={role.id}
                    onClick={() => handleRoleSelect(role)}
                    className={clsx(
                      'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left',
                      isSelected
                        ? isDark
                          ? 'bg-cyan-500/10 border border-cyan-500/30'
                          : 'bg-cyan-50 border border-cyan-200'
                        : isDark
                          ? 'hover:bg-white/5 border border-transparent'
                          : 'hover:bg-gray-50 border border-transparent'
                    )}
                  >
                    <div className={clsx(
                      'w-10 h-10 rounded-xl flex items-center justify-center text-xl',
                      role.color === 'cyan' && (isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'),
                      role.color === 'purple' && (isDark ? 'bg-purple-500/20' : 'bg-purple-100'),
                      role.color === 'green' && (isDark ? 'bg-green-500/20' : 'bg-green-100'),
                    )}>
                      {role.icon}
                    </div>
                    <div className="flex-1">
                      <div className={clsx(
                        'font-medium text-sm',
                        isDark ? 'text-night-text' : 'text-day-text'
                      )}>
                        {role.label}
                      </div>
                      <div className={clsx(
                        'text-xs',
                        isDark ? 'text-night-muted' : 'text-day-muted'
                      )}>
                        {role.description}
                      </div>
                    </div>
                    {isSelected && (
                      <div className={clsx(
                        'w-5 h-5 rounded-full flex items-center justify-center',
                        isDark ? 'bg-cyan-500 text-night-bg' : 'bg-cyan-500 text-white'
                      )}>
                        ✓
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {!isConnected && (
              <div className={clsx(
                'px-4 py-3 border-t',
                isDark ? 'border-white/5 bg-night-bg/30' : 'border-black/5 bg-gray-50'
              )}>
                <p className={clsx(
                  'text-xs text-center',
                  isDark ? 'text-night-muted' : 'text-day-muted'
                )}>
                  💡 Connect wallet for full features
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
