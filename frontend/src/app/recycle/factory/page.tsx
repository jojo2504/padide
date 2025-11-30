'use client';

import { Header } from '@/components/layout/Header';
import { ConnectWalletRequired } from '@/components/wallet/ConnectWalletRequired';
import { useWallet } from '@/lib/wallet-context';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';

// Product presets for demo
const PRODUCT_PRESETS = {
  iphone17: {
    name: 'iPhone 17 Pro Max',
    description: 'Apple iPhone 17 Pro Max - 256GB - Natural Titanium. Features A19 Pro chip, 48MP camera system, and titanium design. Manufactured with recycled materials.',
    serial_number: 'APPL-IP17-2025-001',
    image: '/product_images/iphone_17.png',
    price: 1199,
    expiryDays: 730, // 2 years warranty
    materials: '45% Recycled Aluminum, 25% Recycled Rare Earth, 20% Glass, 10% Plastic'
  }
};

// Fee constants (matching backend)
const MANUFACTURER_DEPOSIT_PERCENT = 5.0;
const CUSTOMER_ESCROW_PERCENT = 5.0;
const CYCLR_FEE_PERCENT = 1.0;

// APY distribution
const APY_USER_SHARE = 40;
const APY_MANUFACTURER_SHARE = 20;
const APY_RECYCLER_SHARE = 20;
const APY_ECO_FUND_SHARE = 20;

interface ProductForm {
  name: string;
  description: string;
  serial_number: string;
  price: number;
  expiryDays: number;
  materials: string;
}

interface RegisteredProduct {
  id: string;
  name: string;
  price: number;
  status: string;
  manufacturer_deposit: number;
  manufacturer_wallet?: string;
  created_at: string;
  expires_at: string;
  nft_id?: string;
}

// Simple QR Code component using Canvas
function QRCodeDisplay({ value, size = 200 }: { value: string; size?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple visual QR-like pattern (not a real QR code encoder)
    // For production, use a proper QR library like 'qrcode'
    const cellSize = size / 25;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000000';

    // Create deterministic pattern from value
    const hash = value.split('').reduce((acc, char, i) => acc + char.charCodeAt(0) * (i + 1), 0);
    
    // Draw finder patterns (corners)
    const drawFinder = (x: number, y: number) => {
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          if (i === 0 || i === 6 || j === 0 || j === 6 || (i >= 2 && i <= 4 && j >= 2 && j <= 4)) {
            ctx.fillRect((x + i) * cellSize, (y + j) * cellSize, cellSize, cellSize);
          }
        }
      }
    };
    
    drawFinder(0, 0);
    drawFinder(18, 0);
    drawFinder(0, 18);
    
    // Draw data pattern
    for (let i = 8; i < 17; i++) {
      for (let j = 8; j < 17; j++) {
        const shouldFill = ((hash * i * j) % 3) === 0;
        if (shouldFill) {
          ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
        }
      }
    }
    
    // Timing patterns
    for (let i = 8; i < 17; i++) {
      if (i % 2 === 0) {
        ctx.fillRect(i * cellSize, 6 * cellSize, cellSize, cellSize);
        ctx.fillRect(6 * cellSize, i * cellSize, cellSize, cellSize);
      }
    }
  }, [value, size]);

  return <canvas ref={canvasRef} width={size} height={size} className="rounded-lg" />;
}

