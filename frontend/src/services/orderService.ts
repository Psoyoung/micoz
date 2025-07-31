import type { CartItem } from '../store/cartSlice';
import type { Address, ShippingMethod, PaymentMethod } from '../store/checkoutSlice';
import { shippingService } from './shippingService';
import { inventoryService } from './inventoryService';

export interface OrderItem {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  variant?: {
    name: string;
    sku: string;
  };
}

export interface Order {
  id: string;
  orderNumber: string;
  status: 'pending' | 'paid' | 'preparing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  
  // 가격 정보
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  
  // 고객 정보
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  
  // 배송 정보
  shippingAddress: Address;
  shippingMethod: ShippingMethod;
  orderNote?: string;
  
  // 결제 정보
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  transactionId?: string;
  paymentKey?: string;
  
  // 쿠폰 정보
  promotionCode?: string;
  
  // 배송 추적
  trackingNumber?: string;
  shippingCompany?: string;
  
  // 타임스탬프
  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
  shippedAt?: Date;
  deliveredAt?: Date;
}

export interface CreateOrderRequest {
  items: CartItem[];
  shippingAddress: Address;
  shippingMethod: ShippingMethod;
  paymentMethod: PaymentMethod;
  orderNote?: string;
  promotionCode?: string;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}

class OrderService {
  private orders: Order[] = [];

  // 주문 생성
  async createOrder(request: CreateOrderRequest): Promise<Order> {
    // 1. 재고 확인
    const stockChecks = await inventoryService.checkMultipleStock(
      request.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity
      }))
    );

    // 재고 부족 상품 확인
    const insufficientStock = stockChecks.filter(check => !check.isAvailable);
    if (insufficientStock.length > 0) {
      const errorMessages = insufficientStock.map(check => 
        `${check.productId}: 요청 ${check.requestedQuantity}개, 가능 ${check.availableQuantity}개`
      );
      throw new Error(`재고가 부족합니다: ${errorMessages.join(', ')}`);
    }

    const orderNumber = this.generateOrderNumber();
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const order: Order = {
      id: orderId,
      orderNumber,
      status: 'pending',
      items: request.items.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        variant: item.variant,
      })),
      subtotal: request.subtotal,
      discount: request.discount,
      shippingCost: request.shippingCost,
      total: request.total,
      customerName: request.customerName,
      customerEmail: request.customerEmail,
      customerPhone: request.customerPhone,
      shippingAddress: request.shippingAddress,
      shippingMethod: request.shippingMethod,
      orderNote: request.orderNote,
      paymentMethod: request.paymentMethod,
      paymentStatus: 'pending',
      promotionCode: request.promotionCode,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 2. 재고 예약
    const reservationPromises = request.items.map(item =>
      inventoryService.reserveStock(item.productId, item.quantity, orderId, item.variantId)
    );
    
    try {
      await Promise.all(reservationPromises);
    } catch (error) {
      throw new Error('재고 예약 중 오류가 발생했습니다.');
    }

    // 메모리에 저장 (실제로는 서버 API 호출)
    this.orders.push(order);
    
    // 로컬 스토리지에도 저장
    this.saveOrdersToStorage();
    
    console.log('Order created:', order);
    return order;
  }

  // 주문 상태 업데이트
  async updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return null;

    const previousStatus = order.status;
    order.status = status;
    order.updatedAt = new Date();
    
    if (status === 'paid') {
      order.paymentStatus = 'paid';
      order.paidAt = new Date();
      
      // 결제 완료 시 재고 차감
      await this.decreaseInventory(order.items);
      
    } else if (status === 'shipped' && !order.shippedAt) {
      order.shippedAt = new Date();
      
      // 배송 시작 시 배송 추적번호 생성
      try {
        const shippingCompany = order.shippingMethod.name.includes('CJ') || 
                               order.shippingMethod.name.includes('대한통운') ? 'CJ대한통운' : '롯데택배';
        
        const trackingNumber = await shippingService.createShipment({
          orderId: order.id,
          shippingCompany,
          recipient: {
            name: order.shippingAddress.name,
            address: `${order.shippingAddress.address} ${order.shippingAddress.detailAddress}`,
            phone: order.shippingAddress.phone
          },
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            weight: 0.5 // Mock weight
          }))
        });
        
        order.trackingNumber = trackingNumber;
        order.shippingCompany = shippingCompany;
        
      } catch (error) {
        console.error('Failed to create shipment:', error);
        // Fallback
        order.trackingNumber = this.generateTrackingNumber();
        order.shippingCompany = order.shippingMethod.name.includes('CJ') ? 'CJ대한통운' : '롯데택배';
      }
      
    } else if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
      
    } else if (status === 'cancelled' && previousStatus !== 'cancelled') {
      // 주문 취소 시 재고 복원
      await this.restoreInventory(order.items);
    }

    this.saveOrdersToStorage();
    console.log('Order status updated:', order);
    return order;
  }

  // 결제 정보 업데이트
  async updatePaymentInfo(orderId: string, transactionId: string, paymentKey?: string): Promise<Order | null> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return null;

    order.transactionId = transactionId;
    order.paymentKey = paymentKey;
    order.updatedAt = new Date();
    
    this.saveOrdersToStorage();
    return order;
  }

  // 주문 조회
  async getOrder(orderId: string): Promise<Order | null> {
    return this.orders.find(order => order.id === orderId) || null;
  }

  // 주문 번호로 조회
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    return this.orders.find(order => order.orderNumber === orderNumber) || null;
  }

  // 사용자의 주문 목록 조회
  async getUserOrders(customerEmail: string): Promise<Order[]> {
    return this.orders.filter(order => order.customerEmail === customerEmail);
  }

  // 재고 감소 처리
  async decreaseInventory(items: OrderItem[]): Promise<boolean> {
    console.log('Decreasing inventory for items:', items);
    
    try {
      const decreasePromises = items.map(item =>
        inventoryService.decreaseStock(item.productId, item.quantity, item.variantId)
      );
      
      const results = await Promise.all(decreasePromises);
      const failures = results.filter(result => !result.success);
      
      if (failures.length > 0) {
        console.error('Failed to decrease inventory:', failures);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error decreasing inventory:', error);
      return false;
    }
  }

  // 재고 복원 처리 (주문 취소 시)
  async restoreInventory(items: OrderItem[]): Promise<boolean> {
    console.log('Restoring inventory for items:', items);
    
    try {
      const restorePromises = items.map(item =>
        inventoryService.restoreStock(item.productId, item.quantity, item.variantId)
      );
      
      const results = await Promise.all(restorePromises);
      const failures = results.filter(result => !result.success);
      
      if (failures.length > 0) {
        console.error('Failed to restore inventory:', failures);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error restoring inventory:', error);
      return false;
    }
  }

  // 배송 추적 정보 조회
  async getTrackingInfo(orderId: string): Promise<any> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order || !order.trackingNumber) return null;

    try {
      const trackingInfo = await shippingService.trackShipment(order.trackingNumber);
      return trackingInfo;
    } catch (error) {
      console.error('Failed to get tracking info:', error);
      return null;
    }
  }

  // 주문 취소
  async cancelOrder(orderId: string): Promise<Order | null> {
    const order = this.orders.find(o => o.id === orderId);
    if (!order) return null;

    // 취소 가능한 상태인지 확인
    if (!['pending', 'paid', 'preparing'].includes(order.status)) {
      throw new Error('취소할 수 없는 주문 상태입니다.');
    }

    order.status = 'cancelled';
    order.updatedAt = new Date();
    
    // 재고 복원
    await this.restoreInventory(order.items);
    
    this.saveOrdersToStorage();
    console.log('Order cancelled:', order);
    return order;
  }

  // 주문번호 생성
  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    
    return `${year}${month}${day}${random}`;
  }

  // 송장번호 생성
  private generateTrackingNumber(): string {
    const prefix = Math.random() > 0.5 ? 'CJ' : 'LO'; // CJ 또는 롯데
    const number = Math.floor(Math.random() * 900000000) + 100000000;
    return `${prefix}${number}`;
  }

  // 로컬 스토리지에 주문 저장
  private saveOrdersToStorage(): void {
    try {
      localStorage.setItem('micoz_orders', JSON.stringify(
        this.orders.map(order => ({
          ...order,
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          paidAt: order.paidAt?.toISOString(),
          shippedAt: order.shippedAt?.toISOString(),
          deliveredAt: order.deliveredAt?.toISOString(),
        }))
      ));
    } catch (error) {
      console.error('Failed to save orders to localStorage:', error);
    }
  }

  // 로컬 스토리지에서 주문 로드
  private loadOrdersFromStorage(): void {
    try {
      const savedOrders = localStorage.getItem('micoz_orders');
      if (savedOrders) {
        const parsedOrders = JSON.parse(savedOrders);
        this.orders = parsedOrders.map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt),
          updatedAt: new Date(order.updatedAt),
          paidAt: order.paidAt ? new Date(order.paidAt) : undefined,
          shippedAt: order.shippedAt ? new Date(order.shippedAt) : undefined,
          deliveredAt: order.deliveredAt ? new Date(order.deliveredAt) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load orders from localStorage:', error);
    }
  }

  constructor() {
    this.loadOrdersFromStorage();
  }
}

