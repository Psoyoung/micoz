import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Address {
  id: string;
  name: string;
  phone: string;
  zipCode: string;
  address: string;
  detailAddress: string;
  isDefault: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  description: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'card' | 'bank' | 'mobile' | 'point';
  icon: string;
  fee?: number;
}

interface CheckoutState {
  // 진행 단계
  currentStep: number;
  steps: string[];
  
  // 배송 정보
  selectedAddress: Address | null;
  selectedShippingMethod: ShippingMethod | null;
  shippingMethods: ShippingMethod[];
  
  // 결제 정보
  selectedPaymentMethod: PaymentMethod | null;
  paymentMethods: PaymentMethod[];
  
  // 주문 정보
  orderNote: string;
  
  // 할인 및 쿠폰
  appliedCoupon: string | null;
  discountAmount: number;
  
  // 로딩 상태
  isProcessing: boolean;
  
  // 에러
  error: string | null;
}

const initialState: CheckoutState = {
  currentStep: 0,
  steps: ['장바구니 확인', '배송 정보', '결제 방법', '주문 완료'],
  
  selectedAddress: null,
  selectedShippingMethod: null,
  shippingMethods: [
    {
      id: 'standard',
      name: '일반배송',
      price: 3000,
      estimatedDays: '2-3일',
      description: '영업일 기준 2-3일 내 배송'
    },
    {
      id: 'express',
      name: '당일배송',
      price: 5000,
      estimatedDays: '당일',
      description: '오후 2시 이전 주문 시 당일 배송 (서울/경기 일부)'
    },
    {
      id: 'free',
      name: '무료배송',
      price: 0,
      estimatedDays: '3-5일',
      description: '5만원 이상 구매 시 무료배송'
    }
  ],
  
  selectedPaymentMethod: null,
  paymentMethods: [
    {
      id: 'card',
      name: '신용카드',
      type: 'card',
      icon: '💳'
    },
    {
      id: 'kakaopay',
      name: '카카오페이',
      type: 'mobile',
      icon: '💛'
    },
    {
      id: 'tosspay',
      name: '토스페이',
      type: 'mobile',
      icon: '💙'
    },
    {
      id: 'bank',
      name: '무통장입금',
      type: 'bank',
      icon: '🏛️'
    }
  ],
  
  orderNote: '',
  appliedCoupon: null,
  discountAmount: 0,
  isProcessing: false,
  error: null,
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    // 단계 이동
    nextStep: (state) => {
      if (state.currentStep < state.steps.length - 1) {
        state.currentStep += 1;
      }
    },
    
    prevStep: (state) => {
      if (state.currentStep > 0) {
        state.currentStep -= 1;
      }
    },
    
    setStep: (state, action: PayloadAction<number>) => {
      if (action.payload >= 0 && action.payload < state.steps.length) {
        state.currentStep = action.payload;
      }
    },
    
    // 배송 정보
    setSelectedAddress: (state, action: PayloadAction<Address>) => {
      state.selectedAddress = action.payload;
    },
    
    setSelectedShippingMethod: (state, action: PayloadAction<ShippingMethod>) => {
      state.selectedShippingMethod = action.payload;
    },
    
    // 결제 정보
    setSelectedPaymentMethod: (state, action: PayloadAction<PaymentMethod>) => {
      state.selectedPaymentMethod = action.payload;
    },
    
    // 주문 메모
    setOrderNote: (state, action: PayloadAction<string>) => {
      state.orderNote = action.payload;
    },
    
    // 쿠폰 적용
    applyCoupon: (state, action: PayloadAction<{ code: string; discount: number }>) => {
      state.appliedCoupon = action.payload.code;
      state.discountAmount = action.payload.discount;
    },
    
    removeCoupon: (state) => {
      state.appliedCoupon = null;
      state.discountAmount = 0;
    },
    
    // 로딩 상태
    setProcessing: (state, action: PayloadAction<boolean>) => {
      state.isProcessing = action.payload;
    },
    
    // 에러 처리
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    // 체크아웃 초기화
    resetCheckout: (state) => {
      return {
        ...initialState,
        shippingMethods: state.shippingMethods,
        paymentMethods: state.paymentMethods,
      };
    },
  },
});

export const {
  nextStep,
  prevStep,
  setStep,
  setSelectedAddress,
  setSelectedShippingMethod,
  setSelectedPaymentMethod,
  setOrderNote,
  applyCoupon,
  removeCoupon,
  setProcessing,
  setError,
  resetCheckout,
} = checkoutSlice.actions;

export default checkoutSlice.reducer;