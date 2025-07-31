// Review System Service
// 제품 리뷰, 평점, 도움이 되는 투표 등 리뷰 관련 기능 관리

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export interface ReviewPhoto {
  id: string;
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Review {
  id: string;
  productId?: string;
  userId?: string;
  userName: string;
  userAvatar?: string;
  userAge?: string;
  userSkinType?: string;
  rating: number; // 1-5 stars
  title?: string;
  content: string;
  photos: ReviewPhoto[];
  
  // Review metadata
  helpfulVotes: number;
  totalVotes: number;
  isVerifiedPurchase: boolean;
  purchaseDate?: Date;
  usageDuration?: string; // "1주 사용", "3개월 사용" etc.
  
  // Timestamps
  createdAt: Date;
  updatedAt?: Date;
  
  // User engagement
  likedBy: string[]; // User IDs who liked this review
  
  // Skin concerns and effects
  skinConcerns?: string[];
  effectsExperienced?: string[];
  wouldRecommend: boolean;
  repurchaseIntent: boolean;

  // API specific fields
  comment?: string;
  images?: string[];
  verified?: boolean;
  helpful?: number;
  skinType?: string;
  user?: {
    name: string;
    avatar?: string;
  };
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  verifiedPurchaseCount: number;
  photoReviewCount: number;
  recommendationRate: number;
  repurchaseRate: number;
}

export interface CreateReviewRequest {
  rating: number;
  title?: string;
  comment: string;
  images?: File[];
  skinType?: string;
  skinConcerns?: string[];
  effectsExperienced?: string[];
  wouldRecommend: boolean;
  repurchaseIntent: boolean;
  usageDuration?: string;
}

export interface CreateReviewResponse {
  message: string;
  review: Review;
}

export interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface VoteResponse {
  message: string;
  vote: {
    id: string;
    isHelpful: boolean;
    createdAt: string;
  };
  helpfulCount: number;
}

export interface ReviewFilters {
  rating?: number[];
  hasPhotos?: boolean;
  verifiedOnly?: boolean;
  skinType?: string[];
  sortBy?: 'newest' | 'oldest' | 'highest_rating' | 'lowest_rating' | 'most_helpful';
  skinConcerns?: string[];
}

class ReviewService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private getMultipartHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  // 리뷰 생성
  async createReview(productId: string, reviewData: CreateReviewRequest): Promise<CreateReviewResponse> {
    const formData = new FormData();
    
    formData.append('productId', productId);
    formData.append('rating', reviewData.rating.toString());
    formData.append('comment', reviewData.comment);
    
    if (reviewData.title) {
      formData.append('title', reviewData.title);
    }
    
    if (reviewData.skinType) {
      formData.append('skinType', reviewData.skinType);
    }
    
    if (reviewData.skinConcerns && reviewData.skinConcerns.length > 0) {
      formData.append('skinConcerns', JSON.stringify(reviewData.skinConcerns));
    }
    
    if (reviewData.effectsExperienced && reviewData.effectsExperienced.length > 0) {
      formData.append('effectsExperienced', JSON.stringify(reviewData.effectsExperienced));
    }
    
    formData.append('wouldRecommend', reviewData.wouldRecommend.toString());
    formData.append('repurchaseIntent', reviewData.repurchaseIntent.toString());
    
    if (reviewData.usageDuration) {
      formData.append('usageDuration', reviewData.usageDuration);
    }
    
    if (reviewData.images && reviewData.images.length > 0) {
      reviewData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: 'POST',
      headers: this.getMultipartHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to create review');
    }

    return response.json();
  }

  // 리뷰 수정
  async updateReview(reviewId: string, reviewData: Partial<CreateReviewRequest>): Promise<CreateReviewResponse> {
    const formData = new FormData();
    
    if (reviewData.rating) {
      formData.append('rating', reviewData.rating.toString());
    }
    
    if (reviewData.comment) {
      formData.append('comment', reviewData.comment);
    }
    
    if (reviewData.title !== undefined) {
      formData.append('title', reviewData.title);
    }
    
    if (reviewData.skinType) {
      formData.append('skinType', reviewData.skinType);
    }
    
    if (reviewData.skinConcerns) {
      formData.append('skinConcerns', JSON.stringify(reviewData.skinConcerns));
    }
    
    if (reviewData.effectsExperienced) {
      formData.append('effectsExperienced', JSON.stringify(reviewData.effectsExperienced));
    }
    
    if (reviewData.wouldRecommend !== undefined) {
      formData.append('wouldRecommend', reviewData.wouldRecommend.toString());
    }
    
    if (reviewData.repurchaseIntent !== undefined) {
      formData.append('repurchaseIntent', reviewData.repurchaseIntent.toString());
    }
    
    if (reviewData.usageDuration !== undefined) {
      formData.append('usageDuration', reviewData.usageDuration);
    }
    
    if (reviewData.images && reviewData.images.length > 0) {
      reviewData.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'PUT',
      headers: this.getMultipartHeaders(),
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to update review');
    }

    return response.json();
  }

  // 리뷰 삭제
  async deleteReview(reviewId: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to delete review');
    }

    return response.json();
  }

  // 제품별 리뷰 조회
  async getProductReviews(
    productId: string, 
    filters?: ReviewFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<ReviewsResponse> {
    const params = new URLSearchParams();
    
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters) {
      if (filters.sortBy) {
        const sortByMap = {
          'newest': 'createdAt',
          'oldest': 'createdAt',
          'highest_rating': 'rating',
          'lowest_rating': 'rating',
          'most_helpful': 'helpful'
        };
        params.append('sortBy', sortByMap[filters.sortBy]);
        
        const sortOrderMap = {
          'newest': 'desc',
          'oldest': 'asc',
          'highest_rating': 'desc',
          'lowest_rating': 'asc',
          'most_helpful': 'desc'
        };
        params.append('sortOrder', sortOrderMap[filters.sortBy]);
      }
      
      if (filters.rating && filters.rating.length === 1) {
        params.append('rating', filters.rating[0].toString());
      }
      
      if (filters.verifiedOnly) {
        params.append('verifiedOnly', 'true');
      }
      
      if (filters.hasPhotos) {
        params.append('withImages', 'true');
      }
    }

    const response = await fetch(`${API_BASE_URL}/products/${productId}/reviews?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch reviews');
    }

    const data = await response.json();
    
    // Transform API response to match frontend interface
    return {
      reviews: data.reviews.map((review: any) => ({
        ...review,
        userName: review.user?.name || '익명',
        userAvatar: review.user?.avatar,
        content: review.comment,
        photos: (review.images || []).map((url: string, index: number) => ({
          id: `${review.id}_${index}`,
          url,
          alt: `리뷰 이미지 ${index + 1}`
        })),
        isVerifiedPurchase: review.verified,
        createdAt: new Date(review.createdAt),
        updatedAt: review.updatedAt ? new Date(review.updatedAt) : undefined,
        likedBy: [], // Will be implemented later
        wouldRecommend: review.wouldRecommend !== undefined ? review.wouldRecommend : true,
        repurchaseIntent: review.repurchaseIntent !== undefined ? review.repurchaseIntent : false
      })),
      pagination: data.pagination
    };
  }

  // 내 리뷰 조회
  async getMyReviews(options: {
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'rating';
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<ReviewsResponse> {
    const params = new URLSearchParams();
    
    if (options.page) params.append('page', options.page.toString());
    if (options.limit) params.append('limit', options.limit.toString());
    if (options.sortBy) params.append('sortBy', options.sortBy);
    if (options.sortOrder) params.append('sortOrder', options.sortOrder);

    const response = await fetch(`${API_BASE_URL}/my-reviews?${params}`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to fetch your reviews');
    }

    const data = await response.json();
    
    // Transform API response to match frontend interface
    return {
      reviews: data.reviews.map((review: any) => ({
        ...review,
        userName: '나', // Current user
        content: review.comment,
        photos: (review.images || []).map((url: string, index: number) => ({
          id: `${review.id}_${index}`,
          url,
          alt: `리뷰 이미지 ${index + 1}`
        })),
        isVerifiedPurchase: review.verified,
        createdAt: new Date(review.createdAt),
        updatedAt: review.updatedAt ? new Date(review.updatedAt) : undefined,
        likedBy: [],
        wouldRecommend: review.wouldRecommend !== undefined ? review.wouldRecommend : true,
        repurchaseIntent: review.repurchaseIntent !== undefined ? review.repurchaseIntent : false
      })),
      pagination: data.pagination
    };
  }

  // 리뷰 도움됨 투표
  async voteHelpful(reviewId: string, isHelpful: boolean): Promise<VoteResponse> {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/vote`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ isHelpful }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to vote');
    }

    return response.json();
  }

  // 제품 리뷰 통계 (기존 로직 유지 - 클라이언트에서 계산)
  async getProductReviewStats(productId: string): Promise<ReviewStats> {
    try {
      const { reviews } = await this.getProductReviews(productId, undefined, 1, 1000); // Get all reviews for stats
      
      if (reviews.length === 0) {
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          verifiedPurchaseCount: 0,
          photoReviewCount: 0,
          recommendationRate: 0,
          repurchaseRate: 0
        };
      }

      const totalReviews = reviews.length;
      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
      
      const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(review => {
        ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
      });

      const verifiedPurchaseCount = reviews.filter(r => r.isVerifiedPurchase).length;
      const photoReviewCount = reviews.filter(r => r.photos.length > 0).length;
      const recommendationRate = reviews.filter(r => r.wouldRecommend).length / totalReviews * 100;
      const repurchaseRate = reviews.filter(r => r.repurchaseIntent).length / totalReviews * 100;

      return {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
        verifiedPurchaseCount,
        photoReviewCount,
        recommendationRate: Math.round(recommendationRate),
        repurchaseRate: Math.round(repurchaseRate)
      };
    } catch (error) {
      console.error('Failed to get product review stats:', error);
      return {
        totalReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        verifiedPurchaseCount: 0,
        photoReviewCount: 0,
        recommendationRate: 0,
        repurchaseRate: 0
      };
    }
  }

  // 리뷰 검색 (기존 로직 유지 - 클라이언트에서 필터링)
  async searchReviews(query: string, productId?: string): Promise<Review[]> {
    try {
      if (productId) {
        const { reviews } = await this.getProductReviews(productId);
        const searchTerms = query.toLowerCase().split(' ');
        
        return reviews.filter(review => {
          const searchText = `${review.title || ''} ${review.content} ${review.userName}`.toLowerCase();
          return searchTerms.every(term => searchText.includes(term));
        });
      }
      
      // Global search would require a separate API endpoint
      return [];
    } catch (error) {
      console.error('Failed to search reviews:', error);
      return [];
    }
  }

  // Legacy methods for backward compatibility
  async getUserReviews(userId: string): Promise<Review[]> {
    // This would need to be implemented with a proper API endpoint
    // For now, return empty array
    return [];
  }

  async toggleLike(reviewId: string, userId: string): Promise<boolean> {
    // This would need to be implemented with a proper API endpoint
    // For now, return false
    return false;
  }

  async reportReview(reviewId: string, userId: string, reason: string): Promise<boolean> {
    // This would need to be implemented with a proper API endpoint
    // For now, return false
    return false;
  }
}

// Singleton instance
export const reviewService = new ReviewService();

// Utility functions
export const formatRating = (rating: number): string => {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
};

export const getHelpfulnessPercentage = (helpfulVotes: number, totalVotes: number): number => {
  if (totalVotes === 0) return 0;
  return Math.round((helpfulVotes / totalVotes) * 100);
};

export const formatUsageDuration = (duration: string): string => {
  return duration || '사용기간 미기재';
};

export const getSkinTypeColor = (skinType: string): string => {
  const colors: Record<string, string> = {
    'OILY': '#FF6B6B',
    'DRY': '#4ECDC4',
    'COMBINATION': '#45B7D1',
    'SENSITIVE': '#96CEB4',
    'NORMAL': '#FECA57',
    '건성': '#e67e22',
    '지성': '#3498db',
    '복합성': '#9b59b6',
    '민감성': '#e74c3c',
    '정상': '#27ae60'
  };
  return colors[skinType] || '#95a5a6';
};

export const getVerificationBadge = (isVerified: boolean): string => {
  return isVerified ? '✓ 구매확인' : '';
};