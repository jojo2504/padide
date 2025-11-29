'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import clsx from 'clsx';

export function Footer() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const links = {
    Product: ['Features', 'Roadmap', 'Pricing', 'FAQ'],
    Resources: ['Documentation', 'API', 'Guides', 'Blog'],
    Company: ['About', 'Careers', 'Press', 'Contact'],
    Legal: ['Privacy', 'Terms', 'Cookies', 'Licenses'],
  };

  return (
    <footer className={clsx(
      'relative py-24 px-8',
      isDark ? 'bg-night-bg' : 'bg-day-bg'
    )}>
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={clsx(
          'absolute -bottom-1/2 left-1/2 -translate-x-1/2 w-[200%] aspect-square rounded-full blur-3xl opacity-10',
          isDark ? 'bg-night-neon-green' : 'bg-day-accent'
        )} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        {/* Top section */}
        <div className="grid md:grid-cols-2 gap-16 mb-16">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className={clsx(
                'w-12 h-12 rounded-full flex items-center justify-center',
                isDark 
                  ? 'bg-night-neon-green/10' 
                  : 'bg-day-accent/10'
              )}>
                <span className={clsx(
                  'text-xl font-display font-bold',
                  isDark ? 'text-night-neon-green' : 'text-day-accent'
                )}>
                  C
                </span>
              </div>
              <span className="font-display text-2xl text-day-text dark:text-night-text">
                CYCLR
              </span>
            </div>
            <p className="text-day-muted dark:text-night-muted max-w-sm mb-8">
              Breaking the cycle of extractive finance. Building regenerative systems on XRPL.
            </p>
            
            {/* Social links */}
            <div className="flex gap-4">
              {['Twitter', 'Discord', 'GitHub'].map((social) => (
                <a
                  key={social}
                  href="#"
                  className={clsx(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                    isDark
                      ? 'bg-night-surface hover:bg-night-neon-green/20 text-night-muted hover:text-night-neon-green'
                      : 'bg-day-surface hover:bg-day-accent/20 text-day-muted hover:text-day-accent'
                  )}
                >
                  <span className="sr-only">{social}</span>
                  <span className="text-xs font-mono">{social[0]}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(links).map(([category, items]) => (
              <div key={category}>
                <h4 className="font-mono text-xs tracking-wider uppercase mb-4 text-day-text dark:text-night-text">
                  {category}
                </h4>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item}>
                      <a
                        href="#"
                        className={clsx(
                          'text-sm transition-colors',
                          isDark
                            ? 'text-night-muted hover:text-night-neon-green'
                            : 'text-day-muted hover:text-day-accent'
                        )}
                      >
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom section */}
        <div className={clsx(
          'pt-8 flex flex-col md:flex-row justify-between items-center gap-4',
          isDark ? 'border-t border-white/5' : 'border-t border-black/5'
        )}>
          <p className="text-sm text-day-muted dark:text-night-muted">
            © 2024 CYCLR. All rights reserved.
          </p>
          <p className="text-sm text-day-muted dark:text-night-muted">
            Built with 💚 on{' '}
            <span className={isDark ? 'text-night-neon-green' : 'text-day-accent'}>
              XRPL
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
