'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

// Hardcoded wallet addresses for role detection
export const KNOWN_WALLETS = {
  recycler: 'rnYrUUuqgU5PddJVBu8Hitsw9ejPheKhLd',
  manufacturer: 'rfHrTMepc23WLFgnFtxpd1LPa52sT7qKoK',
  // Customers are dynamically created when products are sold
} as const;

export type WalletRole = 'recycler' | 'manufacturer' | 'customer' | 'unknown';
export type SelectedRole = 'recycler' | 'manufacturer' | 'customer' | null;

export interface WalletState {
  address: string | null;
  role: WalletRole;
  selectedRole: SelectedRole; // User's chosen role during onboarding
  isConnected: boolean;
  isConnecting: boolean;
  isFirstTime: boolean; // True if user hasn't selected a role yet
}

export interface WalletContextType extends WalletState {
  connect: (address: string, role?: SelectedRole) => void;
  disconnect: () => void;
  setConnecting: (value: boolean) => void;
  selectRole: (role: SelectedRole) => void;
  getRoleFromAddress: (address: string) => WalletRole;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

// Storage keys
const WALLET_STORAGE_KEY = 'cyclr_wallet_address';
const ROLE_STORAGE_KEY = 'cyclr_selected_role';

// Known customer wallets (from sold products - in production, this would come from backend)
let knownCustomerWallets: Set<string> = new Set();

// Function to register a customer wallet (called when product is sold)
export function registerCustomerWallet(address: string) {
  knownCustomerWallets.add(address);
  // Persist to localStorage
  const stored = localStorage.getItem('cyclr_customer_wallets');
  const wallets = stored ? JSON.parse(stored) : [];
  if (!wallets.includes(address)) {
    wallets.push(address);
    localStorage.setItem('cyclr_customer_wallets', JSON.stringify(wallets));
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    address: null,
    role: 'unknown',
    selectedRole: null,
    isConnected: false,
    isConnecting: false,
    isFirstTime: true,
  });

  // Load wallet from localStorage on mount
  useEffect(() => {
    // Load known customer wallets
    const storedCustomers = localStorage.getItem('cyclr_customer_wallets');
    if (storedCustomers) {
      knownCustomerWallets = new Set(JSON.parse(storedCustomers));
    }

    // Load selected role
    const storedRole = localStorage.getItem(ROLE_STORAGE_KEY) as SelectedRole;
    
    // Load connected wallet
    const storedAddress = localStorage.getItem(WALLET_STORAGE_KEY);
    if (storedAddress) {
      const role = getRoleFromAddress(storedAddress);
      setState({
        address: storedAddress,
        role,
        selectedRole: storedRole,
        isConnected: true,
        isConnecting: false,
        isFirstTime: !storedRole,
      });
    } else {
      setState(prev => ({
        ...prev,
        selectedRole: storedRole,
        isFirstTime: !storedRole,
      }));
    }
  }, []);

  const getRoleFromAddress = (address: string): WalletRole => {
    if (address === KNOWN_WALLETS.recycler) {
      return 'recycler';
    }
    if (address === KNOWN_WALLETS.manufacturer) {
      return 'manufacturer';
    }
    if (knownCustomerWallets.has(address)) {
      return 'customer';
    }
    // Any other valid XRPL address is treated as a potential customer
    if (address.startsWith('r') && address.length >= 25 && address.length <= 35) {
      return 'customer';
    }
    return 'unknown';
  };

  const selectRole = (role: SelectedRole) => {
    setState(prev => ({
      ...prev,
      selectedRole: role,
      isFirstTime: false,
    }));
    if (role) {
      localStorage.setItem(ROLE_STORAGE_KEY, role);
    } else {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    }
  };

  const connect = (address: string, role?: SelectedRole) => {
    const detectedRole = getRoleFromAddress(address);
    const finalRole = role || state.selectedRole;
    
    setState(prev => ({
      ...prev,
      address,
      role: detectedRole,
      selectedRole: finalRole,
      isConnected: true,
      isConnecting: false,
      isFirstTime: !finalRole,
    }));
    localStorage.setItem(WALLET_STORAGE_KEY, address);
    if (finalRole) {
      localStorage.setItem(ROLE_STORAGE_KEY, finalRole);
    }
  };

  const disconnect = () => {
    setState({
      address: null,
      role: 'unknown',
      selectedRole: null,
      isConnected: false,
      isConnecting: false,
      isFirstTime: true,
    });
    localStorage.removeItem(WALLET_STORAGE_KEY);
    localStorage.removeItem(ROLE_STORAGE_KEY);
  };

  const setConnecting = (value: boolean) => {
    setState(prev => ({ ...prev, isConnecting: value }));
  };

  return (
    <WalletContext.Provider
      value={{
        ...state,
        connect,
        disconnect,
        setConnecting,
        selectRole,
        getRoleFromAddress,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

// Helper to get role display name
export function getRoleDisplayName(role: WalletRole): string {
  switch (role) {
    case 'recycler':
      return 'Recycling Enterprise';
    case 'manufacturer':
      return 'Manufacturer';
    case 'customer':
      return 'Customer';
    default:
      return 'Unknown';
  }
}

// Helper to get role icon
export function getRoleIcon(role: WalletRole): string {
  switch (role) {
    case 'recycler':
      return '♻️';
    case 'manufacturer':
      return '🏭';
    case 'customer':
      return '👤';
    default:
      return '❓';
  }
}
