// Inventory Management Service
// 재고 확인, 예약, 감소 등 재고 관리 기능

export interface InventoryItem {
  productId: string;
  variantId?: string;
  sku: string;
  name: string;
  availableQuantity: number;
  reservedQuantity: number;
  totalQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
  lastUpdated: Date;
}

export interface InventoryReservation {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  orderId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface StockCheck {
  productId: string;
  variantId?: string;
  requestedQuantity: number;
  availableQuantity: number;
  isAvailable: boolean;
  maxQuantity: number;
}

class InventoryService {
  private inventory: Map<string, InventoryItem> = new Map();
  private reservations: Map<string, InventoryReservation> = new Map();
  private reservationDuration = 15 * 60 * 1000; // 15분

  constructor() {
    this.initializeMockInventory();
    this.loadFromStorage();
    this.startReservationCleanup();
  }

  // Mock 재고 데이터 초기화
  private initializeMockInventory(): void {
    const mockProducts = [
      { id: 'prod1', name: '라벤더 세럼', quantity: 50, threshold: 10 },
      { id: 'prod2', name: '로즈 토너', quantity: 30, threshold: 5 },
      { id: 'prod3', name: '그린티 클렌저', quantity: 25, threshold: 8 },
      { id: 'prod4', name: '비타민C 크림', quantity: 40, threshold: 12 },
      { id: 'prod5', name: '하이알루론 마스크', quantity: 60, threshold: 15 },
    ];

    mockProducts.forEach(product => {
      const inventoryItem: InventoryItem = {
        productId: product.id,
        sku: `SKU-${product.id.toUpperCase()}`,
        name: product.name,
        availableQuantity: product.quantity,
        reservedQuantity: 0,
        totalQuantity: product.quantity,
        lowStockThreshold: product.threshold,
        isActive: true,
        lastUpdated: new Date()
      };
      
      this.inventory.set(this.getInventoryKey(product.id), inventoryItem);
    });
  }

  // 재고 키 생성
  private getInventoryKey(productId: string, variantId?: string): string {
    return variantId ? `${productId}:${variantId}` : productId;
  }

  // 재고 확인
  async checkStock(productId: string, variantId?: string, quantity: number = 1): Promise<StockCheck> {
    const key = this.getInventoryKey(productId, variantId);
    const item = this.inventory.get(key);

    if (!item || !item.isActive) {
      return {
        productId,
        variantId,
        requestedQuantity: quantity,
        availableQuantity: 0,
        isAvailable: false,
        maxQuantity: 0
      };
    }

    const availableQuantity = item.availableQuantity - item.reservedQuantity;
    
    return {
      productId,
      variantId,
      requestedQuantity: quantity,
      availableQuantity: item.availableQuantity,
      isAvailable: availableQuantity >= quantity,
      maxQuantity: availableQuantity
    };
  }

  // 다중 상품 재고 확인
  async checkMultipleStock(items: Array<{ productId: string; variantId?: string; quantity: number }>): Promise<StockCheck[]> {
    const results = await Promise.all(
      items.map(item => this.checkStock(item.productId, item.variantId, item.quantity))
    );
    
    return results;
  }

  // 재고 예약 (장바구니에 담을 때, 주문 시작 시)
  async reserveStock(
    productId: string,
    quantity: number,
    orderId: string,
    variantId?: string
  ): Promise<{ success: boolean; reservationId?: string; error?: string }> {
    const stockCheck = await this.checkStock(productId, variantId, quantity);
    
    if (!stockCheck.isAvailable) {
      return {
        success: false,
        error: `재고가 부족합니다. 요청: ${quantity}, 가능: ${stockCheck.availableQuantity}`
      };
    }

    const key = this.getInventoryKey(productId, variantId);
    const item = this.inventory.get(key);
    
    if (!item) {
      return { success: false, error: '상품을 찾을 수 없습니다.' };
    }

    // 예약 생성
    const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const reservation: InventoryReservation = {
      id: reservationId,
      productId,
      variantId,
      quantity,
      orderId,
      expiresAt: new Date(Date.now() + this.reservationDuration),
      createdAt: new Date()
    };

    this.reservations.set(reservationId, reservation);
    
    // 예약 수량 증가
    item.reservedQuantity += quantity;
    item.lastUpdated = new Date();
    
    this.saveToStorage();
    
    console.log(`Stock reserved: ${quantity} units of ${productId} for order ${orderId}`);
    
    return { success: true, reservationId };
  }

  // 재고 예약 해제
  async releaseReservation(reservationId: string): Promise<boolean> {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) return false;

    const key = this.getInventoryKey(reservation.productId, reservation.variantId);
    const item = this.inventory.get(key);
    
    if (item) {
      item.reservedQuantity = Math.max(0, item.reservedQuantity - reservation.quantity);
      item.lastUpdated = new Date();
    }

    this.reservations.delete(reservationId);
    this.saveToStorage();
    
    console.log(`Reservation released: ${reservationId}`);
    return true;
  }

