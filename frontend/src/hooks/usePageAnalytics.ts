import { useEffect, useCallback, useRef } from 'react';
import { analyticsService } from '../services/analyticsService';

export interface UsePageAnalyticsProps {
  page: string;
  userId?: string;
  autoTrack?: boolean;
}

export interface PageAnalyticsActions {
  trackPageView: () => void;
  trackScrollDepth: (depth: number) => void;
  trackTimeOnPage: () => void;
  trackProductView: (productId: string, category: string) => void;
  trackAddToCart: (productId: string, quantity: number, price: number) => void;
  trackPurchase: (orderId: string, productIds: string[], totalValue: number) => void;
}

export const usePageAnalytics = ({
  page,
  userId,
  autoTrack = true
}: UsePageAnalyticsProps): PageAnalyticsActions => {
  const startTime = useRef<number>(Date.now());
  const maxScrollDepth = useRef<number>(0);
  const pageViewTracked = useRef<boolean>(false);

  // Track page view
  const trackPageView = useCallback(async () => {
    if (pageViewTracked.current) {
      return;
    }

    try {
      await analyticsService.trackPageView(page, userId);
      pageViewTracked.current = true;
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }, [page, userId]);

  // Track scroll depth
  const trackScrollDepth = useCallback(async (depth: number) => {
    if (depth > maxScrollDepth.current) {
      maxScrollDepth.current = depth;
      
      try {
        await analyticsService.trackScrollDepth(depth, userId);
      } catch (error) {
        console.error('Failed to track scroll depth:', error);
      }
    }
  }, [userId]);

  // Track time on page
  const trackTimeOnPage = useCallback(async () => {
    const duration = (Date.now() - startTime.current) / 1000; // in seconds
    
    try {
      await analyticsService.trackTimeOnPage(duration, userId);
    } catch (error) {
      console.error('Failed to track time on page:', error);
    }
  }, [userId]);

  // Track product view
  const trackProductView = useCallback(async (productId: string, category: string) => {
    try {
      await analyticsService.trackProductView(productId, category, userId);
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  }, [userId]);

  // Track add to cart
  const trackAddToCart = useCallback(async (
    productId: string,
    quantity: number,
    price: number
  ) => {
    try {
      await analyticsService.trackAddToCart(productId, quantity, price, userId);
    } catch (error) {
      console.error('Failed to track add to cart:', error);
    }
  }, [userId]);

  // Track purchase
  const trackPurchase = useCallback(async (
    orderId: string,
    productIds: string[],
    totalValue: number
  ) => {
    try {
      await analyticsService.trackPurchase(orderId, productIds, totalValue, userId);
    } catch (error) {
      console.error('Failed to track purchase:', error);
    }
  }, [userId]);

  // Setup scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollDepth = Math.round((scrollTop / documentHeight) * 100);
      
      if (scrollDepth > maxScrollDepth.current) {
        trackScrollDepth(scrollDepth);
      }
    };

    if (autoTrack) {
      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [autoTrack, trackScrollDepth]);

  // Setup page visibility tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackTimeOnPage();
      }
    };

    const handleBeforeUnload = () => {
      trackTimeOnPage();
    };

    if (autoTrack) {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [autoTrack, trackTimeOnPage]);

  // Auto track page view on mount
  useEffect(() => {
    if (autoTrack) {
      trackPageView();
    }
  }, [autoTrack, trackPageView]);

  // Reset tracking when page changes
  useEffect(() => {
    startTime.current = Date.now();
    maxScrollDepth.current = 0;
    pageViewTracked.current = false;
  }, [page]);

  return {
    trackPageView,
    trackScrollDepth,
    trackTimeOnPage,
    trackProductView,
    trackAddToCart,
    trackPurchase
  };
};