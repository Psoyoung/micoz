import { useCallback, useRef } from 'react';
import { analyticsService } from '../services/analyticsService';
import { abTestService } from '../services/abTestService';

export interface UseSearchAnalyticsProps {
  userId?: string;
}

export interface SearchAnalyticsActions {
  trackSearch: (query: string, resultsCount: number, filters?: Record<string, any>, sortBy?: string) => void;
  trackSearchClick: (query: string, productId: string, position: number) => void;
  getOptimizedSearchAlgorithm: () => Promise<string>;
}

export const useSearchAnalytics = ({
  userId
}: UseSearchAnalyticsProps): SearchAnalyticsActions => {
  const abTestAlgorithm = useRef<string | null>(null);

  // Get optimized search algorithm from A/B test
  const getOptimizedSearchAlgorithm = useCallback(async (): Promise<string> => {
    if (abTestAlgorithm.current) {
      return abTestAlgorithm.current;
    }

    try {
      if (userId) {
        abTestAlgorithm.current = await abTestService.getSearchAlgorithm(userId);
      } else {
        abTestAlgorithm.current = 'elasticsearch_default';
      }
      return abTestAlgorithm.current;
    } catch (error) {
      console.error('Failed to get optimized search algorithm:', error);
      return 'elasticsearch_default';
    }
  }, [userId]);

  // Track search query
  const trackSearch = useCallback(async (
    query: string,
    resultsCount: number,
    filters?: Record<string, any>,
    sortBy?: string
  ) => {
    try {
      await analyticsService.trackSearch(
        query,
        resultsCount,
        filters,
        sortBy,
        userId
      );
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }, [userId]);

  // Track search result click
  const trackSearchClick = useCallback(async (
    query: string,
    productId: string,
    position: number
  ) => {
    try {
      // Track in analytics
      await analyticsService.trackSearchClick(query, productId, position, userId);

      // Track for A/B testing
      if (userId) {
        await abTestService.trackSearchClick(query, productId, position, userId);
      }
    } catch (error) {
      console.error('Failed to track search click:', error);
    }
  }, [userId]);

  return {
    trackSearch,
    trackSearchClick,
    getOptimizedSearchAlgorithm
  };
};