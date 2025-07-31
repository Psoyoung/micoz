// Review System Service
// 제품 리뷰, 평점, 도움이 되는 투표 등 리뷰 관련 기능 관리

export interface ReviewPhoto {
  id: string;
  url: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userAge?: string;
  userSkinType?: string;
  rating: number; // 1-5 stars
  title: string;
  content: string;
  photos: ReviewPhoto[];
  
  // Review metadata
  helpfulVotes: number;
  totalVotes: number;
  isVerifiedPurchase: boolean;
  purchaseDate?: Date;
  usageDuration?: string; // "1주 사용", "3개월 사용" etc.
  
  // Moderation
  status: 'pending' | 'approved' | 'rejected';
  moderationReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // User engagement
  likedBy: string[]; // User IDs who liked this review
  reportedBy: string[]; // User IDs who reported this review
  
  // Skin concerns and effects
  skinConcerns?: string[];
  effectsExperienced?: string[];
  wouldRecommend: boolean;
  repurchaseIntent: boolean;
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
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userAge?: string;
  userSkinType?: string;
  rating: number;
  title: string;
  content: string;
  photos?: ReviewPhoto[];
  usageDuration?: string;
  skinConcerns?: string[];
  effectsExperienced?: string[];
  wouldRecommend: boolean;
  repurchaseIntent: boolean;
  isVerifiedPurchase?: boolean;
  purchaseDate?: Date;
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
  private reviews: Review[] = [];
  private votedReviews: Map<string, Set<string>> = new Map(); // reviewId -> Set of userIds who voted

  constructor() {
    this.loadFromStorage();
    this.initializeMockData();
  }

