import { Product } from '../types';

export interface RecommendationOptions {
  userId?: string;
  productId?: string;
  category?: string;
  skinType?: string;
  limit?: number;
  excludeProductIds?: string[];
}

export interface PersonalizedRecommendationOptions extends RecommendationOptions {
  includeBasedOn?: ('browsing' | 'purchases' | 'wishlist' | 'ratings')[];
  preferredCategories?: string[];
  preferredBrands?: string[];
}

export interface TrendingProductsOptions {
  period?: 'day' | 'week' | 'month' | 'year';
  category?: string;
  limit?: number;
}

export interface RecommendationResult {
  products: Product[];
  reason?: string;
  basedOn?: string;
  confidence?: number;
}

export interface RecommendationAnalytics {
  recommendationType: string;
  productIds: string[];
  userId?: string;
  context?: Record<string, any>;
  timestamp: Date;
}

class RecommendationService {
  private baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          ...options?.headers,
        },
        credentials: 'include',
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Personalized recommendations based on user profile and behavior
  async getPersonalizedRecommendations(
    userId: string, 
    limit: number = 10, 
    options?: PersonalizedRecommendationOptions
  ): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        userId,
        limit: limit.toString(),
        ...(options?.category && { category: options.category }),
        ...(options?.skinType && { skinType: options.skinType }),
        ...(options?.includeBasedOn && { basedOn: options.includeBasedOn.join(',') }),
        ...(options?.preferredCategories && { preferredCategories: options.preferredCategories.join(',') }),
        ...(options?.preferredBrands && { preferredBrands: options.preferredBrands.join(',') }),
        ...(options?.excludeProductIds && { exclude: options.excludeProductIds.join(',') }),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/personalized?${params.toString()}`
      );

      // Track analytics
      this.trackRecommendation('personalized', result.products.map(p => p.id), userId);

      return result.products;
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      return [];
    }
  }

  // Similar products based on collaborative filtering
  async getSimilarProducts(productId: string, limit: number = 10): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        productId,
        limit: limit.toString(),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/similar?${params.toString()}`
      );

      // Track analytics
      this.trackRecommendation('similar', result.products.map(p => p.id), undefined, { productId });

      return result.products;
    } catch (error) {
      console.error('Failed to get similar products:', error);
      return [];
    }
  }

  // Trending products based on current popularity
  async getTrendingProducts(
    limit: number = 10, 
    category?: string, 
    options?: TrendingProductsOptions
  ): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(category && { category }),
        ...(options?.period && { period: options.period }),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/trending?${params.toString()}`
      );

      // Track analytics
      this.trackRecommendation('trending', result.products.map(p => p.id), undefined, { category, period: options?.period });

      return result.products;
    } catch (error) {
      console.error('Failed to get trending products:', error);
      return [];
    }
  }

  // Recommendations based on user's skin type
  async getSkinTypeRecommendations(userId: string, limit: number = 10): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        userId,
        limit: limit.toString(),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/skin-type?${params.toString()}`
      );

      // Track analytics
      this.trackRecommendation('skin-type', result.products.map(p => p.id), userId);

      return result.products;
    } catch (error) {
      console.error('Failed to get skin type recommendations:', error);
      return [];
    }
  }

  // Recommendations based on browsing history
  async getBrowsingHistoryRecommendations(userId: string, limit: number = 10): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        userId,
        limit: limit.toString(),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/browsing-history?${params.toString()}`
      );

      // Track analytics
      this.trackRecommendation('browsing-history', result.products.map(p => p.id), userId);

      return result.products;
    } catch (error) {
      console.error('Failed to get browsing history recommendations:', error);
      return [];
    }
  }

  // Recommendations based on purchase history
  async getPurchaseHistoryRecommendations(userId: string, limit: number = 10): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        userId,
        limit: limit.toString(),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/purchase-history?${params.toString()}`
      );

      // Track analytics
      this.trackRecommendation('purchase-history', result.products.map(p => p.id), userId);

      return result.products;
    } catch (error) {
      console.error('Failed to get purchase history recommendations:', error);
      return [];
    }
  }

  // Recommendations for products that go well together
  async getComplementaryProducts(productId: string, limit: number = 10): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        productId,
        limit: limit.toString(),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/complementary?${params.toString()}`
      );

      // Track analytics
      this.trackRecommendation('complementary', result.products.map(p => p.id), undefined, { productId });

      return result.products;
    } catch (error) {
      console.error('Failed to get complementary products:', error);
      return [];
    }
  }

  // Recommendations based on frequently bought together
  async getFrequentlyBoughtTogether(productId: string, limit: number = 10): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        productId,
        limit: limit.toString(),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/frequently-bought-together?${params.toString()}`
      );

      // Track analytics
      this.trackRecommendation('frequently-bought-together', result.products.map(p => p.id), undefined, { productId });

      return result.products;
    } catch (error) {
      console.error('Failed to get frequently bought together products:', error);
      return [];
    }
  }

  // Get recommendations for specific categories
  async getCategoryRecommendations(category: string, userId?: string, limit: number = 10): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        category,
        limit: limit.toString(),
        ...(userId && { userId }),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/category?${params.toString()}`
      );

      // Track analytics
      this.trackRecommendation('category', result.products.map(p => p.id), userId, { category });

      return result.products;
    } catch (error) {
      console.error('Failed to get category recommendations:', error);
      return [];
    }
  }

  // Get new arrivals recommendations
  async getNewArrivals(limit: number = 10, category?: string): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(category && { category }),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/new-arrivals?${params.toString()}`
      );

      // Track analytics
      this.trackRecommendation('new-arrivals', result.products.map(p => p.id), undefined, { category });

      return result.products;
    } catch (error) {
      console.error('Failed to get new arrivals:', error);
      return [];
    }
  }

  // Get bestseller recommendations
  async getBestsellers(limit: number = 10, category?: string): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        limit: limit.toString(),
        ...(category && { category }),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/bestsellers?${params.toString()}`
      );

      // Track analytics
      this.trackRecommendation('bestsellers', result.products.map(p => p.id), undefined, { category });

      return result.products;
    } catch (error) {
      console.error('Failed to get bestsellers:', error);
      return [];
    }
  }

  // Track user interaction with recommendations for improvement
  async trackRecommendationInteraction(
    recommendationType: string,
    productId: string,
    action: 'view' | 'click' | 'add_to_cart' | 'purchase' | 'wishlist',
    userId?: string
  ): Promise<void> {
    try {
      await this.makeRequest('/recommendations/track-interaction', {
        method: 'POST',
        body: JSON.stringify({
          recommendationType,
          productId,
          action,
          userId,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.error('Failed to track recommendation interaction:', error);
    }
  }

  // Get recommendation performance analytics
  async getRecommendationAnalytics(
    startDate: Date,
    endDate: Date,
    type?: string
  ): Promise<any> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(type && { type }),
      });

      return await this.makeRequest(`/recommendations/analytics?${params.toString()}`);
    } catch (error) {
      console.error('Failed to get recommendation analytics:', error);
      return null;
    }
  }

  // A/B test different recommendation algorithms
  async getABTestRecommendations(
    testId: string,
    userId: string,
    variant: 'A' | 'B',
    limit: number = 10
  ): Promise<Product[]> {
    try {
      const params = new URLSearchParams({
        testId,
        userId,
        variant,
        limit: limit.toString(),
      });

      const result = await this.makeRequest<RecommendationResult>(
        `/recommendations/ab-test?${params.toString()}`
      );

      // Track A/B test analytics
      this.trackRecommendation('ab-test', result.products.map(p => p.id), userId, { testId, variant });

      return result.products;
    } catch (error) {
      console.error('Failed to get A/B test recommendations:', error);
      return [];
    }
  }

  // Private method to track recommendation analytics
  private async trackRecommendation(
    type: string,
    productIds: string[],
    userId?: string,
    context?: Record<string, any>
  ): Promise<void> {
    try {
      // Don't await this call to avoid blocking the UI
      this.makeRequest('/recommendations/track', {
        method: 'POST',
        body: JSON.stringify({
          recommendationType: type,
          productIds,
          userId,
          context,
          timestamp: new Date().toISOString(),
        }),
      }).catch(error => {
        console.error('Failed to track recommendation:', error);
      });
    } catch (error) {
      console.error('Failed to track recommendation:', error);
    }
  }

  // Utility method to format recommendation reason
  formatRecommendationReason(type: string, basedOn?: string): string {
    const reasons: Record<string, string> = {
      'personalized': '개인 맞춤 추천',
      'similar': '유사한 상품',
      'trending': '인기 상품',
      'skin-type': '피부 타입별 추천',
      'browsing-history': '최근 관심 상품 기반',
      'purchase-history': '구매 이력 기반',
      'complementary': '함께 사용하면 좋은 상품',
      'frequently-bought-together': '함께 구매한 상품',
      'category': '카테고리 추천',
      'new-arrivals': '신상품',
      'bestsellers': '베스트셀러',
      'ab-test': 'A/B 테스트 추천',
    };

    return reasons[type] || '추천 상품';
  }
}

export const recommendationService = new RecommendationService();