import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, MenuOption, MenuDetail } from '../types';
import { storageHelper } from '../utils/storage';
import { useToast } from './ToastContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (menu: MenuDetail | import('../types').Menu, quantity: number, selectedGroups: { group_id: string; group_name: string; options: MenuOption[] }[], note: string) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  updateCartItem: (itemId: string, quantity: number, selectedGroups: { group_id: string; group_name: string; options: MenuOption[] }[], note: string) => void;
  clearCart: () => void;
  cartSubtotal: number;
  cartOptionsTotal: number;
  cartTotal: number;
  cartItemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function generateCartItemId(
  menuId: string,
  selectedGroups: { group_id: string; options: MenuOption[] }[],
  note: string
): string {
  const optionsString = selectedGroups
    .map(g => {
      const sortedIds = [...g.options].map(o => o.id).sort().join('-');
      return `${g.group_id}:${sortedIds}`;
    })
    .sort()
    .join('|');
  return `${menuId}_[${optionsString}]_${note.trim()}`;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { showError } = useToast();

  // Load cart from local storage on mount with migration
  useEffect(() => {
    const savedCart = storageHelper.getCart();
    let isDamaged = false;
    const migratedCart: CartItem[] = [];

    if (Array.isArray(savedCart)) {
      savedCart.forEach((item: any) => {
        // Extract base price from different potential fields
        const base_price = Number(
          item.base_price ??
          item.final_price ??
          item.price ??
          item.menu?.price ??
          item.menu?.final_price ??
          0
        );

        const cart_item_id = item.cart_item_id ?? item.id;

        // Skip damaged or 0 price items (except if it really is 0)
        if (base_price <= 0 || !cart_item_id || !item.menu_id) {
          isDamaged = true;
          return; // Skip this damaged item
        }

        // Calculate option total per item
        const optionTotalPerItem = (item.selected_options || []).reduce((sum: number, g: any) => {
          return sum + (g.options || []).reduce((optSum: number, o: any) => {
            const p = Number(o.additional_price ?? o.price ?? 0);
            return optSum + p * Number(o.quantity ?? 1);
          }, 0);
        }, 0);

        const quantity = Number(item.quantity ?? 1);
        const item_total = Number(item.item_total ?? (base_price + optionTotalPerItem) * quantity);

        migratedCart.push({
          id: cart_item_id,
          cart_item_id,
          menu_id: String(item.menu_id),
          menu_name: String(item.menu_name ?? "Menu"),
          category_id: String(item.category_id ?? ""),
          image_url: String(item.image_url ?? ""),
          base_price,
          quantity,
          selected_options: item.selected_options || [],
          option_total: optionTotalPerItem,
          item_note: String(item.item_note ?? ""),
          item_total
        });
      });
    }

    if (isDamaged) {
      showError("Data keranjang lama telah diperbarui. Silakan tambahkan menu kembali.");
    }

    setCart(migratedCart);
    storageHelper.setCart(migratedCart);
  }, []);

  // Sync cart to local storage whenever it changes
  const saveCartState = (newCart: CartItem[]) => {
    setCart(newCart);
    storageHelper.setCart(newCart);
  };

  const addToCart = (
    menu: MenuDetail | import('../types').Menu,
    quantity: number,
    selectedGroups: { group_id: string; group_name: string; options: MenuOption[] }[],
    note: string
  ) => {
    const basePrice = Number(menu.final_price ?? menu.price ?? 0);

    const optionTotalPerItem = selectedGroups.reduce((sum, g) => {
      return sum + g.options.reduce((optSum, o: any) => {
        const p = Number(o.additional_price ?? o.price ?? 0);
        return optSum + p * Number(o.quantity ?? 1);
      }, 0);
    }, 0);

    const itemTotal = (basePrice + optionTotalPerItem) * quantity;
    const cart_item_id = generateCartItemId(menu.id, selectedGroups, note);

    const existingIndex = cart.findIndex(item => (item.cart_item_id ?? item.id) === cart_item_id);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const existingItem = updatedCart[existingIndex];
      const newQuantity = existingItem.quantity + quantity;
      
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQuantity,
        item_total: (basePrice + optionTotalPerItem) * newQuantity
      };
      saveCartState(updatedCart);
    } else {
      const newItem: CartItem = {
        id: cart_item_id,
        cart_item_id,
        menu_id: menu.id,
        menu_name: menu.menu_name,
        category_id: menu.category_id,
        image_url: menu.image_url,
        base_price: basePrice,
        quantity,
        selected_options: selectedGroups,
        option_total: optionTotalPerItem,
        item_note: note.trim(),
        item_total: itemTotal
      };
      saveCartState([...cart, newItem]);
    }
  };

  const removeFromCart = (itemId: string) => {
    const updatedCart = cart.filter(item => (item.cart_item_id ?? item.id) !== itemId);
    saveCartState(updatedCart);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const updatedCart = cart
      .map(item => {
        const cart_item_id = item.cart_item_id ?? item.id;
        if (cart_item_id === itemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;

          const optionTotalPerItem = item.selected_options.reduce((sum, g) => {
            return sum + g.options.reduce((optSum, o: any) => {
              const p = Number(o.additional_price ?? o.price ?? 0);
              return optSum + p * Number(o.quantity ?? 1);
            }, 0);
          }, 0);

          return {
            ...item,
            quantity: newQty,
            item_total: (item.base_price + optionTotalPerItem) * newQty
          };
        }
        return item;
      })
      .filter((item): item is CartItem => item !== null);

    saveCartState(updatedCart);
  };

  const updateCartItem = (
    oldItemId: string,
    quantity: number,
    selectedGroups: { group_id: string; group_name: string; options: MenuOption[] }[],
    note: string
  ) => {
    const oldItem = cart.find(item => (item.cart_item_id ?? item.id) === oldItemId);
    if (!oldItem) return;

    const basePrice = oldItem.base_price;
    const optionTotalPerItem = selectedGroups.reduce((sum, g) => {
      return sum + g.options.reduce((optSum, o: any) => {
        const p = Number(o.additional_price ?? o.price ?? 0);
        return optSum + p * Number(o.quantity ?? 1);
      }, 0);
    }, 0);
    const itemTotal = (basePrice + optionTotalPerItem) * quantity;
    const newItemId = generateCartItemId(oldItem.menu_id, selectedGroups, note);

    const updatedCart = cart.filter(item => (item.cart_item_id ?? item.id) !== oldItemId);
    const existingIndex = updatedCart.findIndex(item => (item.cart_item_id ?? item.id) === newItemId);

    if (existingIndex > -1) {
      const existingItem = updatedCart[existingIndex];
      const newQuantity = existingItem.quantity + quantity;
      updatedCart[existingIndex] = {
        ...existingItem,
        quantity: newQuantity,
        item_total: (basePrice + optionTotalPerItem) * newQuantity
      };
    } else {
      updatedCart.push({
        ...oldItem,
        id: newItemId,
        cart_item_id: newItemId,
        quantity,
        selected_options: selectedGroups,
        option_total: optionTotalPerItem,
        item_note: note.trim(),
        item_total: itemTotal
      });
    }

    saveCartState(updatedCart);
  };

  const clearCart = () => {
    saveCartState([]);
  };

  // Calculators
  const cartSubtotal = cart.reduce((sum, item) => sum + (Number(item.base_price ?? 0) * item.quantity), 0);
  const cartOptionsTotal = cart.reduce((sum, item) => {
    const optionTotalPerItem = item.selected_options.reduce((gSum, g) => {
      return gSum + g.options.reduce((optSum, o: any) => {
        const p = Number(o.additional_price ?? o.price ?? 0);
        return optSum + p * Number(o.quantity ?? 1);
      }, 0);
    }, 0);
    return sum + (optionTotalPerItem * item.quantity);
  }, 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.item_total ?? 0), 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        updateCartItem,
        clearCart,
        cartSubtotal,
        cartOptionsTotal,
        cartTotal,
        cartItemsCount
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
