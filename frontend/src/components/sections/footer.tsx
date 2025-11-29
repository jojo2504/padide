'use client';

import { motion } from 'framer-motion';
import { useTheme } from '@/components/theme/theme-provider';

const footerLinks = {
  product: [
    { label: 'How It Works', href: '#' },
    { label: 'Scan Products', href: '#' },
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Rewards', href: '#' },
  ],
  resources: [
    { label: 'Documentation', href: '#' },
    { label: 'API', href: '#' },
    { label: 'Whitepaper', href: '#' },
    { label: 'Blog', href: '#' },
  ],
  company: [
    { label: 'About', href: '#' },
    { label: 'Careers', href: '#' },
    { label: 'Press', href: '#' },
    { label: 'Contact', href: '#' },
  ],
  legal: [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Cookies', href: '#' },
  ],
};

const socials = [
  { label: 'Twitter', icon: '𝕏', href: '#' },
  { label: 'Discord', icon: '💬', href: '#' },
  { label: 'GitHub', icon: '🐙', href: '#' },
];

export default function Footer() {
  const { isDay } = useTheme();
  
  return (
    <footer className={`relative py-16 ${
      isDay ? 'bg-clay-light' : 'bg-night-surface'
    }`}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <motion.div
              className={`text-2xl font-heading font-bold mb-4 ${
                isDay ? 'text-leaf' : 'text-sky'
              }`}
              whileHover={{ scale: 1.05 }}
            >
              🌱 CYCLR
            </motion.div>
            <p className={`text-sm mb-4 ${
              isDay ? 'text-void/60' : 'text-white/60'
            }`}>
              Building the circular economy on blockchain.
            </p>
            
            {/* Socials */}
            <div className="flex gap-3">
              {socials.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-lg
                    ${isDay 
                      ? 'bg-day-bg hover:bg-leaf/10' 
                      : 'bg-void hover:bg-sky/10'
                    }
                  `}
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>
          
          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className={`font-heading font-semibold mb-4 capitalize ${
                isDay ? 'text-void' : 'text-white'
              }`}>
                {category}
              </h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <motion.a
                      href={link.href}
                      className={`text-sm ${
                        isDay 
                          ? 'text-void/60 hover:text-leaf' 
                          : 'text-white/60 hover:text-sky'
                      }`}
                      whileHover={{ x: 4 }}
                    >
                      {link.label}
                    </motion.a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        {/* Bottom bar */}
        <div className={`
          pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4
          ${isDay ? 'border-clay-dark/20' : 'border-white/10'}
        `}>
          <p className={`text-sm ${
            isDay ? 'text-void/50' : 'text-white/50'
          }`}>
            © 2024 CYCLR. All rights reserved.
          </p>
          
          <div className={`flex items-center gap-2 text-sm ${
            isDay ? 'text-void/50' : 'text-white/50'
          }`}>
            <span>Built with</span>
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              ♻️
            </motion.span>
            <span>on</span>
            <span className={isDay ? 'text-leaf font-medium' : 'text-sky font-medium'}>
              XRPL
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