export default function FactoryRecyclePage() {
  const { resolvedTheme } = useTheme();
  const { address, isConnected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'create' | 'products'>('create');
  const [isLoading, setIsLoading] = useState(false);
  const [registeredProducts, setRegisteredProducts] = useState<RegisteredProduct[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastProduct, setLastProduct] = useState<RegisteredProduct | null>(null);
  
  // Form state
  const [form, setForm] = useState<ProductForm>({
    name: '',
    description: '',
    serial_number: '',
    price: 0,
    expiryDays: 365,
    materials: ''
  });

  const isDark = resolvedTheme === 'dark';
  const manufacturerWallet = address || 'rfHrTMepc23WLFgnFtxpd1LPa52sT7qKoK';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch products when connected
  useEffect(() => {
    if (isConnected && address) {
      fetchProducts();
    }
  }, [isConnected, address]);

  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/products');
      if (res.ok) {
        const data = await res.json();
        // Filter to show only products from this manufacturer
        const myProducts = data.filter((p: RegisteredProduct) => 
          !address || p.manufacturer_wallet === address
        );
        setRegisteredProducts(myProducts);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const loadPreset = (presetKey: keyof typeof PRODUCT_PRESETS) => {
    const preset = PRODUCT_PRESETS[presetKey];
    setForm({
      name: preset.name,
      description: preset.description,
      serial_number: preset.serial_number,
      price: preset.price,
      expiryDays: preset.expiryDays,
      materials: preset.materials
    });
  };

  const calculateFees = () => {
    const manufacturerDeposit = form.price * (MANUFACTURER_DEPOSIT_PERCENT / 100);
    const customerEscrow = form.price * (CUSTOMER_ESCROW_PERCENT / 100);
    const cyclrFee = form.price * (CYCLR_FEE_PERCENT / 100);
    const totalToAMM = manufacturerDeposit + customerEscrow;
    
    // Simulated APY (10% annual for demo)
    const annualAPY = totalToAMM * 0.10;
    const userAPY = annualAPY * (APY_USER_SHARE / 100);
    const manufacturerAPY = annualAPY * (APY_MANUFACTURER_SHARE / 100);
    const recyclerAPY = annualAPY * (APY_RECYCLER_SHARE / 100);
    const ecoFundAPY = annualAPY * (APY_ECO_FUND_SHARE / 100);

    return {
      manufacturerDeposit,
      customerEscrow,
      cyclrFee,
      totalToAMM,
      annualAPY,
      userAPY,
      manufacturerAPY,
      recyclerAPY,
      ecoFundAPY
    };
  };

  const registerProduct = async () => {
    if (!form.name || !form.price) {
      alert('Please fill in product name and price');
      return;
    }

    setIsLoading(true);
    
    try {
      const res = await fetch('http://localhost:8000/api/v1/products/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          serial_number: form.serial_number || `SN-${Date.now()}`,
          price: form.price,
          manufacturer_wallet: manufacturerWallet,
          expiry_days: form.expiryDays
        })
      });

      if (res.ok) {
        const product = await res.json();
        setLastProduct(product);
        setShowSuccess(true);
        fetchProducts();
        
        // Reset form
        setForm({
          name: '',
          description: '',
          serial_number: '',
          price: 0,
          expiryDays: 365,
          materials: ''
        });

        // Auto-hide success after 5 seconds
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        const error = await res.json();
        alert(`Registration failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register product. Is the backend running?');
    } finally {
      setIsLoading(false);
    }
  };

  const fees = calculateFees();

  if (!mounted) return null;

  // Show connect wallet screen if not connected
  if (!isConnected) {
    return (
      <ConnectWalletRequired
        role="manufacturer"
        title="Manufacturer Portal"
        description="Connect your verified manufacturer wallet to register products on CYCLR and earn recycling rewards."
      />
    );
  }

  return (
    <div className={clsx(
      'min-h-screen',
      isDark ? 'bg-night-bg' : 'bg-day-bg'
    )}>
      {/* Success Modal with Product ID and QR Code */}
      <AnimatePresence>
        {showSuccess && lastProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                'w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden',
                isDark ? 'bg-night-surface border-green-500/30' : 'bg-white border-green-200'
              )}
            >
              {/* Header */}
              <div className={clsx(
                'p-6 text-center border-b',
                isDark ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-100'
              )}>
                <div className="text-5xl mb-3">✅</div>
                <h2 className={clsx('text-2xl font-logo font-bold', isDark ? 'text-night-text' : 'text-day-text')}>
                  Product Registered!
                </h2>
                <p className={clsx('text-sm mt-1', isDark ? 'text-night-muted' : 'text-day-muted')}>
                  {lastProduct.name}
                </p>
              </div>

              {/* Product ID Section */}
              <div className="p-6 space-y-6">
                {/* QR Code */}
                <div className="flex flex-col items-center">
                  <div className={clsx(
                    'p-4 rounded-xl mb-4',
                    isDark ? 'bg-white' : 'bg-gray-50'
                  )}>
                    <QRCodeDisplay value={lastProduct.id} size={180} />
                  </div>
                  <p className={clsx('text-xs', isDark ? 'text-night-muted' : 'text-day-muted')}>
                    Scan this QR code at point of sale or recycling
                  </p>
                </div>

                {/* Product ID with Copy */}
                <div className={clsx(
                  'p-4 rounded-xl',
                  isDark ? 'bg-night-bg/50' : 'bg-gray-50'
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={clsx('text-sm font-medium', isDark ? 'text-night-muted' : 'text-day-muted')}>
                      Product ID
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lastProduct.id);
                        alert('Product ID copied to clipboard!');
                      }}
                      className={clsx(
                        'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                        isDark 
                          ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30' 
                          : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200'
                      )}
                    >
                      📋 Copy
                    </button>
                  </div>
                  <div className={clsx(
                    'font-mono text-sm break-all p-3 rounded-lg',
                    isDark ? 'bg-night-bg text-cyan-400' : 'bg-white text-cyan-700 border border-gray-200'
                  )}>
                    {lastProduct.id}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={clsx(
                    'p-3 rounded-xl text-center',
                    isDark ? 'bg-purple-500/10' : 'bg-purple-50'
                  )}>
                    <div className={clsx('text-sm', isDark ? 'text-night-muted' : 'text-day-muted')}>
                      Your Deposit
                    </div>
                    <div className={clsx('font-mono font-bold', isDark ? 'text-purple-400' : 'text-purple-600')}>
                      ${lastProduct.manufacturer_deposit?.toFixed(2)}
                    </div>
                  </div>
                  <div className={clsx(
                    'p-3 rounded-xl text-center',
                    isDark ? 'bg-green-500/10' : 'bg-green-50'
                  )}>
                    <div className={clsx('text-sm', isDark ? 'text-night-muted' : 'text-day-muted')}>
                      Status
                    </div>
                    <div className={clsx('font-semibold capitalize', isDark ? 'text-green-400' : 'text-green-600')}>
                      {lastProduct.status}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowSuccess(false);
                      setActiveTab('products');
                    }}
                    className={clsx(
                      'flex-1 py-3 rounded-xl font-medium transition-all',
                      isDark 
                        ? 'bg-night-bg text-night-text hover:bg-night-bg/70' 
                        : 'bg-gray-100 text-day-text hover:bg-gray-200'
                    )}
                  >
                    View All Products
                  </button>
                  <button
                    onClick={() => setShowSuccess(false)}
                    className={clsx(
                      'flex-1 py-3 rounded-xl font-medium transition-all',
                      isDark 
                        ? 'bg-green-500 text-night-bg hover:bg-green-400' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    )}
                  >
                    Create Another
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Role Badge & Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className={clsx(
              'inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6',
              isDark 
                ? 'bg-night-neon-purple/10 border border-night-neon-purple/30' 
                : 'bg-purple-100 border border-purple-200'
            )}>
              <span className="text-2xl">🏭</span>
              <span className={clsx(
                'font-semibold',
                isDark ? 'text-night-neon-purple' : 'text-purple-700'
              )}>
                Manufacturer Demo Panel
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-logo font-bold">
              <span className={isDark ? 'text-night-text' : 'text-day-text'}>Product</span>
              {' '}
              <span className={isDark ? 'text-night-neon-purple' : 'text-purple-500'}>Registration</span>
            </h1>
          </motion.div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className={clsx(
              'inline-flex p-1 rounded-full',
              isDark ? 'bg-night-surface' : 'bg-day-surface'
            )}>
              {[
                { id: 'create', label: '➕ Create Product', icon: '📦' },
                { id: 'products', label: '📋 My Products', icon: '📋' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'create' | 'products')}
                  className={clsx(
                    'px-6 py-2 rounded-full text-sm font-medium transition-all',
                    activeTab === tab.id
                      ? isDark
                        ? 'bg-night-neon-purple text-white'
                        : 'bg-purple-500 text-white'
                      : isDark
                        ? 'text-night-muted hover:text-night-text'
                        : 'text-day-muted hover:text-day-text'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Create Product Tab */}
          {activeTab === 'create' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Left: Form */}
              <div className={clsx(
                'p-6 rounded-3xl border',
                isDark 
                  ? 'bg-night-surface/50 border-white/5' 
                  : 'bg-white border-black/5 shadow-lg'
              )}>
                {/* Quick Presets */}
                <div className="mb-6">
                  <label className={clsx(
                    'block text-sm font-medium mb-3',
                    isDark ? 'text-night-muted' : 'text-day-muted'
                  )}>
                    🎯 Quick Demo Presets
                  </label>
                  <button
                    onClick={() => loadPreset('iphone17')}
                    className={clsx(
                      'flex items-center gap-3 w-full p-4 rounded-xl border-2 border-dashed transition-all hover:scale-[1.02]',
                      isDark 
                        ? 'border-night-neon-purple/30 hover:border-night-neon-purple/60 hover:bg-night-neon-purple/5' 
                        : 'border-purple-200 hover:border-purple-400 hover:bg-purple-50'
                    )}
                  >
                    <div className="text-4xl">📱</div>
                    <div className="text-left">
                      <div className={clsx('font-semibold', isDark ? 'text-night-text' : 'text-day-text')}>
                        iPhone 17 Pro Max
                      </div>
                      <div className={clsx('text-sm', isDark ? 'text-night-muted' : 'text-day-muted')}>
                        Apple • $1,199 CUSD • 2 Year Warranty
                      </div>
                    </div>
                    <div className={clsx(
                      'ml-auto px-3 py-1 rounded-full text-xs font-semibold',
                      isDark ? 'bg-night-neon-green/20 text-night-neon-green' : 'bg-green-100 text-green-700'
                    )}>
                      LOAD
                    </div>
                  </button>
                </div>

                <div className="border-t border-dashed my-6" style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-night-muted' : 'text-day-muted')}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., iPhone 17 Pro Max"
                      className={clsx(
                        'w-full px-4 py-3 rounded-xl border transition-all',
                        isDark 
                          ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-purple' 
                          : 'bg-day-bg border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-purple-500'
                      )}
                    />
                  </div>

                  <div>
                    <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-night-muted' : 'text-day-muted')}>
                      Serial Number
                    </label>
                    <input
                      type="text"
                      value={form.serial_number}
                      onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
                      placeholder="e.g., APPL-IP17-2025-001"
                      className={clsx(
                        'w-full px-4 py-3 rounded-xl border transition-all',
                        isDark 
                          ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-purple' 
                          : 'bg-day-bg border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-purple-500'
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-night-muted' : 'text-day-muted')}>
                        Price (CUSD) *
                      </label>
                      <input
                        type="number"
                        value={form.price || ''}
                        onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                        placeholder="1199"
                        className={clsx(
                          'w-full px-4 py-3 rounded-xl border transition-all',
                          isDark 
                            ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-purple' 
                            : 'bg-day-bg border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-purple-500'
                        )}
                      />
                    </div>
                    <div>
                      <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-night-muted' : 'text-day-muted')}>
                        Warranty (days)
                      </label>
                      <input
                        type="number"
                        value={form.expiryDays}
                        onChange={(e) => setForm({ ...form, expiryDays: parseInt(e.target.value) || 365 })}
                        placeholder="730"
                        className={clsx(
                          'w-full px-4 py-3 rounded-xl border transition-all',
                          isDark 
                            ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-purple' 
                            : 'bg-day-bg border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-purple-500'
                        )}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-night-muted' : 'text-day-muted')}>
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      placeholder="Product description..."
                      className={clsx(
                        'w-full px-4 py-3 rounded-xl border transition-all resize-none',
                        isDark 
                          ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-purple' 
                          : 'bg-day-bg border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-purple-500'
                      )}
                    />
                  </div>

                  <div>
                    <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-night-muted' : 'text-day-muted')}>
                      Recyclable Materials
                    </label>
                    <input
                      type="text"
                      value={form.materials}
                      onChange={(e) => setForm({ ...form, materials: e.target.value })}
                      placeholder="e.g., 45% Aluminum, 25% Rare Earth, 20% Glass, 10% Plastic"
                      className={clsx(
                        'w-full px-4 py-3 rounded-xl border transition-all',
                        isDark 
                          ? 'bg-night-bg border-white/10 text-night-text placeholder:text-night-muted/50 focus:border-night-neon-purple' 
                          : 'bg-day-bg border-black/10 text-day-text placeholder:text-day-muted/50 focus:border-purple-500'
                      )}
                    />
                  </div>
                </div>

                {/* Register Button */}
                <button
                  onClick={registerProduct}
                  disabled={isLoading || !form.name || !form.price}
                  className={clsx(
                    'w-full mt-6 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2',
                    isLoading || !form.name || !form.price
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-[1.02]',
                    isDark 
                      ? 'bg-gradient-to-r from-night-neon-purple to-night-neon-magenta text-white' 
                      : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  )}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Registering on XRPL...
                    </>
                  ) : (
                    <>
                      📦 Register Product
                    </>
                  )}
                </button>
              </div>

              {/* Right: Fee Breakdown */}
              <div className="space-y-6">
                {/* Live Fee Calculator */}
                <div className={clsx(
                  'p-6 rounded-3xl border',
                  isDark 
                    ? 'bg-night-surface/50 border-white/5' 
                    : 'bg-white border-black/5 shadow-lg'
                )}>
                  <h3 className={clsx(
                    'text-lg font-logo font-bold mb-4 flex items-center gap-2',
                    isDark ? 'text-night-text' : 'text-day-text'
                  )}>
                    💰 Fee Breakdown
                    {form.price > 0 && (
                      <span className={clsx(
                        'text-xs font-normal px-2 py-1 rounded-full',
                        isDark ? 'bg-night-neon-green/20 text-night-neon-green' : 'bg-green-100 text-green-700'
                      )}>
                        LIVE
                      </span>
                    )}
                  </h3>

                  <div className="space-y-3">
                    <div className={clsx(
                      'flex justify-between items-center p-3 rounded-xl',
                      isDark ? 'bg-night-bg/50' : 'bg-gray-50'
                    )}>
                      <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>Product Price</span>
                      <span className={clsx('font-mono font-bold', isDark ? 'text-night-text' : 'text-day-text')}>
                        ${form.price.toFixed(2)} CUSD
                      </span>
                    </div>

                    <div className={clsx(
                      'flex justify-between items-center p-3 rounded-xl',
                      isDark ? 'bg-purple-500/10' : 'bg-purple-50'
                    )}>
                      <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>
                        Your Deposit ({MANUFACTURER_DEPOSIT_PERCENT}%)
                      </span>
                      <span className={clsx('font-mono font-bold', isDark ? 'text-night-neon-purple' : 'text-purple-600')}>
                        ${fees.manufacturerDeposit.toFixed(2)} CUSD
                      </span>
                    </div>

                    <div className={clsx(
                      'flex justify-between items-center p-3 rounded-xl',
                      isDark ? 'bg-blue-500/10' : 'bg-blue-50'
                    )}>
                      <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>
                        Customer Escrow ({CUSTOMER_ESCROW_PERCENT}%)
                      </span>
                      <span className={clsx('font-mono font-bold', isDark ? 'text-blue-400' : 'text-blue-600')}>
                        ${fees.customerEscrow.toFixed(2)} CUSD
                      </span>
                    </div>

                    <div className={clsx(
                      'flex justify-between items-center p-3 rounded-xl',
                      isDark ? 'bg-night-neon-green/10' : 'bg-green-50'
                    )}>
                      <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>
                        Total in AMM Pool
                      </span>
                      <span className={clsx('font-mono font-bold', isDark ? 'text-night-neon-green' : 'text-green-600')}>
                        ${fees.totalToAMM.toFixed(2)} CUSD
                      </span>
                    </div>
                  </div>
                </div>

                {/* APY Distribution */}
                <div className={clsx(
                  'p-6 rounded-3xl border',
                  isDark 
                    ? 'bg-night-surface/50 border-white/5' 
                    : 'bg-white border-black/5 shadow-lg'
                )}>
                  <h3 className={clsx(
                    'text-lg font-logo font-bold mb-4',
                    isDark ? 'text-night-text' : 'text-day-text'
                  )}>
                    📊 APY Distribution (on recycle)
                  </h3>

                  <div className="space-y-3">
                    <div className={clsx('text-center text-sm mb-4 p-2 rounded-lg', isDark ? 'bg-night-bg/50 text-night-muted' : 'bg-gray-100 text-day-muted')}>
                      Estimated ~10% APY → ${fees.annualAPY.toFixed(2)}/year
                    </div>

                    {[
                      { label: 'Customer', percent: APY_USER_SHARE, value: fees.userAPY, emoji: '👤', color: 'blue' },
                      { label: 'Manufacturer', percent: APY_MANUFACTURER_SHARE, value: fees.manufacturerAPY, emoji: '🏭', color: 'purple' },
                      { label: 'Recycler', percent: APY_RECYCLER_SHARE, value: fees.recyclerAPY, emoji: '♻️', color: 'green' },
                      { label: 'Eco Fund', percent: APY_ECO_FUND_SHARE, value: fees.ecoFundAPY, emoji: '🌍', color: 'cyan' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <div className="text-xl">{item.emoji}</div>
                        <div className="flex-1">
                          <div className={clsx(
                            'h-2 rounded-full overflow-hidden',
                            isDark ? 'bg-night-bg' : 'bg-gray-200'
                          )}>
                            <div 
                              className={clsx(
                                'h-full rounded-full transition-all',
                                item.color === 'blue' && (isDark ? 'bg-blue-500' : 'bg-blue-500'),
                                item.color === 'purple' && (isDark ? 'bg-purple-500' : 'bg-purple-500'),
                                item.color === 'green' && (isDark ? 'bg-night-neon-green' : 'bg-green-500'),
                                item.color === 'cyan' && (isDark ? 'bg-cyan-500' : 'bg-cyan-500'),
                              )}
                              style={{ width: `${item.percent}%` }}
                            />
                          </div>
                        </div>
                        <div className={clsx('text-sm font-mono', isDark ? 'text-night-muted' : 'text-day-muted')}>
                          {item.percent}%
                        </div>
                        <div className={clsx('text-sm font-mono font-bold w-20 text-right', isDark ? 'text-night-text' : 'text-day-text')}>
                          ${item.value.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Transaction Flow */}
                <div className={clsx(
                  'p-6 rounded-3xl border',
                  isDark 
                    ? 'bg-night-surface/50 border-white/5' 
                    : 'bg-white border-black/5 shadow-lg'
                )}>
                  <h3 className={clsx(
                    'text-lg font-logo font-bold mb-4',
                    isDark ? 'text-night-text' : 'text-day-text'
                  )}>
                    🔄 Transaction Flow
                  </h3>

                  <div className="space-y-2 text-sm">
                    {[
                      { step: '1', text: 'Manufacturer deposits 5% → AMM Pool', icon: '🏭➡️💧' },
                      { step: '2', text: 'Customer pays price + 5% escrow', icon: '👤➡️💰' },
                      { step: '3', text: 'CYCLR takes 1% fee, 99% to manufacturer', icon: '💸' },
                      { step: '4', text: 'Customer escrow → AMM Pool', icon: '💧' },
                      { step: '5', text: 'On recycle: APY distributed to all parties', icon: '♻️✨' },
                    ].map((item) => (
                      <div key={item.step} className={clsx(
                        'flex items-center gap-3 p-2 rounded-lg',
                        isDark ? 'hover:bg-night-bg/50' : 'hover:bg-gray-50'
                      )}>
                        <div className={clsx(
                          'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                          isDark ? 'bg-night-neon-purple/20 text-night-neon-purple' : 'bg-purple-100 text-purple-600'
                        )}>
                          {item.step}
                        </div>
                        <div className={isDark ? 'text-night-muted' : 'text-day-muted'}>
                          {item.text}
                        </div>
                        <div className="ml-auto">{item.icon}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {registeredProducts.length === 0 ? (
                <div className={clsx(
                  'text-center py-16 rounded-3xl border',
                  isDark ? 'bg-night-surface/50 border-white/5' : 'bg-white border-black/5'
                )}>
                  <div className="text-6xl mb-4">📦</div>
                  <div className={clsx('text-xl font-semibold mb-2', isDark ? 'text-night-text' : 'text-day-text')}>
                    No Products Yet
                  </div>
                  <div className={clsx('text-sm mb-6', isDark ? 'text-night-muted' : 'text-day-muted')}>
                    Register your first product to start tracking
                  </div>
                  <button
                    onClick={() => setActiveTab('create')}
                    className={clsx(
                      'px-6 py-3 rounded-full font-semibold transition-all',
                      isDark 
                        ? 'bg-night-neon-purple text-white hover:opacity-90' 
                        : 'bg-purple-500 text-white hover:opacity-90'
                    )}
                  >
                    ➕ Create Product
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {registeredProducts.map((product) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={clsx(
                        'rounded-2xl border transition-all hover:scale-[1.02] overflow-hidden',
                        isDark 
                          ? 'bg-night-surface/50 border-white/5 hover:border-night-neon-purple/30' 
                          : 'bg-white border-black/5 shadow-lg hover:border-purple-200'
                      )}
                    >
                      {/* Product Header */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-3xl">📱</div>
                          <span className={clsx(
                            'px-2 py-1 rounded-full text-xs font-semibold uppercase',
                            product.status === 'registered' && (isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'),
                            product.status === 'sold' && (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'),
                            product.status === 'recycled' && (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'),
                            product.status === 'expired' && (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700'),
                          )}>
                            {product.status}
                          </span>
                        </div>
                        
                        <h3 className={clsx('font-semibold mb-2', isDark ? 'text-night-text' : 'text-day-text')}>
                          {product.name}
                        </h3>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>Price</span>
                            <span className={clsx('font-mono', isDark ? 'text-night-text' : 'text-day-text')}>
                              ${product.price} CUSD
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>Deposit</span>
                            <span className={clsx('font-mono', isDark ? 'text-night-neon-purple' : 'text-purple-600')}>
                              ${product.manufacturer_deposit?.toFixed(2)} CUSD
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>Created</span>
                            <span className={clsx('font-mono text-xs', isDark ? 'text-night-muted' : 'text-day-muted')}>
                              {new Date(product.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Product ID Section */}
                      <div className={clsx(
                        'px-6 py-4 border-t',
                        isDark ? 'bg-night-bg/30 border-white/5' : 'bg-gray-50 border-black/5'
                      )}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={clsx('text-xs', isDark ? 'text-night-muted' : 'text-day-muted')}>
                            Product ID
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(product.id);
                              alert('Product ID copied!');
                            }}
                            className={clsx(
                              'px-2 py-0.5 rounded text-[10px] font-medium',
                              isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-700'
                            )}
                          >
                            Copy
                          </button>
                        </div>
                        <div className={clsx(
                          'font-mono text-xs p-2 rounded break-all',
                          isDark ? 'bg-night-bg text-cyan-400' : 'bg-white text-cyan-700 border border-gray-200'
                        )}>
                          {product.id}
                        </div>
                      </div>

                      {product.nft_id && (
                        <div className={clsx(
                          'px-6 py-3 border-t text-xs',
                          isDark ? 'border-white/5' : 'border-black/5'
                        )}>
                          <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>NFT: </span>
                          <span className={clsx('font-mono', isDark ? 'text-purple-400' : 'text-purple-600')}>
                            {product.nft_id.slice(0, 20)}...
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
