// Payment Gateway Integration Service
// 실제 운영 환경에서는 각 결제사의 실제 SDK를 사용해야 합니다.

export interface PaymentRequest {
  orderId: string;
  amount: number;
  orderName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  method: 'card' | 'kakaopay' | 'tosspay' | 'bank';
  successUrl: string;
  failUrl: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentKey?: string;
  method?: string;
  amount?: number;
  orderId?: string;
  error?: string;
  errorCode?: string;
}

// Mock TossPayments SDK (실제로는 @tosspayments/payment-sdk 사용)
class MockTossPayments {
  async requestPayment(method: string, options: any): Promise<PaymentResponse> {
    // 실제 환경에서는 TossPayments SDK 호출
    return new Promise((resolve) => {
      setTimeout(() => {
        // 90% 성공률로 시뮬레이션
        const success = Math.random() > 0.1;
        
        if (success) {
          resolve({
            success: true,
            transactionId: `toss_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            paymentKey: `payment_${Date.now()}`,
            method: method,
            amount: options.amount,
            orderId: options.orderId,
          });
        } else {
          resolve({
            success: false,
            error: '결제가 취소되었습니다.',
            errorCode: 'USER_CANCEL',
          });
        }
      }, 2000); // 2초 지연으로 실제 결제 프로세스 시뮬레이션
    });
  }
}

// Mock KakaoPay API
class MockKakaoPay {
  async requestPayment(options: any): Promise<PaymentResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.1;
        
        if (success) {
          resolve({
            success: true,
            transactionId: `kakao_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            method: 'kakaopay',
            amount: options.amount,
            orderId: options.orderId,
          });
        } else {
          resolve({
            success: false,
            error: '카카오페이 결제가 실패했습니다.',
            errorCode: 'PAYMENT_FAILED',
          });
        }
      }, 1500);
    });
  }
}

// Mock NaverPay API (토스페이로 대체)
class MockNaverPay {
  async requestPayment(options: any): Promise<PaymentResponse> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const success = Math.random() > 0.1;
        
        if (success) {
          resolve({
            success: true,
            transactionId: `naver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            method: 'tosspay',
            amount: options.amount,
            orderId: options.orderId,
          });
        } else {
          resolve({
            success: false,
            error: '토스페이 결제가 실패했습니다.',
            errorCode: 'PAYMENT_FAILED',
          });
        }
      }, 1800);
    });
  }
}

// Payment Service Class
export class PaymentService {
  private tossPayments: MockTossPayments;
  private kakaoPay: MockKakaoPay;
  private naverPay: MockNaverPay;

  constructor() {
    this.tossPayments = new MockTossPayments();
    this.kakaoPay = new MockKakaoPay();
    this.naverPay = new MockNaverPay();
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      console.log('Processing payment:', request);

      switch (request.method) {
        case 'card':
          return await this.tossPayments.requestPayment('카드', {
            amount: request.amount,
            orderId: request.orderId,
            orderName: request.orderName,
            customerName: request.customerName,
            customerEmail: request.customerEmail,
            successUrl: request.successUrl,
            failUrl: request.failUrl,
          });

        case 'kakaopay':
          return await this.kakaoPay.requestPayment({
            amount: request.amount,
            orderId: request.orderId,
            orderName: request.orderName,
            customerName: request.customerName,
          });

        case 'tosspay':
          return await this.naverPay.requestPayment({
            amount: request.amount,
            orderId: request.orderId,
            orderName: request.orderName,
            customerName: request.customerName,
          });

        case 'bank':
          // 무통장입금은 즉시 성공 처리 (실제로는 가상계좌 발급)
          return {
            success: true,
            transactionId: `bank_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            method: 'bank',
            amount: request.amount,
            orderId: request.orderId,
          };

        default:
          return {
            success: false,
            error: '지원하지 않는 결제 방법입니다.',
            errorCode: 'UNSUPPORTED_METHOD',
          };
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      return {
        success: false,
        error: '결제 처리 중 오류가 발생했습니다.',
        errorCode: 'PROCESSING_ERROR',
      };
    }
  }

  // 결제 취소 (실제 환경에서 구현)
  async cancelPayment(transactionId: string): Promise<boolean> {
    console.log('Cancelling payment:', transactionId);
    // Mock implementation
    return true;
  }

  // 결제 상태 조회 (실제 환경에서 구현)
  async getPaymentStatus(transactionId: string): Promise<'SUCCESS' | 'FAILED' | 'PENDING'> {
    console.log('Getting payment status:', transactionId);
    // Mock implementation
    return 'SUCCESS';
  }
}

// Singleton instance
export const paymentService = new PaymentService();

// Utility functions
export const generateOrderId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `ORDER_${timestamp}_${random}`;
};

export const formatPaymentMethod = (method: string): string => {
  const methodNames: Record<string, string> = {
    'card': '신용카드',
    'kakaopay': '카카오페이',
    'tosspay': '토스페이',
    'bank': '무통장입금',
  };
  return methodNames[method] || method;
};

export const getPaymentErrorMessage = (errorCode: string): string => {
  const errorMessages: Record<string, string> = {
    'USER_CANCEL': '사용자가 결제를 취소했습니다.',
    'PAYMENT_FAILED': '결제가 실패했습니다. 다시 시도해주세요.',
    'INSUFFICIENT_FUNDS': '잔액이 부족합니다.',
    'CARD_ERROR': '카드 정보를 확인해주세요.',
    'NETWORK_ERROR': '네트워크 오류가 발생했습니다.',
    'UNSUPPORTED_METHOD': '지원하지 않는 결제 방법입니다.',
    'PROCESSING_ERROR': '결제 처리 중 오류가 발생했습니다.',
  };
  return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.';
};