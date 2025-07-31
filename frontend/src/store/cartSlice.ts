import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  maxQuantity: number;
  variant?: {
    name: string;
    sku: string;
  };
}

export interface PromotionCode {
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  isValid: boolean;
  errorMessage?: string;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isOpen: boolean;
  promotionCode: PromotionCode | null;
  subtotal: number;
  discount: number;
  shipping: number;
}

// Load cart from localStorage
const loadCartFromStorage = (): CartState => {
  try {
    const savedCart = localStorage.getItem('micoz_cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      return {
        ...parsedCart,
        isOpen: false, // Always start with drawer closed
      };
    }
  } catch (error) {
    console.error('Failed to load cart from localStorage:', error);
  }
  
  return {
    items: [],
    total: 0,
    itemCount: 0,
    isOpen: false,
    promotionCode: null,
    subtotal: 0,
    discount: 0,
    shipping: 0,
  };
};

const initialState: CartState = loadCartFromStorage();

// Save cart to localStorage
const saveCartToStorage = (state: CartState) => {
  try {
    const cartToSave = {
      ...state,
      isOpen: false, // Don't save drawer state
    };
    localStorage.setItem('micoz_cart', JSON.stringify(cartToSave));
  } catch (error) {
    console.error('Failed to save cart to localStorage:', error);
  }
};

const calculateTotals = (items: CartItem[], promotionCode: PromotionCode | null = null) => {
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  // Calculate discount
  let discount = 0;
  if (promotionCode && promotionCode.isValid) {
    if (promotionCode.type === 'percentage') {
      discount = subtotal * (promotionCode.value / 100);
      if (promotionCode.maxDiscount) {
        discount = Math.min(discount, promotionCode.maxDiscount);
      }
    } else if (promotionCode.type === 'fixed') {
      discount = promotionCode.value;
    }
    discount = Math.min(discount, subtotal); // Don't allow negative totals
  }
  
  // Calculate shipping (free shipping over 50,000 KRW)
  const shipping = subtotal >= 50000 ? 0 : 3000;
  
  // Calculate final total
  const total = subtotal - discount + shipping;
  
  return { itemCount, subtotal, discount, shipping, total };
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<Omit<CartItem, 'id'>>) => {
      const newItem = action.payload;
      const existingItem = state.items.find(
        item => item.productId === newItem.productId && 
               item.variantId === newItem.variantId
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + newItem.quantity;
        existingItem.quantity = Math.min(newQuantity, existingItem.maxQuantity);
      } else {
        const cartItem: CartItem = {
          ...newItem,
          id: `${newItem.productId}-${newItem.variantId || 'default'}-${Date.now()}`,
        };
        state.items.push(cartItem);
      }

      const totals = calculateTotals(state.items, state.promotionCode);
      Object.assign(state, totals);
      saveCartToStorage(state);
    },

    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
      const totals = calculateTotals(state.items, state.promotionCode);
      Object.assign(state, totals);
      saveCartToStorage(state);
    },

    updateQuantity: (state, action: PayloadAction<{ id: string; quantity: number }>) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(item => item.id === id);
      
      if (item && quantity > 0 && quantity <= item.maxQuantity) {
        item.quantity = quantity;
        const totals = calculateTotals(state.items, state.promotionCode);
        Object.assign(state, totals);
        saveCartToStorage(state);
      }
    },

    clearCart: (state) => {
      state.items = [];
      state.promotionCode = null;
      const totals = calculateTotals([], null);
      Object.assign(state, totals);
      saveCartToStorage(state);
    },

    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },

    openCart: (state) => {
      state.isOpen = true;
    },

    closeCart: (state) => {
      state.isOpen = false;
    },

    applyPromotionCode: (state, action: PayloadAction<PromotionCode>) => {
      const promotionCode = action.payload;
      
      // Validate minimum order amount
      if (promotionCode.minOrderAmount && state.subtotal < promotionCode.minOrderAmount) {
        state.promotionCode = {
          ...promotionCode,
          isValid: false,
          errorMessage: `최소 주문 금액 ₩${promotionCode.minOrderAmount.toLocaleString()}을 충족해야 합니다.`,
        };
      } else {
        state.promotionCode = {
          ...promotionCode,
          isValid: true,
          errorMessage: undefined,
        };
      }
      
      const totals = calculateTotals(state.items, state.promotionCode);
      Object.assign(state, totals);
      saveCartToStorage(state);
    },

    removePromotionCode: (state) => {
      state.promotionCode = null;
      const totals = calculateTotals(state.items, null);
      Object.assign(state, totals);
      saveCartToStorage(state);
    },

    validateInventory: (state, action: PayloadAction<{ productId: string; variantId?: string; availableQuantity: number }>) => {
      const { productId, variantId, availableQuantity } = action.payload;
      const item = state.items.find(
        item => item.productId === productId && item.variantId === variantId
      );
      
      if (item && item.quantity > availableQuantity) {
        item.quantity = Math.max(availableQuantity, 0);
        item.maxQuantity = availableQuantity;
        
        const totals = calculateTotals(state.items, state.promotionCode);
        Object.assign(state, totals);
        saveCartToStorage(state);
      }
    },
  },
});

export const {
  addToCart,
  removeFromCart,
  updateQuantity,
  clearCart,
  toggleCart,
  openCart,
  closeCart,
  applyPromotionCode,
  removePromotionCode,
  validateInventory,
} = cartSlice.actions;

export default cartSlice.reducer;