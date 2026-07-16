import { Category, Menu, MenuDetail, MenuDetailResponse, Table, Order, PaymentResponse, ApiResponse } from '../types';

const BASE_URL = 'https://script.google.com/macros/s/AKfycbwulMTmiZe1no7IqMA3dzXejF5lwbeLMtR3e7FOZK_1uEBkabmJBalxWyCbOoc7GHVxGw/exec';

// --- DATA SAFETY UTILITY HELPERS ---
export function safeString(val: any): string {
  if (typeof val === 'undefined' || val === null) return "";
  return String(val);
}

export function safeNumber(val: any): number {
  if (typeof val === 'undefined' || val === null) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}

export function safeArray<T>(val: any): T[] {
  return Array.isArray(val) ? val : [];
}

// --- 5-MINUTE CACHING MECHANISM ---
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms
const memoryCache: Record<string, { data: any; timestamp: number }> = {};

export const cacheHelper = {
  get: <T>(key: string): T | null => {
    const now = Date.now();
    // Check memory first
    if (memoryCache[key]) {
      const entry = memoryCache[key];
      if (now - entry.timestamp < CACHE_TTL) {
        return entry.data as T;
      }
      delete memoryCache[key];
    }
    // Check SessionStorage as fallback
    try {
      const sessionStr = sessionStorage.getItem(`nuvora_api_${key}`);
      if (sessionStr) {
        const parsed = JSON.parse(sessionStr);
        if (now - parsed.timestamp < CACHE_TTL) {
          // Hydrate memory
          memoryCache[key] = { data: parsed.data, timestamp: parsed.timestamp };
          return parsed.data as T;
        } else {
          sessionStorage.removeItem(`nuvora_api_${key}`);
        }
      }
    } catch (e) {
      // Ignore sessionStorage issues (e.g. sandboxed iframe blocks)
    }
    return null;
  },
  set: <T>(key: string, data: T): void => {
    const timestamp = Date.now();
    memoryCache[key] = { data, timestamp };
    try {
      sessionStorage.setItem(`nuvora_api_${key}`, JSON.stringify({ data, timestamp }));
    } catch (e) {
      // Ignore sessionStorage issues
    }
  },
  clear: (key: string): void => {
    delete memoryCache[key];
    try {
      sessionStorage.removeItem(`nuvora_api_${key}`);
    } catch (e) {
      // Ignore
    }
  }
};

// Fetch helper for GET requests with 15s timeout
async function get<T>(params: Record<string, string>): Promise<T> {
  const url = new URL(BASE_URL);
  Object.entries(params).forEach(([key, val]) => {
    url.searchParams.append(key, val);
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();
    
    // GAS script typically returns the response wrapped in { success: true, data: T } or directly as data.
    if (json && typeof json === 'object' && 'success' in json) {
      if (json.success === false) {
        throw new Error(json.message || 'Terjadi kesalahan pada server API.');
      }
      return json.data as T;
    }
    
    return json as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('API GET Error:', error);
    if (error.name === 'AbortError') {
      throw new Error('Koneksi ke server timeout (15 detik). Silakan coba lagi.');
    }
    throw new Error(error.message || 'Gagal terhubung dengan server Nuvora.');
  }
}

// Fetch helper for POST requests with 15s timeout
async function post<T>(body: any): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // We send as text/plain to bypass CORS preflight issues that sometimes happen with Google Apps Script
    const response = await fetch(BASE_URL, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const json = await response.json();

    if (json && typeof json === 'object' && 'success' in json) {
      if (json.success === false) {
        throw new Error(json.message || 'Gagal memproses transaksi.');
      }
      return json.data as T;
    }

    return json as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('API POST Error:', error);
    if (error.name === 'AbortError') {
      throw new Error('Koneksi ke server timeout (15 detik). Silakan coba lagi.');
    }
    throw new Error(error.message || 'Gagal mengirimkan data ke server Nuvora.');
  }
}

function normalizeMenu(menu: any): Menu {
  const menu_id = safeString(menu?.menu_id ?? menu?.id ?? "");
  const is_recommended = safeString(menu?.is_recommended ?? "no");
  return {
    id: menu_id,
    menu_id: menu_id,
    category_id: safeString(menu?.category_id ?? ""),
    sku: safeString(menu?.sku ?? ""),
    name: safeString(menu?.menu_name ?? menu?.name ?? "Menu tanpa nama"),
    menu_name: safeString(menu?.menu_name ?? menu?.name ?? "Menu tanpa nama"),
    description: safeString(menu?.description ?? ""),
    price: safeNumber(menu?.price ?? 0),
    discount_price: safeNumber(menu?.discount_price ?? 0),
    final_price: safeNumber(
      menu?.final_price ??
      (safeNumber(menu?.discount_price ?? 0) > 0
        ? menu?.discount_price
        : menu?.price) ??
      0
    ),
    stock: safeNumber(menu?.stock ?? 0),
    minimum_stock: safeNumber(menu?.minimum_stock ?? 0),
    image_url: safeString(menu?.image_url ?? ""),
    is_recommended: is_recommended,
    recommended: (is_recommended === "yes" || menu?.recommended === "yes" || menu?.recommended === true) ? "yes" : "no",
    status: safeString(menu?.status ?? "inactive"),
    is_available:
      typeof menu?.is_available === "boolean"
        ? menu.is_available
        : safeNumber(menu?.stock ?? 0) > 0,
    subcategory: safeString(menu?.subcategory ?? "")
  };
}

