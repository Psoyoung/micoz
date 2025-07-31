import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Review Comments
export const addReviewComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { reviewId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        error: 'Content is required',
        code: 'MISSING_CONTENT'
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

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.reviewComment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment || parentComment.reviewId !== reviewId) {
        return res.status(404).json({ 
          error: 'Parent comment not found',
          code: 'PARENT_COMMENT_NOT_FOUND'
        });
      }
    }

    // Create comment
    const comment = await prisma.reviewComment.create({
      data: {
        reviewId,
        userId,
        content: content.trim(),
        parentId
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
      message: 'Comment added successfully',
      comment: {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        parentId: comment.parentId,
        user: {
          name: `${comment.user.lastName}${comment.user.firstName.charAt(0)}*`,
          avatar: comment.user.avatar,
        }
      }
    });
  } catch (error) {
    console.error('Add review comment error:', error);
    res.status(500).json({ 
      error: 'Failed to add comment',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const updateReviewComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content || !content.trim()) {
      return res.status(400).json({ 
        error: 'Content is required',
        code: 'MISSING_CONTENT'
      });
    }

    // Find existing comment
    const existingComment = await prisma.reviewComment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment) {
      return res.status(404).json({ 
        error: 'Comment not found',
        code: 'COMMENT_NOT_FOUND'
      });
    }

    if (existingComment.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only edit your own comments',
        code: 'FORBIDDEN'
      });
    }

    // Update comment
    const updatedComment = await prisma.reviewComment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
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
      message: 'Comment updated successfully',
      comment: {
        id: updatedComment.id,
        content: updatedComment.content,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt,
        parentId: updatedComment.parentId,
        user: {
          name: `${updatedComment.user.lastName}${updatedComment.user.firstName.charAt(0)}*`,
          avatar: updatedComment.user.avatar,
        }
      }
    });
  } catch (error) {
    console.error('Update review comment error:', error);
    res.status(500).json({ 
      error: 'Failed to update comment',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const deleteReviewComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { commentId } = req.params;
    const userId = req.user.userId;

    // Find existing comment
    const existingComment = await prisma.reviewComment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment) {
      return res.status(404).json({ 
        error: 'Comment not found',
        code: 'COMMENT_NOT_FOUND'
      });
    }

    if (existingComment.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only delete your own comments',
        code: 'FORBIDDEN'
      });
    }

    // Delete comment (cascades to replies)
    await prisma.reviewComment.delete({
      where: { id: commentId }
    });

    res.json({
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete review comment error:', error);
    res.status(500).json({ 
      error: 'Failed to delete comment',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getReviewComments = async (req: Request, res: Response) => {
  try {
    const { reviewId } = req.params;
    const {
      page = 1,
      limit = 20,
      sortOrder = 'asc'
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNumber - 1) * limitNumber;

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

    // Get top-level comments with replies
    const [comments, totalCount] = await Promise.all([
      prisma.reviewComment.findMany({
        where: { 
          reviewId,
          parentId: null // Only top-level comments
        },
        orderBy: { createdAt: sortOrder as 'asc' | 'desc' },
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
          replies: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      }),
      prisma.reviewComment.count({ 
        where: { 
          reviewId,
          parentId: null 
        } 
      })
    ]);

    // Format comments
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: {
        name: `${comment.user.lastName}${comment.user.firstName.charAt(0)}*`,
        avatar: comment.user.avatar,
      },
      replies: comment.replies.map(reply => ({
        id: reply.id,
        content: reply.content,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        user: {
          name: `${reply.user.lastName}${reply.user.firstName.charAt(0)}*`,
          avatar: reply.user.avatar,
        }
      }))
    }));

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      comments: formattedComments,
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
    console.error('Get review comments error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch comments',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Discussion-related features
export const getPopularDiscussions = async (req: Request, res: Response) => {
  try {
    const {
      type = 'all', // 'reviews', 'questions', 'tips', 'all'
      limit = 10,
      timeframe = 'week' // 'day', 'week', 'month'
    } = req.query;

    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    
    // Calculate timeframe
    const now = new Date();
    let since: Date;
    switch (timeframe) {
      case 'day':
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'month':
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // week
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    const discussions: any[] = [];

    // Get popular reviews (if type includes reviews)
    if (type === 'all' || type === 'reviews') {
      const popularReviews = await prisma.review.findMany({
        where: { 
          createdAt: { gte: since },
        },
        orderBy: [
          { helpful: 'desc' },
          { createdAt: 'desc' }
        ],
        take: Math.ceil(limitNumber / (type === 'all' ? 3 : 1)),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            }
          },
          _count: {
            select: {
              comments: true,
              reviewVotes: true,
            }
          }
        }
      });

      discussions.push(...popularReviews.map(review => ({
        id: review.id,
        type: 'review',
        title: `${review.product.name} 리뷰`,
        content: review.comment,
        rating: review.rating,
        helpful: review.helpful,
        createdAt: review.createdAt,
        user: {
          name: `${review.user.lastName}${review.user.firstName.charAt(0)}*`,
          avatar: review.user.avatar,
        },
        product: {
          id: review.product.id,
          name: review.product.name,
          slug: review.product.slug,
          image: review.product.images ? JSON.parse(review.product.images)[0] : null,
        },
        commentCount: review._count.comments,
        engagementCount: review._count.reviewVotes + review._count.comments
      })));
    }

    // Get popular questions (if type includes questions)
    if (type === 'all' || type === 'questions') {
      const popularQuestions = await prisma.question.findMany({
        where: { 
          createdAt: { gte: since },
        },
        orderBy: [
          { upvotes: 'desc' },
          { createdAt: 'desc' }
        ],
        take: Math.ceil(limitNumber / (type === 'all' ? 3 : 1)),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            }
          },
          _count: {
            select: {
              answers: true,
              votes: true,
            }
          }
        }
      });

      discussions.push(...popularQuestions.map(question => ({
        id: question.id,
        type: 'question',
        title: question.title,
        content: question.content,
        category: question.category,
        upvotes: question.upvotes,
        downvotes: question.downvotes,
        createdAt: question.createdAt,
        user: {
          name: `${question.user.lastName}${question.user.firstName.charAt(0)}*`,
          avatar: question.user.avatar,
        },
        product: {
          id: question.product.id,
          name: question.product.name,
          slug: question.product.slug,
          image: question.product.images ? JSON.parse(question.product.images)[0] : null,
        },
        answerCount: question._count.answers,
        engagementCount: question._count.votes + question._count.answers
      })));
    }

    // Get popular beauty tips (if type includes tips)
    if (type === 'all' || type === 'tips') {
      const popularTips = await prisma.beautyTip.findMany({
        where: { 
          createdAt: { gte: since },
          status: 'PUBLISHED'
        },
        orderBy: [
          { upvotes: 'desc' },
          { views: 'desc' },
          { createdAt: 'desc' }
        ],
        take: Math.ceil(limitNumber / (type === 'all' ? 3 : 1)),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          _count: {
            select: {
              comments: true,
              votes: true,
            }
          }
        }
      });

      discussions.push(...popularTips.map(tip => ({
        id: tip.id,
        type: 'tip',
        title: tip.title,
        content: tip.content.substring(0, 200) + (tip.content.length > 200 ? '...' : ''),
        category: tip.category,
        difficulty: tip.difficulty,
        upvotes: tip.upvotes,
        downvotes: tip.downvotes,
        views: tip.views,
        createdAt: tip.createdAt,
        user: {
          name: `${tip.user.lastName}${tip.user.firstName.charAt(0)}*`,
          avatar: tip.user.avatar,
        },
        images: tip.images ? JSON.parse(tip.images) : [],
        commentCount: tip._count.comments,
        engagementCount: tip._count.votes + tip._count.comments + Math.floor(tip.views / 10)
      })));
    }

    // Sort all discussions by engagement
    discussions.sort((a, b) => b.engagementCount - a.engagementCount);

    res.json({
      discussions: discussions.slice(0, limitNumber),
      metadata: {
        type,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get popular discussions error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch popular discussions',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getDiscussionStats = async (req: Request, res: Response) => {
  try {
    const [
      totalReviews,
      totalQuestions,
      totalBeautyTips,
      totalReviewComments,
      totalAnswers,
      totalTipComments,
      activeUsers
    ] = await Promise.all([
      prisma.review.count(),
      prisma.question.count(),
      prisma.beautyTip.count({ where: { status: 'PUBLISHED' } }),
      prisma.reviewComment.count(),
      prisma.answer.count(),
      prisma.beautyTipComment.count(),
      // Active users in the last 30 days
      prisma.user.count({
        where: {
          OR: [
            { reviews: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
            { questions: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } },
            { beautyTips: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } } }
          ]
        }
      })
    ]);

    const totalDiscussions = totalReviews + totalQuestions + totalBeautyTips;
    const totalComments = totalReviewComments + totalAnswers + totalTipComments;

    res.json({
      stats: {
        totalDiscussions,
        totalComments,
        activeUsers,
        breakdown: {
          reviews: totalReviews,
          questions: totalQuestions,
          beautyTips: totalBeautyTips,
          reviewComments: totalReviewComments,
          answers: totalAnswers,
          tipComments: totalTipComments
        }
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get discussion stats error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch discussion stats',
      code: 'INTERNAL_ERROR'
    });
  }
};