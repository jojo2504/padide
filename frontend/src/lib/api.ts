// API Service for CYCLR Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Types
export interface Product {
  id: string;
  name: string;
  price: number;
  cyclr_fee: number;
  deposit_amount: number;
  lp_tokens: number;
  status: 'active' | 'recycled' | 'expired';
  buyer_wallet: string;
  manufacturer_wallet: string;
  recycler_wallet: string | null;
  nft_id: string | null;
  created_at: string;
  recycled_at: string | null;
  total_rewards: number;
  apy_earned: number;
  estimated_current_apy?: number;
}

export interface ProductCreate {
  name: string;
  price: number;
  buyer_wallet: string;
  manufacturer_wallet: string;
}

export interface RecycleRequest {
  product_id: string;
  recycler_wallet: string;
  eco_fund_wallet?: string;
}

export interface RecycleResponse {
  success: boolean;
  product_id: string;
  total_rusd_distributed: number;
  apy_earned: number;
  payments: Record<string, any>;
  error?: string;
}

export interface AMMInfo {
  success: boolean;
  amm_account?: string;
  xrp_pool: number;
  rusd_pool: number;
  trading_fee_percent: number;
  error?: string;
}

export interface WalletBalance {
  address: string;
  xrp_balance: number;
  rusd_balance: number;
  error?: string;
}

export interface HealthStatus {
  status: string;
  cyclr_wallet: string;
  rusd_issuer: string;
  amm_available: boolean;
}

// API Functions
export const api = {
  // Health Check
  async getHealth(): Promise<HealthStatus> {
    const res = await fetch(`${API_BASE_URL}/api/v1/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  // AMM Info
  async getAMMInfo(): Promise<AMMInfo> {
    const res = await fetch(`${API_BASE_URL}/api/v1/amm/info`);
    if (!res.ok) throw new Error('Failed to get AMM info');
    return res.json();
  },

  // Wallet Balance
  async getWalletBalance(address: string): Promise<WalletBalance> {
    const res = await fetch(`${API_BASE_URL}/api/v1/wallet/${address}`);
    if (!res.ok) throw new Error('Failed to get wallet balance');
    return res.json();
  },

  // Register Product (on purchase)
  async registerProduct(product: ProductCreate): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/api/v1/products/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to register product');
    }
    return res.json();
  },

  // Get All Products
  async getProducts(): Promise<Product[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/products`);
    if (!res.ok) throw new Error('Failed to get products');
    return res.json();
  },

  // Get Single Product
  async getProduct(productId: string): Promise<Product> {
    const res = await fetch(`${API_BASE_URL}/api/v1/products/${productId}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error('Product not found');
      throw new Error('Failed to get product');
    }
    return res.json();
  },

  // Recycle Product
  async recycleProduct(request: RecycleRequest): Promise<RecycleResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/recycle`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.detail || 'Failed to recycle product');
    }
    return res.json();
  },

  // Demo: Simulate Purchase (for testing)
  async simulatePurchase(
    productName: string = 'Demo Product',
    price: number = 1000,
    buyerWallet: string = 'rDemoUserWallet',
    manufacturerWallet: string = 'rDemoManufacturer'
  ): Promise<any> {
    const params = new URLSearchParams({
      product_name: productName,
      price: price.toString(),
      buyer_wallet: buyerWallet,
      manufacturer_wallet: manufacturerWallet,
    });
    const res = await fetch(`${API_BASE_URL}/api/v1/demo/simulate-purchase?${params}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to simulate purchase');
    return res.json();
  },
};

export default api;