function normalizeCategory(category: any): Category {
  const category_id = safeString(category.category_id ?? category.id ?? "");
  const category_name = safeString(category.category_name ?? category.name ?? "Kategori");
  return {
    id: category_id,
    category_id: category_id,
    name: category_name,
    category_name: category_name,
    parent_category_id: safeString(category.parent_category_id ?? ""),
    category_type: safeString(category.category_type ?? "sub"),
    sort_order: safeNumber(category.sort_order ?? 0),
    status: safeString(category.status ?? "inactive"),
    subcategories: []
  };
}

export const apiService = {
  // Test server connectivity
  checkHealth: async (): Promise<{ status: string }> => {
    return get({ action: 'health' });
  },

  // Get categories (Cached 5 mins)
  getCategories: async (): Promise<Category[]> => {
    const cacheKey = 'categories';
    const cached = cacheHelper.get<Category[]>(cacheKey);
    if (cached) return cached;

    const rawCats = await get<any[]>({ action: 'getCategories' });
    const normalized = safeArray(rawCats).map(normalizeCategory);
    
    // Auto-populate parent's subcategories array with subcategories category_names
    normalized.forEach(cat => {
      if (cat.parent_category_id) {
        const parent = normalized.find(p => p.category_id === cat.parent_category_id);
        if (parent) {
          if (!parent.subcategories.includes(cat.category_name)) {
            parent.subcategories.push(cat.category_name);
          }
        }
      }
    });

    cacheHelper.set(cacheKey, normalized);
    return normalized;
  },

  // Get menus with optional filters (Cached 5 mins)
  getMenus: async (filters?: { category_id?: string; recommended?: 'yes' | 'no' }): Promise<Menu[]> => {
    const cacheKey = `menus_${filters?.category_id ?? ''}_${filters?.recommended ?? ''}`;
    const cached = cacheHelper.get<Menu[]>(cacheKey);
    if (cached) return cached;

    const params: Record<string, string> = { action: 'getMenus' };
    if (filters?.category_id) {
      params.category_id = filters.category_id;
    }
    if (filters?.recommended) {
      params.recommended = filters.recommended;
    }
    const rawMenus = await get<any[]>(params);
    const normalized = safeArray(rawMenus).map(normalizeMenu);

    normalized.forEach(menu => {
      menu.subcategory = safeString(menu.category_id); // Default fallback
    });

    cacheHelper.set(cacheKey, normalized);
    return normalized;
  },

  // Get single menu detail (Cached 5 mins per menuId)
  getMenuDetail: async (menuId: string): Promise<MenuDetailResponse> => {
    const cacheKey = `detail_${menuId}`;
    const cached = cacheHelper.get<MenuDetailResponse>(cacheKey);
    if (cached) return cached;

    const rawDetail = await get<any>({ action: 'getMenuDetail', menu_id: menuId });
    
    if (!rawDetail) {
      throw new Error('Detail menu tidak ditemukan.');
    }

    // Determine the source for menu data (could be nested inside rawDetail.menu, or rawDetail itself)
    const rawMenu = rawDetail.menu ?? rawDetail;
    const menu_id = safeString(rawMenu.menu_id ?? rawMenu.id ?? menuId);
    const menu_name = safeString(rawMenu.menu_name ?? rawMenu.name ?? 'Menu');
    const description = safeString(rawMenu.description ?? '');
    const price = safeNumber(rawMenu.price ?? 0);
    const discount_price = safeNumber(rawMenu.discount_price ?? 0);
    const final_price = safeNumber(
      rawMenu.final_price ??
      (discount_price > 0 ? discount_price : price) ??
      0
    );
    const image_url = safeString(rawMenu.image_url ?? '');
    const stock = safeNumber(rawMenu.stock ?? 0);
    const category_id = safeString(rawMenu.category_id ?? '');
    const subcategory = safeString(rawMenu.subcategory ?? '');
    const recommended = ((rawMenu.recommended === 'yes' || rawMenu.is_recommended === 'yes' || rawMenu.recommended === true) ? 'yes' : 'no') as 'yes' | 'no';
    const is_available = typeof rawMenu.is_available === 'boolean' ? rawMenu.is_available : stock > 0;

    const normalizedMenu = {
      id: menu_id,
      menu_id,
      category_id,
      sku: safeString(rawMenu.sku ?? ''),
      name: menu_name,
      menu_name,
      description,
      price,
      discount_price,
      final_price,
      stock,
      minimum_stock: safeNumber(rawMenu.minimum_stock ?? 0),
      image_url,
      is_recommended: safeString(rawMenu.is_recommended ?? ''),
      recommended,
      status: safeString(rawMenu.status ?? 'active'),
      is_available,
      subcategory
    };

    // Normalize option groups and options
    const rawGroups = safeArray(rawDetail.option_groups ?? rawDetail.optionGroups);

    const normalizedGroups = rawGroups.map((group: any) => {
      const option_group_id = safeString(group.option_group_id ?? group.id ?? '');
      const group_name = safeString(group.group_name ?? group.name ?? '');
      const selection_type: 'single' | 'multiple' = (safeString(group.selection_type ?? group.selectionType ?? 'single').toLowerCase() === 'multiple') ? 'multiple' : 'single';
      const is_required: 'yes' | 'no' = (group.is_required === true || group.is_required === 'yes' || group.isRequired === true || group.isRequired === 'yes') ? 'yes' : 'no';
      const minimum_selection = safeNumber(group.minimum_selection ?? group.min_selection ?? group.minimumSelection ?? (is_required === 'yes' ? 1 : 0));
      const maximum_selection = safeNumber(group.maximum_selection ?? group.max_selection ?? group.maximumSelection ?? 999);

      const rawOptions = safeArray(group.options);
      const options = rawOptions
        .map((opt: any) => {
          const option_id = safeString(opt.option_id ?? opt.id ?? '');
          const option_name = safeString(opt.option_name ?? opt.name ?? '');
          const additional_price = safeNumber(opt.additional_price ?? opt.price ?? 0);
          const status = safeString(opt.status ?? 'active');

          return {
            option_id,
            option_name,
            additional_price,
            status,
            id: option_id,
            name: option_name,
            price: additional_price
          };
        })
        .filter((opt: any) => opt.option_id && opt.option_name.trim().length > 0);

      return {
        option_group_id,
        group_name,
        selection_type,
        is_required,
        minimum_selection,
        maximum_selection,
        options,
        id: option_group_id,
        name: group_name
      };
    })
    .filter((g: any) => g.option_group_id && g.group_name.trim().length > 0);

    const result = {
      menu: normalizedMenu,
      option_groups: normalizedGroups
    };

    cacheHelper.set(cacheKey, result);
    return result;
  },

  // Get list of tables (Cached 5 mins)
  getTables: async (): Promise<Table[]> => {
    const cacheKey = 'tables';
    const cached = cacheHelper.get<Table[]>(cacheKey);
    if (cached) return cached;

    const res = await get<Table[]>({ action: 'getTables' });
    const normalized = safeArray<any>(res).map(t => ({
      id: safeString(t.table_id ?? t.id ?? ""),
      table_id: safeString(t.table_id ?? t.id ?? ""),
      table_number: safeString(t.table_number ?? ""),
      table_name: safeString(t.table_name ?? t.name ?? t.table_number ?? ""),
      capacity: safeNumber(t.capacity ?? 0),
      status: safeString(t.status ?? "available"),
      token: safeString(t.token ?? ""),
      name: safeString(t.table_name ?? t.name ?? t.table_number ?? "")
    }));
    cacheHelper.set(cacheKey, normalized);
    return normalized;
  },

  // Get order status details
  getOrderStatus: async (orderId: string): Promise<Order> => {
    const res = await get<Order>({ action: 'getOrderStatus', order_id: orderId });
    return res;
  },

  // Create order
  createOrder: async (orderData: Omit<import('../types').OrderInput, 'action'>): Promise<{ order_id: string; order_number: string }> => {
    // Clear menus/tables caches so that stock or tables state is re-fetched
    cacheHelper.clear('categories');
    // Clear any cached menus
    Object.keys(memoryCache).forEach(k => {
      if (k.startsWith('menus_') || k.startsWith('detail_') || k === 'tables') {
        cacheHelper.clear(k);
      }
    });

    return post<{ order_id: string; order_number: string }>({
      action: 'createOrder',
      ...orderData
    });
  },

  // Create payment for order
  createPayment: async (orderId: string): Promise<PaymentResponse['data']> => {
    return post<PaymentResponse['data']>({
      action: 'createPayment',
      order_id: orderId
    });
  },

  // Google Login JWT Token verification
  googleLogin: async (idToken: string): Promise<any> => {
    return post<any>({
      action: 'googleLogin',
      id_token: idToken
    });
  },

  // Get active configurations and settings
  getSettings: async (): Promise<any> => {
    return get<any>({ action: 'getSettings' });
  }
};
