import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import wishlistReducer from './wishlistSlice';
import toastReducer from './toastSlice';
import checkoutReducer from './checkoutSlice';
import addressReducer from './addressSlice';
import paymentReducer from './paymentSlice';

export const store = configureStore({
  reducer: {
    cart: cartReducer,
    wishlist: wishlistReducer,
    toast: toastReducer,
    checkout: checkoutReducer,
    address: addressReducer,
    payment: paymentReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;