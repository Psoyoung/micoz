export interface AnalyticsEvent {
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  pageUrl: string;
  userAgent: string;
}

export interface SearchAnalytics {
  query: string;
  resultsCount: number;
  clickedProductId?: string;
  clickPosition?: number;
  filters?: Record<string, any>;
  sortBy?: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
}

export interface RecommendationAnalytics {
  recommendationType: string;
  algorithm: string;
  productIds: string[];
  clickedProductId?: string;
  clickPosition?: number;
  userId?: string;
  sessionId: string;
  context?: Record<string, any>;
  timestamp: Date;
}

export interface ABTestResult {
  testId: string;
  variant: string;
  userId: string;
  outcome: 'conversion' | 'click' | 'view' | 'bounce';
  value?: number;
  timestamp: Date;
}

export interface AnalyticsMetrics {
  totalEvents: number;
  uniqueUsers: number;
  searchQueries: number;
  searchClickThrough: number;
  recommendationClicks: number;
  recommendationConversions: number;
  conversionRate: number;
  averageSessionDuration: number;
  bounceRate: number;
}

class AnalyticsService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  private sessionId: string;
  private eventQueue: AnalyticsEvent[] = [];
  private isOnline = navigator.onLine;
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds

  constructor() {
    this.sessionId = this.generateSessionId();
    this.setupEventListeners();
    this.startBatchProcessor();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupEventListeners(): void {
    // Online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushEvents();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.flushEvents();
      }
    });

    // Before page unload
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
    });
  }

  private startBatchProcessor(): void {
    setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.flushInterval);
  }

  // Generic event tracking
  async trackEvent(eventType: string, eventData: Record<string, any>, userId?: string): Promise<void> {
    const event: AnalyticsEvent = {
      eventType,
      eventData,
      userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
    };

    this.eventQueue.push(event);

    if (this.eventQueue.length >= this.batchSize) {
      await this.flushEvents();
    }
  }

  // Search analytics
  async trackSearch(
    query: string,
    resultsCount: number,
    filters?: Record<string, any>,
    sortBy?: string,
    userId?: string
  ): Promise<void> {
    const searchData: SearchAnalytics = {
      query,
      resultsCount,
      filters,
      sortBy,
      userId,
      sessionId: this.sessionId,
      timestamp: new Date(),
    };

    await this.trackEvent('search_query', searchData, userId);
  }

  async trackSearchClick(
    query: string,
    productId: string,
    position: number,
    userId?: string
  ): Promise<void> {
    const clickData = {
      query,
      productId,
      position,
      action: 'search_result_click',
    };

    await this.trackEvent('search_click', clickData, userId);
  }

  // Recommendation analytics
  async trackRecommendationView(
    recommendationType: string,
    algorithm: string,
    productIds: string[],
    context?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const recommendationData: RecommendationAnalytics = {
      recommendationType,
      algorithm,
      productIds,
      userId,
      sessionId: this.sessionId,
      context,
      timestamp: new Date(),
    };

    await this.trackEvent('recommendation_view', recommendationData, userId);
  }

  async trackRecommendationClick(
    recommendationType: string,
    algorithm: string,
    productId: string,
    position: number,
    context?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const clickData = {
      recommendationType,
      algorithm,
      productId,
      position,
      context,
      action: 'recommendation_click',
    };

    await this.trackEvent('recommendation_click', clickData, userId);
  }

  // A/B Testing
  async trackABTest(
    testId: string,
    variant: string,
    outcome: 'conversion' | 'click' | 'view' | 'bounce',
    value?: number,
    userId?: string
  ): Promise<void> {
    const abTestData: ABTestResult = {
      testId,
      variant,
      userId: userId || 'anonymous',
      outcome,
      value,
      timestamp: new Date(),
    };

    await this.trackEvent('ab_test_result', abTestData, userId);
  }

  // Page views
  async trackPageView(page: string, userId?: string): Promise<void> {
    const pageViewData = {
      page,
      referrer: document.referrer,
      title: document.title,
    };

    await this.trackEvent('page_view', pageViewData, userId);
  }

  // Product interactions
  async trackProductView(productId: string, category: string, userId?: string): Promise<void> {
    const productData = {
      productId,
      category,
      action: 'product_view',
    };

    await this.trackEvent('product_interaction', productData, userId);
  }

  async trackAddToCart(productId: string, quantity: number, price: number, userId?: string): Promise<void> {
    const cartData = {
      productId,
      quantity,
      price,
      action: 'add_to_cart',
    };

    await this.trackEvent('cart_interaction', cartData, userId);
  }

  async trackPurchase(
    orderId: string,
    productIds: string[],
    totalValue: number,
    userId?: string
  ): Promise<void> {
    const purchaseData = {
      orderId,
      productIds,
      totalValue,
      action: 'purchase',
    };

    await this.trackEvent('purchase', purchaseData, userId);
  }

  // User engagement
  async trackScrollDepth(depth: number, userId?: string): Promise<void> {
    const scrollData = {
      depth,
      page: window.location.pathname,
    };

    await this.trackEvent('scroll_depth', scrollData, userId);
  }

  async trackTimeOnPage(duration: number, userId?: string): Promise<void> {
    const timeData = {
      duration,
      page: window.location.pathname,
    };

    await this.trackEvent('time_on_page', timeData, userId);
  }

  // Flush events to server
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0 || !this.isOnline) {
      return;
    }

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      await fetch(`${this.baseUrl}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: eventsToFlush }),
      });
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Re-add events to queue if sending failed
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  // Get analytics data
  async getAnalyticsMetrics(
    startDate: Date,
    endDate: Date,
    filters?: Record<string, any>
  ): Promise<AnalyticsMetrics> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...filters,
      });

      const response = await fetch(`${this.baseUrl}/analytics/metrics?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics metrics');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get analytics metrics:', error);
      throw error;
    }
  }

  async getSearchAnalytics(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<SearchAnalytics[]> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/analytics/search?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch search analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get search analytics:', error);
      throw error;
    }
  }

  async getRecommendationAnalytics(
    startDate: Date,
    endDate: Date,
    limit: number = 100
  ): Promise<RecommendationAnalytics[]> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: limit.toString(),
      });

      const response = await fetch(`${this.baseUrl}/analytics/recommendations?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendation analytics');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get recommendation analytics:', error);
      throw error;
    }
  }

  async getABTestResults(testId?: string): Promise<ABTestResult[]> {
    try {
      const params = new URLSearchParams();
      if (testId) params.append('testId', testId);

      const response = await fetch(`${this.baseUrl}/analytics/ab-tests?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch A/B test results');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get A/B test results:', error);
      throw error;
    }
  }

  // Session management
  getSessionId(): string {
    return this.sessionId;
  }

  regenerateSessionId(): void {
    this.sessionId = this.generateSessionId();
  }
}

export const analyticsService = new AnalyticsService();