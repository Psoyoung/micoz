import { Request, Response } from 'express';
import { recommendationService } from '../services/recommendationService';
import { AuthenticatedRequest } from '../middleware/auth';

export const getPersonalizedRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userId = req.user.userId;
    const {
      algorithm = 'hybrid',
      limit = 10,
      category,
      skinType,
      useCache = true
    } = req.query;

    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));

    let recommendations;

    // Try to get cached recommendations first
    if (useCache === 'true') {
      recommendations = await recommendationService.getCachedRecommendations(
        userId,
        algorithm as string,
        limitNumber
      );
    }

    // If no cached recommendations or cache disabled, generate fresh ones
    if (!recommendations || recommendations.length === 0) {
      recommendations = await recommendationService.getPersonalizedRecommendations(userId, {
        algorithm: algorithm as any,
        limit: limitNumber,
        category: category as string,
        skinType: skinType as string
      });

      // Cache the new recommendations
      if (recommendations.length > 0) {
        await recommendationService.cacheRecommendations(
          userId,
          recommendations,
          algorithm as string
        );
      }
    }

    // Format the response
    const formattedRecommendations = recommendations.map(rec => {
      const product = rec.product;
      const ratings = product?.reviews?.map((r: any) => r.rating) || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        productId: rec.productId,
        score: rec.score,
        reason: rec.reason,
        product: product ? {
          id: product.id,
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          category: product.category,
          subCategory: product.subCategory,
          brand: product.brand,
          slug: product.slug,
          images: product.images ? JSON.parse(product.images) : [],
          featured: product.featured,
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          inventory: product.inventory,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: product._count?.reviews || 0,
          createdAt: product.createdAt
        } : null
      };
    });

    res.json({
      recommendations: formattedRecommendations,
      algorithm,
      metadata: {
        totalCount: formattedRecommendations.length,
        generatedAt: new Date().toISOString(),
        userId: userId
      }
    });

  } catch (error) {
    console.error('Get personalized recommendations error:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      code: 'RECOMMENDATION_ERROR'
    });
  }
};

export const getSimilarProducts = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { limit = 10 } = req.query;

    const limitNumber = Math.min(20, Math.max(1, parseInt(limit as string)));

    const recommendations = await recommendationService.getContentBasedRecommendations(
      productId,
      limitNumber
    );

    const formattedRecommendations = recommendations.map(rec => {
      const product = rec.product;
      const ratings = product?.reviews?.map((r: any) => r.rating) || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        productId: rec.productId,
        score: rec.score,
        reason: rec.reason,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          category: product.category,
          subCategory: product.subCategory,
          brand: product.brand,
          slug: product.slug,
          images: product.images ? JSON.parse(product.images) : [],
          featured: product.featured,
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          inventory: product.inventory,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: product._count?.reviews || 0,
          createdAt: product.createdAt
        }
      };
    });

    res.json({
      recommendations: formattedRecommendations,
      productId,
      algorithm: 'content_based',
      metadata: {
        totalCount: formattedRecommendations.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get similar products error:', error);
    res.status(500).json({
      error: 'Failed to get similar products',
      code: 'SIMILAR_PRODUCTS_ERROR'
    });
  }
};

export const getFrequentlyBoughtTogether = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const { limit = 6 } = req.query;

    const limitNumber = Math.min(10, Math.max(1, parseInt(limit as string)));

    const recommendations = await recommendationService.getFrequentlyBoughtTogether(
      productId,
      limitNumber
    );

    const formattedRecommendations = recommendations.map(rec => {
      const product = rec.product;
      const ratings = product?.reviews?.map((r: any) => r.rating) || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        productId: rec.productId,
        score: rec.score,
        reason: rec.reason,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          category: product.category,
          subCategory: product.subCategory,
          brand: product.brand,
          slug: product.slug,
          images: product.images ? JSON.parse(product.images) : [],
          featured: product.featured,
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          inventory: product.inventory,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: product._count?.reviews || 0,
          createdAt: product.createdAt
        }
      };
    });

    res.json({
      recommendations: formattedRecommendations,
      productId,
      algorithm: 'frequently_bought_together',
      metadata: {
        totalCount: formattedRecommendations.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get frequently bought together error:', error);
    res.status(500).json({
      error: 'Failed to get frequently bought together products',
      code: 'FREQUENTLY_BOUGHT_ERROR'
    });
  }
};

export const getRecentlyViewed = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userId = req.user.userId;
    const { limit = 10 } = req.query;

    const limitNumber = Math.min(20, Math.max(1, parseInt(limit as string)));

    const recommendations = await recommendationService.getRecentlyViewedRecommendations(
      userId,
      limitNumber
    );

    const formattedRecommendations = recommendations.map(rec => {
      const product = rec.product;
      const ratings = product?.reviews?.map((r: any) => r.rating) || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        productId: rec.productId,
        score: rec.score,
        reason: rec.reason,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          category: product.category,
          subCategory: product.subCategory,
          brand: product.brand,
          slug: product.slug,
          images: product.images ? JSON.parse(product.images) : [],
          featured: product.featured,
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          inventory: product.inventory,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: product._count?.reviews || 0,
          createdAt: product.createdAt
        }
      };
    });

    res.json({
      recommendations: formattedRecommendations,
      algorithm: 'recently_viewed',
      metadata: {
        totalCount: formattedRecommendations.length,
        generatedAt: new Date().toISOString(),
        userId: userId
      }
    });

  } catch (error) {
    console.error('Get recently viewed error:', error);
    res.status(500).json({
      error: 'Failed to get recently viewed products',
      code: 'RECENTLY_VIEWED_ERROR'
    });
  }
};

