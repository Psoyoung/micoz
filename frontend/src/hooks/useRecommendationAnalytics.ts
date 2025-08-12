import { useCallback, useEffect, useRef } from 'react';
import { Product } from '../types';
import { analyticsService } from '../services/analyticsService';
import { abTestService } from '../services/abTestService';

export interface UseRecommendationAnalyticsProps {
  recommendationType: string;
  userId?: string;
  productIds: string[];
  algorithm?: string;
  context?: Record<string, any>;
}

export interface RecommendationAnalyticsActions {
  trackView: () => void;
  trackClick: (productId: string, position: number) => void;
  trackConversion: (productId: string, value: number) => void;
  getOptimizedAlgorithm: () => Promise<string>;
}

export const useRecommendationAnalytics = ({
  recommendationType,
  userId,
  productIds,
  algorithm,
  context
}: UseRecommendationAnalyticsProps): RecommendationAnalyticsActions => {
  const viewTracked = useRef(false);
  const abTestAlgorithm = useRef<string | null>(null);

  // Get optimized algorithm from A/B test
  const getOptimizedAlgorithm = useCallback(async (): Promise<string> => {
    if (abTestAlgorithm.current) {
      return abTestAlgorithm.current;
    }

    try {
      if (userId) {
        abTestAlgorithm.current = await abTestService.getRecommendationAlgorithm(userId);
      } else {
        abTestAlgorithm.current = algorithm || 'collaborative_filtering';
      }
      return abTestAlgorithm.current;
    } catch (error) {
      console.error('Failed to get optimized algorithm:', error);
      return algorithm || 'collaborative_filtering';
    }
  }, [userId, algorithm]);

  // Track recommendation view
  const trackView = useCallback(async () => {
    if (viewTracked.current || productIds.length === 0) {
      return;
    }

    try {
      const optimizedAlgorithm = await getOptimizedAlgorithm();
      
      await analyticsService.trackRecommendationView(
        recommendationType,
        optimizedAlgorithm,
        productIds,
        context,
        userId
      );
      
      viewTracked.current = true;
    } catch (error) {
      console.error('Failed to track recommendation view:', error);
    }
  }, [recommendationType, productIds, context, userId, getOptimizedAlgorithm]);

  // Track recommendation click
  const trackClick = useCallback(async (productId: string, position: number) => {
    try {
      const optimizedAlgorithm = await getOptimizedAlgorithm();
      
      // Track in analytics
      await analyticsService.trackRecommendationClick(
        recommendationType,
        optimizedAlgorithm,
        productId,
        position,
        context,
        userId
      );

      // Track for A/B testing
      if (userId) {
        await abTestService.trackRecommendationClick(productId, position, userId);
      }
    } catch (error) {
      console.error('Failed to track recommendation click:', error);
    }
  }, [recommendationType, context, userId, getOptimizedAlgorithm]);

  // Track conversion (purchase)
  const trackConversion = useCallback(async (productId: string, value: number) => {
    try {
      // Track conversion for A/B testing
      if (userId) {
        await abTestService.trackRecommendationConversion(productId, value, userId);
      }

      // Track purchase in analytics
      await analyticsService.trackAddToCart(productId, 1, value, userId);
    } catch (error) {
      console.error('Failed to track recommendation conversion:', error);
    }
  }, [userId]);

  // Automatically track view when component mounts or productIds change
  useEffect(() => {
    viewTracked.current = false;
  }, [productIds]);

  return {
    trackView,
    trackClick,
    trackConversion,
    getOptimizedAlgorithm
  };
};