  // Mock 데이터 초기화
  private initializeMockData(): void {
    if (this.reviews.length === 0) {
      const mockReviews: Review[] = [
        {
          id: 'review_1',
          productId: 'prod1',
          userId: 'user_1',
          userName: '김미영',
          userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
          userAge: '20대 후반',
          userSkinType: '복합성',
          rating: 5,
          title: '정말 순하고 효과 좋아요!',
          content: '민감한 피부라 걱정했는데 정말 순하면서도 효과가 좋네요. 라벤더 향이 은은하고 진정 효과가 뛰어나요. 사용한 지 2주 정도 됐는데 피부 톤이 한층 밝아진 것 같아요. 아침에 일어나면 피부가 촉촉하고 부드러워서 너무 만족스러워요. 확실히 자연 성분이라 그런지 자극이 전혀 없어서 매일 사용하고 있어요.',
          photos: [
            {
              id: 'photo_1',
              url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
              alt: '라벤더 세럼 사용 전후'
            }
          ],
          helpfulVotes: 24,
          totalVotes: 27,
          isVerifiedPurchase: true,
          purchaseDate: new Date('2024-01-10'),
          usageDuration: '2주 사용',
          status: 'approved',
          createdAt: new Date('2024-01-25'),
          updatedAt: new Date('2024-01-25'),
          likedBy: [],
          reportedBy: [],
          skinConcerns: ['민감성', '칙칙함'],
          effectsExperienced: ['진정효과', '톤업', '보습'],
          wouldRecommend: true,
          repurchaseIntent: true
        },
        {
          id: 'review_2',
          productId: 'prod1',
          userId: 'user_2',
          userName: '박서연',
          userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=256&q=80',
          userAge: '30대 초반',
          userSkinType: '건성',
          rating: 4,
          title: '향은 좋은데 보습력이 아쉬워요',
          content: '라벤더 향이 정말 좋고 텍스처도 가볍게 발려서 좋아요. 다만 건성 피부라 그런지 보습력이 조금 아쉬운 것 같아요. 겨울에는 추가로 크림을 발라줘야 할 것 같네요. 그래도 진정 효과는 확실히 있어서 트러블 난 부위에 발라주면 금세 가라앉아요.',
          photos: [],
          helpfulVotes: 12,
          totalVotes: 15,
          isVerifiedPurchase: true,
          purchaseDate: new Date('2024-01-15'),
          usageDuration: '1주 사용',
          status: 'approved',
          createdAt: new Date('2024-01-22'),
          updatedAt: new Date('2024-01-22'),
          likedBy: [],
          reportedBy: [],
          skinConcerns: ['건조함', '트러블'],
          effectsExperienced: ['진정효과'],
          wouldRecommend: true,
          repurchaseIntent: false
        },
        {
          id: 'review_3',
          productId: 'prod2',
          userId: 'user_3',
          userName: '이지은',
          userAge: '20대 중반',
          userSkinType: '지성',
          rating: 5,
          title: '로즈 토너 최고에요! 꼭 써보세요💕',
          content: '지성 피부라 토너 선택이 어려웠는데 이 제품은 정말 완벽해요! �끈적하지 않으면서도 수분 공급이 충분하고, 로즈 향이 너무 우아해요. 아침저녁으로 꾸준히 사용하니까 모공도 조여지고 피부 결도 부드러워졌어요. 화장 지속력도 좋아진 것 같아요.',
          photos: [
            {
              id: 'photo_2',
              url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
              alt: '로즈 토너 사용 모습'
            },
            {
              id: 'photo_3',
              url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
              alt: '사용 후 피부'
            }
          ],
          helpfulVotes: 31,
          totalVotes: 34,
          isVerifiedPurchase: true,
          purchaseDate: new Date('2024-01-08'),
          usageDuration: '3주 사용',
          status: 'approved',
          createdAt: new Date('2024-01-30'),
          updatedAt: new Date('2024-01-30'),
          likedBy: [],
          reportedBy: [],
          skinConcerns: ['모공', '유분기'],
          effectsExperienced: ['모공축소', '수분공급', '피부결개선'],
          wouldRecommend: true,
          repurchaseIntent: true
        },
        {
          id: 'review_4',
          productId: 'prod3',
          userId: 'user_4',
          userName: '최예림',
          userAge: '40대 초반',
          userSkinType: '복합성',
          rating: 3,
          title: '무난하지만 특별함은 없어요',
          content: '클렌저로서의 기본 기능은 충분히 해요. 거品도 풍성하고 세정력도 좋은 편이에요. 다만 특별히 인상적인 점은 없는 것 같아요. 그린티 향도 그냥 그런 편이고요. 나쁘지는 않지만 재구매는 고민될 것 같아요.',
          photos: [],
          helpfulVotes: 8,
          totalVotes: 12,
          isVerifiedPurchase: false,
          usageDuration: '1개월 사용',
          status: 'approved',
          createdAt: new Date('2024-01-28'),
          updatedAt: new Date('2024-01-28'),
          likedBy: [],
          reportedBy: [],
          skinConcerns: ['블랙헤드'],
          effectsExperienced: ['세정효과'],
          wouldRecommend: false,
          repurchaseIntent: false
        },
        {
          id: 'review_5',
          productId: 'prod4',
          userId: 'user_5',
          userName: '정민지',
          userAge: '30대 중반',
          userSkinType: '건성',
          rating: 5,
          title: '비타민C 크림 진짜 대박이에요!!',
          content: '비타민C 제품들을 많이 써봤는데 이 제품이 제일 좋아요! 자극 없이 순하면서도 확실한 효과를 보여줘요. 사용한 지 한 달 정도 됐는데 기미, 잡티가 확실히 옅어졌어요. 크림 질감도 촉촉하면서 �끈적하지 않아서 아침에 발라도 부담 없어요. 이미 두 번째 구매했어요!',
          photos: [
            {
              id: 'photo_4',
              url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
              alt: '비타민C 크림'
            }
          ],
          helpfulVotes: 45,
          totalVotes: 48,
          isVerifiedPurchase: true,
          purchaseDate: new Date('2024-01-05'),
          usageDuration: '1개월 사용',
          status: 'approved',
          createdAt: new Date('2024-02-05'),
          updatedAt: new Date('2024-02-05'),
          likedBy: [],
          reportedBy: [],
          skinConcerns: ['기미', '잡티', '칙칙함'],
          effectsExperienced: ['톤업', '잡티개선', '보습'],
          wouldRecommend: true,
          repurchaseIntent: true
        }
      ];

      this.reviews = mockReviews;
      this.saveToStorage();
    }
  }

