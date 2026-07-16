import { CartItem, GoogleUser } from '../types';

const KEYS = {
  TABLE_INFO: 'nuvora_table_info',
  CART: 'nuvora_cart_items',
  ORDERS: 'nuvora_orders_history',
  GUEST_USER: 'nuvora_guest_user',
  LATEST_ORDER: 'nuvora_latest_order',
  USER_SESSION: 'nuvora_user_session'
};

export interface TableInfo {
  table_number: number;
  table_id: string;
  tableId: string;
  tableName: string;
  token: string;
}

export interface GuestUser {
  name: string;
  email: string;
  phone: string;
}

export const storageHelper = {
  // Table info
  getTableInfo: (): TableInfo | null => {
    try {
      const data = localStorage.getItem(KEYS.TABLE_INFO);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setTableInfo: (info: TableInfo | null): void => {
    if (info) {
      localStorage.setItem(KEYS.TABLE_INFO, JSON.stringify(info));
    } else {
      localStorage.removeItem(KEYS.TABLE_INFO);
    }
  },

  // Cart
  getCart: (): CartItem[] => {
    try {
      const data = localStorage.getItem(KEYS.CART);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  setCart: (items: CartItem[]): void => {
    localStorage.setItem(KEYS.CART, JSON.stringify(items));
  },

  // Orders History
  getOrders: (): string[] => {
    try {
      const data = localStorage.getItem(KEYS.ORDERS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },
  addOrderToHistory: (orderId: string): void => {
    try {
      const orders = storageHelper.getOrders();
      if (!orders.includes(orderId)) {
        orders.push(orderId);
        localStorage.setItem(KEYS.ORDERS, JSON.stringify(orders));
      }
    } catch (e) {
      console.error(e);
    }
  },

  // Guest User profile (persisting checkout info for convenience)
  getGuestUser: (): GuestUser | null => {
    try {
      const data = localStorage.getItem(KEYS.GUEST_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setGuestUser: (user: GuestUser | null): void => {
    if (user) {
      localStorage.setItem(KEYS.GUEST_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.GUEST_USER);
    }
  },

  // Latest Order info
  getLatestOrder: (): { orderId: string; orderNumber: string; redirectUrl?: string } | null => {
    try {
      const data = localStorage.getItem(KEYS.LATEST_ORDER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setLatestOrder: (order: { orderId: string; orderNumber: string; redirectUrl?: string } | null): void => {
    if (order) {
      localStorage.setItem(KEYS.LATEST_ORDER, JSON.stringify(order));
    } else {
      localStorage.removeItem(KEYS.LATEST_ORDER);
    }
  },

  // User session
  getUser: (): GoogleUser | null => {
    try {
      const data = localStorage.getItem(KEYS.USER_SESSION);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },
  setUser: (user: GoogleUser | null): void => {
    if (user) {
      localStorage.setItem(KEYS.USER_SESSION, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.USER_SESSION);
    }
  },
  logout: (): void => {
    localStorage.removeItem(KEYS.USER_SESSION);
  }
};

// Storage Versioning Migration Check
const NUVORA_STORAGE_VERSION = "3";
const STORAGE_VERSION_KEY = "nuvora_storage_version";

if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  const currentVersion = localStorage.getItem(STORAGE_VERSION_KEY);
  if (currentVersion !== NUVORA_STORAGE_VERSION) {
    // Validate key-by-key on migration instead of erasing everything
    const keysToCheck = [
      KEYS.CART,
      KEYS.TABLE_INFO,
      KEYS.ORDERS,
      KEYS.GUEST_USER,
      KEYS.LATEST_ORDER,
      KEYS.USER_SESSION,
      'nuvora_theme',
      'nuvora_locale',
      'nuvora_reduce_motion'
    ];

    keysToCheck.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) {
        try {
          // If it can't be parsed (unless it's a simple string like theme/locale), remove it
          if (key.includes('cart') || key.includes('info') || key.includes('history') || key.includes('user') || key.includes('order') || key.includes('session')) {
            JSON.parse(val);
          }
        } catch {
          localStorage.removeItem(key);
          console.warn(`Removed corrupted localStorage key: ${key}`);
        }
      }
    });
    localStorage.setItem(STORAGE_VERSION_KEY, NUVORA_STORAGE_VERSION);
  }
}
