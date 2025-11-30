'use client';

import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { QRScanner } from './QRScanner';

interface ScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
  subtitle?: string;
}

export function ScannerModal({ 
  isOpen, 
  onClose, 
  onScan,
  title = 'Scan QR Code',
  subtitle = 'Point your camera at a product QR code'
}: ScannerModalProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
    }
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!mounted) return null;

  const handleScan = (result: string) => {
    onScan(result);
    // Don't auto-close - let the parent handle it
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={clsx(
              'relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl',
              isDark ? 'bg-night-nav' : 'bg-white'
            )}
          >
            {/* Header */}
            <div className={clsx(
              'sticky top-0 flex items-center justify-between p-4 border-b z-10',
              isDark 
                ? 'bg-night-nav border-white/10' 
                : 'bg-white border-gray-200'
            )}>
              <div>
                <h2 className={clsx(
                  'text-lg font-semibold',
                  isDark ? 'text-white' : 'text-gray-900'
                )}>
                  {title}
                </h2>
                <p className={clsx(
                  'text-sm',
                  isDark ? 'text-night-muted' : 'text-gray-500'
                )}>
                  {subtitle}
                </p>
              </div>
              
              <button
                onClick={onClose}
                className={clsx(
                  'p-2 rounded-xl transition-colors',
                  isDark 
                    ? 'hover:bg-white/10 text-night-muted hover:text-white' 
                    : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                )}
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scanner */}
            <div className="p-4">
              <QRScanner
                onScan={handleScan}
                onError={(error) => console.error('Scanner error:', error)}
                className="!rounded-2xl"
              />
            </div>

            {/* Instructions */}
            <div className={clsx(
              'p-4 border-t',
              isDark ? 'border-white/10' : 'border-gray-200'
            )}>
              <div className="flex items-start gap-3">
                <div className={clsx(
                  'p-2 rounded-lg flex-shrink-0',
                  isDark ? 'bg-blue-500/20' : 'bg-blue-50'
                )}>
                  <svg className={clsx('w-5 h-5', isDark ? 'text-blue-400' : 'text-blue-600')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className={clsx(
                    'text-sm font-medium',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}>
                    Tips for scanning
                  </p>
                  <ul className={clsx(
                    'mt-1 text-xs space-y-1',
                    isDark ? 'text-night-muted' : 'text-gray-500'
                  )}>
                    <li>• Hold the QR code steady in the center of the frame</li>
                    <li>• Ensure good lighting for better recognition</li>
                    <li>• Keep the QR code flat and avoid glare</li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