// Singleton instance
export const orderService = new OrderService();

// Utility functions
export const getOrderStatusText = (status: Order['status']): string => {
  const statusTexts: Record<Order['status'], string> = {
    'pending': '주문 대기',
    'paid': '결제 완료',
    'preparing': '상품 준비 중',
    'shipped': '배송 중',
    'delivered': '배송 완료',
    'cancelled': '주문 취소',
  };
  return statusTexts[status];
};

export const getPaymentStatusText = (status: Order['paymentStatus']): string => {
  const statusTexts: Record<Order['paymentStatus'], string> = {
    'pending': '결제 대기',
    'paid': '결제 완료',
    'failed': '결제 실패',
    'refunded': '환불 완료',
  };
  return statusTexts[status];
};

export const canCancelOrder = (order: Order): boolean => {
  return ['pending', 'paid', 'preparing'].includes(order.status);
};

export const formatOrderNumber = (orderNumber: string): string => {
  // 20241231ABCDEF -> 2024-12-31-ABCDEF
  if (orderNumber.length >= 8) {
    const year = '20' + orderNumber.slice(0, 2);
    const month = orderNumber.slice(2, 4);
    const day = orderNumber.slice(4, 6);
    const code = orderNumber.slice(6);
    return `${year}-${month}-${day}-${code}`;
  }
  return orderNumber;
};