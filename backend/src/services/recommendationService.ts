import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface RecommendationOptions {
  userId?: string;
  productId?: string;
  algorithm?: 'content' | 'collaborative' | 'hybrid' | 'popularity' | 'recent';
  limit?: number;
  excludeViewed?: boolean;
  skinType?: string;
  category?: string;
}

export interface RecommendationResult {
  productId: string;
  score: number;
  reason: string;
  product?: any;
}

export class RecommendationService {
  // Track user behavior
  async trackBehavior(
    userId: string,
    productId: string,
    action: string,
    sessionId?: string,
    metadata?: any
  ): Promise<void> {
    try {
      await prisma.userBehavior.create({
        data: {
          userId,
          productId,
          action: action as any,
          sessionId,
          metadata: metadata ? JSON.stringify(metadata) : null
        }
      });
    } catch (error) {
      console.error('Failed to track behavior:', error);
    }
  }

  // Content-based recommendations
  async getContentBasedRecommendations(
    productId: string,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: {
          category: true,
          subCategory: true,
          brand: true,
          ingredients: true,
          price: true
        }
      });

      if (!product) return [];

      // Find similar products based on attributes
      const similarProducts = await prisma.product.findMany({
        where: {
          id: { not: productId },
          status: 'ACTIVE',
          OR: [
            { category: product.category },
            { subCategory: product.subCategory },
            { brand: product.brand }
          ]
        },
        include: {
          reviews: {
            select: { rating: true }
          },
          _count: {
            select: { reviews: true, wishlistItems: true }
          }
        },
        take: limit * 2 // Get more to calculate scores
      });

      // Calculate similarity scores
      const recommendations = similarProducts.map(similarProduct => {
        let score = 0;
        let reasons = [];

        // Category match (highest weight)
        if (similarProduct.category === product.category) {
          score += 0.4;
          reasons.push('같은 카테고리');
        }

        // Subcategory match
        if (similarProduct.subCategory === product.subCategory && product.subCategory) {
          score += 0.3;
          reasons.push('같은 세부 카테고리');
        }

        // Brand match
        if (similarProduct.brand === product.brand) {
          score += 0.2;
          reasons.push('같은 브랜드');
        }

        // Price similarity (within 20% range)
        const priceDiff = Math.abs(similarProduct.price - product.price) / product.price;
        if (priceDiff <= 0.2) {
          score += 0.1;
          reasons.push('비슷한 가격대');
        }

        // Rating boost
        const ratings = similarProduct.reviews.map(r => r.rating);
        const avgRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;
        
        if (avgRating >= 4) {
          score += 0.1;
          reasons.push('높은 평점');
        }

        // Popularity boost
        if (similarProduct._count.reviews > 10) {
          score += 0.05;
        }

        return {
          productId: similarProduct.id,
          score,
          reason: reasons.join(', ') || '유사한 상품',
          product: similarProduct
        };
      });

      // Sort by score and return top results
      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Content-based recommendation error:', error);
      return [];
    }
  }

  // Collaborative filtering recommendations
  async getCollaborativeRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      // Get user's behavior patterns
      const userBehaviors = await prisma.userBehavior.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
        take: 100 // Recent behaviors
      });

      if (userBehaviors.length === 0) return [];

      // Find similar users based on behavior patterns
      const userProducts = userBehaviors.map(b => b.productId);
      
      const similarUsers = await prisma.userBehavior.findMany({
        where: {
          productId: { in: userProducts },
          userId: { not: userId }
        },
        select: {
          userId: true,
          productId: true,
          action: true
        }
      });

      // Calculate user similarity scores
      const userSimilarityMap = new Map<string, number>();
      
      similarUsers.forEach(behavior => {
        const currentScore = userSimilarityMap.get(behavior.userId) || 0;
        let actionWeight = 0;
        
        switch (behavior.action) {
          case 'PURCHASE': actionWeight = 1.0; break;
          case 'ADD_TO_CART': actionWeight = 0.8; break;
          case 'ADD_TO_WISHLIST': actionWeight = 0.6; break;
          case 'VIEW': actionWeight = 0.3; break;
          default: actionWeight = 0.1;
        }
        
        userSimilarityMap.set(behavior.userId, currentScore + actionWeight);
      });

      // Get top similar users
      const topSimilarUsers = Array.from(userSimilarityMap.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 20)
        .map(([userId]) => userId);

      if (topSimilarUsers.length === 0) return [];

      // Get products liked by similar users but not by current user
      const recommendedProducts = await prisma.userBehavior.findMany({
        where: {
          userId: { in: topSimilarUsers },
          productId: { notIn: userProducts },
          action: { in: ['PURCHASE', 'ADD_TO_CART', 'ADD_TO_WISHLIST'] }
        },
        include: {
          product: {
            include: {
              reviews: { select: { rating: true } },
              _count: { select: { reviews: true } }
            }
          }
        }
      });

      // Calculate recommendation scores
      const productScores = new Map<string, { score: number; count: number; product: any }>();
      
      recommendedProducts.forEach(behavior => {
        const current = productScores.get(behavior.productId) || { score: 0, count: 0, product: behavior.product };
        const userSimilarity = userSimilarityMap.get(behavior.userId) || 0;
        
        let actionWeight = 0;
        switch (behavior.action) {
          case 'PURCHASE': actionWeight = 1.0; break;
          case 'ADD_TO_CART': actionWeight = 0.8; break;
          case 'ADD_TO_WISHLIST': actionWeight = 0.6; break;
        }
        
        current.score += userSimilarity * actionWeight;
        current.count += 1;
        current.product = behavior.product;
        
        productScores.set(behavior.productId, current);
      });

      // Convert to recommendations
      const recommendations = Array.from(productScores.entries()).map(([productId, data]) => ({
        productId,
        score: data.score / Math.sqrt(data.count), // Normalize by frequency
        reason: `${data.count}명의 유사한 고객이 선택한 상품`,
        product: data.product
      }));

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  // Hybrid recommendations combining multiple approaches
  async getHybridRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<RecommendationResult[]> {
    const limit = options.limit || 10;
    
    try {
      // Get user's recent behaviors to understand preferences
      const recentBehaviors = await prisma.userBehavior.findMany({
        where: { userId },
        include: { product: true },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      let recommendations: RecommendationResult[] = [];

      // If user has behavior history, use collaborative filtering
      if (recentBehaviors.length > 0) {
        const collaborativeRecs = await this.getCollaborativeRecommendations(userId, Math.ceil(limit * 0.6));
        recommendations.push(...collaborativeRecs.map(rec => ({
          ...rec,
          score: rec.score * 0.6, // Weight collaborative filtering
          reason: `협업 필터링: ${rec.reason}`
        })));

        // Get content-based recommendations for recently viewed products
        const recentProductIds = recentBehaviors.slice(0, 3).map(b => b.productId);
        for (const productId of recentProductIds) {
          const contentRecs = await this.getContentBasedRecommendations(productId, 3);
          recommendations.push(...contentRecs.map(rec => ({
            ...rec,
            score: rec.score * 0.4, // Weight content-based lower
            reason: `콘텐츠 기반: ${rec.reason}`
          })));
        }
      } else {
        // For new users, use popularity-based recommendations
        const popularRecs = await this.getPopularityBasedRecommendations(limit, options);
        recommendations.push(...popularRecs);
      }

      // Remove duplicates and sort by score
      const uniqueRecommendations = new Map<string, RecommendationResult>();
      
      recommendations.forEach(rec => {
        const existing = uniqueRecommendations.get(rec.productId);
        if (!existing || rec.score > existing.score) {
          uniqueRecommendations.set(rec.productId, rec);
        }
      });

      return Array.from(uniqueRecommendations.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Hybrid recommendation error:', error);
      return [];
    }
  }

  // Popularity-based recommendations for new users
  async getPopularityBasedRecommendations(
    limit: number = 10,
    options: RecommendationOptions = {}
  ): Promise<RecommendationResult[]> {
    try {
      const where: any = {
        status: 'ACTIVE',
        ...(options.category && { category: options.category }),
        ...(options.skinType && {
          reviews: {
            some: {
              skinType: options.skinType
            }
          }
        })
      };

      const products = await prisma.product.findMany({
        where,
        include: {
          reviews: {
            select: { rating: true }
          },
          _count: {
            select: {
              reviews: true,
              wishlistItems: true,
              orderItems: true
            }
          }
        },
        take: limit * 3 // Get more to calculate popularity scores
      });

      const recommendations = products.map(product => {
        const ratings = product.reviews.map(r => r.rating);
        const avgRating = ratings.length > 0 
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length 
          : 0;

        // Calculate popularity score
        let score = 0;
        score += avgRating * 0.3; // Rating weight
        score += Math.log(product._count.reviews + 1) * 0.3; // Review count (log scale)
        score += Math.log(product._count.wishlistItems + 1) * 0.2; // Wishlist count
        score += Math.log(product._count.orderItems + 1) * 0.2; // Purchase count

        // Boost for special categories
        if (product.isBestseller) score += 0.5;
        if (product.featured) score += 0.3;
        if (product.isNew) score += 0.1;

        return {
          productId: product.id,
          score,
          reason: '인기 상품',
          product
        };
      });

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Popularity-based recommendation error:', error);
      return [];
    }
  }

  // Recently viewed recommendations
  async getRecentlyViewedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      const recentViews = await prisma.userBehavior.findMany({
        where: {
          userId,
          action: 'VIEW'
        },
        include: {
          product: {
            include: {
              reviews: { select: { rating: true } },
              _count: { select: { reviews: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      });

      return recentViews.map((behavior, index) => ({
        productId: behavior.productId,
        score: 1 - (index * 0.1), // Decrease score for older views
        reason: '최근 본 상품',
        product: behavior.product
      }));

    } catch (error) {
      console.error('Recently viewed recommendation error:', error);
      return [];
    }
  }

  // Frequently bought together recommendations
  async getFrequentlyBoughtTogether(
    productId: string,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      // Find orders that contain the given product
      const ordersWithProduct = await prisma.orderItem.findMany({
        where: { productId },
        select: { orderId: true }
      });

      const orderIds = ordersWithProduct.map(item => item.orderId);

      if (orderIds.length === 0) return [];

      // Find other products frequently bought with this product
      const otherProducts = await prisma.orderItem.findMany({
        where: {
          orderId: { in: orderIds },
          productId: { not: productId }
        },
        include: {
          product: {
            include: {
              reviews: { select: { rating: true } },
              _count: { select: { reviews: true } }
            }
          }
        }
      });

      // Count frequency of each product
      const productFrequency = new Map<string, { count: number; product: any }>();
      
      otherProducts.forEach(item => {
        const current = productFrequency.get(item.productId) || { count: 0, product: item.product };
        current.count += 1;
        current.product = item.product;
        productFrequency.set(item.productId, current);
      });

      // Convert to recommendations
      const recommendations = Array.from(productFrequency.entries()).map(([productId, data]) => ({
        productId,
        score: data.count / orderIds.length, // Frequency ratio
        reason: `${data.count}번 함께 구매된 상품`,
        product: data.product
      }));

      return recommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Frequently bought together error:', error);
      return [];
    }
  }

  // Get personalized recommendations for a user
  async getPersonalizedRecommendations(
    userId: string,
    options: RecommendationOptions = {}
  ): Promise<RecommendationResult[]> {
    const algorithm = options.algorithm || 'hybrid';
    const limit = options.limit || 10;

    try {
      switch (algorithm) {
        case 'collaborative':
          return await this.getCollaborativeRecommendations(userId, limit);
        
        case 'content':
          // For content-based, we need a product context
          if (options.productId) {
            return await this.getContentBasedRecommendations(options.productId, limit);
          }
          // Fall back to hybrid if no product context
          return await this.getHybridRecommendations(userId, options);
        
        case 'popularity':
          return await this.getPopularityBasedRecommendations(limit, options);
        
        case 'recent':
          return await this.getRecentlyViewedRecommendations(userId, limit);
        
        case 'hybrid':
        default:
          return await this.getHybridRecommendations(userId, options);
      }
    } catch (error) {
      console.error('Personalized recommendation error:', error);
      return [];
    }
  }

  // Cache recommendations for performance
  async cacheRecommendations(
    userId: string,
    recommendations: RecommendationResult[],
    algorithm: string
  ): Promise<void> {
    try {
      // Delete old recommendations for this user and algorithm
      await prisma.userRecommendation.deleteMany({
        where: {
          userId,
          algorithm: algorithm as any
        }
      });

      // Insert new recommendations
      const data = recommendations.map((rec, index) => ({
        userId,
        productId: rec.productId,
        score: rec.score,
        algorithm: algorithm as any,
        metadata: JSON.stringify({ reason: rec.reason, rank: index + 1 })
      }));

      await prisma.userRecommendation.createMany({ data });

    } catch (error) {
      console.error('Failed to cache recommendations:', error);
    }
  }

  // Get cached recommendations
  async getCachedRecommendations(
    userId: string,
    algorithm: string,
    limit: number = 10
  ): Promise<RecommendationResult[]> {
    try {
      const cached = await prisma.userRecommendation.findMany({
        where: {
          userId,
          algorithm: algorithm as any,
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        include: {
          product: {
            include: {
              reviews: { select: { rating: true } },
              _count: { select: { reviews: true } }
            }
          }
        },
        orderBy: { score: 'desc' },
        take: limit
      });

      return cached.map(rec => ({
        productId: rec.productId,
        score: rec.score,
        reason: rec.metadata ? JSON.parse(rec.metadata).reason : '추천 상품',
        product: rec.product
      }));

    } catch (error) {
      console.error('Failed to get cached recommendations:', error);
      return [];
    }
  }
}

export const recommendationService = new RecommendationService();