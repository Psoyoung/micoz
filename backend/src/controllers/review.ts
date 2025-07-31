import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { uploadToS3 } from '../utils/s3';

const prisma = new PrismaClient();

export const createReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const {
      productId,
      rating,
      title,
      comment,
      skinType,
      skinConcerns,
      effectsExperienced,
      wouldRecommend,
      repurchaseIntent,
      usageDuration
    } = req.body;

    const userId = req.user.userId;

    // Validate required fields
    if (!productId || !rating || !comment) {
      return res.status(400).json({ 
        error: 'Product ID, rating, and comment are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5',
        code: 'INVALID_RATING'
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, status: 'ACTIVE' },
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId
        }
      }
    });

    if (existingReview) {
      return res.status(409).json({ 
        error: 'You have already reviewed this product',
        code: 'REVIEW_ALREADY_EXISTS'
      });
    }

    // Check if user purchased this product (for verification)
    const purchaseExists = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED'
        }
      }
    });

    const verified = !!purchaseExists;

    // Handle image uploads if present
    let imageUrls: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const imageUrl = await uploadToS3(file, `reviews/${userId}/${Date.now()}`);
        imageUrls.push(imageUrl);
      }
    }

    // Create review
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        rating,
        title,
        comment,
        images: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        verified,
        skinType,
        skinConcerns: skinConcerns ? JSON.stringify(skinConcerns) : null,
        effectsExperienced: effectsExperienced ? JSON.stringify(effectsExperienced) : null,
        wouldRecommend: wouldRecommend !== undefined ? wouldRecommend : true,
        repurchaseIntent: repurchaseIntent !== undefined ? repurchaseIntent : false,
        usageDuration
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    });

    res.status(201).json({
      message: 'Review created successfully',
      review: {
        id: review.id,
        rating: review.rating,
        title: review.title,
        comment: review.comment,
        images: review.images ? JSON.parse(review.images) : [],
        verified: review.verified,
        helpful: review.helpful,
        skinType: review.skinType,
        skinConcerns: review.skinConcerns ? JSON.parse(review.skinConcerns) : [],
        effectsExperienced: review.effectsExperienced ? JSON.parse(review.effectsExperienced) : [],
        wouldRecommend: review.wouldRecommend,
        repurchaseIntent: review.repurchaseIntent,
        usageDuration: review.usageDuration,
        createdAt: review.createdAt,
        user: {
          name: `${review.user.lastName}${review.user.firstName.charAt(0)}*`,
          avatar: review.user.avatar,
        },
      }
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({ 
      error: 'Failed to create review',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const updateReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { reviewId } = req.params;
    const {
      rating,
      title,
      comment,
      skinType,
      skinConcerns,
      effectsExperienced,
      wouldRecommend,
      repurchaseIntent,
      usageDuration
    } = req.body;

    const userId = req.user.userId;

    // Find existing review
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      return res.status(404).json({ 
        error: 'Review not found',
        code: 'REVIEW_NOT_FOUND'
      });
    }

    if (existingReview.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only edit your own reviews',
        code: 'FORBIDDEN'
      });
    }

    // Validate rating if provided
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ 
        error: 'Rating must be between 1 and 5',
        code: 'INVALID_RATING'
      });
    }

    // Handle new image uploads if present
    let imageUrls = existingReview.images ? JSON.parse(existingReview.images) : [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        const imageUrl = await uploadToS3(file, `reviews/${userId}/${Date.now()}`);
        imageUrls.push(imageUrl);
      }
    }

    // Update review
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(rating && { rating }),
        ...(title !== undefined && { title }),
        ...(comment && { comment }),
        ...(imageUrls.length > 0 && { images: JSON.stringify(imageUrls) }),
        ...(skinType && { skinType }),
        ...(skinConcerns && { skinConcerns: JSON.stringify(skinConcerns) }),
        ...(effectsExperienced && { effectsExperienced: JSON.stringify(effectsExperienced) }),
        ...(wouldRecommend !== undefined && { wouldRecommend }),
        ...(repurchaseIntent !== undefined && { repurchaseIntent }),
        ...(usageDuration !== undefined && { usageDuration }),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    });

    res.json({
      message: 'Review updated successfully',
      review: {
        id: updatedReview.id,
        rating: updatedReview.rating,
        title: updatedReview.title,
        comment: updatedReview.comment,
        images: updatedReview.images ? JSON.parse(updatedReview.images) : [],
        verified: updatedReview.verified,
        helpful: updatedReview.helpful,
        skinType: updatedReview.skinType,
        skinConcerns: updatedReview.skinConcerns ? JSON.parse(updatedReview.skinConcerns) : [],
        effectsExperienced: updatedReview.effectsExperienced ? JSON.parse(updatedReview.effectsExperienced) : [],
        wouldRecommend: updatedReview.wouldRecommend,
        repurchaseIntent: updatedReview.repurchaseIntent,
        usageDuration: updatedReview.usageDuration,
        createdAt: updatedReview.createdAt,
        updatedAt: updatedReview.updatedAt,
        user: {
          name: `${updatedReview.user.lastName}${updatedReview.user.firstName.charAt(0)}*`,
          avatar: updatedReview.user.avatar,
        },
      }
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ 
      error: 'Failed to update review',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const deleteReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { reviewId } = req.params;
    const userId = req.user.userId;

    // Find existing review
    const existingReview = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!existingReview) {
      return res.status(404).json({ 
        error: 'Review not found',
        code: 'REVIEW_NOT_FOUND'
      });
    }

    if (existingReview.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only delete your own reviews',
        code: 'FORBIDDEN'
      });
    }

    // Delete review
    await prisma.review.delete({
      where: { id: reviewId }
    });

    res.json({
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ 
      error: 'Failed to delete review',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const voteReviewHelpful = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { reviewId } = req.params;
    const { isHelpful } = req.body;
    const userId = req.user.userId;

    if (typeof isHelpful !== 'boolean') {
      return res.status(400).json({ 
        error: 'isHelpful must be a boolean',
        code: 'INVALID_VOTE'
      });
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId }
    });

    if (!review) {
      return res.status(404).json({ 
        error: 'Review not found',
        code: 'REVIEW_NOT_FOUND'
      });
    }

    // Prevent users from voting on their own reviews
    if (review.userId === userId) {
      return res.status(400).json({ 
        error: 'You cannot vote on your own review',
        code: 'CANNOT_VOTE_OWN_REVIEW'
      });
    }

    // Upsert vote
    const vote = await prisma.reviewVote.upsert({
      where: {
        reviewId_userId: {
          reviewId,
          userId
        }
      },
      update: {
        isHelpful
      },
      create: {
        reviewId,
        userId,
        isHelpful
      }
    });

    // Update helpful count on review
    const helpfulCount = await prisma.reviewVote.count({
      where: {
        reviewId,
        isHelpful: true
      }
    });

    await prisma.review.update({
      where: { id: reviewId },
      data: { helpful: helpfulCount }
    });

    res.json({
      message: 'Vote recorded successfully',
      vote: {
        id: vote.id,
        isHelpful: vote.isHelpful,
        createdAt: vote.createdAt
      },
      helpfulCount
    });
  } catch (error) {
    console.error('Vote review helpful error:', error);
    res.status(500).json({ 
      error: 'Failed to record vote',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getReviewsByProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      rating,
      verifiedOnly,
      withImages
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause
    const where: any = { productId };

    if (rating) {
      where.rating = parseInt(rating as string);
    }

    if (verifiedOnly === 'true') {
      where.verified = true;
    }

    if (withImages === 'true') {
      where.images = {
        not: null
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'helpful') {
      orderBy.helpful = sortOrder;
    } else if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute queries
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        orderBy,
        skip,
        take: limitNumber,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          reviewVotes: {
            select: {
              userId: true,
              isHelpful: true
            }
          }
        }
      }),
      prisma.review.count({ where })
    ]);

    // Format reviews
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images ? JSON.parse(review.images) : [],
      verified: review.verified,
      helpful: review.helpful,
      skinType: review.skinType,
      skinConcerns: review.skinConcerns ? JSON.parse(review.skinConcerns) : [],
      effectsExperienced: review.effectsExperienced ? JSON.parse(review.effectsExperienced) : [],
      wouldRecommend: review.wouldRecommend,
      repurchaseIntent: review.repurchaseIntent,
      usageDuration: review.usageDuration,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      user: {
        name: `${review.user.lastName}${review.user.firstName.charAt(0)}*`,
        avatar: review.user.avatar,
      },
      totalVotes: review.reviewVotes.length,
      helpfulVotes: review.reviewVotes.filter(vote => vote.isHelpful).length
    }));

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      reviews: formattedReviews,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      }
    });
  } catch (error) {
    console.error('Get reviews by product error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reviews',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getMyReviews = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNumber - 1) * limitNumber;

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'rating') {
      orderBy.rating = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute queries
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where: { userId },
        orderBy,
        skip,
        take: limitNumber,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            }
          },
          reviewVotes: {
            select: {
              userId: true,
              isHelpful: true
            }
          }
        }
      }),
      prisma.review.count({ where: { userId } })
    ]);

    // Format reviews
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: review.images ? JSON.parse(review.images) : [],
      verified: review.verified,
      helpful: review.helpful,
      skinType: review.skinType,
      skinConcerns: review.skinConcerns ? JSON.parse(review.skinConcerns) : [],
      effectsExperienced: review.effectsExperienced ? JSON.parse(review.effectsExperienced) : [],
      wouldRecommend: review.wouldRecommend,
      repurchaseIntent: review.repurchaseIntent,
      usageDuration: review.usageDuration,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
      product: {
        id: review.product.id,
        name: review.product.name,
        slug: review.product.slug,
        images: review.product.images ? JSON.parse(review.product.images) : [],
      },
      totalVotes: review.reviewVotes.length,
      helpfulVotes: review.reviewVotes.filter(vote => vote.isHelpful).length
    }));

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      reviews: formattedReviews,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      }
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch your reviews',
      code: 'INTERNAL_ERROR'
    });
  }
};