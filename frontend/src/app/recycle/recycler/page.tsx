'use client';

import { Header } from '@/components/layout/Header';
import { QRScanner } from '@/components/scanner/QRScanner';
import { ConnectWalletRequired } from '@/components/wallet/ConnectWalletRequired';
import { useWallet } from '@/lib/wallet-context';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  status: string;
  manufacturer_wallet: string;
  customer_wallet?: string;
  manufacturer_deposit?: number;
  customer_escrow?: number;
  total_in_amm?: number;
  created_at: string;
  sold_at?: string;
}

export default function RecyclerPage() {
  const { resolvedTheme } = useTheme();
  const { address, isConnected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');
  const [productId, setProductId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recycledProducts, setRecycledProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({ pending: 0, processing: 0, completed: 0, total: 0 });
  const [showScanner, setShowScanner] = useState(false);

  const isDark = resolvedTheme === 'dark';
  const recyclerWallet = address || 'rnYrUUuqgU5PddJVBu8Hitsw9ejPheKhLd';

  useEffect(() => {
    setMounted(true);
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/products');
      if (res.ok) {
        const products = await res.json();
        const recycled = products.filter((p: Product) => p.status === 'recycled');
        const sold = products.filter((p: Product) => p.status === 'sold');
        setRecycledProducts(recycled.slice(0, 5));
        setStats({
          pending: sold.length,
          processing: 0,
          completed: recycled.length,
          total: products.length
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const lookupProduct = async () => {
    if (!productId.trim()) {
      alert('Please enter a product ID');
      return;
    }

    setIsLoading(true);
    setScannedProduct(null);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/products/${productId}`);
      if (res.ok) {
        const product = await res.json();
        setScannedProduct(product);
      } else {
        alert('Product not found. Please check the ID.');
      }
    } catch (error) {
      console.error('Lookup error:', error);
      alert('Failed to lookup product. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const recycleProduct = async () => {
    if (!scannedProduct) return;

    setIsLoading(true);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/products/${scannedProduct.id}/recycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recycler_wallet: recyclerWallet
        })
      });

      if (res.ok) {
        setShowSuccess(true);
        setScannedProduct(null);
        setProductId('');
        fetchStats();
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        const error = await res.json();
        alert(`Recycle failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Recycle error:', error);
      alert('Failed to recycle product.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle QR code scan result
  const handleQRScan = async (scannedData: string) => {
    console.log('QR Code scanned:', scannedData);
    
    // Extract product ID from scanned data
    // The QR code might contain just the ID or a full URL
    let extractedId = scannedData;
    
    // If it's a URL, try to extract the product ID
    if (scannedData.includes('/')) {
      const parts = scannedData.split('/');
      extractedId = parts[parts.length - 1];
    }
    
    // If it looks like a JSON object, try to parse it
    if (scannedData.startsWith('{')) {
      try {
        const parsed = JSON.parse(scannedData);
        extractedId = parsed.id || parsed.productId || scannedData;
      } catch {
        // Not valid JSON, use as-is
      }
    }
    
    setProductId(extractedId);
    setShowScanner(false);
    
    // Auto-lookup after scanning
    setIsLoading(true);
    setScannedProduct(null);

    try {
      const res = await fetch(`http://localhost:8000/api/v1/products/${extractedId}`);
      if (res.ok) {
        const product = await res.json();
        setScannedProduct(product);
      } else {
        alert('Product not found. The scanned QR code may be invalid.');
      }
    } catch (error) {
      console.error('Lookup error:', error);
      alert('Failed to lookup product. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) return null;

  // Show connect wallet screen if not connected
  if (!isConnected) {
    return (
      <ConnectWalletRequired
        role="recycler"
        title="Recycler Portal"
        description="Connect your verified recycler wallet to process recycling claims and earn rewards."
      />
    );
  }

  return (
    <div className={clsx(
      'min-h-screen',
      isDark ? 'bg-night-bg' : 'bg-day-bg'
    )}>
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50"
          >
            <div className={clsx(
              'px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4',
              isDark 
                ? 'bg-night-surface border-night-neon-green/30' 
                : 'bg-white border-green-200'
            )}>
              <div className="text-3xl">♻️</div>
              <div>
                <div className={clsx('font-semibold', isDark ? 'text-night-text' : 'text-day-text')}>
                  Product Recycled Successfully!
                </div>
                <div className={clsx('text-sm', isDark ? 'text-night-muted' : 'text-day-muted')}>
                  APY rewards distributed to all parties
                </div>
              </div>
              <button 
                onClick={() => setShowSuccess(false)}
                className={clsx('p-1 rounded-full hover:bg-white/10', isDark ? 'text-night-muted' : 'text-day-muted')}
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="pt-28 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Role Badge & Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className={clsx(
              'inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6',
              isDark 
                ? 'bg-night-neon-green/10 border border-night-neon-green/30' 
                : 'bg-green-100 border border-green-200'
            )}>
              <span className="text-2xl">♻️</span>
              <span className={clsx(
                'font-semibold',
                isDark ? 'text-night-neon-green' : 'text-green-700'
              )}>
                Verified Recycling Center
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-logo font-bold">
              <span className={isDark ? 'text-night-text' : 'text-day-text'}>Process</span>
              {' '}
              <span className={isDark ? 'text-night-neon-green' : 'text-green-500'}>Recyclables</span>
            </h1>
          </motion.div>

          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {[
              { label: 'Awaiting Recycle', value: stats.pending.toString(), color: 'yellow', icon: '⏳' },
              { label: 'Processing', value: stats.processing.toString(), color: 'blue', icon: '🔄' },
              { label: 'Completed Today', value: stats.completed.toString(), color: 'green', icon: '✅' },
              { label: 'Total Processed', value: stats.total.toString(), color: 'purple', icon: '📊' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                className={clsx(
                  'text-center p-5 rounded-2xl',
                  isDark ? 'bg-night-surface/50' : 'bg-white shadow-lg'
                )}
              >
                <div className="text-2xl mb-2">{stat.icon}</div>
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
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Scan/Lookup Section */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={clsx(
                'p-6 rounded-3xl border',
                isDark 
                  ? 'bg-night-surface/50 border-white/5' 
                  : 'bg-white border-black/5 shadow-lg'
              )}
            >
              <h3 className={clsx(
                'text-lg font-logo font-bold mb-6',
                isDark ? 'text-night-text' : 'text-day-text'
              )}>
                🔍 Verify Product
              </h3>

              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setScanMode('camera')}
                  className={clsx(
                    'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                    scanMode === 'camera'
                      ? isDark 
                        ? 'bg-night-neon-green text-night-bg' 
                        : 'bg-green-500 text-white'
                      : isDark
                        ? 'bg-night-bg text-night-muted hover:text-night-text'
                        : 'bg-gray-100 text-day-muted hover:text-day-text'
                  )}
                >
                  📷 Scan QR
                </button>
                <button
                  onClick={() => setScanMode('manual')}
                  className={clsx(
                    'flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
                    scanMode === 'manual'
                      ? isDark 
                        ? 'bg-night-neon-green text-night-bg' 
                        : 'bg-green-500 text-white'
                      : isDark
                        ? 'bg-night-bg text-night-muted hover:text-night-text'
                        : 'bg-gray-100 text-day-muted hover:text-day-text'
                  )}
                >
                  ⌨️ Enter ID
                </button>
              </div>

              {scanMode === 'camera' ? (
                <div className="space-y-4">
                  {showScanner ? (
                    <QRScanner
                      onScan={handleQRScan}
                      onClose={() => setShowScanner(false)}
                      onError={(error) => console.error('Scanner error:', error)}
                    />
                  ) : (
                    <div className={clsx(
                      'aspect-video rounded-2xl overflow-hidden relative',
                      isDark ? 'bg-night-bg' : 'bg-gray-100'
                    )}>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div className="text-6xl mb-4">📷</div>
                        <p className={clsx('text-sm mb-2', isDark ? 'text-night-muted' : 'text-day-muted')}>
                          Ready to scan
                        </p>
                        <p className={clsx('text-xs', isDark ? 'text-night-muted/70' : 'text-gray-400')}>
                          Works on desktop webcam and mobile camera
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {!showScanner && (
                    <button
                      onClick={() => setShowScanner(true)}
                      className={clsx(
                        'w-full py-3 rounded-xl font-semibold transition-all',
                        isDark 
                          ? 'bg-night-neon-green text-night-bg hover:opacity-90' 
                          : 'bg-green-500 text-white hover:opacity-90'
                      )}
                    >
                      📷 Open Scanner
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className={clsx(
                      'block text-sm font-medium mb-2',
                      isDark ? 'text-night-muted' : 'text-day-muted'
                    )}>
                      Product ID
                    </label>
                    <input
                      type="text"
                      value={productId}
                      onChange={(e) => setProductId(e.target.value)}
                      placeholder="e.g., abc123-def456-..."
                      className={clsx(
                        'w-full px-4 py-3 rounded-xl border transition-all font-mono',
                        isDark 
                          ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-green' 
                          : 'bg-gray-50 border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-green-500'
                      )}
                    />
                  </div>

                  <button
                    onClick={lookupProduct}
                    disabled={isLoading || !productId.trim()}
                    className={clsx(
                      'w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                      isLoading || !productId.trim()
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:opacity-90',
                      isDark 
                        ? 'bg-night-neon-green text-night-bg' 
                        : 'bg-green-500 text-white'
                    )}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Looking up...
                      </>
                    ) : (
                      <>🔍 Lookup Product</>
                    )}
                  </button>
                </div>
              )}

              {/* Scanned Product Preview */}
              <AnimatePresence>
                {scannedProduct && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={clsx(
                      'mt-6 p-4 rounded-2xl border-2',
                      scannedProduct.status === 'sold'
                        ? isDark 
                          ? 'bg-green-500/10 border-green-500/30' 
                          : 'bg-green-50 border-green-200'
                        : isDark 
                          ? 'bg-yellow-500/10 border-yellow-500/30' 
                          : 'bg-yellow-50 border-yellow-200'
                    )}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">📱</div>
                        <div>
                          <div className={clsx('font-semibold', isDark ? 'text-night-text' : 'text-day-text')}>
                            {scannedProduct.name}
                          </div>
                          <div className={clsx('text-xs font-mono', isDark ? 'text-night-muted' : 'text-day-muted')}>
                            {scannedProduct.id.slice(0, 20)}...
                          </div>
                        </div>
                      </div>
                      <span className={clsx(
                        'px-3 py-1 rounded-full text-xs font-semibold uppercase',
                        scannedProduct.status === 'sold' && (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'),
                        scannedProduct.status === 'registered' && (isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'),
                        scannedProduct.status === 'recycled' && (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'),
                      )}>
                        {scannedProduct.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div>
                        <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>Price</span>
                        <div className={clsx('font-mono font-semibold', isDark ? 'text-night-text' : 'text-day-text')}>
                          ${scannedProduct.price} CUSD
                        </div>
                      </div>
                      <div>
                        <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>Total in AMM</span>
                        <div className={clsx('font-mono font-semibold', isDark ? 'text-night-neon-green' : 'text-green-600')}>
                          ${(scannedProduct.total_in_amm || 0).toFixed(2)} CUSD
                        </div>
                      </div>
                    </div>

                    {scannedProduct.status === 'sold' ? (
                      <button
                        onClick={recycleProduct}
                        disabled={isLoading}
                        className={clsx(
                          'w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                          isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02]',
                          isDark 
                            ? 'bg-gradient-to-r from-night-neon-green to-night-neon-cyan text-night-bg' 
                            : 'bg-gradient-to-r from-green-500 to-cyan-500 text-white'
                        )}
                      >
                        {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>♻️ Confirm Recycle & Distribute APY</>
                        )}
                      </button>
                    ) : scannedProduct.status === 'recycled' ? (
                      <div className={clsx(
                        'w-full py-3 rounded-xl font-semibold text-center',
                        isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                      )}>
                        ✅ Already Recycled
                      </div>
                    ) : (
                      <div className={clsx(
                        'w-full py-3 rounded-xl font-semibold text-center',
                        isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                      )}>
                        ⚠️ Product not yet sold - cannot recycle
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={clsx(
                'p-6 rounded-3xl border',
                isDark 
                  ? 'bg-night-surface/50 border-white/5' 
                  : 'bg-white border-black/5 shadow-lg'
              )}
            >
              <h3 className={clsx(
                'text-lg font-logo font-bold mb-6',
                isDark ? 'text-night-text' : 'text-day-text'
              )}>
                📋 Recent Activity
              </h3>

              {recycledProducts.length > 0 ? (
                <div className="space-y-3">
                  {recycledProducts.map((product, i) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.05 }}
                      className={clsx(
                        'flex items-center justify-between p-4 rounded-xl',
                        isDark ? 'bg-night-bg/50' : 'bg-gray-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          'w-10 h-10 rounded-xl flex items-center justify-center',
                          isDark ? 'bg-night-neon-green/10' : 'bg-green-100'
                        )}>
                          ♻️
                        </div>
                        <div>
                          <div className={clsx('font-medium text-sm', isDark ? 'text-night-text' : 'text-day-text')}>
                            {product.name}
                          </div>
                          <div className={clsx('text-xs font-mono', isDark ? 'text-night-muted' : 'text-day-muted')}>
                            {product.id.slice(0, 16)}...
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={clsx('font-mono text-sm font-semibold', isDark ? 'text-night-neon-green' : 'text-green-600')}>
                          +${((product.total_in_amm || 0) * 0.20).toFixed(2)}
                        </div>
                        <div className={clsx('text-xs', isDark ? 'text-night-muted' : 'text-day-muted')}>
                          Your reward
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className={clsx(
                  'text-center py-12',
                  isDark ? 'text-night-muted' : 'text-day-muted'
                )}>
                  <div className="text-5xl mb-4">📦</div>
                  <p>No recycled products yet</p>
                  <p className="text-sm mt-2">Scan a product to get started</p>
                </div>
              )}

              {/* Quick Stats */}
              <div className={clsx(
                'mt-6 p-4 rounded-xl',
                isDark ? 'bg-gradient-to-r from-green-500/10 to-cyan-500/10' : 'bg-gradient-to-r from-green-50 to-cyan-50'
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className={clsx('text-sm', isDark ? 'text-night-muted' : 'text-day-muted')}>
                      Your Total Earnings
                    </div>
                    <div className={clsx('text-2xl font-logo font-bold', isDark ? 'text-night-neon-green' : 'text-green-600')}>
                      $0.00 CUSD
                    </div>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
