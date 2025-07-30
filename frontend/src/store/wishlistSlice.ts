import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  slug: string;
  brand: string;
  category: string;
  inStock: boolean;
  addedAt: string;
}

interface WishlistState {
  items: WishlistItem[];
  itemCount: number;
}

const initialState: WishlistState = {
  items: [],
  itemCount: 0,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action: PayloadAction<WishlistItem>) => {
      const item = action.payload;
      const existingItem = state.items.find(wishItem => wishItem.productId === item.productId);
      
      if (!existingItem) {
        state.items.push({
          ...item,
          addedAt: new Date().toISOString(),
        });
        state.itemCount = state.items.length;
      }
    },

    removeFromWishlist: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.productId !== action.payload);
      state.itemCount = state.items.length;
    },

    toggleWishlist: (state, action: PayloadAction<WishlistItem>) => {
      const item = action.payload;
      const existingItemIndex = state.items.findIndex(wishItem => wishItem.productId === item.productId);
      
      if (existingItemIndex >= 0) {
        state.items.splice(existingItemIndex, 1);
      } else {
        state.items.push({
          ...item,
          addedAt: new Date().toISOString(),
        });
      }
      state.itemCount = state.items.length;
    },

    clearWishlist: (state) => {
      state.items = [];
      state.itemCount = 0;
    },

    updateWishlistItemStock: (state, action: PayloadAction<{ productId: string; inStock: boolean }>) => {
      const { productId, inStock } = action.payload;
      const item = state.items.find(item => item.productId === productId);
      if (item) {
        item.inStock = inStock;
      }
    },
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
  updateWishlistItemStock,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;