  // 재고 차감 (주문 완료 시)
  async decreaseStock(
    productId: string,
    quantity: number,
    variantId?: string,
    reservationId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const key = this.getInventoryKey(productId, variantId);
    const item = this.inventory.get(key);
    
    if (!item) {
      return { success: false, error: '상품을 찾을 수 없습니다.' };
    }

    // 예약이 있는 경우 예약 해제
    if (reservationId) {
      await this.releaseReservation(reservationId);
    }

    // 실제 재고 차감
    if (item.availableQuantity < quantity) {
      return { success: false, error: '재고가 부족합니다.' };
    }

    item.availableQuantity -= quantity;
    item.totalQuantity -= quantity;
    item.lastUpdated = new Date();
    
    this.saveToStorage();
    
    console.log(`Stock decreased: ${quantity} units of ${productId}`);
    
    // 재고 부족 알림 체크
    if (item.availableQuantity <= item.lowStockThreshold) {
      this.sendLowStockAlert(item);
    }
    
    return { success: true };
  }

  // 재고 복원 (주문 취소 시)
  async restoreStock(
    productId: string,
    quantity: number,
    variantId?: string
  ): Promise<{ success: boolean; error?: string }> {
    const key = this.getInventoryKey(productId, variantId);
    const item = this.inventory.get(key);
    
    if (!item) {
      return { success: false, error: '상품을 찾을 수 없습니다.' };
    }

    item.availableQuantity += quantity;
    item.totalQuantity += quantity;
    item.lastUpdated = new Date();
    
    this.saveToStorage();
    
    console.log(`Stock restored: ${quantity} units of ${productId}`);
    return { success: true };
  }

  // 재고 정보 조회
  async getInventoryInfo(productId: string, variantId?: string): Promise<InventoryItem | null> {
    const key = this.getInventoryKey(productId, variantId);
    return this.inventory.get(key) || null;
  }

  // 전체 재고 목록 조회
  async getAllInventory(): Promise<InventoryItem[]> {
    return Array.from(this.inventory.values());
  }

  // 재고 부족 상품 조회
  async getLowStockItems(): Promise<InventoryItem[]> {
    return Array.from(this.inventory.values()).filter(
      item => item.availableQuantity <= item.lowStockThreshold
    );
  }

  // 만료된 예약 정리
  private startReservationCleanup(): void {
    setInterval(() => {
      const now = new Date();
      const expiredReservations: string[] = [];

      this.reservations.forEach((reservation, id) => {
        if (reservation.expiresAt < now) {
          expiredReservations.push(id);
        }
      });

      expiredReservations.forEach(id => {
        this.releaseReservation(id);
      });

      if (expiredReservations.length > 0) {
        console.log(`Cleaned up ${expiredReservations.length} expired reservations`);
      }
    }, 60000); // 1분마다 체크
  }

  // 재고 부족 알림
  private sendLowStockAlert(item: InventoryItem): void {
    console.warn(`⚠️ Low stock alert: ${item.name} (${item.availableQuantity} remaining)`);
    // 실제 환경에서는 관리자에게 이메일/SMS 발송
  }

  // localStorage에 저장
  private saveToStorage(): void {
    try {
      const inventoryData = {
        inventory: Array.from(this.inventory.entries()).map(([key, item]) => [
          key,
          {
            ...item,
            lastUpdated: item.lastUpdated.toISOString()
          }
        ]),
        reservations: Array.from(this.reservations.entries()).map(([key, reservation]) => [
          key,
          {
            ...reservation,
            expiresAt: reservation.expiresAt.toISOString(),
            createdAt: reservation.createdAt.toISOString()
          }
        ])
      };
      
      localStorage.setItem('micoz_inventory', JSON.stringify(inventoryData));
    } catch (error) {
      console.error('Failed to save inventory to storage:', error);
    }
  }

  // localStorage에서 로드
  private loadFromStorage(): void {
    try {
      const savedData = localStorage.getItem('micoz_inventory');
      if (!savedData) return;

      const { inventory, reservations } = JSON.parse(savedData);
      
      // 재고 데이터 복원
      if (inventory) {
        inventory.forEach(([key, item]: [string, any]) => {
          this.inventory.set(key, {
            ...item,
            lastUpdated: new Date(item.lastUpdated)
          });
        });
      }
      
      // 예약 데이터 복원 (만료되지 않은 것만)
      if (reservations) {
        const now = new Date();
        reservations.forEach(([key, reservation]: [string, any]) => {
          const expiresAt = new Date(reservation.expiresAt);
          if (expiresAt > now) {
            this.reservations.set(key, {
              ...reservation,
              expiresAt,
              createdAt: new Date(reservation.createdAt)
            });
          }
        });
      }
    } catch (error) {
      console.error('Failed to load inventory from storage:', error);
    }
  }
}

// Singleton instance
export const inventoryService = new InventoryService();

// Utility functions
export const getStockStatus = (item: InventoryItem): { 
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
  text: string;
  color: string;
} => {
  const available = item.availableQuantity - item.reservedQuantity;
  
  if (available <= 0) {
    return { status: 'out_of_stock', text: '품절', color: '#ef4444' };
  } else if (available <= item.lowStockThreshold) {
    return { status: 'low_stock', text: '재고 부족', color: '#f59e0b' };
  } else {
    return { status: 'in_stock', text: '재고 충분', color: '#10b981' };
  }
};

export const formatStockQuantity = (quantity: number): string => {
  if (quantity <= 0) return '품절';
  if (quantity <= 5) return `${quantity}개 남음`;
  return `${quantity}개`;
};

export const calculateStockPercentage = (available: number, total: number): number => {
  if (total <= 0) return 0;
  return Math.round((available / total) * 100);
};