export const getPopularProducts = async (req: Request, res: Response) => {
  try {
    const {
      limit = 10,
      category,
      skinType
    } = req.query;

    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));

    const recommendations = await recommendationService.getPopularityBasedRecommendations(
      limitNumber,
      {
        category: category as string,
        skinType: skinType as string
      }
    );

    const formattedRecommendations = recommendations.map(rec => {
      const product = rec.product;
      const ratings = product?.reviews?.map((r: any) => r.rating) || [];
      const averageRating = ratings.length > 0 
        ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
        : 0;

      return {
        productId: rec.productId,
        score: rec.score,
        reason: rec.reason,
        product: {
          id: product.id,
          name: product.name,
          description: product.description,
          shortDescription: product.shortDescription,
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          category: product.category,
          subCategory: product.subCategory,
          brand: product.brand,
          slug: product.slug,
          images: product.images ? JSON.parse(product.images) : [],
          featured: product.featured,
          isNew: product.isNew,
          isBestseller: product.isBestseller,
          inventory: product.inventory,
          averageRating: Math.round(averageRating * 10) / 10,
          reviewCount: product._count?.reviews || 0,
          createdAt: product.createdAt
        }
      };
    });

    res.json({
      recommendations: formattedRecommendations,
      algorithm: 'popularity_based',
      filters: {
        category: category || null,
        skinType: skinType || null
      },
      metadata: {
        totalCount: formattedRecommendations.length,
        generatedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Get popular products error:', error);
    res.status(500).json({
      error: 'Failed to get popular products',
      code: 'POPULAR_PRODUCTS_ERROR'
    });
  }
};

export const trackBehavior = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userId = req.user.userId;
    const {
      productId,
      action,
      sessionId,
      metadata
    } = req.body;

    if (!productId || !action) {
      return res.status(400).json({
        error: 'Product ID and action are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    await recommendationService.trackBehavior(
      userId,
      productId,
      action,
      sessionId,
      metadata
    );

    res.json({
      message: 'Behavior tracked successfully',
      userId,
      productId,
      action,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Track behavior error:', error);
    res.status(500).json({
      error: 'Failed to track behavior',
      code: 'BEHAVIOR_TRACKING_ERROR'
    });
  }
};

export const refreshRecommendations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userId = req.user.userId;
    const { algorithm = 'hybrid' } = req.body;

    // Generate fresh recommendations
    const recommendations = await recommendationService.getPersonalizedRecommendations(userId, {
      algorithm: algorithm as any,
      limit: 20
    });

    // Cache the new recommendations
    if (recommendations.length > 0) {
      await recommendationService.cacheRecommendations(
        userId,
        recommendations,
        algorithm as string
      );
    }

    res.json({
      message: 'Recommendations refreshed successfully',
      algorithm,
      count: recommendations.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Refresh recommendations error:', error);
    res.status(500).json({
      error: 'Failed to refresh recommendations',
      code: 'REFRESH_ERROR'
    });
  }
};