// Shipping Integration Service
// CJ대한통운, 롯데택배 등 배송사 연동

export interface TrackingInfo {
  trackingNumber: string;
  shippingCompany: string;
  status: 'preparing' | 'shipped' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception';
  statusText: string;
  estimatedDelivery?: Date;
  actualDelivery?: Date;
  history: TrackingEvent[];
  recipient: {
    name: string;
    address: string;
    phone: string;
  };
}

export interface TrackingEvent {
  timestamp: Date;
  location: string;
  status: string;
  description: string;
}

export interface ShippingRate {
  company: string;
  service: string;
  price: number;
  estimatedDays: string;
  features: string[];
}

// Mock CJ대한통운 API
class MockCJLogistics {
  async calculateShipping(
    origin: string,
    destination: string,
    weight: number,
    dimensions: { width: number; height: number; depth: number }
  ): Promise<ShippingRate[]> {
    // Mock calculation based on distance and weight
    const baseRate = 3000;
    const weightSurcharge = weight > 5 ? Math.ceil((weight - 5) / 5) * 1000 : 0;
    
    return [
      {
        company: 'CJ대한통운',
        service: '일반택배',
        price: baseRate + weightSurcharge,
        estimatedDays: '2-3일',
        features: ['실시간 추적', '안전 배송']
      },
      {
        company: 'CJ대한통운',
        service: '당일배송',
        price: baseRate + weightSurcharge + 2000,
        estimatedDays: '당일',
        features: ['당일 배송', '실시간 추적']
      }
    ];
  }

  async createShipment(orderInfo: any): Promise<string> {
    // Generate mock tracking number
    const trackingNumber = `CJ${Date.now().toString().slice(-9)}`;
    console.log('CJ Logistics shipment created:', trackingNumber);
    return trackingNumber;
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    // Mock tracking information
    const statuses = ['preparing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'] as const;
    const currentStatusIndex = Math.min(
      Math.floor((Date.now() % 432000000) / 86400000), // 5일 주기로 상태 변경
      statuses.length - 1
    );
    const currentStatus = statuses[currentStatusIndex];

    const history: TrackingEvent[] = [];
    const baseTime = Date.now() - (4 - currentStatusIndex) * 86400000;

    // Generate mock history
    const locations = ['서울 물류센터', '분당 허브', '수원 터미널', '배송지역 센터'];
    const descriptions = [
      '상품 접수 완료',
      '간선상차 완료',
      '터미널 도착',
      '배송 출발',
      '배송 완료'
    ];

    for (let i = 0; i <= currentStatusIndex; i++) {
      history.push({
        timestamp: new Date(baseTime + i * 86400000),
        location: locations[i] || '배송지',
        status: statuses[i],
        description: descriptions[i]
      });
    }

    return {
      trackingNumber,
      shippingCompany: 'CJ대한통운',
      status: currentStatus,
      statusText: this.getStatusText(currentStatus),
      estimatedDelivery: new Date(Date.now() + (5 - currentStatusIndex) * 86400000),
      actualDelivery: currentStatus === 'delivered' ? new Date(baseTime + currentStatusIndex * 86400000) : undefined,
      history,
      recipient: {
        name: '김고객',
        address: '경기도 성남시 분당구',
        phone: '010-1234-5678'
      }
    };
  }

  private getStatusText(status: TrackingInfo['status']): string {
    const statusTexts = {
      'preparing': '상품 준비 중',
      'shipped': '배송 시작',
      'in_transit': '배송 중',
      'out_for_delivery': '배송지 도착',
      'delivered': '배송 완료',
      'exception': '배송 예외'
    };
    return statusTexts[status];
  }
}

// Mock 롯데택배 API
class MockLotteLogistics {
  async calculateShipping(
    origin: string,
    destination: string,
    weight: number,
    dimensions: { width: number; height: number; depth: number }
  ): Promise<ShippingRate[]> {
    const baseRate = 2800;
    const weightSurcharge = weight > 5 ? Math.ceil((weight - 5) / 5) * 800 : 0;
    
    return [
      {
        company: '롯데택배',
        service: '표준택배',
        price: baseRate + weightSurcharge,
        estimatedDays: '2-4일',
        features: ['안전 배송', '보험 적용']
      },
      {
        company: '롯데택배',
        service: '익일배송',
        price: baseRate + weightSurcharge + 1500,
        estimatedDays: '익일',
        features: ['익일 배송', '보험 적용']
      }
    ];
  }

  async createShipment(orderInfo: any): Promise<string> {
    const trackingNumber = `LO${Date.now().toString().slice(-9)}`;
    console.log('Lotte Logistics shipment created:', trackingNumber);
    return trackingNumber;
  }

  async trackShipment(trackingNumber: string): Promise<TrackingInfo> {
    // Similar implementation to CJ but with different locations/descriptions
    const statuses = ['preparing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'] as const;
    const currentStatusIndex = Math.min(
      Math.floor((Date.now() % 345600000) / 86400000),
      statuses.length - 1
    );
    const currentStatus = statuses[currentStatusIndex];

    const history: TrackingEvent[] = [];
    const baseTime = Date.now() - (4 - currentStatusIndex) * 86400000;

    const locations = ['인천 물류센터', '김포 허브', '안양 터미널', '지역 배송센터'];
    const descriptions = [
      '물품 접수',
      '간선상차',
      '중간 터미널 경유',
      '최종 배송지 출발',
      '고객 전달 완료'
    ];

    for (let i = 0; i <= currentStatusIndex; i++) {
      history.push({
        timestamp: new Date(baseTime + i * 86400000),
        location: locations[i] || '배송 완료',
        status: statuses[i],
        description: descriptions[i]
      });
    }

    return {
      trackingNumber,
      shippingCompany: '롯데택배',
      status: currentStatus,
      statusText: this.getStatusText(currentStatus),
      estimatedDelivery: new Date(Date.now() + (5 - currentStatusIndex) * 86400000),
      actualDelivery: currentStatus === 'delivered' ? new Date(baseTime + currentStatusIndex * 86400000) : undefined,
      history,
      recipient: {
        name: '이고객',
        address: '서울시 강남구',
        phone: '010-9876-5432'
      }
    };
  }

