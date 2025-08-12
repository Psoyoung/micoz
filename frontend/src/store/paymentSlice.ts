import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { paymentService, PaymentRequest, PaymentResponse } from '../services/paymentService';
import { orderService, CreateOrderRequest, Order } from '../services/orderService';
import type { RootState } from './index';

export interface PaymentState {
  // 결제 처리 상태
  isProcessing: boolean;
  paymentStatus: 'idle' | 'processing' | 'success' | 'failed';
  
  // 현재 주문
  currentOrder: Order | null;
  
  // 결제 응답
  paymentResponse: PaymentResponse | null;
  
  // 에러
  error: string | null;
  
  // 결제 진행 단계
  paymentStep: 'init' | 'processing' | 'verifying' | 'completed' | 'failed';
}

const initialState: PaymentState = {
  isProcessing: false,
  paymentStatus: 'idle',
  currentOrder: null,
  paymentResponse: null,
  error: null,
  paymentStep: 'init',
};

// 주문 생성 및 결제 처리 비동기 액션
export const processPayment = createAsyncThunk(
  'payment/processPayment',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const { cart, checkout } = state;
      
      // 필수 정보 검증
      if (!checkout.selectedAddress) {
        throw new Error('배송지가 선택되지 않았습니다.');
      }
      if (!checkout.selectedShippingMethod) {
        throw new Error('배송 방법이 선택되지 않았습니다.');
      }
      if (!checkout.selectedPaymentMethod) {
        throw new Error('결제 방법이 선택되지 않았습니다.');
      }
      if (cart.items.length === 0) {
        throw new Error('장바구니가 비어있습니다.');
      }

      // 임시 고객 정보 (실제로는 auth.user에서 가져옴)
      const customerInfo = {
        name: checkout.selectedAddress.name,
        email: 'customer@example.com', // auth.user?.email || 
        phone: checkout.selectedAddress.phone,
      };

      // 1. 주문 생성
      const createOrderRequest: CreateOrderRequest = {
        items: cart.items,
        shippingAddress: checkout.selectedAddress,
        shippingMethod: checkout.selectedShippingMethod,
        paymentMethod: checkout.selectedPaymentMethod,
        orderNote: checkout.orderNote,
        promotionCode: cart.promotionCode?.code,
        subtotal: cart.subtotal,
        discount: cart.discount,
        shippingCost: cart.shipping,
        total: cart.total,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
      };

      const order = await orderService.createOrder(createOrderRequest);

      // 2. 결제 요청
      const paymentRequest: PaymentRequest = {
        orderId: order.id,
        amount: order.total,
        orderName: `MICOZ 주문 (${order.items.length}개 상품)`,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        customerPhone: order.customerPhone,
        method: checkout.selectedPaymentMethod.id as any,
        successUrl: `${window.location.origin}/checkout/success`,
        failUrl: `${window.location.origin}/checkout/fail`,
      };

      const paymentResponse = await paymentService.processPayment(paymentRequest);

      // 3. 결제 결과 처리
      if (paymentResponse.success) {
        // 결제 성공 시 주문 상태 업데이트
        await orderService.updateOrderStatus(order.id, 'paid');
        await orderService.updatePaymentInfo(
          order.id, 
          paymentResponse.transactionId!, 
          paymentResponse.paymentKey
        );
        
        // 재고 감소
        await orderService.decreaseInventory(order.items);
        
        return { order, paymentResponse };
      } else {
        // 결제 실패 시 주문 취소
        await orderService.cancelOrder(order.id);
        throw new Error(paymentResponse.error || '결제가 실패했습니다.');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return rejectWithValue(error instanceof Error ? error.message : '결제 처리 중 오류가 발생했습니다.');
    }
  }
);

// 주문 조회 비동기 액션
export const fetchOrder = createAsyncThunk(
  'payment/fetchOrder',
  async (orderId: string, { rejectWithValue }) => {
    try {
      const order = await orderService.getOrder(orderId);
      if (!order) {
        throw new Error('주문을 찾을 수 없습니다.');
      }
      return order;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '주문 조회 중 오류가 발생했습니다.');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState,
  reducers: {
    // 결제 상태 초기화
    resetPayment: (state) => {
      state.isProcessing = false;
      state.paymentStatus = 'idle';
      state.currentOrder = null;
      state.paymentResponse = null;
      state.error = null;
      state.paymentStep = 'init';
    },
    
    // 에러 클리어
    clearError: (state) => {
      state.error = null;
    },
    
    // 결제 단계 설정
    setPaymentStep: (state, action: PayloadAction<PaymentState['paymentStep']>) => {
      state.paymentStep = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // processPayment
      .addCase(processPayment.pending, (state) => {
        state.isProcessing = true;
        state.paymentStatus = 'processing';
        state.paymentStep = 'processing';
        state.error = null;
      })
      .addCase(processPayment.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.paymentStatus = 'success';
        state.paymentStep = 'completed';
        state.currentOrder = action.payload.order;
        state.paymentResponse = action.payload.paymentResponse;
        state.error = null;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.isProcessing = false;
        state.paymentStatus = 'failed';
        state.paymentStep = 'failed';
        state.error = action.payload as string;
      })
      
      // fetchOrder
      .addCase(fetchOrder.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(fetchOrder.fulfilled, (state, action) => {
        state.isProcessing = false;
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(fetchOrder.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  resetPayment,
  clearError,
  setPaymentStep,
} = paymentSlice.actions;

// Selectors
export const selectPaymentState = (state: RootState) => state.payment;
export const selectIsPaymentProcessing = (state: RootState) => state.payment.isProcessing;
export const selectCurrentOrder = (state: RootState) => state.payment.currentOrder;
export const selectPaymentError = (state: RootState) => state.payment.error;

export default paymentSlice.reducer;