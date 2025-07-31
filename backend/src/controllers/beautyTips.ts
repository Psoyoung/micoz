import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createBeautyTip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { title, content, category, tags, images, skinTypes, difficulty } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!title || !content || !category) {
      return res.status(400).json({ 
        error: 'Title, content, and category are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Validate category
    const validCategories = ['SKINCARE', 'MAKEUP', 'HAIRCARE', 'NAILCARE', 'BODYCARE', 'ROUTINE', 'PRODUCT_REVIEW', 'TUTORIAL', 'LIFESTYLE'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category',
        code: 'INVALID_CATEGORY'
      });
    }

    // Create beauty tip
    const beautyTip = await prisma.beautyTip.create({
      data: {
        userId,
        title,
        content,
        category,
        tags: tags ? JSON.stringify(tags) : null,
        images: images ? JSON.stringify(images) : null,
        skinTypes: skinTypes ? JSON.stringify(skinTypes) : null,
        difficulty: difficulty || 'BEGINNER'
      },
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
            votes: true,
            comments: true,
            followers: true,
          }
        }
      }
    });

    res.status(201).json({
      message: 'Beauty tip created successfully',
      tip: {
        id: beautyTip.id,
        title: beautyTip.title,
        content: beautyTip.content,
        category: beautyTip.category,
        tags: beautyTip.tags ? JSON.parse(beautyTip.tags) : [],
        images: beautyTip.images ? JSON.parse(beautyTip.images) : [],
        skinTypes: beautyTip.skinTypes ? JSON.parse(beautyTip.skinTypes) : [],
        difficulty: beautyTip.difficulty,
        views: beautyTip.views,
        upvotes: beautyTip.upvotes,
        downvotes: beautyTip.downvotes,
        status: beautyTip.status,
        featured: beautyTip.featured,
        createdAt: beautyTip.createdAt,
        user: {
          name: `${beautyTip.user.lastName}${beautyTip.user.firstName.charAt(0)}*`,
          avatar: beautyTip.user.avatar,
        },
        voteCount: beautyTip._count.votes,
        commentCount: beautyTip._count.comments,
        followerCount: beautyTip._count.followers
      }
    });
  } catch (error) {
    console.error('Create beauty tip error:', error);
    res.status(500).json({ 
      error: 'Failed to create beauty tip',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const updateBeautyTip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { tipId } = req.params;
    const { title, content, category, tags, images, skinTypes, difficulty } = req.body;
    const userId = req.user.userId;

    // Find existing tip
    const existingTip = await prisma.beautyTip.findUnique({
      where: { id: tipId }
    });

    if (!existingTip) {
      return res.status(404).json({ 
        error: 'Beauty tip not found',
        code: 'TIP_NOT_FOUND'
      });
    }

    if (existingTip.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only edit your own tips',
        code: 'FORBIDDEN'
      });
    }

    // Update tip
    const updatedTip = await prisma.beautyTip.update({
      where: { id: tipId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(tags && { tags: JSON.stringify(tags) }),
        ...(images && { images: JSON.stringify(images) }),
        ...(skinTypes && { skinTypes: JSON.stringify(skinTypes) }),
        ...(difficulty && { difficulty }),
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
        },
        _count: {
          select: {
            votes: true,
            comments: true,
            followers: true,
          }
        }
      }
    });

    res.json({
      message: 'Beauty tip updated successfully',
      tip: {
        id: updatedTip.id,
        title: updatedTip.title,
        content: updatedTip.content,
        category: updatedTip.category,
        tags: updatedTip.tags ? JSON.parse(updatedTip.tags) : [],
        images: updatedTip.images ? JSON.parse(updatedTip.images) : [],
        skinTypes: updatedTip.skinTypes ? JSON.parse(updatedTip.skinTypes) : [],
        difficulty: updatedTip.difficulty,
        views: updatedTip.views,
        upvotes: updatedTip.upvotes,
        downvotes: updatedTip.downvotes,
        status: updatedTip.status,
        featured: updatedTip.featured,
        createdAt: updatedTip.createdAt,
        updatedAt: updatedTip.updatedAt,
        user: {
          name: `${updatedTip.user.lastName}${updatedTip.user.firstName.charAt(0)}*`,
          avatar: updatedTip.user.avatar,
        },
        voteCount: updatedTip._count.votes,
        commentCount: updatedTip._count.comments,
        followerCount: updatedTip._count.followers
      }
    });
  } catch (error) {
    console.error('Update beauty tip error:', error);
    res.status(500).json({ 
      error: 'Failed to update beauty tip',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const deleteBeautyTip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { tipId } = req.params;
    const userId = req.user.userId;

    // Find existing tip
    const existingTip = await prisma.beautyTip.findUnique({
      where: { id: tipId }
    });

    if (!existingTip) {
      return res.status(404).json({ 
        error: 'Beauty tip not found',
        code: 'TIP_NOT_FOUND'
      });
    }

    if (existingTip.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only delete your own tips',
        code: 'FORBIDDEN'
      });
    }

    // Delete tip (cascades to votes, comments, and follows)
    await prisma.beautyTip.delete({
      where: { id: tipId }
    });

    res.json({
      message: 'Beauty tip deleted successfully'
    });
  } catch (error) {
    console.error('Delete beauty tip error:', error);
    res.status(500).json({ 
      error: 'Failed to delete beauty tip',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getBeautyTips = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      category,
      difficulty,
      skinType,
      tags,
      featured,
      search
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause
    const where: any = { 
      status: 'PUBLISHED' 
    };

    if (category) {
      where.category = category;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (featured === 'true') {
      where.featured = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'upvotes') {
      orderBy.upvotes = sortOrder;
    } else if (sortBy === 'views') {
      orderBy.views = sortOrder;
    } else if (sortBy === 'comments') {
      orderBy.comments = { _count: sortOrder };
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute queries
    const [tips, totalCount] = await Promise.all([
      prisma.beautyTip.findMany({
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
          _count: {
            select: {
              votes: true,
              comments: true,
              followers: true,
            }
          }
        }
      }),
      prisma.beautyTip.count({ where })
    ]);

    // Format tips
    const formattedTips = tips.map(tip => ({
      id: tip.id,
      title: tip.title,
      content: tip.content.length > 200 ? tip.content.substring(0, 200) + '...' : tip.content,
      category: tip.category,
      tags: tip.tags ? JSON.parse(tip.tags) : [],
      images: tip.images ? JSON.parse(tip.images) : [],
      skinTypes: tip.skinTypes ? JSON.parse(tip.skinTypes) : [],
      difficulty: tip.difficulty,
      views: tip.views,
      upvotes: tip.upvotes,
      downvotes: tip.downvotes,
      featured: tip.featured,
      createdAt: tip.createdAt,
      updatedAt: tip.updatedAt,
      user: {
        name: `${tip.user.lastName}${tip.user.firstName.charAt(0)}*`,
        avatar: tip.user.avatar,
      },
      voteCount: tip._count.votes,
      commentCount: tip._count.comments,
      followerCount: tip._count.followers
    }));

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      tips: formattedTips,
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
    console.error('Get beauty tips error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch beauty tips',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getBeautyTip = async (req: Request, res: Response) => {
  try {
    const { tipId } = req.params;

    const tip = await prisma.beautyTip.findUnique({
      where: { id: tipId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        },
        comments: {
          where: { parentId: null }, // Only top-level comments
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
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            votes: true,
            comments: true,
            followers: true,
          }
        }
      }
    });

    if (!tip || tip.status !== 'PUBLISHED') {
      return res.status(404).json({ 
        error: 'Beauty tip not found',
        code: 'TIP_NOT_FOUND'
      });
    }

    // Increment view count
    await prisma.beautyTip.update({
      where: { id: tipId },
      data: { views: { increment: 1 } }
    });

    // Format response
    const formattedTip = {
      id: tip.id,
      title: tip.title,
      content: tip.content,
      category: tip.category,
      tags: tip.tags ? JSON.parse(tip.tags) : [],
      images: tip.images ? JSON.parse(tip.images) : [],
      skinTypes: tip.skinTypes ? JSON.parse(tip.skinTypes) : [],
      difficulty: tip.difficulty,
      views: tip.views + 1, // Include the incremented view
      upvotes: tip.upvotes,
      downvotes: tip.downvotes,
      featured: tip.featured,
      createdAt: tip.createdAt,
      updatedAt: tip.updatedAt,
      user: {
        name: `${tip.user.lastName}${tip.user.firstName.charAt(0)}*`,
        avatar: tip.user.avatar,
      },
      voteCount: tip._count.votes,
      commentCount: tip._count.comments,
      followerCount: tip._count.followers,
      comments: tip.comments.map(comment => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          name: `${comment.user.lastName}${comment.user.firstName.charAt(0)}*`,
          avatar: comment.user.avatar,
        },
        replies: comment.replies.map(reply => ({
          id: reply.id,
          content: reply.content,
          createdAt: reply.createdAt,
          user: {
            name: `${reply.user.lastName}${reply.user.firstName.charAt(0)}*`,
            avatar: reply.user.avatar,
          }
        }))
      }))
    };

    res.json({
      tip: formattedTip
    });
  } catch (error) {
    console.error('Get beauty tip error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch beauty tip',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const voteBeautyTip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { tipId } = req.params;
    const { isUpvote } = req.body;
    const userId = req.user.userId;

    if (typeof isUpvote !== 'boolean') {
      return res.status(400).json({ 
        error: 'isUpvote must be a boolean',
        code: 'INVALID_VOTE'
      });
    }

    // Check if tip exists
    const tip = await prisma.beautyTip.findUnique({
      where: { id: tipId }
    });

    if (!tip) {
      return res.status(404).json({ 
        error: 'Beauty tip not found',
        code: 'TIP_NOT_FOUND'
      });
    }

    // Prevent users from voting on their own tips
    if (tip.userId === userId) {
      return res.status(400).json({ 
        error: 'You cannot vote on your own tip',
        code: 'CANNOT_VOTE_OWN_TIP'
      });
    }

    // Upsert vote
    const vote = await prisma.beautyTipVote.upsert({
      where: {
        tipId_userId: {
          tipId,
          userId
        }
      },
      update: {
        isUpvote
      },
      create: {
        tipId,
        userId,
        isUpvote
      }
    });

    // Update vote counts on tip
    const [upvoteCount, downvoteCount] = await Promise.all([
      prisma.beautyTipVote.count({
        where: { tipId, isUpvote: true }
      }),
      prisma.beautyTipVote.count({
        where: { tipId, isUpvote: false }
      })
    ]);

    await prisma.beautyTip.update({
      where: { id: tipId },
      data: { 
        upvotes: upvoteCount,
        downvotes: downvoteCount
      }
    });

    res.json({
      message: 'Vote recorded successfully',
      vote: {
        id: vote.id,
        isUpvote: vote.isUpvote,
        createdAt: vote.createdAt
      },
      upvotes: upvoteCount,
      downvotes: downvoteCount
    });
  } catch (error) {
    console.error('Vote beauty tip error:', error);
    res.status(500).json({ 
      error: 'Failed to record vote',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const followBeautyTip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { tipId } = req.params;
    const userId = req.user.userId;

    // Check if tip exists
    const tip = await prisma.beautyTip.findUnique({
      where: { id: tipId }
    });

    if (!tip) {
      return res.status(404).json({ 
        error: 'Beauty tip not found',
        code: 'TIP_NOT_FOUND'
      });
    }

    // Check if already following
    const existingFollow = await prisma.beautyTipFollow.findUnique({
      where: {
        tipId_userId: {
          tipId,
          userId
        }
      }
    });

    if (existingFollow) {
      // Unfollow
      await prisma.beautyTipFollow.delete({
        where: { id: existingFollow.id }
      });

      res.json({
        message: 'Unfollowed beauty tip successfully',
        isFollowing: false
      });
    } else {
      // Follow
      await prisma.beautyTipFollow.create({
        data: {
          tipId,
          userId
        }
      });

      res.json({
        message: 'Following beauty tip successfully',
        isFollowing: true
      });
    }
  } catch (error) {
    console.error('Follow beauty tip error:', error);
    res.status(500).json({ 
      error: 'Failed to toggle follow status',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const addComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { tipId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ 
        error: 'Content is required',
        code: 'MISSING_CONTENT'
      });
    }

    // Check if tip exists
    const tip = await prisma.beautyTip.findUnique({
      where: { id: tipId }
    });

    if (!tip) {
      return res.status(404).json({ 
        error: 'Beauty tip not found',
        code: 'TIP_NOT_FOUND'
      });
    }

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.beautyTipComment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment || parentComment.tipId !== tipId) {
        return res.status(404).json({ 
          error: 'Parent comment not found',
          code: 'PARENT_COMMENT_NOT_FOUND'
        });
      }
    }

    // Create comment
    const comment = await prisma.beautyTipComment.create({
      data: {
        tipId,
        userId,
        content,
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
        user: {
          name: `${comment.user.lastName}${comment.user.firstName.charAt(0)}*`,
          avatar: comment.user.avatar,
        }
      }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      error: 'Failed to add comment',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getMyBeautyTips = async (req: AuthenticatedRequest, res: Response) => {
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
    if (sortBy === 'upvotes') {
      orderBy.upvotes = sortOrder;
    } else if (sortBy === 'views') {
      orderBy.views = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute queries
    const [tips, totalCount] = await Promise.all([
      prisma.beautyTip.findMany({
        where: { userId },
        orderBy,
        skip,
        take: limitNumber,
        include: {
          _count: {
            select: {
              votes: true,
              comments: true,
              followers: true,
            }
          }
        }
      }),
      prisma.beautyTip.count({ where: { userId } })
    ]);

    // Format tips
    const formattedTips = tips.map(tip => ({
      id: tip.id,
      title: tip.title,
      content: tip.content.length > 200 ? tip.content.substring(0, 200) + '...' : tip.content,
      category: tip.category,
      tags: tip.tags ? JSON.parse(tip.tags) : [],
      images: tip.images ? JSON.parse(tip.images) : [],
      skinTypes: tip.skinTypes ? JSON.parse(tip.skinTypes) : [],
      difficulty: tip.difficulty,
      views: tip.views,
      upvotes: tip.upvotes,
      downvotes: tip.downvotes,
      status: tip.status,
      featured: tip.featured,
      createdAt: tip.createdAt,
      updatedAt: tip.updatedAt,
      voteCount: tip._count.votes,
      commentCount: tip._count.comments,
      followerCount: tip._count.followers
    }));

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      tips: formattedTips,
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
    console.error('Get my beauty tips error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch your beauty tips',
      code: 'INTERNAL_ERROR'
    });
  }
};