  private getStatusText(status: TrackingInfo['status']): string {
    const statusTexts = {
      'preparing': '상품 준비 중',
      'shipped': '픽업 완료',
      'in_transit': '이동 중',
      'out_for_delivery': '배송 출발',
      'delivered': '배송 완료',
      'exception': '배송 이슈'
    };
    return statusTexts[status];
  }
}

// Main Shipping Service
export class ShippingService {
  private cjLogistics: MockCJLogistics;
  private lotteLogistics: MockLotteLogistics;

  constructor() {
    this.cjLogistics = new MockCJLogistics();
    this.lotteLogistics = new MockLotteLogistics();
  }

  // 배송비 조회
  async getShippingRates(
    origin: string,
    destination: string,
    weight: number = 1,
    dimensions: { width: number; height: number; depth: number } = { width: 20, height: 20, depth: 10 }
  ): Promise<ShippingRate[]> {
    try {
      const [cjRates, lotteRates] = await Promise.all([
        this.cjLogistics.calculateShipping(origin, destination, weight, dimensions),
        this.lotteLogistics.calculateShipping(origin, destination, weight, dimensions)
      ]);

      return [...cjRates, ...lotteRates];
    } catch (error) {
      console.error('Failed to get shipping rates:', error);
      return this.getFallbackRates();
    }
  }

  // 배송 생성
  async createShipment(orderInfo: {
    orderId: string;
    shippingCompany: string;
    recipient: {
      name: string;
      address: string;
      phone: string;
    };
    items: Array<{
      name: string;
      quantity: number;
      weight?: number;
    }>;
  }): Promise<string> {
    try {
      if (orderInfo.shippingCompany.includes('CJ') || orderInfo.shippingCompany.includes('대한통운')) {
        return await this.cjLogistics.createShipment(orderInfo);
      } else {
        return await this.lotteLogistics.createShipment(orderInfo);
      }
    } catch (error) {
      console.error('Failed to create shipment:', error);
      // Fallback tracking number
      return `ERR${Date.now().toString().slice(-9)}`;
    }
  }

  // 배송 추적
  async trackShipment(trackingNumber: string): Promise<TrackingInfo | null> {
    try {
      if (trackingNumber.startsWith('CJ')) {
        return await this.cjLogistics.trackShipment(trackingNumber);
      } else if (trackingNumber.startsWith('LO')) {
        return await this.lotteLogistics.trackShipment(trackingNumber);
      } else {
        throw new Error('Unknown shipping company');
      }
    } catch (error) {
      console.error('Failed to track shipment:', error);
      return null;
    }
  }

  // 배송 상태 업데이트 시뮬레이션 (실제로는 웹훅으로 받음)
  async simulateStatusUpdate(trackingNumber: string): Promise<TrackingInfo | null> {
    // Mock status update simulation
    console.log('Simulating status update for:', trackingNumber);
    return await this.trackShipment(trackingNumber);
  }

  // Fallback 배송비 (API 실패 시)
  private getFallbackRates(): ShippingRate[] {
    return [
      {
        company: '일반배송',
        service: '표준',
        price: 3000,
        estimatedDays: '2-3일',
        features: ['안전배송']
      }
    ];
  }
}

// Singleton instance
export const shippingService = new ShippingService();

// Utility functions
export const formatShippingStatus = (status: TrackingInfo['status']): { text: string; color: string } => {
  const statusMap = {
    'preparing': { text: '상품 준비 중', color: '#f59e0b' },
    'shipped': { text: '배송 시작', color: '#3b82f6' },
    'in_transit': { text: '배송 중', color: '#6366f1' },
    'out_for_delivery': { text: '배송 출발', color: '#8b5cf6' },
    'delivered': { text: '배송 완료', color: '#10b981' },
    'exception': { text: '배송 예외', color: '#ef4444' }
  };
  
  return statusMap[status] || { text: '알 수 없음', color: '#6b7280' };
};

export const getEstimatedDeliveryText = (estimatedDelivery: Date): string => {
  const now = new Date();
  const diffTime = estimatedDelivery.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return '배송 예정일 지남';
  if (diffDays === 0) return '오늘 배송 예정';
  if (diffDays === 1) return '내일 배송 예정';
  return `${diffDays}일 후 배송 예정`;
};

export const formatTrackingNumber = (trackingNumber: string): string => {
  // Format tracking number for display (e.g., CJ123456789 -> CJ 1234 5678 9)
  if (trackingNumber.length > 4) {
    const prefix = trackingNumber.slice(0, 2);
    const numbers = trackingNumber.slice(2);
    return `${prefix} ${numbers.match(/.{1,4}/g)?.join(' ') || numbers}`;
  }
  return trackingNumber;
};