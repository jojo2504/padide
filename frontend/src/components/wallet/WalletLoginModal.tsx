'use client';

import { KNOWN_WALLETS, useWallet } from '@/lib/wallet-context';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface WalletLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type WalletProvider = 'crossmark' | 'gemwallet' | null;

// Helper function to check GemWallet with retries
async function checkGemWalletInstalled(maxRetries = 3): Promise<boolean> {
  // First check the global flag (set by extension content script)
  if (typeof window !== 'undefined' && (window as any).gemWallet === true) {
    console.log('GemWallet detected via window.gemWallet flag');
    return true;
  }
  
  // Try using the SDK with retries
  for (let i = 0; i < maxRetries; i++) {
    try {
      const { isInstalled } = await import('@gemwallet/api');
      const result = await isInstalled();
      console.log(`GemWallet SDK check attempt ${i + 1}:`, result);
      if (result?.result?.isInstalled) {
        return true;
      }
      // Wait before retry
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (e) {
      console.log(`GemWallet SDK check attempt ${i + 1} failed:`, e);
    }
  }
  return false;
}

// Helper function to get address from GemWallet
async function getGemWalletAddress(): Promise<string | null> {
  try {
    const { getAddress } = await import('@gemwallet/api');
    const response = await getAddress();
    console.log('GemWallet getAddress response:', response);
    return response?.result?.address || null;
  } catch (e) {
    console.error('GemWallet getAddress error:', e);
    throw e;
  }
}

export function WalletLoginModal({ isOpen, onClose }: WalletLoginModalProps) {
  const { resolvedTheme } = useTheme();
  const { connect, isConnecting, setConnecting } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'wallet' | 'demo' | 'manual'>('wallet');
  const [selectedProvider, setSelectedProvider] = useState<WalletProvider>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
    
    // Debug: Check for wallet extensions on mount
    if (typeof window !== 'undefined') {
      const gemWalletFlag = (window as any).gemWallet;
      const crossmarkFlag = (window as any).crossmark || (window as any).xrpl?.crossmark;
      console.log('Wallet extension detection on mount:', {
        gemWallet: gemWalletFlag,
        crossmark: !!crossmarkFlag
      });
    }
  }, []);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedProvider(null);
      setError('');
      setDebugInfo('');
      setIsConnectingWallet(false);
    }
  }, [isOpen]);

  if (!mounted) return null;

  const handleWalletConnect = async (provider: WalletProvider) => {
    setSelectedProvider(provider);
    setIsConnectingWallet(true);
    setError('');
    setDebugInfo('');

    try {
      if (provider === 'crossmark') {
        // Check if Crossmark is available (it injects sdk into window.xrpl or window.crossmark)
        const crossmark = (window as any).crossmark || (window as any).xrpl?.crossmark;
        if (crossmark) {
          try {
            const response = await crossmark.signIn();
            if (response?.address) {
              connect(response.address);
              onClose();
            } else {
              setError('Failed to get address from Crossmark');
            }
          } catch (e: any) {
            // Try alternative method
            if (crossmark.methods?.signIn) {
              const response = await crossmark.methods.signIn();
              if (response?.address) {
                connect(response.address);
                onClose();
              } else {
                setError('Failed to get address from Crossmark');
              }
            } else {
              throw e;
            }
          }
        } else {
          setError('Crossmark wallet not detected. Please install the extension and refresh the page.');
        }
      } else if (provider === 'gemwallet') {
        // Use GemWallet SDK with helper functions that have retries
        try {
          setDebugInfo('Checking if GemWallet is installed...');
          console.log('Starting GemWallet detection...');
          
          // Log current window state for debugging
          console.log('window.gemWallet:', (window as any).gemWallet);
          
          const isGemWalletInstalled = await checkGemWalletInstalled(3);
          console.log('GemWallet installed:', isGemWalletInstalled);
          
          if (isGemWalletInstalled) {
            setDebugInfo('GemWallet found! Requesting address...');
            console.log('Requesting address from GemWallet...');
            
            const address = await getGemWalletAddress();
            console.log('GemWallet address received:', address);
            
            if (address) {
              connect(address);
              onClose();
            } else {
              setError('Failed to get address from GemWallet. Please try again.');
            }
          } else {
            // Provide more helpful debug information
            const gemWalletFlag = (window as any).gemWallet;
            setDebugInfo(`Extension check failed. window.gemWallet = ${gemWalletFlag}`);
            setError(
              'GemWallet extension not detected. Please make sure:\n' +
              '1. The extension is installed from gemwallet.app\n' +
              '2. The extension is unlocked\n' +
              '3. Refresh this page after installing'
            );
          }
        } catch (e: any) {
          console.error('GemWallet error:', e);
          setDebugInfo(`Error: ${e.message || 'Unknown error'}`);
          if (e.message?.includes('User rejected') || e.message?.includes('rejected')) {
            setError('Connection rejected. Please approve the request in GemWallet.');
          } else if (e.message?.includes('not installed')) {
            setError('GemWallet is not installed. Please install from gemwallet.app');
          } else {
            setError(`GemWallet error: ${e.message || 'Please make sure the extension is unlocked.'}`);
          }
        }
      }
    } catch (err: any) {
      console.error('Wallet connection error:', err);
      setError(err.message || 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnectingWallet(false);
    }
  };

  const handleQuickConnect = (address: string, role: string) => {
    setConnecting(true);
    setError('');
    
    // Simulate connection delay
    setTimeout(() => {
      connect(address);
      setConnecting(false);
      onClose();
    }, 500);
  };

  const handleManualConnect = () => {
    if (!manualAddress.trim()) {
      setError('Please enter a wallet address');
      return;
    }

    // Basic XRPL address validation
    if (!manualAddress.startsWith('r') || manualAddress.length < 25 || manualAddress.length > 35) {
      setError('Invalid XRPL address format');
      return;
    }

    setConnecting(true);
    setError('');

    // Simulate connection
    setTimeout(() => {
      connect(manualAddress.trim());
      setConnecting(false);
      onClose();
    }, 500);
  };

  const walletProviders = [
    {
      id: 'crossmark' as const,
      name: 'Crossmark',
      icon: '✖️',
      description: 'Connect with Crossmark browser extension',
      color: isDark ? 'border-blue-500/50 hover:bg-blue-500/10' : 'border-blue-400 hover:bg-blue-50',
      iconBg: isDark ? 'bg-blue-500/20' : 'bg-blue-100',
    },
    {
      id: 'gemwallet' as const,
      name: 'GemWallet',
      icon: '💎',
      description: 'Connect with GemWallet browser extension',
      color: isDark ? 'border-cyan-500/50 hover:bg-cyan-500/10' : 'border-cyan-400 hover:bg-cyan-50',
      iconBg: isDark ? 'bg-cyan-500/20' : 'bg-cyan-100',
    },
  ];

  const quickConnectOptions = [
    {
      role: 'recycler' as const,
      address: KNOWN_WALLETS.recycler,
      name: 'Recycling Enterprise',
      icon: '♻️',
      description: 'Process and verify recycled products',
      color: isDark ? 'border-green-500/50 hover:bg-green-500/10' : 'border-green-400 hover:bg-green-50',
    },
    {
      role: 'manufacturer' as const,
      address: KNOWN_WALLETS.manufacturer,
      name: 'Manufacturer',
      icon: '🏭',
      description: 'Register and track products',
      color: isDark ? 'border-purple-500/50 hover:bg-purple-500/10' : 'border-purple-400 hover:bg-purple-50',
    },
    {
      role: 'customer' as const,
      address: 'rCustomerDemo123456789012345678', // Demo customer address
      name: 'Demo Customer',
      icon: '👤',
      description: 'View and recycle your products',
      color: isDark ? 'border-blue-500/50 hover:bg-blue-500/10' : 'border-blue-400 hover:bg-blue-50',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={clsx(
              'w-full max-w-md rounded-2xl p-6 shadow-2xl',
              isDark ? 'bg-night-surface border border-white/10' : 'bg-white border border-gray-200'
            )}>
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className={clsx(
                  'text-2xl font-logo font-bold',
                  isDark ? 'text-night-text' : 'text-day-text'
                )}>
                  Connect Wallet
                </h2>
                <button
                  onClick={onClose}
                  className={clsx(
                    'p-2 rounded-full transition-colors',
                    isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
                  )}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Tabs */}
              <div className={clsx(
                'flex gap-1 p-1 rounded-xl mb-6',
                isDark ? 'bg-night-bg' : 'bg-gray-100'
              )}>
                <button
                  onClick={() => setActiveTab('wallet')}
                  className={clsx(
                    'flex-1 py-2 px-3 rounded-lg font-mono text-xs transition-all',
                    activeTab === 'wallet'
                      ? isDark
                        ? 'bg-night-surface text-night-neon-green'
                        : 'bg-white text-day-accent shadow-sm'
                      : isDark
                        ? 'text-night-muted hover:text-night-text'
                        : 'text-day-muted hover:text-day-text'
                  )}
                >
                  Wallet
                </button>
                <button
                  onClick={() => setActiveTab('demo')}
                  className={clsx(
                    'flex-1 py-2 px-3 rounded-lg font-mono text-xs transition-all',
                    activeTab === 'demo'
                      ? isDark
                        ? 'bg-night-surface text-night-neon-green'
                        : 'bg-white text-day-accent shadow-sm'
                      : isDark
                        ? 'text-night-muted hover:text-night-text'
                        : 'text-day-muted hover:text-day-text'
                  )}
                >
                  Demo
                </button>
                <button
                  onClick={() => setActiveTab('manual')}
                  className={clsx(
                    'flex-1 py-2 px-3 rounded-lg font-mono text-xs transition-all',
                    activeTab === 'manual'
                      ? isDark
                        ? 'bg-night-surface text-night-neon-green'
                        : 'bg-white text-day-accent shadow-sm'
                      : isDark
                        ? 'text-night-muted hover:text-night-text'
                        : 'text-day-muted hover:text-day-text'
                  )}
                >
                  Address
                </button>
              </div>

              {/* Content */}
              {activeTab === 'wallet' ? (
                <div className="space-y-3">
                  <p className={clsx(
                    'text-sm mb-4',
                    isDark ? 'text-night-muted' : 'text-day-muted'
                  )}>
                    Choose your XRPL wallet provider:
                  </p>

                  {walletProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => handleWalletConnect(provider.id)}
                      disabled={isConnectingWallet}
                      className={clsx(
                        'w-full p-4 rounded-xl border-2 transition-all text-left',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        selectedProvider === provider.id && isConnectingWallet
                          ? isDark
                            ? 'border-night-neon-green bg-night-neon-green/10'
                            : 'border-day-accent bg-day-accent/10'
                          : provider.color
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className={clsx(
                          'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                          provider.iconBg
                        )}>
                          {provider.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={clsx(
                            'font-semibold',
                            isDark ? 'text-night-text' : 'text-day-text'
                          )}>
                            {provider.name}
                          </h3>
                          <p className={clsx(
                            'text-sm',
                            isDark ? 'text-night-muted' : 'text-day-muted'
                          )}>
                            {provider.description}
                          </p>
                        </div>
                        {selectedProvider === provider.id && isConnectingWallet && (
                          <div className="animate-spin w-5 h-5 border-2 border-current border-t-transparent rounded-full" />
                        )}
                      </div>
                    </button>
                  ))}

                  {error && (
                    <div className={clsx(
                      'p-3 rounded-lg text-sm whitespace-pre-line',
                      isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
                    )}>
                      {error}
                    </div>
                  )}
                  
                  {debugInfo && (
                    <div className={clsx(
                      'p-2 rounded-lg text-xs font-mono',
                      isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'
                    )}>
                      Debug: {debugInfo}
                    </div>
                  )}
                </div>
              ) : activeTab === 'demo' ? (
                <div className="space-y-3">
                  <p className={clsx(
                    'text-sm mb-4',
                    isDark ? 'text-night-muted' : 'text-day-muted'
                  )}>
                    Select a demo role to test the platform:
                  </p>

                  {quickConnectOptions.map((option) => (
                    <button
                      key={option.role}
                      onClick={() => handleQuickConnect(option.address, option.role)}
                      disabled={isConnecting}
                      className={clsx(
                        'w-full p-4 rounded-xl border-2 transition-all text-left',
                        'disabled:opacity-50 disabled:cursor-not-allowed',
                        option.color
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{option.icon}</span>
                        <div className="flex-1">
                          <h3 className={clsx(
                            'font-semibold',
                            isDark ? 'text-night-text' : 'text-day-text'
                          )}>
                            {option.name}
                          </h3>
                          <p className={clsx(
                            'text-sm',
                            isDark ? 'text-night-muted' : 'text-day-muted'
                          )}>
                            {option.description}
                          </p>
                          <code className={clsx(
                            'text-xs mt-2 block font-mono',
                            isDark ? 'text-night-muted' : 'text-gray-400'
                          )}>
                            {option.address.slice(0, 8)}...{option.address.slice(-6)}
                          </code>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className={clsx(
                    'text-sm',
                    isDark ? 'text-night-muted' : 'text-day-muted'
                  )}>
                    Enter your XRPL wallet address to connect:
                  </p>

                  <div>
                    <input
                      type="text"
                      value={manualAddress}
                      onChange={(e) => {
                        setManualAddress(e.target.value);
                        setError('');
                      }}
                      placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      className={clsx(
                        'w-full px-4 py-3 rounded-xl border-2 font-mono text-sm transition-all',
                        'focus:outline-none focus:ring-2',
                        error
                          ? 'border-red-500 focus:ring-red-500/20'
                          : isDark
                            ? 'bg-night-bg border-white/10 focus:border-night-neon-green focus:ring-night-neon-green/20'
                            : 'bg-gray-50 border-gray-200 focus:border-day-accent focus:ring-day-accent/20'
                      )}
                    />
                    {error && (
                      <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}
                  </div>

                  <button
                    onClick={handleManualConnect}
                    disabled={isConnecting || !manualAddress.trim()}
                    className={clsx(
                      'w-full py-3 rounded-xl font-semibold transition-all',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      isDark
                        ? 'bg-night-neon-green text-night-bg hover:shadow-neon-green'
                        : 'bg-day-accent text-white hover:shadow-lg'
                    )}
                  >
                    {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className={clsx(
                'mt-6 pt-4 border-t text-center',
                isDark ? 'border-white/10' : 'border-gray-200'
              )}>
                <p className={clsx(
                  'text-xs',
                  isDark ? 'text-night-muted' : 'text-day-muted'
                )}>
                  Your role is determined by your wallet address.
                  <br />
                  <span className="font-semibold">Recycler</span> and <span className="font-semibold">Manufacturer</span> wallets are pre-registered.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
