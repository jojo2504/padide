'use client';

import { Header } from '@/components/layout/Header';
import { ConnectWalletRequired } from '@/components/wallet/ConnectWalletRequired';
import { registerCustomerWallet, useWallet } from '@/lib/wallet-context';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  status: string;
  manufacturer_wallet?: string;
  customer_wallet?: string;
  customer_escrow?: number;
  manufacturer_deposit?: number;
  total_in_amm?: number;
  created_at: string;
  sold_at?: string;
  apy_earned?: number;
  // Enriched fields for owned products
  escrow?: number;
  daysHeld?: number;
  apyEarned?: number;
  projectedAPY?: number;
  purchaseDate?: string;
}

// Fee constants
const CUSTOMER_ESCROW_PERCENT = 5.0;
const CYCLR_FEE_PERCENT = 1.0;
const ESTIMATED_APY = 10.0; // 10% annual

export default function ClientRecyclePage() {
  const { resolvedTheme } = useTheme();
  const { address, isConnected } = useWallet();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'shop' | 'portfolio'>('shop');
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [buyingProduct, setBuyingProduct] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastPurchase, setLastPurchase] = useState<Product | null>(null);
  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch products when wallet is connected
  useEffect(() => {
    if (mounted) {
      fetchProducts();
    }
  }, [mounted, address]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/products');
      if (res.ok) {
        const allProducts = await res.json();
        
        // Available for purchase (status = registered)
        const available = allProducts.filter((p: Product) => p.status === 'registered');
        setAvailableProducts(available);
        
        // My products (owned by this customer)
        if (address) {
          const owned = allProducts.filter(
            (p: Product) => p.customer_wallet === address && (p.status === 'sold' || p.status === 'recycled')
          );
          
          // Enrich with calculated fields
          const enriched = owned.map((p: Product) => {
            const soldDate = p.sold_at ? new Date(p.sold_at) : new Date();
            const daysHeld = Math.floor((Date.now() - soldDate.getTime()) / (1000 * 60 * 60 * 24));
            const escrow = p.customer_escrow || p.price * 0.05;
            const dailyAPY = escrow * (ESTIMATED_APY / 100) / 365;
            const apyEarned = dailyAPY * Math.max(daysHeld, 0);
            const projectedAPY = escrow * (ESTIMATED_APY / 100);
            
            return {
              ...p,
              escrow,
              daysHeld: Math.max(daysHeld, 0),
              apyEarned,
              projectedAPY,
              purchaseDate: p.sold_at?.split('T')[0] || 'Unknown'
            };
          });
          
          setMyProducts(enriched);
        }
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate purchase details
  const calculatePurchase = (price: number) => {
    const escrow = price * (CUSTOMER_ESCROW_PERCENT / 100);
    const cyclrFee = price * (CYCLR_FEE_PERCENT / 100);
    const total = price + escrow;
    const yearlyAPY = escrow * (ESTIMATED_APY / 100) * 0.4; // Customer gets 40% of APY
    const manufacturerReceives = price - cyclrFee;
    
    return { escrow, cyclrFee, total, yearlyAPY, manufacturerReceives };
  };

  // Buy a product
  const buyProduct = async (product: Product) => {
    if (!address) {
      alert('Please connect your wallet first');
      return;
    }
    
    setBuyingProduct(product.id);
    
    try {
      const res = await fetch(`http://localhost:8000/api/v1/products/${product.id}/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_wallet: address
        })
      });

      if (res.ok) {
        const updatedProduct = await res.json();
        registerCustomerWallet(address);
        setLastPurchase(updatedProduct);
        setShowSuccess(true);
        fetchProducts();
        setActiveTab('portfolio');
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        const error = await res.json();
        alert(`Purchase failed: ${error.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Failed to purchase product. Is the backend running?');
    } finally {
      setBuyingProduct(null);
    }
  };

  // Calculate portfolio totals
  const totalLocked = myProducts.reduce((sum, p) => sum + (p.escrow || 0), 0);
  const totalAPYEarned = myProducts.reduce((sum, p) => sum + (p.apyEarned || 0), 0);
  const projectedAnnualAPY = myProducts.reduce((sum, p) => sum + (p.projectedAPY || 0), 0);

  if (!mounted) return null;

  if (!isConnected) {
    return (
      <ConnectWalletRequired
        role="customer"
        title="Customer Dashboard"
        description="Connect your wallet to browse products, make purchases, and track your APY earnings."
      />
    );
  }

  return (
    <div className={clsx('min-h-screen', isDark ? 'bg-night-bg' : 'bg-day-bg')}>
      {/* Success Toast */}
      <AnimatePresence>
        {showSuccess && lastPurchase && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -50, x: '-50%' }}
            className="fixed top-24 left-1/2 z-50"
          >
            <div className={clsx(
              'px-6 py-4 rounded-2xl shadow-2xl border flex items-center gap-4',
              isDark ? 'bg-night-surface border-cyan-500/30' : 'bg-white border-cyan-200'
            )}>
              <div className="text-3xl">🎉</div>
              <div>
                <div className={clsx('font-semibold', isDark ? 'text-night-text' : 'text-day-text')}>
                  Purchase Successful!
                </div>
                <div className={clsx('text-sm', isDark ? 'text-night-muted' : 'text-day-muted')}>
                  {lastPurchase.name} - Your escrow is now earning APY
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

      <Header />

      <main className="pt-28 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className={clsx(
              'inline-flex items-center gap-3 px-6 py-3 rounded-full mb-6',
              isDark ? 'bg-cyan-500/10 border border-cyan-500/30' : 'bg-cyan-100 border border-cyan-200'
            )}>
              <span className="text-2xl">👤</span>
              <span className={clsx('font-semibold', isDark ? 'text-cyan-400' : 'text-cyan-700')}>
                Customer Dashboard
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-logo font-bold">
              <span className={isDark ? 'text-night-text' : 'text-day-text'}>Shop &</span>
              {' '}
              <span className={isDark ? 'text-cyan-400' : 'text-cyan-500'}>Earn</span>
            </h1>
          </motion.div>

          {/* Tabs */}
          <div className="flex justify-center mb-8">
            <div className={clsx(
              'inline-flex p-1 rounded-full',
              isDark ? 'bg-night-surface' : 'bg-gray-100'
            )}>
              {[
                { id: 'shop', label: '🛒 Shop Products', count: availableProducts.length },
                { id: 'portfolio', label: '📊 My Portfolio', count: myProducts.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'shop' | 'portfolio')}
                  className={clsx(
                    'px-6 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-2',
                    activeTab === tab.id
                      ? isDark
                        ? 'bg-cyan-500 text-night-bg'
                        : 'bg-cyan-500 text-white'
                      : isDark
                        ? 'text-night-muted hover:text-night-text'
                        : 'text-day-muted hover:text-day-text'
                  )}
                >
                  {tab.label}
                  <span className={clsx(
                    'px-2 py-0.5 rounded-full text-xs',
                    activeTab === tab.id
                      ? 'bg-white/20'
                      : isDark ? 'bg-white/10' : 'bg-black/10'
                  )}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* SHOP TAB */}
          {activeTab === 'shop' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full" />
                </div>
              ) : availableProducts.length === 0 ? (
                <div className={clsx(
                  'text-center py-20 rounded-3xl border',
                  isDark ? 'bg-night-surface/50 border-white/5' : 'bg-white border-black/5'
                )}>
                  <div className="text-6xl mb-4">🏪</div>
                  <h3 className={clsx('text-xl font-bold mb-2', isDark ? 'text-night-text' : 'text-day-text')}>
                    No Products Available
                  </h3>
                  <p className={isDark ? 'text-night-muted' : 'text-day-muted'}>
                    Check back later for new CYCLR-registered products
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {availableProducts.map((product, i) => {
                    const calc = calculatePurchase(product.price);
                    const isSelected = selectedProduct === product.id;
                    const isBuying = buyingProduct === product.id;
                    
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={clsx(
                          'rounded-3xl border overflow-hidden transition-all',
                          isSelected
                            ? isDark ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/10' : 'border-cyan-300 shadow-lg'
                            : isDark ? 'border-white/5 hover:border-white/10' : 'border-black/5 hover:border-black/10',
                          isDark ? 'bg-night-surface/50' : 'bg-white'
                        )}
                      >
                        {/* Product Header */}
                        <div className={clsx(
                          'p-6 border-b',
                          isDark ? 'border-white/5' : 'border-black/5'
                        )}>
                          <div className="flex items-start justify-between mb-4">
                            <div className="text-4xl">📱</div>
                            <span className={clsx(
                              'px-3 py-1 rounded-full text-xs font-semibold',
                              isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'
                            )}>
                              Available
                            </span>
                          </div>
                          <h3 className={clsx(
                            'text-xl font-bold mb-1',
                            isDark ? 'text-night-text' : 'text-day-text'
                          )}>
                            {product.name}
                          </h3>
                          <p className={clsx(
                            'text-sm line-clamp-2',
                            isDark ? 'text-night-muted' : 'text-day-muted'
                          )}>
                            {product.description || 'CYCLR-registered product with sustainability tracking'}
                          </p>
                        </div>

                        {/* Pricing */}
                        <div className={clsx('p-6', isDark ? 'bg-night-bg/50' : 'bg-gray-50')}>
                          <div className="flex items-center justify-between mb-4">
                            <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>Price</span>
                            <span className={clsx(
                              'text-2xl font-logo font-bold',
                              isDark ? 'text-night-text' : 'text-day-text'
                            )}>
                              ${product.price.toFixed(2)}
                            </span>
                          </div>

                          {/* Expand/Collapse Details */}
                          <button
                            onClick={() => setSelectedProduct(isSelected ? null : product.id)}
                            className={clsx(
                              'w-full text-sm flex items-center justify-center gap-2 py-2',
                              isDark ? 'text-cyan-400' : 'text-cyan-600'
                            )}
                          >
                            {isSelected ? 'Hide Details' : 'View Details'}
                            <span className={clsx('transition-transform', isSelected && 'rotate-180')}>▼</span>
                          </button>

                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                              >
                                <div className={clsx(
                                  'mt-4 pt-4 border-t space-y-3',
                                  isDark ? 'border-white/10' : 'border-black/10'
                                )}>
                                  <div className="flex justify-between text-sm">
                                    <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>
                                      Your Escrow (5%)
                                    </span>
                                    <span className={clsx('font-mono', isDark ? 'text-cyan-400' : 'text-cyan-600')}>
                                      +${calc.escrow.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>
                                      Total to Pay
                                    </span>
                                    <span className={clsx('font-mono font-bold', isDark ? 'text-night-text' : 'text-day-text')}>
                                      ${calc.total.toFixed(2)}
                                    </span>
                                  </div>
                                  <div className={clsx(
                                    'p-3 rounded-xl mt-3',
                                    isDark ? 'bg-green-500/10' : 'bg-green-50'
                                  )}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-lg">💰</span>
                                      <span className={clsx('font-semibold', isDark ? 'text-green-400' : 'text-green-600')}>
                                        Projected Annual Earnings
                                      </span>
                                    </div>
                                    <div className={clsx(
                                      'text-2xl font-logo font-bold',
                                      isDark ? 'text-green-400' : 'text-green-600'
                                    )}>
                                      ${calc.yearlyAPY.toFixed(2)}
                                    </div>
                                    <div className={clsx('text-xs', isDark ? 'text-green-400/70' : 'text-green-600/70')}>
                                      ~{((calc.yearlyAPY / calc.escrow) * 100).toFixed(1)}% APY on your escrow
                                    </div>
                                  </div>
                                  <div className={clsx(
                                    'text-xs p-2 rounded-lg text-center',
                                    isDark ? 'bg-white/5 text-night-muted' : 'bg-gray-100 text-day-muted'
                                  )}>
                                    🔒 Escrow locked until product is recycled
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Buy Button */}
                          <button
                            onClick={() => buyProduct(product)}
                            disabled={isBuying}
                            className={clsx(
                              'w-full mt-4 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                              isBuying
                                ? 'opacity-50 cursor-not-allowed'
                                : 'hover:scale-[1.02] active:scale-[0.98]',
                              isDark
                                ? 'bg-gradient-to-r from-cyan-500 to-green-500 text-night-bg'
                                : 'bg-gradient-to-r from-cyan-500 to-green-500 text-white'
                            )}
                          >
                            {isBuying ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                Processing...
                              </>
                            ) : (
                              <>
                                🛒 Buy Now - ${calc.total.toFixed(2)}
                              </>
                            )}
                          </button>
                        </div>

                        {/* Product ID */}
                        <div className={clsx(
                          'px-6 py-3 border-t text-xs font-mono truncate',
                          isDark ? 'border-white/5 text-night-muted' : 'border-black/5 text-day-muted'
                        )}>
                          ID: {product.id}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* PORTFOLIO TAB */}
          {activeTab === 'portfolio' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Portfolio Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { 
                    label: 'Total Locked', 
                    value: `$${totalLocked.toFixed(2)}`, 
                    subtext: 'In escrow',
                    icon: '🔒',
                    color: 'purple'
                  },
                  { 
                    label: 'APY Earned', 
                    value: `$${totalAPYEarned.toFixed(2)}`, 
                    subtext: 'So far',
                    icon: '💰',
                    color: 'green'
                  },
                  { 
                    label: 'Projected Annual', 
                    value: `$${(projectedAnnualAPY * 0.4).toFixed(2)}`, 
                    subtext: `~${ESTIMATED_APY}% APY`,
                    icon: '📈',
                    color: 'cyan'
                  },
                  { 
                    label: 'Products Owned', 
                    value: myProducts.length.toString(), 
                    subtext: 'Earning rewards',
                    icon: '📦',
                    color: 'blue'
                  },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={clsx(
                      'p-5 rounded-2xl border backdrop-blur-sm',
                      isDark ? 'bg-night-surface/50 border-white/5' : 'bg-white/80 border-black/5 shadow-lg'
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <span className="text-2xl">{stat.icon}</span>
                      <span className={clsx(
                        'px-2 py-1 rounded-full text-[10px] font-semibold uppercase',
                        stat.color === 'purple' && (isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'),
                        stat.color === 'green' && (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600'),
                        stat.color === 'cyan' && (isDark ? 'bg-cyan-500/20 text-cyan-400' : 'bg-cyan-100 text-cyan-600'),
                        stat.color === 'blue' && (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'),
                      )}>
                        {stat.subtext}
                      </span>
                    </div>
                    <div className={clsx('text-2xl font-logo font-bold mb-1', isDark ? 'text-night-text' : 'text-day-text')}>
                      {stat.value}
                    </div>
                    <div className={clsx('text-xs', isDark ? 'text-night-muted' : 'text-day-muted')}>
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Products List */}
              <div className={clsx(
                'rounded-3xl border p-6',
                isDark ? 'bg-night-surface/50 border-white/5' : 'bg-white border-black/5 shadow-lg'
              )}>
                <h3 className={clsx('text-lg font-logo font-bold mb-6', isDark ? 'text-night-text' : 'text-day-text')}>
                  📦 Your Products
                </h3>

                {myProducts.length === 0 ? (
                  <div className={clsx('text-center py-12', isDark ? 'text-night-muted' : 'text-day-muted')}>
                    <div className="text-5xl mb-4">🛒</div>
                    <p className="mb-4">You don't own any products yet</p>
                    <button
                      onClick={() => setActiveTab('shop')}
                      className={clsx(
                        'px-6 py-2 rounded-full font-medium',
                        isDark ? 'bg-cyan-500 text-night-bg' : 'bg-cyan-500 text-white'
                      )}
                    >
                      Browse Products
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myProducts.map((product, i) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        onClick={() => setSelectedProduct(selectedProduct === product.id ? null : product.id)}
                        className={clsx(
                          'p-4 rounded-2xl border cursor-pointer transition-all',
                          selectedProduct === product.id
                            ? isDark ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-cyan-50 border-cyan-200'
                            : isDark ? 'bg-night-bg/50 border-white/5 hover:border-cyan-500/20' : 'bg-gray-50 border-black/5 hover:border-cyan-200'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">📱</div>
                            <div>
                              <div className={clsx('font-semibold', isDark ? 'text-night-text' : 'text-day-text')}>
                                {product.name}
                              </div>
                              <div className={clsx('text-xs', isDark ? 'text-night-muted' : 'text-day-muted')}>
                                Owned for {product.daysHeld} days
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={clsx('font-mono font-bold', isDark ? 'text-green-400' : 'text-green-600')}>
                              +${(product.apyEarned ?? 0).toFixed(2)}
                            </div>
                            <div className={clsx('text-xs', isDark ? 'text-night-muted' : 'text-day-muted')}>
                              APY earned
                            </div>
                          </div>
                        </div>

                        {/* Expanded details */}
                        <AnimatePresence>
                          {selectedProduct === product.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className={clsx(
                                'mt-4 pt-4 border-t border-dashed',
                                isDark ? 'border-white/10' : 'border-black/10'
                              )}>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>Locked Amount</span>
                                    <div className={clsx('font-mono font-semibold', isDark ? 'text-night-text' : 'text-day-text')}>
                                      ${(product.escrow ?? 0).toFixed(2)}
                                    </div>
                                  </div>
                                  <div>
                                    <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>Purchase Date</span>
                                    <div className={clsx('font-mono font-semibold', isDark ? 'text-night-text' : 'text-day-text')}>
                                      {product.purchaseDate}
                                    </div>
                                  </div>
                                  <div>
                                    <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>Status</span>
                                    <div className={clsx(
                                      'font-semibold capitalize',
                                      product.status === 'recycled'
                                        ? isDark ? 'text-green-400' : 'text-green-600'
                                        : isDark ? 'text-cyan-400' : 'text-cyan-600'
                                    )}>
                                      {product.status}
                                    </div>
                                  </div>
                                  <div>
                                    <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>Projected Annual</span>
                                    <div className={clsx('font-mono font-semibold', isDark ? 'text-green-400' : 'text-green-600')}>
                                      ${((product.projectedAPY ?? 0) * 0.4).toFixed(2)}
                                    </div>
                                  </div>
                                </div>

                                {/* APY Progress Bar */}
                                <div className="mt-4">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span className={isDark ? 'text-night-muted' : 'text-day-muted'}>APY Progress (this year)</span>
                                    <span className={isDark ? 'text-cyan-400' : 'text-cyan-600'}>
                                      {(((product.apyEarned ?? 0) / ((product.projectedAPY || 1) * 0.4)) * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                  <div className={clsx('h-2 rounded-full overflow-hidden', isDark ? 'bg-night-bg' : 'bg-gray-200')}>
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${Math.min(((product.apyEarned ?? 0) / ((product.projectedAPY || 1) * 0.4)) * 100, 100)}%` }}
                                      transition={{ delay: 0.5, duration: 0.8 }}
                                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-green-500"
                                    />
                                  </div>
                                </div>

                                {/* Product ID */}
                                <div className={clsx('mt-4 text-xs font-mono', isDark ? 'text-night-muted' : 'text-day-muted')}>
                                  Product ID: {product.id}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Environmental Impact */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={clsx(
                  'mt-8 p-6 rounded-3xl border',
                  isDark 
                    ? 'bg-gradient-to-r from-cyan-500/10 to-green-500/10 border-cyan-500/20' 
                    : 'bg-gradient-to-r from-cyan-50 to-green-50 border-cyan-200'
                )}
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="text-center md:text-left">
                    <h3 className={clsx('text-xl font-logo font-bold mb-2', isDark ? 'text-night-text' : 'text-day-text')}>
                      🌱 Your Environmental Impact
                    </h3>
                    <p className={clsx('text-sm', isDark ? 'text-night-muted' : 'text-day-muted')}>
                      By participating in CYCLR, you're helping create a circular economy
                    </p>
                  </div>
                  <div className="flex gap-8">
                    {[
                      { label: 'CO₂ Saved', value: `${(myProducts.length * 2.3).toFixed(1)} kg`, icon: '🌍' },
                      { label: 'Recycle Score', value: myProducts.length > 3 ? 'A+' : myProducts.length > 0 ? 'B+' : 'N/A', icon: '⭐' },
                      { label: 'Green Rank', value: myProducts.length > 0 ? `#${1000 - myProducts.length * 50}` : '-', icon: '🏆' },
                    ].map((stat) => (
                      <div key={stat.label} className="text-center">
                        <div className="text-2xl mb-1">{stat.icon}</div>
                        <div className={clsx('font-logo font-bold', isDark ? 'text-night-text' : 'text-day-text')}>
                          {stat.value}
                        </div>
                        <div className={clsx('text-xs', isDark ? 'text-night-muted' : 'text-day-muted')}>
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