  // 리뷰 생성
  async createReview(request: CreateReviewRequest): Promise<Review> {
    const reviewId = `review_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const review: Review = {
      id: reviewId,
      productId: request.productId,
      userId: request.userId,
      userName: request.userName,
      userAvatar: request.userAvatar,
      userAge: request.userAge,
      userSkinType: request.userSkinType,
      rating: request.rating,
      title: request.title,
      content: request.content,
      photos: request.photos || [],
      helpfulVotes: 0,
      totalVotes: 0,
      isVerifiedPurchase: request.isVerifiedPurchase || false,
      purchaseDate: request.purchaseDate,
      usageDuration: request.usageDuration,
      status: 'pending', // 모든 리뷰는 승인 대기 상태로 시작
      createdAt: new Date(),
      updatedAt: new Date(),
      likedBy: [],
      reportedBy: [],
      skinConcerns: request.skinConcerns,
      effectsExperienced: request.effectsExperienced,
      wouldRecommend: request.wouldRecommend,
      repurchaseIntent: request.repurchaseIntent
    };

    this.reviews.push(review);
    this.saveToStorage();
    
    console.log('Review created:', review);
    return review;
  }

  // 제품별 리뷰 조회
  async getProductReviews(
    productId: string, 
    filters?: ReviewFilters,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: Review[]; total: number; hasMore: boolean }> {
    let filteredReviews = this.reviews.filter(
      review => review.productId === productId && review.status === 'approved'
    );

    // 필터 적용
    if (filters) {
      if (filters.rating && filters.rating.length > 0) {
        filteredReviews = filteredReviews.filter(review => 
          filters.rating!.includes(review.rating)
        );
      }

      if (filters.hasPhotos) {
        filteredReviews = filteredReviews.filter(review => 
          review.photos.length > 0
        );
      }

      if (filters.verifiedOnly) {
        filteredReviews = filteredReviews.filter(review => 
          review.isVerifiedPurchase
        );
      }

      if (filters.skinType && filters.skinType.length > 0) {
        filteredReviews = filteredReviews.filter(review => 
          review.userSkinType && filters.skinType!.includes(review.userSkinType)
        );
      }

      if (filters.skinConcerns && filters.skinConcerns.length > 0) {
        filteredReviews = filteredReviews.filter(review => 
          review.skinConcerns?.some(concern => 
            filters.skinConcerns!.includes(concern)
          )
        );
      }
    }

    // 정렬
    const sortBy = filters?.sortBy || 'newest';
    filteredReviews.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'highest_rating':
          return b.rating - a.rating;
        case 'lowest_rating':
          return a.rating - b.rating;
        case 'most_helpful':
          return b.helpfulVotes - a.helpfulVotes;
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

    return {
      reviews: paginatedReviews,
      total: filteredReviews.length,
      hasMore: endIndex < filteredReviews.length
    };
  }

  // 제품 리뷰 통계
  async getProductReviewStats(productId: string): Promise<ReviewStats> {
    const productReviews = this.reviews.filter(
      review => review.productId === productId && review.status === 'approved'
    );

    if (productReviews.length === 0) {
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

    const totalReviews = productReviews.length;
    const averageRating = productReviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews;
    
    const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    productReviews.forEach(review => {
      ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
    });

    const verifiedPurchaseCount = productReviews.filter(r => r.isVerifiedPurchase).length;
    const photoReviewCount = productReviews.filter(r => r.photos.length > 0).length;
    const recommendationRate = productReviews.filter(r => r.wouldRecommend).length / totalReviews * 100;
    const repurchaseRate = productReviews.filter(r => r.repurchaseIntent).length / totalReviews * 100;

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      verifiedPurchaseCount,
      photoReviewCount,
      recommendationRate: Math.round(recommendationRate),
      repurchaseRate: Math.round(repurchaseRate)
    };
  }

  // 리뷰 도움됨 투표
  async voteHelpful(reviewId: string, userId: string, isHelpful: boolean): Promise<boolean> {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) return false;

    const userVotes = this.votedReviews.get(reviewId) || new Set();
    
    // 이미 투표한 사용자인지 확인
    if (userVotes.has(userId)) {
      return false; // 중복 투표 방지
    }

    // 투표 기록
    userVotes.add(userId);
    this.votedReviews.set(reviewId, userVotes);

    // 투표 수 업데이트
    review.totalVotes++;
    if (isHelpful) {
      review.helpfulVotes++;
    }
    review.updatedAt = new Date();

    this.saveToStorage();
    return true;
  }

  // 리뷰 좋아요
  async toggleLike(reviewId: string, userId: string): Promise<boolean> {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) return false;

    const likedIndex = review.likedBy.indexOf(userId);
    if (likedIndex > -1) {
      // 이미 좋아요한 경우 취소
      review.likedBy.splice(likedIndex, 1);
    } else {
      // 좋아요 추가
      review.likedBy.push(userId);
    }

    review.updatedAt = new Date();
    this.saveToStorage();
    return likedIndex === -1; // 좋아요 추가되었는지 여부 반환
  }

  // 리뷰 신고
  async reportReview(reviewId: string, userId: string, reason: string): Promise<boolean> {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) return false;

    // 이미 신고한 사용자인지 확인
    if (review.reportedBy.includes(userId)) {
      return false;
    }

    review.reportedBy.push(userId);
    review.updatedAt = new Date();

    // 5회 이상 신고되면 자동으로 검토 대기 상태로 변경
    if (review.reportedBy.length >= 5) {
      review.status = 'pending';
      review.moderationReason = '다수 신고로 인한 자동 검토';
    }

    this.saveToStorage();
    console.log(`Review ${reviewId} reported by user ${userId}: ${reason}`);
    return true;
  }

  // 리뷰 승인/거부 (관리자용)
  async moderateReview(reviewId: string, status: 'approved' | 'rejected', reason?: string): Promise<boolean> {
    const review = this.reviews.find(r => r.id === reviewId);
    if (!review) return false;

    review.status = status;
    review.moderationReason = reason;
    review.updatedAt = new Date();

    this.saveToStorage();
    console.log(`Review ${reviewId} moderated: ${status}`, reason);
    return true;
  }

  // 사용자 리뷰 조회
  async getUserReviews(userId: string): Promise<Review[]> {
    return this.reviews
      .filter(review => review.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // 리뷰 수정
  async updateReview(reviewId: string, updates: Partial<Review>): Promise<Review | null> {
    const index = this.reviews.findIndex(r => r.id === reviewId);
    if (index === -1) return null;

    const review = this.reviews[index];
    const updatedReview = {
      ...review,
      ...updates,
      updatedAt: new Date()
    };

    this.reviews[index] = updatedReview;
    this.saveToStorage();
    
    return updatedReview;
  }

  // 리뷰 삭제
  async deleteReview(reviewId: string): Promise<boolean> {
    const index = this.reviews.findIndex(r => r.id === reviewId);
    if (index === -1) return false;

    this.reviews.splice(index, 1);
    this.votedReviews.delete(reviewId);
    this.saveToStorage();
    
    console.log('Review deleted:', reviewId);
    return true;
  }

  // 검색
  async searchReviews(query: string, productId?: string): Promise<Review[]> {
    const searchTerms = query.toLowerCase().split(' ');
    
    return this.reviews.filter(review => {
      if (productId && review.productId !== productId) return false;
      if (review.status !== 'approved') return false;

      const searchText = `${review.title} ${review.content} ${review.userName}`.toLowerCase();
      return searchTerms.every(term => searchText.includes(term));
    });
  }

  // localStorage 저장
  private saveToStorage(): void {
    try {
      const data = {
        reviews: this.reviews.map(review => ({
          ...review,
          createdAt: review.createdAt.toISOString(),
          updatedAt: review.updatedAt.toISOString(),
          purchaseDate: review.purchaseDate?.toISOString()
        })),
        votedReviews: Array.from(this.votedReviews.entries()).map(([key, value]) => [
          key, Array.from(value)
        ])
      };
      localStorage.setItem('micoz_reviews', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save reviews to storage:', error);
    }
  }

  // localStorage 로드
  private loadFromStorage(): void {
    try {
      const savedData = localStorage.getItem('micoz_reviews');
      if (savedData) {
        const { reviews, votedReviews } = JSON.parse(savedData);
        
        this.reviews = reviews.map((review: any) => ({
          ...review,
          createdAt: new Date(review.createdAt),
          updatedAt: new Date(review.updatedAt),
          purchaseDate: review.purchaseDate ? new Date(review.purchaseDate) : undefined
        }));

        if (votedReviews) {
          this.votedReviews = new Map(
            votedReviews.map(([key, value]: [string, string[]]) => [key, new Set(value)])
          );
        }
      }
    } catch (error) {
      console.error('Failed to load reviews from storage:', error);
    }
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
  const colors = {
    '건성': '#e67e22',
    '지성': '#3498db',
    '복합성': '#9b59b6',
    '민감성': '#e74c3c',
    '정상': '#27ae60'
  };
  return colors[skinType as keyof typeof colors] || '#95a5a6';
};

export const getVerificationBadge = (isVerified: boolean): string => {
  return isVerified ? '✓ 구매확인' : '';
};